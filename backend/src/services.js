import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../src/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const authService = {
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  generateToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  async registerUser(email, password, displayName, authProvider = 'email') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email sudah terdaftar');
      }

      // Hash password if using email auth
      let passwordHash = null;
      if (authProvider === 'email' && password) {
        passwordHash = await this.hashPassword(password);
      }

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, display_name, auth_provider, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, display_name, role, auth_provider`,
        [email.toLowerCase(), passwordHash, displayName || email.split('@')[0], authProvider, 'REPORTER']
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async loginUser(email, password) {
    const result = await pool.query(
      'SELECT id, email, password_hash, display_name, role, auth_provider FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Email atau password salah');
    }

    const user = result.rows[0];

    if (user.auth_provider === 'email') {
      const isPasswordValid = await this.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Email atau password salah');
      }
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      authProvider: user.auth_provider,
      token,
    };
  },

  async loginOrRegisterWithGoogle(email, displayName) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      let user = await client.query(
        'SELECT id, email, display_name, role, auth_provider FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (user.rows.length === 0) {
        // Create new user
        const result = await client.query(
          `INSERT INTO users (email, display_name, auth_provider, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, display_name, role, auth_provider`,
          [email.toLowerCase(), displayName || email.split('@')[0], 'google', 'REPORTER']
        );
        user = result;
      }

      await client.query('COMMIT');

      const userData = user.rows[0];
      const token = this.generateToken(userData.id, userData.email, userData.role);

      return {
        id: userData.id,
        email: userData.email,
        displayName: userData.display_name,
        role: userData.role,
        authProvider: userData.auth_provider,
        token,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getUserById(userId) {
    const result = await pool.query(
      'SELECT id, email, display_name, role, auth_provider, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  },
};

export const adminService = {
  async getAdminPolicy() {
    const result = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'admin_policy'"
    );

    if (result.rows.length === 0) {
      return {
        primaryAdminEmail: process.env.PRIMARY_ADMIN_EMAIL,
        assistantEmails: [],
      };
    }

    return result.rows[0].value;
  },

  async setAdminPolicy(policy, actor = 'system') {
    const result = await pool.query(
      `UPDATE app_settings 
       SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE key = 'admin_policy'
       RETURNING value`,
      [JSON.stringify(policy), actor]
    );

    return result.rows[0].value;
  },

  async promoteAssistantAdmin(email, actor) {
    const policy = await this.getAdminPolicy();
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === policy.primaryAdminEmail.toLowerCase()) {
      throw new Error('Email admin utama tidak perlu diangkat sebagai asisten');
    }

    if (!policy.assistantEmails.includes(normalizedEmail)) {
      policy.assistantEmails.push(normalizedEmail);
    }

    return this.setAdminPolicy(policy, actor);
  },

  async revokeAssistantAdmin(email, actor) {
    const policy = await this.getAdminPolicy();
    const normalizedEmail = email.toLowerCase().trim();

    policy.assistantEmails = policy.assistantEmails.filter(
      (e) => e !== normalizedEmail
    );

    return this.setAdminPolicy(policy, actor);
  },

  async isAdmin(email) {
    const policy = await this.getAdminPolicy();
    const normalizedEmail = email.toLowerCase().trim();

    return (
      normalizedEmail === policy.primaryAdminEmail.toLowerCase() ||
      policy.assistantEmails.includes(normalizedEmail)
    );
  },

  async isPrimaryAdmin(email) {
    const policy = await this.getAdminPolicy();
    return email.toLowerCase().trim() === policy.primaryAdminEmail.toLowerCase();
  },
};

export const settingsService = {
  async getSlaConfig() {
    const result = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'sla_config'"
    );

    if (result.rows.length === 0) {
      return {
        defaultHours: 72,
        message: 'SLA ditentukan admin sesuai tingkat kesulitan.',
      };
    }

    return result.rows[0].value;
  },

  async setSlaConfig(config, actor = 'system') {
    const result = await pool.query(
      `UPDATE app_settings 
       SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE key = 'sla_config'
       RETURNING value`,
      [JSON.stringify(config), actor]
    );

    return result.rows[0].value;
  },
};

export const reportService = {
  scoreUrgency(text) {
    const value = text.toLowerCase();
    let score = 45;
    if (/rusak|bahaya|darurat|kekerasan|krisis/.test(value)) score += 35;
    if (/cepat|segera|urgent|mendesak/.test(value)) score += 20;
    return Math.min(score, 100);
  },

  async createReport(payload) {
    const urgencyScore = this.scoreUrgency(payload.description);
    const sentiment = urgencyScore >= 70 ? 'NEGATIF-URGENT' : 'NORMAL';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert report
      const reportResult = await client.query(
        `INSERT INTO reports (
          reporter_type, reporter_name, contact, phone_number,
          anonymous_limited, contact_masked, category, sub_category,
          location_name, description, urgency_score, sentiment,
          status, created_by, reporter_auth_provider, reporter_uid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, created_at, updated_at`,
        [
          payload.reporterType,
          payload.reporterName,
          payload.contact,
          payload.phoneNumber,
          payload.anonymousLimited,
          payload.anonymousLimited ? `${payload.contact.slice(0, 3)}***` : payload.contact,
          payload.category,
          payload.subCategory,
          payload.locationName,
          payload.description,
          urgencyScore,
          sentiment,
          'BARU',
          payload.createdBy || 'anonymous',
          payload.reporterAuthProvider || null,
          payload.reporterUid || null,
        ]
      );

      const reportId = reportResult.rows[0].id;

      // Insert initial timeline
      await client.query(
        `INSERT INTO report_timeline (report_id, status, note, updated_by)
         VALUES ($1, $2, $3, $4)`,
        [reportId, 'BARU', 'Laporan diterima sistem', 'system']
      );

      await client.query('COMMIT');

      return {
        id: reportId,
        ...payload,
        urgencyScore,
        sentiment,
        status: 'BARU',
        createdAt: reportResult.rows[0].created_at,
        updatedAt: reportResult.rows[0].updated_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listReports(limit = 200) {
    const result = await pool.query(
      `SELECT * FROM reports 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      reporterType: row.reporter_type,
      reporterName: row.reporter_name,
      contact: row.contact,
      phoneNumber: row.phone_number,
      anonymousLimited: row.anonymous_limited,
      contactMasked: row.contact_masked,
      category: row.category,
      subCategory: row.sub_category,
      locationName: row.location_name,
      description: row.description,
      urgencyScore: row.urgency_score,
      sentiment: row.sentiment,
      status: row.status,
      assignedUnit: row.assigned_unit,
      slaDueAt: row.sla_due_at,
      createdBy: row.created_by,
      reporterAuthProvider: row.reporter_auth_provider,
      reporterUid: row.reporter_uid,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getReportById(reportId) {
    const result = await pool.query(
      'SELECT * FROM reports WHERE id = $1',
      [reportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      reporterType: row.reporter_type,
      reporterName: row.reporter_name,
      contact: row.contact,
      phoneNumber: row.phone_number,
      anonymousLimited: row.anonymous_limited,
      contactMasked: row.contact_masked,
      category: row.category,
      subCategory: row.sub_category,
      locationName: row.location_name,
      description: row.description,
      urgencyScore: row.urgency_score,
      sentiment: row.sentiment,
      status: row.status,
      assignedUnit: row.assigned_unit,
      slaDueAt: row.sla_due_at,
      createdBy: row.created_by,
      reporterAuthProvider: row.reporter_auth_provider,
      reporterUid: row.reporter_uid,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateReportStatus(reportId, payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update report
      const result = await client.query(
        `UPDATE reports 
         SET status = $1, assigned_unit = $2, sla_due_at = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [payload.status, payload.assignedUnit, payload.slaDueAt, reportId]
      );

      if (result.rows.length === 0) {
        throw new Error('Laporan tidak ditemukan');
      }

      // Insert timeline entry
      await client.query(
        `INSERT INTO report_timeline (report_id, status, note, updated_by)
         VALUES ($1, $2, $3, $4)`,
        [reportId, payload.status, payload.note, payload.by]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        status: row.status,
        assignedUnit: row.assigned_unit,
        slaDueAt: row.sla_due_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getReportTimeline(reportId) {
    const result = await pool.query(
      `SELECT id, report_id, status, note, updated_by, created_at
       FROM report_timeline
       WHERE report_id = $1
       ORDER BY created_at ASC`,
      [reportId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      reportId: row.report_id,
      status: row.status,
      note: row.note,
      by: row.updated_by,
      at: row.created_at,
    }));
  },

  async buildDashboardMetrics() {
    const reports = await this.listReports();
    const now = Date.now();

    const metrics = {
      total: reports.length,
      byStatus: {},
      byCategory: {},
      delayed: 0,
      urgencyHigh: 0,
      locations: {},
    };

    for (const report of reports) {
      metrics.byStatus[report.status] = (metrics.byStatus[report.status] || 0) + 1;
      metrics.byCategory[report.category] = (metrics.byCategory[report.category] || 0) + 1;

      if (report.urgencyScore >= 70) {
        metrics.urgencyHigh += 1;
      }

      if (report.slaDueAt && new Date(report.slaDueAt).getTime() < now && report.status !== 'SELESAI') {
        metrics.delayed += 1;
      }

      if (report.locationName) {
        metrics.locations[report.locationName] = (metrics.locations[report.locationName] || 0) + 1;
      }
    }

    return metrics;
  },
};
