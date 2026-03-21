// __tests__/unit/useLocation.test.js
// Pruebas unitarias del hook useLocation — lógica GPS desacoplada de la UI

import { renderHook, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useLocation } from '../../src/hooks/useLocation';

describe('useLocation hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────
  it('inicia con estado nulo', () => {
    const { result } = renderHook(() => useLocation());
    expect(result.current.permission).toBeNull();
    expect(result.current.location).toBeNull();
    expect(result.current.address).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.watching).toBe(false);
  });

  // ── Permiso concedido ───────────────────────────────────────────────────────
  it('actualiza permiso a "granted" cuando se concede', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const { result } = renderHook(() => useLocation());
    let granted;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
    expect(result.current.permission).toBe('granted');
  });

  // ── Permiso denegado ────────────────────────────────────────────────────────
  it('retorna false y guarda "denied" cuando se deniega permiso', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { result } = renderHook(() => useLocation());
    let granted;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
    expect(result.current.permission).toBe('denied');
  });

  // ── Obtener ubicación ───────────────────────────────────────────────────────
  it('obtiene ubicación correctamente', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const { result } = renderHook(() => useLocation());
    await act(async () => { await result.current.requestPermission(); });
    await act(async () => { await result.current.getCurrentLocation(); });

    expect(result.current.location).not.toBeNull();
    expect(result.current.location.coords.latitude).toBe(-0.2295);
    expect(result.current.location.coords.longitude).toBe(-78.5243);
  });

  // ── Geocodificación inversa ─────────────────────────────────────────────────
  it('genera dirección legible desde coordenadas', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const { result } = renderHook(() => useLocation());
    await act(async () => { await result.current.requestPermission(); });
    await act(async () => { await result.current.getCurrentLocation(); });

    expect(result.current.address).toContain('Quito');
  });

  // ── Loading state ───────────────────────────────────────────────────────────
  it('activa loading durante la obtención de ubicación', async () => {
    let resolveLocation;
    Location.getCurrentPositionAsync.mockReturnValueOnce(
      new Promise((resolve) => { resolveLocation = resolve; })
    );

    const { result } = renderHook(() => useLocation());
    act(() => { result.current.getCurrentLocation(); });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveLocation({ coords: { latitude: -0.2295, longitude: -78.5243, accuracy: 10 } });
    });
    expect(result.current.loading).toBe(false);
  });

  // ── Seguimiento ─────────────────────────────────────────────────────────────
  it('activa el seguimiento GPS', async () => {
    const { result } = renderHook(() => useLocation());
    await act(async () => { await result.current.startWatching(); });
    expect(result.current.watching).toBe(true);
  });

  it('detiene el seguimiento GPS', async () => {
    const mockRemove = jest.fn();
    Location.watchPositionAsync.mockResolvedValueOnce({ remove: mockRemove });

    const { result } = renderHook(() => useLocation());
    await act(async () => { await result.current.startWatching(); });
    act(() => { result.current.stopWatching(); });

    expect(result.current.watching).toBe(false);
    expect(mockRemove).toHaveBeenCalled();
  });

  // ── Manejo de errores ───────────────────────────────────────────────────────
  it('maneja error al obtener ubicación sin crash', async () => {
    Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('GPS no disponible'));

    const { result } = renderHook(() => useLocation());
    await act(async () => {
      const location = await result.current.getCurrentLocation();
      expect(location).toBeNull();
    });
    expect(result.current.loading).toBe(false);
  });
});
