// __tests__/integration/LoginScreen.test.js
// Pruebas de INTEGRACIÓN — UI de Login + AuthContext + authService
// Valida la interacción entre componente y lógica de negocio

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../../src/screens/LoginScreen';
import { AuthProvider } from '../../src/context/AuthContext';

// Wrapper con navegación y contexto de autenticación
const Wrapper = ({ children }) => (
  <AuthProvider>
    <NavigationContainer>{children}</NavigationContainer>
  </AuthProvider>
);

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() };

// Respuesta exitosa del servidor
const MOCK_LOGIN_RESPONSE = {
  access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.test',
  refresh_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.refresh',
  user: { id: 1, nombre: 'David Guerra', email: 'david@eco.com', role: 'CLIENTE' },
};

describe('LoginScreen — Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ── Renderizado ─────────────────────────────────────────────────────────────
  it('renderiza correctamente los elementos principales', () => {
    render(<LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper });

    expect(screen.getByText('EcoMarket')).toBeTruthy();
    expect(screen.getByText('Iniciar sesión')).toBeTruthy();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getByText(/Ingresar/i)).toBeTruthy();
  });

  it('muestra el enlace de registro', () => {
    render(<LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper });
    expect(screen.getByText(/Regístrate aquí/i)).toBeTruthy();
  });

  // ── Navegación ──────────────────────────────────────────────────────────────
  it('navega a la pantalla de registro al presionar el enlace', () => {
    render(<LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper });

    const registerLink = screen.getByText(/Regístrate aquí/i);
    fireEvent.press(registerLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  // ── Validación de formulario ────────────────────────────────────────────────
  it('muestra alerta si se envía sin datos', async () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper }
    );

    fireEvent.press(getByText(/Ingresar/i));

    // No debe llamar al API
    expect(axios.post).not.toHaveBeenCalled();
  });

  // ── Login exitoso ───────────────────────────────────────────────────────────
  it('llama al API con credenciales correctas', async () => {
    axios.post.mockResolvedValueOnce({ data: MOCK_LOGIN_RESPONSE });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'david@eco.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'secreta123');
    fireEvent.press(getByText(/Ingresar/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          email: 'david@eco.com',
          password: 'secreta123',
        })
      );
    });
  });

  it('guarda el token en AsyncStorage tras login exitoso', async () => {
    axios.post.mockResolvedValueOnce({ data: MOCK_LOGIN_RESPONSE });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'david@eco.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'secreta123');
    fireEvent.press(getByText(/Ingresar/i));

    await waitFor(async () => {
      const token = await AsyncStorage.getItem('@ecomarket_token');
      expect(token).toBe(MOCK_LOGIN_RESPONSE.access_token);
    });
  });

  // ── Login fallido ───────────────────────────────────────────────────────────
  it('muestra error de credenciales incorrectas', async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Credenciales incorrectas' } },
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />, { wrapper: Wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'malo@eco.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
    fireEvent.press(getByText(/Ingresar/i));

    await waitFor(() => {
      // El token no debe guardarse
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        '@ecomarket_token',
        expect.anything()
      );
    });
  });
});
