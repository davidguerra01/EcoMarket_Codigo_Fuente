// jest.setup.js — Configuración global de mocks para Jest + Expo

import '@testing-library/jest-native/extend-expect';

// ── Mock: AsyncStorage ────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ── Mock: expo-camera ─────────────────────────────────────────────────────────
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
  },
  CameraView: 'CameraView',
}));

// ── Mock: expo-location ───────────────────────────────────────────────────────
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: -0.2295,
        longitude: -78.5243,
        accuracy: 10,
      },
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        street: 'Av. 6 de Diciembre',
        city: 'Quito',
        region: 'Pichincha',
        country: 'Ecuador',
      },
    ])
  ),
  watchPositionAsync: jest.fn(() =>
    Promise.resolve({ remove: jest.fn() })
  ),
  Accuracy: { Balanced: 3, High: 5 },
}));

// ── Mock: expo-media-library ──────────────────────────────────────────────────
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  saveToLibraryAsync: jest.fn(() => Promise.resolve()),
}));

// ── Mock: axios ───────────────────────────────────────────────────────────────
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// ── Mock: @react-navigation/native ────────────────────────────────────────────
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn((cb) => cb()),
}));

// ── Suppress known warnings ───────────────────────────────────────────────────
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('componentWillReceiveProps') ||
      args[0].includes('componentWillMount') ||
      args[0].includes('NativeEventEmitter'))
  ) {
    return;
  }
  originalWarn(...args);
};
