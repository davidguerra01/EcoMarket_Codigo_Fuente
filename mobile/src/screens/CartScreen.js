import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const GREEN = "#1B8A4E";

export default function CartScreen() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/carrito/`);
      setCart(res.data);
    } catch {
      Alert.alert("Error", "No se pudo cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchCart(); }, [fetchCart]));

  const checkout = async () => {
    if (cart.items.length === 0) { Alert.alert("Carrito vacío", "Agrega productos antes de pagar."); return; }
    setChecking(true);
    try {
      const res = await axios.post(`${API_URL}/carrito/checkout`);
      Alert.alert("✅ Orden creada", `Tu orden #${res.data.orden_id} por $${res.data.total.toFixed(2)} fue creada.`, [{ text: "Ver órdenes" }]);
      fetchCart();
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.detail || "No se pudo procesar el pedido.");
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={GREEN} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🛒 Mi Carrito</Text>
        <Text style={s.headerSub}>{cart.items.length} producto{cart.items.length !== 1 ? "s" : ""}</Text>
      </View>
      <FlatList
        data={cart.items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🛒</Text>
            <Text style={s.emptyTxt}>Tu carrito está vacío</Text>
            <Text style={s.emptySub}>Explora el catálogo y agrega productos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.itemIcon}><Text style={{ fontSize: 24 }}>🌿</Text></View>
            <View style={s.itemInfo}>
              <Text style={s.itemName}>{item.nombre}</Text>
              <Text style={s.itemQty}>Cantidad: {item.cantidad}</Text>
            </View>
            <Text style={s.itemSubtotal}>${item.subtotal.toFixed(2)}</Text>
          </View>
        )}
      />
      {cart.items.length > 0 && (
        <View style={s.footer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalVal}>${cart.total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={s.checkoutBtn} onPress={checkout} disabled={checking}>
            {checking ? <ActivityIndicator color="#fff" /> : <Text style={s.checkoutTxt}>Confirmar pedido 🚀</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F4" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: GREEN, paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  list: { padding: 16, gap: 10 },
  item: { backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", alignItems: "center", padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  itemIcon: { width: 46, height: 46, borderRadius: 10, backgroundColor: "#E8F5EE", alignItems: "center", justifyContent: "center", marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  itemQty: { fontSize: 13, color: "#888", marginTop: 2 },
  itemSubtotal: { fontSize: 16, fontWeight: "800", color: GREEN },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTxt: { fontSize: 18, fontWeight: "700", color: "#444" },
  emptySub: { fontSize: 13, color: "#888", marginTop: 4 },
  footer: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: "700", color: "#333" },
  totalVal: { fontSize: 22, fontWeight: "800", color: GREEN },
  checkoutBtn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  checkoutTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
