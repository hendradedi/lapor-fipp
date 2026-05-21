# 🚀 Panduan Deployment Lapor FIPP ke aaPanel

Panduan lengkap untuk deploy aplikasi Lapor FIPP (Frontend + Backend + Database) ke server Linux dengan aaPanel.

## 📋 Prasyarat

- Server Linux dengan aaPanel terinstall
- Domain atau subdomain (contoh: `lapor.fipp.unnes.ac.id`)
- Akses SSH ke server
- Node.js 18+ terinstall di aaPanel
- PostgreSQL terinstall di aaPanel

---

## 🗄️ BAGIAN 1: Setup Database PostgreSQL

### 1.1 Install PostgreSQL di aaPanel

1. Login ke aaPanel
2. Buka **App Store** → Cari **PostgreSQL**
3. Klik **Install** → Pilih versi terbaru (14+)
4. Tunggu hingga instalasi selesai

### 1.2 Buat Database

1. Buka **Database** → **PostgreSQL**
2. Klik **Add Database**
3. Isi form:
   - **Database Name**: `lapor_fipp`
   - **Username**: `lapor_fipp_user` (atau sesuai keinginan)
   - **Password**: Generate password yang kuat
   - **Access Permission**: `localhost` (untuk keamanan)
4. Klik **Submit**
5. **CATAT** credentials database ini untuk konfigurasi backend

### 1.3 Test Koneksi Database

```bash
# SSH ke server
ssh user@your-server-ip

# Test koneksi PostgreSQL
psql -h localhost -U lapor_fipp_user -d lapor_fipp

# Jika berhasil, ketik \q untuk keluar
```

---

## 🔧 BAGIAN 2: Setup Backend API

### 2.1 Upload File Backend

**Opsi A: Via FTP/SFTP**
1. Gunakan FileZilla atau WinSCP
2. Upload folder `backend/` ke `/www/wwwroot/api.domain-anda.com/`

**Opsi B: Via Git (Recommended)**
```bash
# SSH ke server
cd /www/wwwroot/

# Clone repository
git clone https://github.com/your-repo/lapor-fipp.git
cd lapor-fipp/backend
```

### 2.2 Install Dependencies

```bash
cd /www/wwwroot/api.domain-anda.com/
npm install --production
```

### 2.3 Konfigurasi Environment

```bash
# Copy file .env.example
cp .env.example .env

# Edit file .env
nano .env
```

Isi konfigurasi berikut:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (dari langkah 1.2)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lapor_fipp
DB_USER=lapor_fipp_user
DB_PASSWORD=password_yang_anda_buat

# JWT Secret (Generate dengan command di bawah)
JWT_SECRET=your_generated_secret_here
JWT_EXPIRES_IN=7d

# Admin Configuration
PRIMARY_ADMIN_EMAIL=fipp@mail.unnes.ac.id

# CORS Configuration (ganti dengan domain frontend Anda)
CORS_ORIGIN=https://lapor.fipp.unnes.ac.id,https://www.lapor.fipp.unnes.ac.id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output dan paste ke `JWT_SECRET` di file `.env`

### 2.4 Jalankan Migrasi Database

```bash
npm run migrate
```

Output yang diharapkan:
```
🚀 Starting database migrations...
▶️  Running migration: create_users_table
✅ Completed migration: create_users_table
...
✨ All migrations completed successfully!
```

### 2.5 Setup Node.js App di aaPanel

1. Buka **Website** → **Node Project**
2. Klik **Add Node Project**
3. Isi form:
   - **Project Name**: `Lapor FIPP API`
   - **Domain**: `api.domain-anda.com` (atau subdomain yang Anda inginkan)
   - **Port**: `3000`
   - **Project Path**: `/www/wwwroot/api.domain-anda.com`
   - **Startup File**: `server.js`
   - **Run Command**: `node server.js`
4. Klik **Submit**

### 2.6 Start Backend Service

1. Di halaman **Node Project**, cari project "Lapor FIPP API"
2. Klik tombol **Start**
3. Pastikan status berubah menjadi **Running** (hijau)
4. Klik **Set as Startup** agar auto-start saat server reboot

### 2.7 Test Backend API

```bash
# Test health check
curl http://localhost:3000/api/health

# Expected output:
# {"status":"ok","timestamp":"...","service":"Lapor FIPP API","version":"1.0.0"}
```

### 2.8 Setup SSL Certificate (Recommended)

1. Buka **Website** → Pilih site `api.domain-anda.com`
2. Klik **SSL** → **Let's Encrypt**
3. Centang domain yang ingin di-SSL
4. Klik **Apply**
5. Tunggu hingga certificate terinstall
6. Enable **Force HTTPS**

---

## 🎨 BAGIAN 3: Setup Frontend

### 3.1 Build Frontend

Di komputer lokal (bukan di server):

```bash
cd frontend/

# Update .env dengan URL backend
nano .env
```

Isi `.env`:
```env
VITE_API_BASE_URL=https://api.domain-anda.com/api
VITE_APP_NAME="Lapor FIPP"
VITE_PRIMARY_ADMIN_EMAIL=fipp@mail.unnes.ac.id
```

Build aplikasi:
```bash
npm install
npm run build
```

Folder `dist/` akan berisi file production-ready.

### 3.2 Upload Frontend ke Server

**Opsi A: Via FTP/SFTP**
1. Upload semua isi folder `dist/` ke `/www/wwwroot/lapor.domain-anda.com/`

**Opsi B: Via SCP**
```bash
scp -r dist/* user@server-ip:/www/wwwroot/lapor.domain-anda.com/
```

### 3.3 Setup Website di aaPanel

