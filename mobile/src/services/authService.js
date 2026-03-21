// src/services/authService.js
// Lógica de negocio de autenticación — completamente desacoplada de la UI
// Esta separación permite pruebas unitarias sin montar componentes React

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// ── Claves de almacenamiento ──────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: '@ecomarket_token',
  REFRESH: '@ecomarket_refresh',
  USER: '@ecomarket_user',
};

// ── Validaciones ──────────────────────────────────────────────────────────────

/**
 * Valida formato de email.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'El correo es requerido' };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'El correo no puede estar vacío' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Formato de correo inválido' };
  }
  return { valid: true };
}

/**
 * Valida contraseña.
 * @param {string} password
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'La contraseña es requerida' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'La contraseña es demasiado larga' };
  }
  return { valid: true };
}

/**
 * Valida los datos del formulario de login.
 * @param {{ email: string, password: string }} data
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateLoginForm(data) {
  const errors = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error;

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Valida los datos del formulario de registro.
 * @param {{ nombre: string, email: string, password: string, confirmar: string, role_id: number }} data
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateRegisterForm(data) {
  const errors = {};

  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error;

  if (data.password !== data.confirmar) {
    errors.confirmar = 'Las contraseñas no coinciden';
  }

  if (![2, 3].includes(Number(data.role_id))) {
    errors.role_id = 'Selecciona un rol válido';
  }

  if (Number(data.role_id) === 3 && (!data.nombre_tienda || data.nombre_tienda.trim().length < 2)) {
    errors.nombre_tienda = 'El nombre de tienda es requerido para productores';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Transformaciones de datos ─────────────────────────────────────────────────

/**
 * Formatea el nombre del usuario para mostrar en la UI.
 * @param {string} fullName
 * @returns {string}
 */
export function formatDisplayName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Usuario';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || 'Usuario';
}

/**
 * Parsea la respuesta del servidor al hacer login.
 * @param {object} responseData
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 */
export function parseLoginResponse(responseData) {
  if (!responseData) throw new Error('Respuesta vacía del servidor');
  const { access_token, refresh_token, user } = responseData;
  if (!access_token) throw new Error('Token de acceso no recibido');
  if (!user) throw new Error('Datos de usuario no recibidos');
  return {
    accessToken: access_token,
    refreshToken: refresh_token || null,
    user,
  };
}

/**
 * Determina si una respuesta de error es de credenciales inválidas.
 * @param {Error} error
 * @returns {boolean}
 */
export function isInvalidCredentialsError(error) {
  return (
    error?.response?.status === 401 ||
    error?.response?.data?.detail?.toLowerCase().includes('credencial') ||
    error?.response?.data?.detail?.toLowerCase().includes('incorrect')
  );
}

// ── Servicios de API ──────────────────────────────────────────────────────────

/**
 * Llama al endpoint de login.
 * @param {string} email
 * @param {string} password
 */
export async function loginRequest(email, password) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: email.trim().toLowerCase(),
    password,
  });
  return parseLoginResponse(response.data);
}

/**
 * Llama al endpoint de registro.
 * @param {object} userData
 */
export async function registerRequest(userData) {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return parseLoginResponse(response.data);
}

// ── Persistencia de sesión ────────────────────────────────────────────────────

/**
 * Guarda los tokens y datos de usuario en AsyncStorage.
 */
export async function saveSession({ accessToken, refreshToken, user }) {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
  if (refreshToken) {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH, refreshToken);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
}

/**
 * Carga la sesión guardada desde AsyncStorage.
 * @returns {{ token: string|null, refreshToken: string|null, user: object|null }}
 */
export async function loadSession() {
  const [token, refreshToken, userRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
    AsyncStorage.getItem(STORAGE_KEYS.REFRESH),
    AsyncStorage.getItem(STORAGE_KEYS.USER),
  ]);
  return {
    token,
    refreshToken,
    user: userRaw ? JSON.parse(userRaw) : null,
  };
}

/**
 * Elimina todos los datos de sesión.
 */
export async function clearSession() {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  delete axios.defaults.headers.common['Authorization'];
}
