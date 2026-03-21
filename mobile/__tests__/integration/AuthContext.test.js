// __tests__/integration/AuthContext.test.js
// Pruebas de INTEGRACIÓN — AuthContext completo
// Valida persistencia de sesión, login, logout y refresh token

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

const Wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const MOCK_RESPONSE = {
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-456',
  user: { id: 1, nombre: 'David Guerra', email: 'david@eco.com', role: 'CLIENTE' },
};

describe('AuthContext — Integración', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────
  it('inicia sin token ni usuario', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => { /* esperar hidratación */ });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  // ── Restauración de sesión ──────────────────────────────────────────────────
  it('restaura sesión desde AsyncStorage al iniciar', async () => {
    await AsyncStorage.setItem('@ecomarket_token', 'saved-token');
    await AsyncStorage.setItem('@ecomarket_user', JSON.stringify({ id: 2, nombre: 'Cached' }));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await act(async () => { /* esperar efecto de hidratación */ });

    expect(result.current.token).toBe('saved-token');
    expect(result.current.user.nombre).toBe('Cached');
  });

  it('configura Authorization header al restaurar sesión', async () => {
    await AsyncStorage.setItem('@ecomarket_token', 'saved-token');
    await AsyncStorage.setItem('@ecomarket_user', JSON.stringify({ id: 1 }));

    renderHook(() => useAuth(), { wrapper: Wrapper });
    await act(async () => {});

    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer saved-token');
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  it('hace login y persiste token + usuario', async () => {
    axios.post.mockResolvedValueOnce({ data: MOCK_RESPONSE });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login('david@eco.com', 'secreta123');
    });

    expect(result.current.token).toBe('access-token-123');
    expect(result.current.user.nombre).toBe('David Guerra');

    const savedToken = await AsyncStorage.getItem('@ecomarket_token');
    expect(savedToken).toBe('access-token-123');
  });

  // ── Logout ──────────────────────────────────────────────────────────────────
  it('hace logout y limpia estado + AsyncStorage', async () => {
    axios.post.mockResolvedValueOnce({ data: MOCK_RESPONSE });
    axios.post.mockResolvedValueOnce({ data: { message: 'ok' } }); // logout endpoint

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await act(async () => {});

    await act(async () => { await result.current.login('david@eco.com', 'secreta'); });
    expect(result.current.token).not.toBeNull();

    await act(async () => { await result.current.logout(); });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    const savedToken = await AsyncStorage.getItem('@ecomarket_token');
    expect(savedToken).toBeNull();
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
  });

  // ── Refresh token ───────────────────────────────────────────────────────────
  it('renueva el access token usando refresh token', async () => {
    axios.post.mockResolvedValueOnce({ data: MOCK_RESPONSE }); // login
    axios.post.mockResolvedValueOnce({ // refresh
      data: { access_token: 'new-access-token-789', token_type: 'bearer' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await act(async () => {});

    await act(async () => { await result.current.login('david@eco.com', 'secreta'); });
    await act(async () => { await result.current.refreshSession(); });

    expect(result.current.token).toBe('new-access-token-789');
    const savedToken = await AsyncStorage.getItem('@ecomarket_token');
    expect(savedToken).toBe('new-access-token-789');
  });

  // ── Registro ────────────────────────────────────────────────────────────────
  it('hace registro y persiste sesión automáticamente', async () => {
    axios.post.mockResolvedValueOnce({ data: MOCK_RESPONSE });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.register({
        nombre: 'David Guerra',
        email: 'david@eco.com',
        password: 'secreta123',
        role_id: 2,
      });
    });

    expect(result.current.token).toBe('access-token-123');
    expect(result.current.user.role).toBe('CLIENTE');
  });
});
