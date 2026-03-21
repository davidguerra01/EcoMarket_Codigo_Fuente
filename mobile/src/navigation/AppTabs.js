import React from "react";
import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import OrdersScreen from "../screens/OrdersScreen";
import CameraScreen from "../screens/CameraScreen";
import LocationScreen from "../screens/LocationScreen";

const Tab = createBottomTabNavigator();
const GREEN = "#1B8A4E";

function TabIcon({ emoji, focused, badge }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
      {badge ? (
        <View style={{ position: "absolute", top: -4, right: -8, backgroundColor: "#F5832A", borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
          paddingBottom: 8,
          paddingTop: 4,
          height: 66,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" focused={focused} /> }}
      />
      <Tab.Screen
        name="Carrito"
        component={CartScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} /> }}
      />
      <Tab.Screen
        name="Pedidos"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} /> }}
      />
      <Tab.Screen
        name="Cámara"
        component={CameraScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📷" focused={focused} /> }}
      />
      <Tab.Screen
        name="Ubicación"
        component={LocationScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📍" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
