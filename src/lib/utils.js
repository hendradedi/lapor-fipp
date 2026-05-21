// Utilitas umum untuk aplikasi

import { STATUS_ORDER } from './constants';

/**
 * Menghasilkan ID unik dengan fallback jika crypto.randomUUID tidak tersedia
 * @returns {string} ID unik
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random string
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safe sessionStorage wrapper dengan try-catch
 */
export const safeSessionStorage = {
  getItem(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('Gagal membaca dari sessionStorage:', error);
      return null;
    }
  },
  setItem(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('Gagal menulis ke sessionStorage:', error);
    }
  },
  removeItem(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Gagal menghapus dari sessionStorage:', error);
    }
  },
};

/**
 * Safe localStorage wrapper dengan try-catch
 */
export const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Gagal membaca dari localStorage:', error);
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Gagal menulis ke localStorage:', error);
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Gagal menghapus dari localStorage:', error);
    }
  },
};

/**
 * Normalisasi email
 * @param {string} value 
 * @returns {string}
 */
export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Format tanggal ke string lokal
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatLocalDate(date) {
  return new Date(date).toLocaleDateString('id-ID');
}

export const statusOrder = STATUS_ORDER;