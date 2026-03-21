import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, ScrollView,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const GREEN = "#1B8A4E";
const YELLOW = "#F5C842";
const ORANGE = "#F5832A";
const TEAL = "#0D9488";

const CATEGORY_COLORS = ["#E8F5EE", "#FFF3E0", "#E8F4FD", "#FDE8E8", "#F3E8FD"];
const CATEGORY_ICONS = { Alimentos: "🥬", Hogar: "🏡", Higiene: "🧴", Agricultura: "🌾" };

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/productos/`, { params: { categoria_id: selectedCat || undefined, q: search || undefined } }),
        axios.get(`${API_URL}/categorias/`),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch {
      Alert.alert("Error", "No se pudo cargar el catálogo. Verifica tu conexión.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCat, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addToCart = async (productId) => {
    try {
      await axios.post(`${API_URL}/carrito/items`, { producto_id: productId, cantidad: 1 });
      Alert.alert("✅ Agregado", "Producto agregado al carrito.");
    } catch {
      Alert.alert("Error", "No se pudo agregar al carrito.");
    }
  };

  const renderProduct = ({ item, index }) => (
    <View style={[s.productCard, { borderLeftColor: [GREEN, ORANGE, TEAL, YELLOW][index % 4] }]}>
      <View style={[s.productImagePlaceholder, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]}>
        <Text style={s.productEmoji}>
          {item.es_ecologico ? "🌿" : "📦"}
        </Text>
      </View>
      <View style={s.productInfo}>
        <Text style={s.productName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={s.productProducer} numberOfLines={1}>
          {item.productor_verificado ? "✅ " : ""}{item.productor_nombre || "Productor local"}
        </Text>
        <Text style={s.productPrice}>${parseFloat(item.precio).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={s.addBtn} onPress={() => addToCart(item.id)}>
        <Text style={s.addBtnTxt}>Agregar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hola, {user?.nombre?.split(" ")[0] || "Bienvenido"} 👋</Text>
          <Text style={s.subGreeting}>Productos ecológicos cerca de ti</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutTxt}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar productos, categorías..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={fetchData}
        />
      </View>

      {/* Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catContent}>
        <TouchableOpacity
          style={[s.catChip, !selectedCat && s.catChipActive]}
          onPress={() => setSelectedCat(null)}
        >
          <Text style={[s.catTxt, !selectedCat && s.catTxtActive]}>Todos</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catChip, selectedCat === cat.id && s.catChipActive]}
            onPress={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
          >
            <Text style={s.catEmoji}>{CATEGORY_ICONS[cat.nombre] || "🌱"}</Text>
            <Text style={[s.catTxt, selectedCat === cat.id && s.catTxtActive]}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={s.loadingTxt}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[GREEN]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🌱</Text>
              <Text style={s.emptyTxt}>No hay productos disponibles.</Text>
              <Text style={s.emptySubTxt}>Intenta con otra categoría o búsqueda.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F4" },
  header: { backgroundColor: GREEN, paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  greeting: { fontSize: 22, fontWeight: "800", color: "#fff" },
  subGreeting: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  logoutTxt: { color: "#fff", fontWeight: "600", fontSize: 13 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: "#1a1a1a" },
  catScroll: { maxHeight: 52 },
  catContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#ddd" },
  catChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  catEmoji: { fontSize: 14 },
  catTxt: { fontSize: 13, fontWeight: "600", color: "#666" },
  catTxtActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 12, gap: 10 },
  productCard: { backgroundColor: "#fff", borderRadius: 16, flexDirection: "row", alignItems: "center", padding: 14, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  productImagePlaceholder: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  productEmoji: { fontSize: 26 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  productProducer: { fontSize: 12, color: "#888", marginTop: 2 },
  productPrice: { fontSize: 17, fontWeight: "800", color: GREEN, marginTop: 4 },
  addBtn: { backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  loadingTxt: { color: "#888", marginTop: 12, fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTxt: { fontSize: 16, fontWeight: "700", color: "#444" },
  emptySubTxt: { fontSize: 13, color: "#888", marginTop: 4 },
});