1. Buka **Website** → **Add Site**
2. Pilih **Static Website**
3. Isi form:
   - **Domain**: `lapor.domain-anda.com`
   - **Document Root**: `/www/wwwroot/lapor.domain-anda.com`
   - **PHP Version**: Tidak perlu (static site)
4. Klik **Submit**

### 3.4 Konfigurasi Nginx untuk SPA

1. Buka **Website** → Pilih site `lapor.domain-anda.com`
2. Klik **Config** → **Configuration File**
3. Tambahkan di dalam block `location /`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Full contoh:
```nginx
server {
    listen 80;
    server_name lapor.domain-anda.com;
    root /www/wwwroot/lapor.domain-anda.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

4. Klik **Save**
5. Reload Nginx: **Service** → **Nginx** → **Reload**

### 3.5 Setup SSL Certificate untuk Frontend

1. Buka **Website** → Pilih site `lapor.domain-anda.com`
2. Klik **SSL** → **Let's Encrypt**
3. Centang domain
4. Klik **Apply**
5. Enable **Force HTTPS**

---

## 🔐 BAGIAN 4: Setup Admin Pertama

### 4.1 Buat Akun Admin Utama

```bash
# SSH ke server
cd /www/wwwroot/api.domain-anda.com

# Masuk ke PostgreSQL
psql -h localhost -U lapor_fipp_user -d lapor_fipp

# Buat user admin (ganti email dan password)
INSERT INTO users (email, password_hash, display_name, role, is_active)
VALUES (
  'fipp@mail.unnes.ac.id',
  '$2a$10$YourHashedPasswordHere',
  'Admin Utama FIPP',
  'ADMIN',
  true
);

# Keluar
\q
```

**Generate Password Hash:**
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password_anda', 10));"
```

### 4.2 Test Login Admin

1. Buka `https://lapor.domain-anda.com`
2. Pilih tab **Admin / Asisten**
3. Login dengan:
   - Email: `fipp@mail.unnes.ac.id`
   - Password: password yang Anda set

---

## 📊 BAGIAN 5: Monitoring & Maintenance

### 5.1 Monitor Backend Service

1. **aaPanel** → **Website** → **Node Project**
2. Lihat status "Lapor FIPP API"
3. Klik **Log** untuk melihat error logs

### 5.2 Monitor Database

1. **aaPanel** → **Database** → **PostgreSQL**
2. Klik **phpPgAdmin** untuk GUI management
3. Monitor ukuran database dan performance

### 5.3 Backup Database

**Manual Backup:**
```bash
# Backup database
pg_dump -h localhost -U lapor_fipp_user lapor_fipp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
psql -h localhost -U lapor_fipp_user lapor_fipp < backup_file.sql
```

**Automated Backup via aaPanel:**
1. **Database** → **PostgreSQL** → **Backup**
2. Set schedule (daily/weekly)
3. Pilih retention period

### 5.4 Update Aplikasi

**Update Backend:**
```bash
cd /www/wwwroot/api.domain-anda.com
git pull origin main
npm install --production
npm run migrate  # Jika ada migrasi baru

# Restart service via aaPanel
# Website → Node Project → Restart
```

**Update Frontend:**
```bash
# Di lokal
npm run build

# Upload dist/ ke server
scp -r dist/* user@server:/www/wwwroot/lapor.domain-anda.com/
```

---

## 🔧 Troubleshooting

### Backend tidak bisa start

**Cek logs:**
```bash
cd /www/wwwroot/api.domain-anda.com
pm2 logs lapor-fipp-api
# atau
tail -f /www/server/nodejs/vhost/logs/api.domain-anda.com.log
```

**Common issues:**
- Port sudah digunakan → Ubah PORT di `.env`
- Database connection error → Cek credentials di `.env`
- Module not found → Jalankan `npm install` lagi

### Frontend tidak bisa akses backend

**Cek CORS:**
- Pastikan domain frontend ada di `CORS_ORIGIN` backend
- Restart backend setelah ubah `.env`

**Cek SSL:**
- Pastikan backend juga pakai HTTPS jika frontend pakai HTTPS
- Mixed content error: ubah `VITE_API_BASE_URL` ke `https://`

### Database migration error

```bash
# Reset database (HATI-HATI: akan hapus semua data)
psql -h localhost -U lapor_fipp_user -d lapor_fipp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Jalankan ulang migrasi
npm run migrate
```

### Performance Issues

**Optimize PostgreSQL:**
```bash
# Edit postgresql.conf
nano /www/server/postgresql/data/postgresql.conf

# Adjust settings:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

**Enable Nginx Caching:**
```nginx
# Tambah di nginx config frontend
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📝 Checklist Deployment

- [ ] PostgreSQL terinstall dan database dibuat
- [ ] Backend uploaded dan dependencies terinstall
- [ ] File `.env` backend dikonfigurasi dengan benar
- [ ] Database migration berhasil dijalankan
- [ ] Backend service running di aaPanel
- [ ] SSL certificate terinstall untuk backend
- [ ] Frontend di-build dengan API URL yang benar
- [ ] Frontend uploaded ke server
- [ ] Nginx dikonfigurasi untuk SPA routing
- [ ] SSL certificate terinstall untuk frontend
- [ ] Admin utama berhasil dibuat dan bisa login
- [ ] Test create laporan dari frontend
- [ ] Test update status dari admin panel
- [ ] Backup database di-schedule

---

## 🆘 Support

Jika mengalami masalah:

1. Cek logs backend: `/www/server/nodejs/vhost/logs/`
2. Cek logs Nginx: `/www/wwwlogs/`
3. Cek logs PostgreSQL: `/www/server/postgresql/logs/`
4. Test API endpoint: `curl https://api.domain-anda.com/api/health`

---

## 📚 Referensi

- [aaPanel Documentation](https://doc.aapanel.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Selamat! Aplikasi Lapor FIPP Anda sudah live! 🎉**
