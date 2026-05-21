# 📋 Lapor FIPP v2 - Full Stack Edition

Sistem pelaporan terpadu FIPP UNNES dengan backend Node.js + Express + PostgreSQL dan frontend React + Vite.

## 🎯 Fitur Utama

### Untuk Pelapor
- ✅ Multi-role: Mahasiswa, Dosen, Tendik, Masyarakat
- ✅ Autentikasi: Email/Password & Google OAuth
- ✅ Kategori: Sarpras, Akademik, Kejiwaan, Saran/Kritik
- ✅ Anonim terbatas (identitas hanya terlihat admin)
- ✅ Tracking status laporan real-time
- ✅ Integrasi WhatsApp untuk komunikasi

### Untuk Admin
- ✅ Login terpisah untuk Admin Utama & Asisten Admin
- ✅ Manajemen asisten admin (promote/revoke)
- ✅ Update status laporan dengan timeline
- ✅ Konfigurasi SLA dinamis
- ✅ Assignment ke unit penangan (Sarpras/Akademik/Kejiwaan)
- ✅ Dashboard analytics lengkap

### Dashboard & Analytics
- 📊 Volume laporan total
- ⚠️ SLA terlambat
- 🔥 Urgensi tinggi
- 📈 Tren volume 7 hari terakhir
- 📍 Heatmap lokasi
- 🔄 Funnel status laporan
- 📂 Distribusi kategori

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  - Login/Register Pelapor & Admin                            │
│  - Form Laporan                                              │
│  - Dashboard Analytics                                       │
│  - Admin Management                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                     │
│  - JWT Authentication                                        │
│  - RESTful API Endpoints                                     │
│  - Business Logic & Validation                               │
│  - Rate Limiting & Security                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                      │
│  - users (autentikasi)                                       │
│  - reports (data laporan)                                    │
│  - report_timeline (tracking status)                         │
│  - app_settings (konfigurasi)                                │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Struktur Project

```
lapor-fipp-v2/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── db.js              # Database connection
│   │   └── services.js        # Business logic
│   ├── scripts/
│   │   └── migrate.js         # Database migrations
│   ├── server.js              # Express server
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── src/                        # Frontend React
│   ├── components/
│   │   ├── AdminPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── PelaporPage.jsx
│   ├── lib/
│   │   ├── apiClient.js       # API service layer
│   │   ├── constants.js
│   │   └── utils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── .env.example
│
├── public/                     # Static assets
├── DEPLOYMENT_AAPANEL.md      # Panduan deployment
└── README.md                   # File ini
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### 1. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit dengan konfigurasi database Anda

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output ke JWT_SECRET di .env

# Jalankan migrasi database
npm run migrate

# Start server
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### 2. Setup Frontend

```bash
# Di root project
npm install

# Setup environment
cp src/.env.example src/.env
nano src/.env  # Edit VITE_API_BASE_URL jika perlu

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 3. Buat Admin Pertama

```bash
# Generate password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your_password', 10));"

# Masuk ke PostgreSQL
psql -U postgres -d lapor_fipp

# Insert admin user
INSERT INTO users (email, password_hash, display_name, role, is_active)
VALUES (
  'fipp@mail.unnes.ac.id',
  'hash_dari_command_di_atas',
  'Admin Utama FIPP',
  'ADMIN',
  true
);
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register pelapor baru |
| POST | `/api/auth/login` | Login pelapor |
| POST | `/api/auth/google` | Login/register via Google |
| POST | `/api/auth/admin/login` | Login admin |
| GET | `/api/auth/me` | Get current user info |

### Report Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reports` | Buat laporan baru | Required |
| GET | `/api/reports` | List semua laporan | Required |
| GET | `/api/reports/:id` | Detail laporan + timeline | Required |
| PUT | `/api/reports/:id/status` | Update status | Admin only |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/policy` | Get admin policy | Admin only |
| POST | `/api/admin/assistants` | Promote assistant | Primary admin only |
| DELETE | `/api/admin/assistants/:email` | Revoke assistant | Primary admin only |

### Settings Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings/sla` | Get SLA config | Admin only |
| PUT | `/api/settings/sla` | Update SLA config | Admin only |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/metrics` | Get dashboard metrics | Admin only |
| GET | `/api/dashboard/trend` | Get trend data | Admin only |

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing dengan bcrypt
- ✅ Rate limiting (100 requests/15 menit)
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Input validation dengan express-validator
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection

## 🌐 Deployment

### Deploy ke aaPanel (Recommended)

Ikuti panduan lengkap di [`DEPLOYMENT_AAPANEL.md`](DEPLOYMENT_AAPANEL.md)

**Ringkasan:**
1. Setup PostgreSQL database
2. Upload & configure backend
3. Jalankan migrasi database
4. Build & upload frontend
5. Configure Nginx
6. Setup SSL certificates

### Deploy ke Platform Lain

**Backend:**
- Heroku: Gunakan Heroku Postgres addon
- Railway: Auto-detect Node.js + PostgreSQL
- DigitalOcean App Platform: Deploy dari Git
- VPS: Gunakan PM2 untuk process management

**Frontend:**
- Vercel: `npm run build` → deploy folder `dist/`
- Netlify: Same as Vercel
- Cloudflare Pages: Same as Vercel

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:3000/api/health

# Test dengan token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/reports
```

## 📊 Database Schema

### users
- id, email, password_hash, display_name
- auth_provider, role, is_active
- created_at, updated_at

### reports
- id, reporter_type, reporter_name, contact, phone_number
- anonymous_limited, contact_masked
- category, sub_category, location_name, description
- urgency_score, sentiment, status
- assigned_unit, sla_due_at
- created_by, reporter_auth_provider, reporter_uid
- created_at, updated_at

### report_timeline
- id, report_id, status, note
- updated_by, created_at

### app_settings
- key, value (JSONB)
- updated_by, updated_at

## 🔄 Status Flow

```
BARU → DIVERIFIKASI → DIPROSES → MENUNGGU_PELAPOR → SELESAI
                                                    ↘ DITOLAK
```

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite 8
- CSS3 (Custom styling)

**Backend:**
- Node.js 18+
- Express 4
- PostgreSQL 14+
- JWT untuk authentication
- bcryptjs untuk password hashing

**DevOps:**
- aaPanel untuk hosting
- Let's Encrypt untuk SSL
- Nginx sebagai reverse proxy

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lapor_fipp
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
PRIMARY_ADMIN_EMAIL=fipp@mail.unnes.ac.id
CORS_ORIGIN=https://yourdomain.com
```

### Frontend (src/.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME="Lapor FIPP"
VITE_PRIMARY_ADMIN_EMAIL=fipp@mail.unnes.ac.id
```

## 🤝 Contributing

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail

## 👥 Team

**FIPP UNNES** - Fakultas Ilmu Pendidikan dan Psikologi, Universitas Negeri Semarang

## 📞 Support

- Email: fipp@mail.unnes.ac.id
- Website: https://fipp.unnes.ac.id

---

**Dibuat dengan ❤️ untuk FIPP UNNES**
