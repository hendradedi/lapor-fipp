import { PRIMARY_ADMIN_EMAIL } from './constants.js';

// Konfigurasi API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper untuk request
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authApi = {
  async registerReporter(email, password, displayName) {
    return request('/auth/register', {
      method: 'POST',
      body: { email, password, displayName },
    });
  },

  async loginReporter(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async loginReporterWithGoogle(email, displayName) {
    return request('/auth/google', {
      method: 'POST',
      body: { email, displayName },
    });
  },

  async loginAdmin(email, password) {
    return request('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async getMe(token) {
    return request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Report API
export const reportService = {
  async createReport(payload, token) {
    return request('/reports', {
      method: 'POST',
      body: payload,
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async listReports(token) {
    return request('/reports', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getReportById(id, token) {
    return request(`/reports/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateReportStatus(id, payload, token) {
    return request(`/reports/${id}/status`, {
      method: 'PUT',
      body: payload,
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async uploadAttachment(reportId, file, token) {
    const formData = new FormData();
    formData.append('attachment', file);

    const url = `${API_BASE_URL}/reports/${reportId}/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getAttachments(reportId, token) {
    return request(`/reports/${reportId}/attachments`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async deleteAttachment(reportId, attachmentId, token) {
    return request(`/reports/${reportId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Admin API
export const adminService = {
  async getAdminPolicy(token) {
    return request('/admin/policy', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async promoteAssistantAdmin(email, token) {
    return request('/admin/assistants', {
      method: 'POST',
      body: { email },
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async revokeAssistantAdmin(email, token) {
    return request(`/admin/assistants/${email}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Settings API
export const settingsService = {
  async getSlaConfig(token) {
    return request('/settings/sla', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async setSlaConfig(config, token) {
    return request('/settings/sla', {
      method: 'PUT',
      body: config,
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Dashboard API
export const analyticsService = {
  async getDashboardMetrics(token) {
    return request('/dashboard/metrics', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getTrendData(token) {
    return request('/dashboard/trend', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Utility
export const util = {
  statusOrder: ['BARU', 'DIVERIFIKASI', 'DIPROSES', 'MENUNGGU_PELAPOR', 'SELESAI', 'DITOLAK'],
};
