import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";

/**
 * useLocation — Hook reutilizable que abstrae toda la lógica de geolocalización.
 *
 * Principio aplicado: mínimo acceso — solo se solicita permiso foreground,
 * nunca background, ya que EcoMarket no necesita ubicación en segundo plano.
 */
export function useLocation() {
  const [permission, setPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const watchSubscription = useRef(null);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    if (status === "denied") {
      Alert.alert(
        "Permiso de ubicación denegado",
        "Para ver productores cercanos activa la ubicación en Configuración > EcoMarket.",
        [{ text: "Cancelar", style: "cancel" }, { text: "Ir a Configuración", onPress: () => Linking.openSettings() }]
      );
      return false;
    }
    if (status === "blocked") {
      Alert.alert("Ubicación bloqueada", "Actívala manualmente en la configuración del sistema.", [{ text: "Entendido" }]);
      return false;
    }
    return status === "granted";
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(coords);
      const places = await Location.reverseGeocodeAsync({ latitude: coords.coords.latitude, longitude: coords.coords.longitude });
      if (places.length > 0) {
        const pl = places[0];
        setAddress([pl.street, pl.city, pl.region, pl.country].filter(Boolean).join(", "));
      }
      return coords;
    } catch {
      Alert.alert("Error de ubicación", "No se pudo obtener tu posición. Verifica que el GPS esté activo.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startWatching = useCallback(async () => {
    if (watchSubscription.current) return;
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
      (newLocation) => setLocation(newLocation)
    );
    watchSubscription.current = sub;
    setWatching(true);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      setWatching(false);
    }
  }, []);

  useEffect(() => () => stopWatching(), [stopWatching]);

  return { permission, location, address, loading, watching, requestPermission, getCurrentLocation, startWatching, stopWatching };
}
