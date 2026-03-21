// __tests__/integration/HomeScreen.test.js
// Pruebas de INTEGRACIÓN — HomeScreen + productService + AuthContext
// Valida que la UI muestra datos del servicio correctamente

import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import HomeScreen from '../../src/screens/HomeScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_USER = { id: 1, nombre: 'Gilbert Azuero', email: 'gilbert@eco.com', role: 'CLIENTE' };

const MOCK_PRODUCTS = [
  { id: 1, nombre: 'Café orgánico 500g', precio: '6.50', stock: 10, estado: 'ACTIVO', es_ecologico: true, productor_nombre: 'Finca El Paraíso', productor_verificado: true, categoria_id: 1 },
  { id: 2, nombre: 'Jabón natural', precio: '2.30', stock: 5, estado: 'ACTIVO', es_ecologico: true, productor_nombre: 'Tienda Verde', productor_verificado: false, categoria_id: 3 },
  { id: 3, nombre: 'Banano ecológico', precio: '1.20', stock: 20, estado: 'ACTIVO', es_ecologico: true, productor_nombre: 'Finca El Paraíso', productor_verificado: true, categoria_id: 1 },
];

const MOCK_CATEGORIES = [
  { id: 1, nombre: 'Alimentos', descripcion: 'Orgánicos' },
  { id: 3, nombre: 'Higiene', descripcion: 'Ecológica' },
];

const Wrapper = ({ children }) => (
  <AuthProvider>
    <NavigationContainer>{children}</NavigationContainer>
  </AuthProvider>
);

// Simular usuario autenticado en AsyncStorage
async function mockAuthenticatedUser() {
  await AsyncStorage.setItem('@ecomarket_token', 'mock-token-abc');
  await AsyncStorage.setItem('@ecomarket_user', JSON.stringify(MOCK_USER));
  axios.defaults.headers.common['Authorization'] = 'Bearer mock-token-abc';
}

describe('HomeScreen — Integración', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await mockAuthenticatedUser();
  });

  // ── Carga inicial ───────────────────────────────────────────────────────────
  it('muestra saludo personalizado con el nombre del usuario', async () => {
    axios.get
      .mockResolvedValueOnce({ data: MOCK_PRODUCTS })
      .mockResolvedValueOnce({ data: MOCK_CATEGORIES });

    render(<HomeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Hola, Gilbert/i)).toBeTruthy();
    });
  });

  it('muestra los productos del catálogo', async () => {
    axios.get
      .mockResolvedValueOnce({ data: MOCK_PRODUCTS })
      .mockResolvedValueOnce({ data: MOCK_CATEGORIES });

    render(<HomeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Café orgánico 500g')).toBeTruthy();
      expect(screen.getByText('Jabón natural')).toBeTruthy();
      expect(screen.getByText('Banano ecológico')).toBeTruthy();
    });
  });

  it('muestra precios correctamente formateados', async () => {
    axios.get
      .mockResolvedValueOnce({ data: MOCK_PRODUCTS })
      .mockResolvedValueOnce({ data: MOCK_CATEGORIES });

    render(<HomeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('$6.50')).toBeTruthy();
      expect(screen.getByText('$2.30')).toBeTruthy();
    });
  });

  it('muestra las categorías como filtros', async () => {
    axios.get
      .mockResolvedValueOnce({ data: MOCK_PRODUCTS })
      .mockResolvedValueOnce({ data: MOCK_CATEGORIES });

    render(<HomeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Alimentos')).toBeTruthy();
      expect(screen.getByText('Higiene')).toBeTruthy();
    });
  });

  // ── Mensaje vacío ───────────────────────────────────────────────────────────
  it('muestra mensaje vacío cuando no hay productos', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: MOCK_CATEGORIES });

    render(<HomeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No hay productos disponibles/i)).toBeTruthy();
    });
  });

  // ── Agregar al carrito ──────────────────────────────────────────────────────
  it('llama al endpoint de carrito al presionar Agregar', async () => {
    axios.get
      .mockResolvedValueOnce({ data: MOCK_PRODUCTS })
      .mockResolvedValueOnce({ data: MOCK_CATEGORIES });
    axios.post.mockResolvedValueOnce({ data: { message: 'Producto agregado al carrito' } });

    render(<HomeScreen />, { wrapper: Wrapper });

    await waitFor(() => screen.getAllByText('Agregar'));

    const addButtons = screen.getAllByText('Agregar');
    fireEvent.press(addButtons[0]);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/carrito/items'),
        expect.objectContaining({ producto_id: 1, cantidad: 1 })
      );
    });
  });
});
