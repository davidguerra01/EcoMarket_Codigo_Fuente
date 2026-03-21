import React, { useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, SafeAreaView, StatusBar,
} from "react-native";
import { CameraView } from "expo-camera";
import { useCamera } from "../hooks/useCamera";

const GREEN = "#1B8A4E";

/**
 * CameraScreen
 * Pantalla de cámara nativa para EcoMarket.
 * Toda la lógica de hardware está en useCamera (arquitectura desacoplada).
 */
export default function CameraScreen() {
  const { cameraRef, cameraPermission, photo, loading, facing, requestPermissions, takePhoto, savePhoto, toggleFacing, discardPhoto } = useCamera();

  useEffect(() => { requestPermissions(); }, []);

  if (cameraPermission === null) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={s.info}>Verificando permisos de cámara...</Text>
      </View>
    );
  }

  if (cameraPermission === "denied" || cameraPermission === "blocked") {
    return (
      <View style={s.center}>
        <Text style={s.bigIcon}>📷</Text>
        <Text style={s.title}>Cámara no disponible</Text>
        <Text style={s.info}>EcoMarket necesita acceso a la cámara para fotografiar productos. Activa el permiso en Configuración.</Text>
        <TouchableOpacity style={s.greenBtn} onPress={requestPermissions}>
          <Text style={s.greenBtnTxt}>Solicitar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photo) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.previewHeader}>
          <Text style={s.previewTitle}>📸 Vista previa</Text>
          <Text style={s.previewSub}>¿Te gusta la foto?</Text>
        </View>
        <Image source={{ uri: photo.uri }} style={s.preview} />
        <View style={s.actionRow}>
          <TouchableOpacity style={s.retakeBtn} onPress={discardPhoto}>
            <Text style={s.retakeTxt}>🔄 Repetir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={() => savePhoto(photo.uri)}>
            <Text style={s.saveTxt}>💾 Guardar en galería</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.topBar}>
        <Text style={s.topTitle}>📷 Fotografiar producto</Text>
        <Text style={s.topSub}>Encuadra el producto en el marco</Text>
      </View>

      <CameraView ref={cameraRef} style={s.camera} facing={facing}>
        <View style={s.overlay}>
          <View style={s.focusFrame}>
            <View style={[s.corner, s.tl]} /><View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} /><View style={[s.corner, s.br]} />
          </View>
          <Text style={s.hint}>Encuadra el producto</Text>
        </View>
      </CameraView>

      <View style={s.controls}>
        <TouchableOpacity style={s.flipBtn} onPress={toggleFacing}>
          <Text style={s.flipIcon}>🔄</Text>
          <Text style={s.flipLabel}>Girar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.shutterOuter, loading && s.shutterDisabled]} onPress={takePhoto} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <View style={s.shutterInner} />}
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#F0F7F4" },
  bigIcon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  info: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 24, marginTop: 8 },
  greenBtn: { backgroundColor: GREEN, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  greenBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  topBar: { backgroundColor: "#111", padding: 16, alignItems: "center" },
  topTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  topSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  focusFrame: { width: 240, height: 240, position: "relative" },
  corner: { position: "absolute", width: 24, height: 24, borderColor: GREEN, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 16 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111", paddingVertical: 28, paddingHorizontal: 44 },
  flipBtn: { alignItems: "center", width: 60 },
  flipIcon: { fontSize: 28 },
  flipLabel: { color: "#fff", fontSize: 11, marginTop: 3 },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: GREEN },
  shutterDisabled: { opacity: 0.4 },
  previewHeader: { backgroundColor: GREEN, padding: 18, alignItems: "center" },
  previewTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  previewSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  preview: { flex: 1, resizeMode: "cover" },
  actionRow: { flexDirection: "row", padding: 16, gap: 12, backgroundColor: "#111" },
  retakeBtn: { flex: 1, backgroundColor: "#333", padding: 15, borderRadius: 12, alignItems: "center" },
  retakeTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: GREEN, padding: 15, borderRadius: 12, alignItems: "center" },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
