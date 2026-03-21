import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const GREEN = "#1B8A4E";
const GREEN_LIGHT = "#E8F5EE";
const YELLOW = "#F5C842";
const ORANGE = "#F5832A";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", confirmar: "",
    telefono: "", role_id: 2, nombre_tienda: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/auth/roles`)
      .then((r) => setRoles(r.data.filter((ro) => ro.nombre !== "ADMIN")))
      .catch(() => setRoles([{ id: 2, nombre: "CLIENTE" }, { id: 3, nombre: "PRODUCTOR" }]));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.nombre || !form.email || !form.password) {
      Alert.alert("Campos requeridos", "Completa nombre, correo y contraseña.");
      return;
    }
    if (form.password !== form.confirmar) {
      Alert.alert("Contraseñas distintas", "Las contraseñas no coinciden.");
      return;
    }
    if (form.role_id === 3 && !form.nombre_tienda) {
      Alert.alert("Falta nombre de tienda", "Los productores deben ingresar el nombre de su tienda.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre, email: form.email.trim().toLowerCase(),
        password: form.password, telefono: form.telefono || undefined,
        role_id: form.role_id,
        ...(form.role_id === 3 && { nombre_tienda: form.nombre_tienda }),
      };
      await register(payload);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Error al registrarse. Intenta de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === form.role_id);

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>🌿 EcoMarket</Text>
          <Text style={s.subtitle}>Crea tu cuenta y únete al mercado ecológico</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Regístrate</Text>

          {/* Selector de rol */}
          <Text style={s.label}>Rol</Text>
          <View style={s.roleRow}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[s.roleBtn, form.role_id === r.id && s.roleBtnActive]}
                onPress={() => set("role_id", r.id)}
              >
                <Text style={s.roleIcon}>{r.nombre === "CLIENTE" ? "🛒" : "🌾"}</Text>
                <Text style={[s.roleTxt, form.role_id === r.id && s.roleTxtActive]}>{r.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos */}
          {[
            { key: "nombre", label: "Nombre completo", icon: "👤", placeholder: "Ej. Gilbert Azuero" },
            { key: "email", label: "Correo electrónico", icon: "📧", placeholder: "correo@ejemplo.com", keyboard: "email-address" },
            { key: "telefono", label: "Teléfono (opcional)", icon: "📱", placeholder: "+593 9 0000 0000", keyboard: "phone-pad" },
          ].map(({ key, label, icon, placeholder, keyboard }) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>{icon}</Text>
                <TextInput
                  style={s.input}
                  placeholder={placeholder}
                  placeholderTextColor="#aaa"
                  keyboardType={keyboard || "default"}
                  autoCapitalize={key === "email" ? "none" : "words"}
                  value={form[key]}
                  onChangeText={(v) => set(key, v)}
                />
              </View>
            </View>
          ))}

          {/* Nombre tienda solo para PRODUCTOR */}
          {form.role_id === 3 && (
            <>
              <Text style={s.label}>Nombre de tienda</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>🏪</Text>
                <TextInput
                  style={s.input} placeholder="Tu tienda ecológica"
                  placeholderTextColor="#aaa" value={form.nombre_tienda}
                  onChangeText={(v) => set("nombre_tienda", v)}
                />
              </View>
            </>
          )}

          <Text style={s.label}>Contraseña</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>🔒</Text>
            <TextInput style={s.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#aaa" secureTextEntry value={form.password} onChangeText={(v) => set("password", v)} />
          </View>

          <Text style={s.label}>Confirmar contraseña</Text>
          <View style={[s.inputWrap, form.confirmar && form.password !== form.confirmar && { borderColor: "#e74c3c" }]}>
            <Text style={s.inputIcon}>🔑</Text>
            <TextInput style={s.input} placeholder="Repite la contraseña" placeholderTextColor="#aaa" secureTextEntry value={form.confirmar} onChangeText={(v) => set("confirmar", v)} />
          </View>
          {form.confirmar !== "" && form.password !== form.confirmar && (
            <Text style={s.errorTxt}>Las contraseñas no coinciden</Text>
          )}

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Crear cuenta ✨</Text>}
          </TouchableOpacity>

          <Text style={s.terms}>Al registrarte aceptas los Términos y la Política de privacidad.</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerTxt}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={s.footerLink}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: GREEN_LIGHT },
  scroll: { flexGrow: 1 },
  header: { backgroundColor: GREEN, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  brand: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  card: { margin: 20, marginTop: -16, backgroundColor: "#fff", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 14, elevation: 5 },
  title: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 12 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 2, borderColor: "#ddd", borderRadius: 12, padding: 12, backgroundColor: "#fafafa" },
  roleBtnActive: { borderColor: GREEN, backgroundColor: "#E8F5EE" },
  roleIcon: { fontSize: 18 },
  roleTxt: { fontWeight: "600", color: "#888", fontSize: 14 },
  roleTxtActive: { color: GREEN },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#ddd", borderRadius: 12, backgroundColor: "#fafafa", paddingHorizontal: 12 },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: "#1a1a1a" },
  errorTxt: { color: "#e74c3c", fontSize: 12, marginTop: 4, marginLeft: 4 },
  btn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 22, shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  terms: { fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 14, lineHeight: 16 },
  footer: { flexDirection: "row", justifyContent: "center", padding: 20 },
  footerTxt: { color: "#666", fontSize: 14 },
  footerLink: { color: GREEN, fontWeight: "700", fontSize: 14 },
});
