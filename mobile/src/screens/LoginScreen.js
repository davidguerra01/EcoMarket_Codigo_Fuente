import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const GREEN = "#1B8A4E";
const GREEN_LIGHT = "#E8F5EE";
const YELLOW = "#F5C842";
const ORANGE = "#F5832A";
const TEAL = "#0D9488";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Credenciales incorrectas. Intenta de nuevo.";
      Alert.alert("Error al iniciar sesión", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header decorativo */}
        <View style={s.header}>
          <View style={s.leaf}><Text style={s.leafEmoji}>🌿</Text></View>
          <Text style={s.brand}>EcoMarket</Text>
          <Text style={s.tagline}>Comercio local · Sostenible · Fresco</Text>
          <View style={s.dots}>
            <View style={[s.dot, { backgroundColor: YELLOW }]} />
            <View style={[s.dot, { backgroundColor: ORANGE }]} />
            <View style={[s.dot, { backgroundColor: TEAL }]} />
          </View>
        </View>

        {/* Card de login */}
        <View style={s.card}>
          <Text style={s.title}>Iniciar sesión</Text>

          <Text style={s.label}>Correo electrónico</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>📧</Text>
            <TextInput
              style={s.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={s.label}>Contraseña</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>🔒</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnTxt}>Ingresar 🚀</Text>
            )}
          </TouchableOpacity>

          <View style={s.tipBox}>
            <Text style={s.tipTitle}>💡 Tip</Text>
            <Text style={s.tipTxt}>
              Si usas emulador Android, la API suele ser:{"\n"}
              <Text style={s.tipCode}>http://10.0.2.2:8000</Text>
            </Text>
          </View>
        </View>

        {/* Pie */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={s.footerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: GREEN_LIGHT },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: GREEN, paddingTop: 60, paddingBottom: 36,
    alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  leaf: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center",
    justifyContent: "center", marginBottom: 12,
  },
  leafEmoji: { fontSize: 38 },
  brand: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  tagline: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  dots: { flexDirection: "row", gap: 8, marginTop: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: {
    margin: 20, marginTop: -20, backgroundColor: "#fff",
    borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#1a1a1a", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 12 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#ddd", borderRadius: 12,
    backgroundColor: "#fafafa", paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: "#1a1a1a" },
  btn: {
    backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 24,
    shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tipBox: {
    backgroundColor: "#FFF8E1", borderRadius: 12, padding: 14,
    marginTop: 20, borderLeftWidth: 4, borderLeftColor: YELLOW,
  },
  tipTitle: { fontWeight: "700", color: "#7B5800", fontSize: 13, marginBottom: 4 },
  tipTxt: { fontSize: 12, color: "#7B5800", lineHeight: 18 },
  tipCode: { fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 20 },
  footerTxt: { color: "#666", fontSize: 14 },
  footerLink: { color: GREEN, fontWeight: "700", fontSize: 14 },
});
