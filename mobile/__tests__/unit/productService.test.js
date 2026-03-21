// __tests__/unit/productService.test.js
// Pruebas unitarias — lógica de negocio de productos

import {
  formatPrice,
  filterProductsByQuery,
  sortProductsByPrice,
  calculateCartTotal,
  calculateCartTotalFormatted,
  validateProductForCart,
  getCategoryIcon,
} from '../../src/services/productService';

const SAMPLE_PRODUCTS = [
  { id: 1, nombre: 'Café orgánico 500g', descripcion: 'Café de altura', precio: '6.50', estado: 'ACTIVO', stock: 10, productor_nombre: 'Finca El Paraíso' },
  { id: 2, nombre: 'Jabón natural', descripcion: 'Higiene ecológica', precio: '2.30', estado: 'ACTIVO', stock: 5, productor_nombre: 'Tienda Verde' },
  { id: 3, nombre: 'Banano ecológico', descripcion: 'Del campo', precio: '1.20', estado: 'ACTIVO', stock: 0, productor_nombre: 'Finca El Paraíso' },
  { id: 4, nombre: 'Miel de abeja', descripcion: 'Miel pura', precio: '8.00', estado: 'INACTIVO', stock: 3, productor_nombre: 'Apiario Sur' },
];

// ─────────────────────────────────────────────────────────────────────────────
describe('formatPrice', () => {
  it('formatea precio numérico correctamente', () => {
    expect(formatPrice(6.5)).toBe('$6.50');
  });

  it('formatea precio string correctamente', () => {
    expect(formatPrice('2.3')).toBe('$2.30');
  });

  it('formatea precio entero', () => {
    expect(formatPrice(10)).toBe('$10.00');
  });

  it('retorna $0.00 para valor inválido', () => {
    expect(formatPrice('no-es-numero')).toBe('$0.00');
  });

  it('retorna $0.00 para undefined', () => {
    expect(formatPrice(undefined)).toBe('$0.00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('filterProductsByQuery', () => {
  it('retorna todos los productos si no hay búsqueda', () => {
    expect(filterProductsByQuery(SAMPLE_PRODUCTS, '')).toHaveLength(4);
  });

  it('filtra por nombre del producto', () => {
    const result = filterProductsByQuery(SAMPLE_PRODUCTS, 'café');
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toContain('Café');
  });

  it('filtra por nombre del productor', () => {
    const result = filterProductsByQuery(SAMPLE_PRODUCTS, 'Finca');
    expect(result).toHaveLength(2);
  });

  it('es case-insensitive', () => {
    const result = filterProductsByQuery(SAMPLE_PRODUCTS, 'JABÓN');
    expect(result).toHaveLength(1);
  });

  it('retorna array vacío si no hay coincidencias', () => {
    const result = filterProductsByQuery(SAMPLE_PRODUCTS, 'aguacate');
    expect(result).toHaveLength(0);
  });

  it('retorna todos si query es null', () => {
    expect(filterProductsByQuery(SAMPLE_PRODUCTS, null)).toHaveLength(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('sortProductsByPrice', () => {
  it('ordena de menor a mayor precio (asc)', () => {
    const sorted = sortProductsByPrice(SAMPLE_PRODUCTS, 'asc');
    const prices = sorted.map((p) => parseFloat(p.precio));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('ordena de mayor a menor precio (desc)', () => {
    const sorted = sortProductsByPrice(SAMPLE_PRODUCTS, 'desc');
    const prices = sorted.map((p) => parseFloat(p.precio));
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('no muta el array original', () => {
    const original = [...SAMPLE_PRODUCTS];
    sortProductsByPrice(SAMPLE_PRODUCTS, 'asc');
    expect(SAMPLE_PRODUCTS).toEqual(original);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateCartTotal', () => {
  const cartItems = [
    { precio_unitario: '6.50', cantidad: 2 },
    { precio_unitario: '2.30', cantidad: 1 },
    { precio_unitario: '1.20', cantidad: 3 },
  ];

  it('calcula el total correctamente', () => {
    // 6.50*2 + 2.30*1 + 1.20*3 = 13.00 + 2.30 + 3.60 = 18.90
    expect(calculateCartTotal(cartItems)).toBeCloseTo(18.9, 2);
  });

  it('retorna 0 para carrito vacío', () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it('retorna 0 para null', () => {
    expect(calculateCartTotal(null)).toBe(0);
  });

  it('maneja cantidades en string', () => {
    const items = [{ precio_unitario: '5.00', cantidad: '3' }];
    expect(calculateCartTotal(items)).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateCartTotalFormatted', () => {
  it('retorna total formateado con símbolo de dólar', () => {
    const items = [{ precio_unitario: 10, cantidad: 2 }];
    expect(calculateCartTotalFormatted(items)).toBe('$20.00');
  });

  it('retorna $0.00 para carrito vacío', () => {
    expect(calculateCartTotalFormatted([])).toBe('$0.00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateProductForCart', () => {
  it('acepta producto activo con stock', () => {
    const result = validateProductForCart(SAMPLE_PRODUCTS[0]);
    expect(result.valid).toBe(true);
  });

  it('rechaza producto sin stock', () => {
    const result = validateProductForCart(SAMPLE_PRODUCTS[2]); // stock: 0
    expect(result.valid).toBe(false);
    expect(result.error).toContain('stock');
  });

  it('rechaza producto inactivo', () => {
    const result = validateProductForCart(SAMPLE_PRODUCTS[3]); // INACTIVO
    expect(result.valid).toBe(false);
    expect(result.error).toContain('no disponible');
  });

  it('rechaza producto null', () => {
    expect(validateProductForCart(null).valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getCategoryIcon', () => {
  it('retorna ícono correcto para Alimentos', () => {
    expect(getCategoryIcon('Alimentos')).toBe('🥬');
  });

  it('retorna ícono correcto para Hogar', () => {
    expect(getCategoryIcon('Hogar')).toBe('🏡');
  });

  it('retorna ícono por defecto para categoría desconocida', () => {
    expect(getCategoryIcon('Electrónica')).toBe('🌱');
  });

  it('retorna ícono por defecto para undefined', () => {
    expect(getCategoryIcon(undefined)).toBe('🌱');
  });
});
