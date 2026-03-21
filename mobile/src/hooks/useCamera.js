import { useState, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

/**
 * useCamera — Hook reutilizable que desacopla toda la lógica de hardware
 * de cámara de los componentes de interfaz de usuario.
 *
 * Principio aplicado: mínimo acceso — el permiso de galería solo se
 * solicita cuando el usuario decide guardar una foto.
 */
export function useCamera() {
  const cameraRef = useRef(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState("back");

  const requestPermissions = useCallback(async () => {
    const camResult = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(camResult.status);
    if (camResult.status === "denied") {
      Alert.alert("Permiso denegado", "Ve a Configuración > EcoMarket > Cámara y activa el permiso.", [{ text: "Entendido" }]);
      return false;
    }
    if (camResult.status === "blocked") {
      Alert.alert("Cámara bloqueada", "Actívala manualmente en Configuración.", [{ text: "Entendido" }]);
      return false;
    }
    const mediaResult = await MediaLibrary.requestPermissionsAsync();
    setMediaPermission(mediaResult.status);
    return camResult.status === "granted";
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return null;
    setLoading(true);
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false, skipProcessing: false });
      setPhoto(result);
      return result;
    } catch {
      Alert.alert("Error", "No se pudo tomar la foto. Intenta de nuevo.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const savePhoto = useCallback(async (uri) => {
    if (mediaPermission !== "granted") {
      Alert.alert("Sin permiso", "No tienes permiso para guardar en la galería.");
      return false;
    }
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("✅ Guardado", "La foto se guardó en tu galería correctamente.");
      return true;
    } catch {
      Alert.alert("Error", "No se pudo guardar la foto.");
      return false;
    }
  }, [mediaPermission]);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const discardPhoto = useCallback(() => setPhoto(null), []);

  return { cameraRef, cameraPermission, mediaPermission, photo, loading, facing, requestPermissions, takePhoto, savePhoto, toggleFacing, discardPhoto };
}
