import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Persistencia: cargar sesión guardada al iniciar ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem("@ecomarket_token");
        const savedRefresh = await AsyncStorage.getItem("@ecomarket_refresh");
        const savedUser = await AsyncStorage.getItem("@ecomarket_user");
        if (savedToken) {
          setToken(savedToken);
          setRefreshToken(savedRefresh);
          setUser(savedUser ? JSON.parse(savedUser) : null);
          axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { access_token, refresh_token, user: userData } = res.data;

    // Guardar en AsyncStorage (persistencia segura)
    await AsyncStorage.setItem("@ecomarket_token", access_token);
    await AsyncStorage.setItem("@ecomarket_refresh", refresh_token);
    await AsyncStorage.setItem("@ecomarket_user", JSON.stringify(userData));

    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    return userData;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    const res = await axios.post(`${API_URL}/auth/register`, data);
    const { access_token, refresh_token, user: userData } = res.data;

    await AsyncStorage.setItem("@ecomarket_token", access_token);
    await AsyncStorage.setItem("@ecomarket_refresh", refresh_token);
    await AsyncStorage.setItem("@ecomarket_user", JSON.stringify(userData));

    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    return userData;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (_) {}
    await AsyncStorage.multiRemove(["@ecomarket_token", "@ecomarket_refresh", "@ecomarket_user"]);
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  // ── Refresh Token ────────────────────────────────────────────────────────
  const refreshSession = useCallback(async () => {
    if (!refreshToken) return false;
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
      const newToken = res.data.access_token;
      await AsyncStorage.setItem("@ecomarket_token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }, [refreshToken, logout]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
