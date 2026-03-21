// __tests__/unit/authService.test.js
// Pruebas unitarias — lógica de negocio de autenticación
// Valida validaciones, transformaciones y manejo de errores SIN UI

import {
  validateEmail,
  validatePassword,
  validateLoginForm,
  validateRegisterForm,
  formatDisplayName,
  parseLoginResponse,
  isInvalidCredentialsError,
  saveSession,
  loadSession,
  clearSession,
  STORAGE_KEYS,
} from '../../src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
describe('validateEmail', () => {
  it('acepta un email válido', () => {
    expect(validateEmail('david@ecomarket.com')).toEqual({ valid: true });
  });

  it('rechaza email vacío', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rechaza email sin @', () => {
    const result = validateEmail('davidsinArroba.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('inválido');
  });

  it('rechaza email null', () => {
    expect(validateEmail(null).valid).toBe(false);
  });

  it('rechaza email con espacios', () => {
    expect(validateEmail('  ').valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validatePassword', () => {
  it('acepta contraseña válida', () => {
    expect(validatePassword('segura123').valid).toBe(true);
  });

  it('rechaza contraseña menor a 6 caracteres', () => {
    const result = validatePassword('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('6');
  });

  it('rechaza contraseña vacía', () => {
    expect(validatePassword('').valid).toBe(false);
  });

  it('rechaza contraseña null', () => {
    expect(validatePassword(null).valid).toBe(false);
  });

  it('rechaza contraseña mayor a 128 caracteres', () => {
    const longPass = 'a'.repeat(129);
    expect(validatePassword(longPass).valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateLoginForm', () => {
  it('valida formulario correcto', () => {
    const result = validateLoginForm({ email: 'user@test.com', password: 'password123' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('devuelve errores para ambos campos vacíos', () => {
    const result = validateLoginForm({ email: '', password: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('email');
    expect(result.errors).toHaveProperty('password');
  });

  it('devuelve solo error de password si email es válido', () => {
    const result = validateLoginForm({ email: 'ok@test.com', password: '123' });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toHaveProperty('email');
    expect(result.errors).toHaveProperty('password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegisterForm', () => {
  const validForm = {
    nombre: 'David Guerra',
    email: 'david@eco.com',
    password: 'secreta123',
    confirmar: 'secreta123',
    role_id: 2,
  };

  it('valida formulario completo de CLIENTE', () => {
    const result = validateRegisterForm(validForm);
    expect(result.valid).toBe(true);
  });

  it('rechaza contraseñas que no coinciden', () => {
    const result = validateRegisterForm({ ...validForm, confirmar: 'diferente' });
    expect(result.valid).toBe(false);
    expect(result.errors.confirmar).toContain('no coinciden');
  });

  it('requiere nombre_tienda para PRODUCTOR', () => {
    const result = validateRegisterForm({ ...validForm, role_id: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors.nombre_tienda).toBeTruthy();
  });

  it('acepta PRODUCTOR con nombre_tienda', () => {
    const result = validateRegisterForm({
      ...validForm,
      role_id: 3,
      nombre_tienda: 'Finca El Paraíso',
    });
    expect(result.valid).toBe(true);
  });

  it('rechaza nombre demasiado corto', () => {
    const result = validateRegisterForm({ ...validForm, nombre: 'A' });
    expect(result.valid).toBe(false);
    expect(result.errors.nombre).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('formatDisplayName', () => {
  it('retorna el primer nombre', () => {
    expect(formatDisplayName('David Paúl Guerra')).toBe('David');
  });

  it('retorna nombre completo si es una sola palabra', () => {
    expect(formatDisplayName('Gilbert')).toBe('Gilbert');
  });

  it('retorna "Usuario" para entrada vacía', () => {
    expect(formatDisplayName('')).toBe('Usuario');
  });

  it('retorna "Usuario" para null', () => {
    expect(formatDisplayName(null)).toBe('Usuario');
  });

  it('ignora espacios extras', () => {
    expect(formatDisplayName('  María  José  ')).toBe('María');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('parseLoginResponse', () => {
  it('parsea respuesta válida del servidor', () => {
    const raw = {
      access_token: 'eyJ.abc.xyz',
      refresh_token: 'eyJ.refresh.xyz',
      user: { id: 1, nombre: 'David', email: 'david@eco.com', role: 'CLIENTE' },
    };
    const result = parseLoginResponse(raw);
    expect(result.accessToken).toBe('eyJ.abc.xyz');
    expect(result.refreshToken).toBe('eyJ.refresh.xyz');
    expect(result.user.id).toBe(1);
  });

  it('lanza error si falta access_token', () => {
    expect(() => parseLoginResponse({ user: {} })).toThrow('Token de acceso no recibido');
  });

  it('lanza error si falta user', () => {
    expect(() => parseLoginResponse({ access_token: 'abc' })).toThrow('Datos de usuario no recibidos');
  });

  it('lanza error para respuesta null', () => {
    expect(() => parseLoginResponse(null)).toThrow('Respuesta vacía');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('isInvalidCredentialsError', () => {
  it('detecta error 401', () => {
    const err = { response: { status: 401, data: { detail: 'Unauthorized' } } };
    expect(isInvalidCredentialsError(err)).toBe(true);
  });

  it('detecta mensaje de credenciales incorrectas', () => {
    const err = { response: { status: 400, data: { detail: 'Credenciales incorrectas' } } };
    expect(isInvalidCredentialsError(err)).toBe(true);
  });

  it('retorna false para error 500', () => {
    const err = { response: { status: 500, data: { detail: 'Internal Server Error' } } };
    expect(isInvalidCredentialsError(err)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('saveSession / loadSession / clearSession', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('guarda y carga la sesión correctamente', async () => {
    const session = {
      accessToken: 'token-abc',
      refreshToken: 'refresh-xyz',
      user: { id: 1, nombre: 'David' },
    };
    await saveSession(session);

    const loaded = await loadSession();
    expect(loaded.token).toBe('token-abc');
    expect(loaded.refreshToken).toBe('refresh-xyz');
    expect(loaded.user.id).toBe(1);
  });

  it('configura el header Authorization al guardar sesión', async () => {
    await saveSession({ accessToken: 'mi-token', user: { id: 1 } });
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer mi-token');
  });

  it('limpia la sesión correctamente', async () => {
    await saveSession({ accessToken: 'token', user: { id: 1 } });
    await clearSession();

    const loaded = await loadSession();
    expect(loaded.token).toBeNull();
    expect(loaded.user).toBeNull();
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('retorna nulls si no hay sesión guardada', async () => {
    const loaded = await loadSession();
    expect(loaded.token).toBeNull();
    expect(loaded.user).toBeNull();
  });
});
