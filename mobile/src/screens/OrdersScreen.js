import React, { useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const GREEN = "#1B8A4E";

const STATUS_COLORS = { PENDIENTE: "#FFF3E0", PAGADA: "#E8F5EE", CANCELADA: "#FFEBEE" };
const STATUS_TEXT = { PENDIENTE: "#E65100", PAGADA: "#2E7D32", CANCELADA: "#C62828" };

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/ordenes/mias`);
        setOrders(res.data);
      } catch { Alert.alert("Error", "No se pudieron cargar tus órdenes."); }
      finally { setLoading(false); }
    })();
  }, []));

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={GREEN} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>📦 Mis Pedidos</Text>
        <Text style={s.sub}>{orders.length} orden{orders.length !== 1 ? "es" : ""} registrada{orders.length !== 1 ? "s" : ""}</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyIcon}>📭</Text><Text style={s.emptyTxt}>Aún no tienes pedidos</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.orderId}>Orden #{item.id}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[item.estado] || "#f5f5f5" }]}>
                <Text style={[s.badgeTxt, { color: STATUS_TEXT[item.estado] || "#666" }]}>{item.estado}</Text>
              </View>
            </View>
            <Text style={s.total}>${parseFloat(item.total).toFixed(2)}</Text>
            <Text style={s.date}>{new Date(item.fecha).toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" })}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F4" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: GREEN, paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeTxt: { fontSize: 12, fontWeight: "700" },
  total: { fontSize: 22, fontWeight: "800", color: GREEN },
  date: { fontSize: 12, color: "#999", marginTop: 6 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTxt: { fontSize: 16, fontWeight: "700", color: "#666" },
});
