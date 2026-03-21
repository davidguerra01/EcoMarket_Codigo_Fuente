// __tests__/unit/useCamera.test.js
// Pruebas unitarias del hook useCamera — lógica de cámara desacoplada de la UI

import { renderHook, act } from '@testing-library/react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useCamera } from '../../src/hooks/useCamera';

describe('useCamera hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────
  it('inicia con valores nulos y facing "back"', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.cameraPermission).toBeNull();
    expect(result.current.mediaPermission).toBeNull();
    expect(result.current.photo).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.facing).toBe('back');
  });

  // ── Permisos ────────────────────────────────────────────────────────────────
  it('solicita permisos y retorna true cuando se conceden', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const { result } = renderHook(() => useCamera());
    let granted;
    await act(async () => {
      granted = await result.current.requestPermissions();
    });

    expect(granted).toBe(true);
    expect(result.current.cameraPermission).toBe('granted');
    expect(result.current.mediaPermission).toBe('granted');
  });

  it('retorna false cuando la cámara es denegada', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { result } = renderHook(() => useCamera());
    let granted;
    await act(async () => {
      granted = await result.current.requestPermissions();
    });

    expect(granted).toBe(false);
    expect(result.current.cameraPermission).toBe('denied');
  });

  it('retorna false cuando la cámara está bloqueada', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'blocked' });

    const { result } = renderHook(() => useCamera());
    let granted;
    await act(async () => {
      granted = await result.current.requestPermissions();
    });

    expect(granted).toBe(false);
  });

  // ── Toggle facing ───────────────────────────────────────────────────────────
  it('alterna entre cámara trasera y frontal', () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.facing).toBe('back');
    act(() => { result.current.toggleFacing(); });
    expect(result.current.facing).toBe('front');
    act(() => { result.current.toggleFacing(); });
    expect(result.current.facing).toBe('back');
  });

  // ── Captura de foto ─────────────────────────────────────────────────────────
  it('captura una foto correctamente', async () => {
    const mockPhoto = { uri: 'file:///tmp/photo.jpg', width: 1920, height: 1080 };
    const mockTakePicture = jest.fn().mockResolvedValue(mockPhoto);

    const { result } = renderHook(() => useCamera());
    // Simular ref de cámara
    result.current.cameraRef.current = { takePictureAsync: mockTakePicture };

    let photo;
    await act(async () => {
      photo = await result.current.takePhoto();
    });

    expect(photo).toEqual(mockPhoto);
    expect(result.current.photo).toEqual(mockPhoto);
    expect(result.current.loading).toBe(false);
    expect(mockTakePicture).toHaveBeenCalledWith({
      quality: 0.7,
      base64: false,
      skipProcessing: false,
    });
  });

  it('retorna null si no hay cameraRef', async () => {
    const { result } = renderHook(() => useCamera());
    // cameraRef.current es null por defecto

    let photo;
    await act(async () => {
      photo = await result.current.takePhoto();
    });

    expect(photo).toBeNull();
  });

  it('maneja error al capturar foto sin crash', async () => {
    const mockTakePicture = jest.fn().mockRejectedValue(new Error('Sensor error'));
    const { result } = renderHook(() => useCamera());
    result.current.cameraRef.current = { takePictureAsync: mockTakePicture };

    let photo;
    await act(async () => {
      photo = await result.current.takePhoto();
    });

    expect(photo).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  // ── Guardar foto ────────────────────────────────────────────────────────────
  it('guarda foto cuando tiene permiso de galería', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const { result } = renderHook(() => useCamera());
    await act(async () => { await result.current.requestPermissions(); });

    let saved;
    await act(async () => {
      saved = await result.current.savePhoto('file:///tmp/photo.jpg');
    });

    expect(saved).toBe(true);
    expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith('file:///tmp/photo.jpg');
  });

  it('no guarda foto sin permiso de galería', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { result } = renderHook(() => useCamera());
    await act(async () => { await result.current.requestPermissions(); });

    let saved;
    await act(async () => {
      saved = await result.current.savePhoto('file:///tmp/photo.jpg');
    });

    expect(saved).toBe(false);
    expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
  });

  // ── Descartar foto ──────────────────────────────────────────────────────────
  it('descarta la foto y vuelve a null', async () => {
    const mockPhoto = { uri: 'file:///tmp/photo.jpg' };
    const { result } = renderHook(() => useCamera());
    result.current.cameraRef.current = {
      takePictureAsync: jest.fn().mockResolvedValue(mockPhoto),
    };

    await act(async () => { await result.current.takePhoto(); });
    expect(result.current.photo).not.toBeNull();

    act(() => { result.current.discardPhoto(); });
    expect(result.current.photo).toBeNull();
  });
});
