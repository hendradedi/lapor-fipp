import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

import { 
  authService, 
  adminService, 
  settingsService, 
  reportService 
} from './src/services.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
});
app.use('/api/', limiter);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token autentikasi diperlukan' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kadaluarsa' });
  }

  req.user = decoded;
  next();
};

// Validation Middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Lapor FIPP API',
    version: '1.0.0'
  });
});

// ========== AUTHENTICATION ROUTES ==========

// Register Reporter
app.post('/api/auth/register', 
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('displayName').optional().trim(),
  ]),
  async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      const user = await authService.registerUser(email, password, displayName, 'email');
      
      const token = authService.generateToken(user.id, user.email, user.role);
      
      res.status(201).json({
        message: 'Registrasi berhasil',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          authProvider: user.auth_provider,
        },
        token,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Login Reporter
app.post('/api/auth/login', 
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);
      
      res.json({
        message: 'Login berhasil',
        ...result,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
);

// Google Auth (Login or Register)
app.post('/api/auth/google', 
  validate([
    body('email').isEmail().normalizeEmail(),
    body('displayName').optional().trim(),
  ]),
  async (req, res) => {
    try {
      const { email, displayName } = req.body;
      const result = await authService.loginOrRegisterWithGoogle(email, displayName);
      
      res.json({
        message: 'Login Google berhasil',
        ...result,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Admin Login
app.post('/api/auth/admin/login', 
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user is admin
      const isAdmin = await adminService.isAdmin(email);
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Akun tidak terdaftar sebagai admin/asisten' 
        });
      }

      // Login user
      const result = await authService.loginUser(email, password);
      
      // Check if primary admin
      const isPrimaryAdmin = await adminService.isPrimaryAdmin(email);
      
      res.json({
        message: 'Login admin berhasil',
        ...result,
        isPrimaryAdmin,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
);

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      authProvider: user.auth_provider,
      isActive: user.is_active,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== REPORT ROUTES ==========

// Create Report
app.post('/api/reports', 
  authenticateToken,
  validate([
    body('reporterType').isIn(['MAHASISWA', 'DOSEN', 'TENDIK', 'MASYARAKAT']),
    body('reporterName').trim().notEmpty(),
    body('contact').trim().notEmpty(),
    body('phoneNumber').trim().notEmpty(),
    body('category').isIn(['SARPRAS', 'AKADEMIK', 'KEJIWAAN', 'SARAN_KRITIK']),
    body('subCategory').trim().notEmpty(),
    body('locationName').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('anonymousLimited').optional().isBoolean(),
  ]),
  async (req, res) => {
    try {
      const report = await reportService.createReport({
        ...req.body,
        createdBy: req.user.email,
        reporterAuthProvider: 'email',
        reporterUid: req.user.userId.toString(),
      });

      res.status(201).json({
        message: 'Laporan berhasil dikirim',
        report,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// List Reports
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const reports = await reportService.listReports(limit);
    
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Report by ID
app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    const timeline = await reportService.getReportTimeline(req.params.id);
    
    res.json({ 
      report: { ...report, timeline }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Report Status (Admin only)
app.put('/api/reports/:id/status', 
  authenticateToken,
  validate([
    body('status').isIn(['BARU', 'DIVERIFIKASI', 'DIPROSES', 'MENUNGGU_PELAPOR', 'SELESAI', 'DITOLAK']),
    body('note').trim().notEmpty(),
    body('assignedUnit').optional().isIn(['sarpras', 'akademik', 'kejiwaan']),
    body('slaDueAt').optional().isISO8601(),
  ]),
  async (req, res) => {
    try {
      // Check if user is admin
      const isAdmin = await adminService.isAdmin(req.user.email);
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Hanya admin yang dapat mengupdate status laporan' 
        });
      }

      const updated = await reportService.updateReportStatus(req.params.id, {
        ...req.body,
        by: req.user.email,
      });

      res.json({
        message: 'Status laporan berhasil diperbarui',
        report: updated,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ========== ADMIN MANAGEMENT ROUTES ==========

// Get Admin Policy
app.get('/api/admin/policy', authenticateToken, async (req, res) => {
  try {
    const isAdmin = await adminService.isAdmin(req.user.email);
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Hanya admin yang dapat melihat policy admin' 
      });
    }

    const policy = await adminService.getAdminPolicy();
    res.json({ policy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Promote Assistant Admin
app.post('/api/admin/assistants', 
  authenticateToken,
  validate([
    body('email').isEmail().normalizeEmail(),
  ]),
  async (req, res) => {
    try {
      const isPrimaryAdmin = await adminService.isPrimaryAdmin(req.user.email);
      if (!isPrimaryAdmin) {
        return res.status(403).json({ 
          error: 'Hanya admin utama yang dapat mengangkat asisten admin' 
        });
      }

      const policy = await adminService.promoteAssistantAdmin(req.body.email, req.user.email);
      
      res.json({
        message: `Asisten admin ${req.body.email} berhasil ditambahkan`,
        policy,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Revoke Assistant Admin
app.delete('/api/admin/assistants/:email', 
  authenticateToken,
  async (req, res) => {
    try {
      const isPrimaryAdmin = await adminService.isPrimaryAdmin(req.user.email);
      if (!isPrimaryAdmin) {
        return res.status(403).json({ 
          error: 'Hanya admin utama yang dapat mencabut asisten admin' 
        });
      }

      const policy = await adminService.revokeAssistantAdmin(req.params.email, req.user.email);
      
      res.json({
        message: `Asisten admin ${req.params.email} berhasil dicabut`,
        policy,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ========== SETTINGS ROUTES ==========

// Get SLA Config
app.get('/api/settings/sla', authenticateToken, async (req, res) => {
  try {
    const isAdmin = await adminService.isAdmin(req.user.email);
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Hanya admin yang dapat melihat konfigurasi SLA' 
      });
    }

    const config = await settingsService.getSlaConfig();
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update SLA Config
app.put('/api/settings/sla', 
  authenticateToken,
  validate([
    body('defaultHours').isInt({ min: 1, max: 720 }),
    body('message').optional().trim(),
  ]),
  async (req, res) => {
    try {
      const isAdmin = await adminService.isAdmin(req.user.email);
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Hanya admin yang dapat mengupdate konfigurasi SLA' 
        });
      }

      const config = await settingsService.setSlaConfig(req.body, req.user.email);
      
      res.json({
        message: 'Konfigurasi SLA berhasil diperbarui',
        config,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ========== DASHBOARD ROUTES ==========

// Get Dashboard Metrics
app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
  try {
    const isAdmin = await adminService.isAdmin(req.user.email);
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Hanya admin yang dapat melihat dashboard' 
      });
    }

    const metrics = await reportService.buildDashboardMetrics();
    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Trend Data
app.get('/api/dashboard/trend', authenticateToken, async (req, res) => {
  try {
    const isAdmin = await adminService.isAdmin(req.user.email);
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Hanya admin yang dapat melihat trend data' 
      });
    }

    const reports = await reportService.listReports();
    const map = {};
    
    for (const report of reports) {
      const key = new Date(report.createdAt).toLocaleDateString('id-ID');
      map[key] = (map[key] || 0) + 1;
    }
    
    const trendRows = Object.entries(map).slice(-7);
    
    res.json({ trendRows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ERROR HANDLING ==========

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Terjadi kesalahan server' 
      : err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server Lapor FIPP berjalan di port ${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});
