import React, { useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, SafeAreaView,
} from "react-native";
import { useLocation } from "../hooks/useLocation";

const GREEN = "#1B8A4E";
const TEAL = "#0D9488";

/**
 * LocationScreen — Geolocalización nativa para EcoMarket.
 * Toda la lógica de GPS está en useLocation (arquitectura desacoplada).
 */
export default function LocationScreen() {
  const { permission, location, address, loading, watching, requestPermission, getCurrentLocation, startWatching, stopWatching } = useLocation();

  useEffect(() => { requestPermission(); }, []);

  const producers = location ? [
    { id: 1, name: "Finca Orgánica El Paraíso", distance: "1.2 km", products: "Frutas, Hortalizas", emoji: "🌿", color: "#E8F5EE" },
    { id: 2, name: "Miel Pura Amazónica", distance: "2.8 km", products: "Miel, Polen", emoji: "🍯", color: "#FFF8E1" },
    { id: 3, name: "Lácteos Naturales Sierra", distance: "4.1 km", products: "Queso, Yogurt", emoji: "🥛", color: "#E8F4FD" },
    { id: 4, name: "Cacao Fino de Aroma", distance: "5.6 km", products: "Chocolate, Cacao", emoji: "🍫", color: "#FDE8F0" },
  ] : [];

  if (permission === "denied" || permission === "blocked") {
    return (
      <View style={s.center}>
        <Text style={s.bigIcon}>📍</Text>
        <Text style={s.title}>Ubicación no disponible</Text>
        <Text style={s.info}>Necesitamos tu ubicación para mostrarte productores locales cercanos.</Text>
        <TouchableOpacity style={s.greenBtn} onPress={requestPermission}>
          <Text style={s.greenBtnTxt}>Solicitar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📍 Productores cercanos</Text>
        <View style={[s.statusPill, watching && s.statusPillActive]}>
          <Text style={s.statusPillTxt}>{watching ? "🟢 GPS activo" : "⚪ GPS inactivo"}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de ubicación */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Tu ubicación actual</Text>

          {loading && (
            <View style={s.loadingRow}>
              <ActivityIndicator color={GREEN} size="small" />
              <Text style={s.loadingTxt}>Obteniendo posición GPS...</Text>
            </View>
          )}

          {location && !loading && (
            <>
              <View style={s.coordGrid}>
                {[
                  { label: "Latitud", value: location.coords.latitude.toFixed(6), icon: "↕️" },
                  { label: "Longitud", value: location.coords.longitude.toFixed(6), icon: "↔️" },
                  { label: "Precisión GPS", value: `± ${Math.round(location.coords.accuracy)} m`, icon: "🎯" },
                ].map((item) => (
                  <View key={item.label} style={s.coordBox}>
                    <Text style={s.coordIcon}>{item.icon}</Text>
                    <Text style={s.coordLabel}>{item.label}</Text>
                    <Text style={s.coordVal}>{item.value}</Text>
                  </View>
                ))}
              </View>
              {address && (
                <View style={s.addrBox}>
                  <Text style={s.addrLabel}>📌 Dirección aproximada</Text>
                  <Text style={s.addrTxt}>{address}</Text>
                </View>
              )}
            </>
          )}

          {!location && !loading && (
            <Text style={s.emptyTxt}>Presiona el botón para obtener tu posición GPS.</Text>
          )}

          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={getCurrentLocation} disabled={loading}>
              <Text style={s.btnTxt}>{loading ? "Buscando..." : "📍 Obtener"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.watchBtn, { flex: 1 }, watching && s.watchBtnActive]} onPress={watching ? stopWatching : startWatching}>
              <Text style={[s.watchTxt, watching && { color: "#fff" }]}>{watching ? "⏹ Detener" : "▶ Seguimiento"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Productores */}
        {producers.length > 0 && (
          <>
            <Text style={s.sectionTitle}>🌱 {producers.length} productores encontrados</Text>
            {producers.map((prod) => (
              <View key={prod.id} style={[s.producerCard, { borderLeftColor: GREEN }]}>
                <View style={[s.producerIconWrap, { backgroundColor: prod.color }]}>
                  <Text style={s.producerIcon}>{prod.emoji}</Text>
                </View>
                <View style={s.producerInfo}>
                  <Text style={s.producerName}>{prod.name}</Text>
                  <Text style={s.producerProducts}>{prod.products}</Text>
                </View>
                <View style={s.distBadge}>
                  <Text style={s.distTxt}>{prod.distance}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Estado del sistema */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Estado del sistema</Text>
          {[
            { label: "Permiso de ubicación", value: permission === "granted" ? "Concedido" : permission === "denied" ? "Denegado" : "Pendiente", ok: permission === "granted" },
            { label: "Seguimiento GPS", value: watching ? "Activo" : "Inactivo", ok: watching },
          ].map((item, i) => (
            <View key={i} style={s.statusRow}>
              <Text style={s.statusLabel}>{item.label}</Text>
              <View style={[s.statusBadge, item.ok ? s.statusOk : s.statusWarn]}>
                <Text style={[s.statusTxt, { color: item.ok ? "#2E7D32" : "#E65100" }]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F4" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#F0F7F4" },
  bigIcon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  info: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  greenBtn: { backgroundColor: GREEN, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  greenBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  header: { backgroundColor: GREEN, paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statusPill: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusPillActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  statusPillTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
  scroll: { flex: 1, padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 14 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  loadingTxt: { color: "#666", fontSize: 14 },
  coordGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  coordBox: { flex: 1, minWidth: "30%", backgroundColor: "#F0F7F4", borderRadius: 10, padding: 10 },
  coordIcon: { fontSize: 16, marginBottom: 3 },
  coordLabel: { fontSize: 10, color: GREEN, fontWeight: "700", textTransform: "uppercase" },
  coordVal: { fontSize: 13, color: "#1a1a1a", fontWeight: "600", marginTop: 2 },
  addrBox: { backgroundColor: "#F9F9F9", borderRadius: 10, padding: 12, marginBottom: 12 },
  addrLabel: { fontSize: 11, color: "#888", fontWeight: "600", marginBottom: 4 },
  addrTxt: { fontSize: 13, color: "#333", lineHeight: 20 },
  emptyTxt: { color: "#aaa", fontSize: 14, marginBottom: 14, textAlign: "center" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { backgroundColor: GREEN, padding: 12, borderRadius: 12, alignItems: "center" },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  watchBtn: { backgroundColor: "#eee", padding: 12, borderRadius: 12, alignItems: "center" },
  watchBtnActive: { backgroundColor: "#e74c3c" },
  watchTxt: { color: "#555", fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  producerCard: { backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  producerIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  producerIcon: { fontSize: 26 },
  producerInfo: { flex: 1 },
  producerName: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  producerProducts: { fontSize: 12, color: "#888", marginTop: 2 },
  distBadge: { backgroundColor: "#E8F5EE", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  distTxt: { color: GREEN, fontWeight: "700", fontSize: 13 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  statusLabel: { fontSize: 13, color: "#555" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusOk: { backgroundColor: "#E8F5E9" },
  statusWarn: { backgroundColor: "#FFF3E0" },
  statusTxt: { fontSize: 12, fontWeight: "700" },
});
