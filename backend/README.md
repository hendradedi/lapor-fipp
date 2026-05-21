# Lapor FIPP Backend API

Backend Node.js + Express + PostgreSQL untuk sistem Lapor FIPP UNNES.

## Fitur

- ✅ Autentikasi JWT (email/password & Google)
- ✅ Multi-role: Pelapor, Admin, Asisten Admin
- ✅ CRUD Laporan dengan timeline
- ✅ Manajemen Admin (promote/revoke asisten)
- ✅ Konfigurasi SLA dinamis
- ✅ Dashboard analytics
- ✅ Rate limiting & security headers
- ✅ PostgreSQL database dengan migrasi otomatis

## Struktur Database

### Tabel Utama

1. **users** - Data pengguna
   - id, email, password_hash, display_name, auth_provider, role, is_active
   - role: 'REPORTER', 'ADMIN', 'ASSISTANT_ADMIN'

2. **reports** - Data laporan
   - reporter_type, reporter_name, contact, phone_number, anonymous_limited
   - category, sub_category, location_name, description
   - urgency_score, sentiment, status, assigned_unit, sla_due_at
   - created_by, reporter_auth_provider, reporter_uid

3. **report_timeline** - Timeline status laporan
   - report_id, status, note, updated_by, created_at

4. **app_settings** - Konfigurasi aplikasi
   - key, value (JSONB), updated_by, updated_at

5. **sessions** - Session management (opsional)
   - user_id, token, expires_at

## Setup Lokal

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database PostgreSQL

```bash
# Buat database
createdb lapor_fipp

# Atau via psql
psql -U postgres -c "CREATE DATABASE lapor_fipp;"
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
```

### 4. Jalankan Migrasi Database

```bash
npm run migrate
```

### 5. Jalankan Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Autentikasi
- `POST /api/auth/register` - Registrasi pelapor
- `POST /api/auth/login` - Login pelapor
- `POST /api/auth/google` - Login/register Google
- `POST /api/auth/admin/login` - Login admin
- `GET /api/auth/me` - Get current user

### Laporan
- `POST /api/reports` - Buat laporan baru
- `GET /api/reports` - List semua laporan
- `GET /api/reports/:id` - Detail laporan + timeline
- `PUT /api/reports/:id/status` - Update status (admin only)

### Admin Management
- `GET /api/admin/policy` - Get admin policy
- `POST /api/admin/assistants` - Promote assistant admin
- `DELETE /api/admin/assistants/:email` - Revoke assistant admin

### Settings
- `GET /api/settings/sla` - Get SLA config
- `PUT /api/settings/sla` - Update SLA config

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/trend` - Get trend data

## Deployment di aaPanel

### 1. Setup PostgreSQL di aaPanel

1. Buka aaPanel → Database → PostgreSQL
2. Buat database baru: `lapor_fipp`
3. Buat user dengan password
4. Catat host, port, username, password

### 2. Setup Node.js di aaPanel

1. Buka aaPanel → Website → Add Site
2. Pilih "Node.js" sebagai type
3. Isi:
   - Domain: `api.domain-anda.com`
   - Port: `3000` (atau port yang tersedia)
   - Run Path: `/path/ke/backend`
   - Entry File: `server.js`

### 3. Upload File Backend

```bash
# Upload ke server via FTP/SSH
scp -r backend/* user@server:/path/ke/backend/
```

### 4. Konfigurasi Environment di Server

```bash
cd /path/ke/backend
cp .env.example .env
nano .env
```

Edit `.env` dengan konfigurasi database aaPanel:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lapor_fipp
DB_USER=username_dari_aapanel
DB_PASSWORD=password_dari_aapanel
JWT_SECRET=generate_dengan: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
PRIMARY_ADMIN_EMAIL=fipp@mail.unnes.ac.id
CORS_ORIGIN=https://frontend-domain-anda.com
```

### 5. Install Dependencies & Migrasi

```bash
cd /path/ke/backend
npm install --production
npm run migrate
```

### 6. Start Service di aaPanel

1. Buka aaPanel → Website → Node.js App
2. Klik "Start" pada aplikasi Lapor FIPP
3. Klik "Set as default" untuk auto-start
4. Buka "Settings" → "Process Management" untuk monitor

### 7. Setup Nginx Reverse Proxy (Opsional)

Jika ingin menggunakan domain tanpa port:

1. Buka aaPanel → Website → Add Site
2. Pilih "PHP" sebagai type
3. Domain: `api.domain-anda.com`
4. Setelah dibuat, buka "Settings" → "Configuration"
5. Edit Nginx config:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Security Notes

1. **JWT Secret**: Generate secret yang kuat
2. **Database Password**: Gunakan password yang kompleks
3. **CORS Origin**: Batasi hanya ke domain frontend Anda
4. **Rate Limiting**: Sudah diimplementasi (100 requests/15 menit)
5. **Helmet**: Security headers sudah aktif

## Troubleshooting

### Database Connection Error
- Periksa credentials di `.env`
- Pastikan PostgreSQL service berjalan
- Test koneksi: `psql -h localhost -U username -d lapor_fipp`

### Port Already in Use
- Ubah `PORT` di `.env`
- Pastikan tidak ada service lain di port yang sama

### Migration Failed
- Pastikan user database punya permission CREATE TABLE
- Hapus database dan buat ulang: `dropdb lapor_fipp && createdb lapor_fipp`

## Monitoring

1. **Logs**: aaPanel → Website → Logs
2. **Process**: aaPanel → Website → Process Management
3. **Database**: aaPanel → Database → PostgreSQL Management

## Backup Database

```bash
# Backup
pg_dump -U username lapor_fipp > backup_$(date +%Y%m%d).sql

# Restore
psql -U username lapor_fipp < backup_file.sql
```

## License

MIT
