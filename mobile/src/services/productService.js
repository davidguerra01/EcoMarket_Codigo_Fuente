// src/services/productService.js
// Lógica de negocio de productos — desacoplada de la UI

import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Formatea el precio de un producto para mostrar en la UI.
 * @param {number|string} price
 * @returns {string}
 */
export function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

/**
 * Filtra productos por término de búsqueda.
 * @param {Array} products
 * @param {string} query
 * @returns {Array}
 */
export function filterProductsByQuery(products, query) {
  if (!query || query.trim() === '') return products;
  const q = query.toLowerCase().trim();
  return products.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q) ||
      p.productor_nombre?.toLowerCase().includes(q)
  );
}

/**
 * Ordena productos por precio (asc o desc).
 * @param {Array} products
 * @param {'asc'|'desc'} direction
 * @returns {Array}
 */
export function sortProductsByPrice(products, direction = 'asc') {
  return [...products].sort((a, b) => {
    const diff = parseFloat(a.precio) - parseFloat(b.precio);
    return direction === 'asc' ? diff : -diff;
  });
}

/**
 * Calcula el total del carrito.
 * @param {Array} items - [{ precio_unitario, cantidad }]
 * @returns {number}
 */
export function calculateCartTotal(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((acc, item) => {
    const price = parseFloat(item.precio_unitario) || 0;
    const qty = parseInt(item.cantidad) || 0;
    return acc + price * qty;
  }, 0);
}

/**
 * Calcula el total redondeado del carrito.
 * @param {Array} items
 * @returns {string}
 */
export function calculateCartTotalFormatted(items) {
  return formatPrice(calculateCartTotal(items));
}

/**
 * Valida si un producto puede ser agregado al carrito.
 * @param {object} product
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateProductForCart(product) {
  if (!product) return { valid: false, error: 'Producto no encontrado' };
  if (product.estado !== 'ACTIVO') return { valid: false, error: 'Producto no disponible' };
  if (product.stock <= 0) return { valid: false, error: 'Producto sin stock' };
  return { valid: true };
}

/**
 * Obtiene el ícono emoji de una categoría.
 * @param {string} categoryName
 * @returns {string}
 */
export function getCategoryIcon(categoryName) {
  const icons = {
    Alimentos: '🥬',
    Hogar: '🏡',
    Higiene: '🧴',
    Agricultura: '🌾',
  };
  return icons[categoryName] || '🌱';
}

// ── Servicios de API ──────────────────────────────────────────────────────────

export async function fetchProducts(filters = {}) {
  const params = {};
  if (filters.categoria_id) params.categoria_id = filters.categoria_id;
  if (filters.q) params.q = filters.q;
  if (filters.min_precio != null) params.min_precio = filters.min_precio;
  if (filters.max_precio != null) params.max_precio = filters.max_precio;
  const res = await axios.get(`${API_URL}/productos/`, { params });
  return res.data;
}

export async function fetchCategories() {
  const res = await axios.get(`${API_URL}/categorias/`);
  return res.data;
}

export async function addToCart(productId, cantidad = 1) {
  const res = await axios.post(`${API_URL}/carrito/items`, {
    producto_id: productId,
    cantidad,
  });
  return res.data;
}

export async function fetchCart() {
  const res = await axios.get(`${API_URL}/carrito/`);
  return res.data;
}

export async function checkout() {
  const res = await axios.post(`${API_URL}/carrito/checkout`);
  return res.data;
}
