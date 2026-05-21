# ✅ Pre-Deployment Checklist

Pastikan semua item di bawah sudah dicek sebelum upload ke server aaPanel.

## 📦 File Structure

- [x] `backend/` folder lengkap dengan:
  - [x] `server.js` - Main server file
  - [x] `package.json` - Dependencies
  - [x] `src/db.js` - Database connection
  - [x] `src/services.js` - Business logic
  - [x] `scripts/migrate.js` - Database migrations
  - [x] `.env.example` - Environment template
  - [x] `.gitignore` - Git ignore rules
  - [x] `README.md` - Backend documentation

- [x] `src/` folder lengkap dengan:
  - [x] `App.jsx` - Updated untuk API
  - [x] `lib/apiClient.js` - API service layer
  - [x] `lib/constants.js` - Constants
  - [x] `lib/utils.js` - Utilities
  - [x] `components/` - React components
  - [x] `.env.example` - Frontend env template

- [x] Root files:
  - [x] `README.md` - Project overview
  - [x] `DEPLOYMENT_AAPANEL.md` - Deployment guide
  - [x] `package.json` - Frontend dependencies
  - [x] `vite.config.js` - Vite configuration

## 🔧 Backend Configuration

Sebelum zip, pastikan:

- [ ] **Jangan** include `node_modules/` (akan di-install di server)
- [ ] **Jangan** include `.env` (gunakan `.env.example` sebagai template)
- [ ] **Jangan** include `dist/` atau build files
- [ ] **Pastikan** `.gitignore` sudah ada di backend folder

## 🎨 Frontend Configuration

- [ ] **Jangan** include `node_modules/` (akan di-install di server)
- [ ] **Jangan** include `.env` (gunakan `.env.example` sebagai template)
- [ ] **Jangan** include `dist/` (akan di-build di lokal sebelum upload)

## 📋 Dokumentasi

- [x] `DEPLOYMENT_AAPANEL.md` - Panduan lengkap deployment
- [x] `backend/README.md` - Dokumentasi backend
- [x] `README.md` - Overview project

## 🚀 Deployment Steps (Ringkas)

### Di Lokal (Sebelum Upload)

```bash
# 1. Bersihkan node_modules dan build files
rm -rf node_modules backend/node_modules dist/

# 2. Pastikan .env files tidak di-include
rm -f .env backend/.env src/.env

# 3. Zip project
zip -r lapor-fipp-v2.zip . \
  -x "node_modules/*" \
  ".env" \
  "backend/.env" \
  "src/.env" \
  "dist/*" \
  ".git/*" \
  ".DS_Store"
```

### Di Server aaPanel

```bash
# 1. Extract zip
unzip lapor-fipp-v2.zip

# 2. Setup Backend
cd backend
cp .env.example .env
# Edit .env dengan credentials database

npm install --production
npm run migrate

# 3. Setup Frontend
cd ../
cp src/.env.example src/.env
# Edit src/.env dengan API URL

npm install
npm run build

# 4. Upload dist/ ke server web
# Gunakan FTP atau SCP
```

## 🔐 Security Checklist

- [ ] JWT_SECRET sudah di-generate (jangan gunakan default)
- [ ] Database password sudah di-set dengan kuat
- [ ] CORS_ORIGIN sudah di-set ke domain production
- [ ] NODE_ENV sudah di-set ke `production`
- [ ] SSL certificate sudah di-setup

## 🧪 Testing Checklist

Setelah deploy, test:

- [ ] Backend health check: `curl https://api.domain.com/api/health`
- [ ] Frontend bisa diakses: `https://domain.com`
- [ ] Login pelapor berfungsi
- [ ] Login admin berfungsi
- [ ] Buat laporan berfungsi
- [ ] Update status laporan berfungsi
- [ ] Dashboard berfungsi
- [ ] WhatsApp link berfungsi

## 📝 Important Notes

1. **Database Credentials**
   - Simpan credentials database di tempat aman
   - Jangan commit `.env` ke git
   - Gunakan password yang kuat

2. **JWT Secret**
   - Generate dengan: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Simpan di `.env` backend
   - Jangan share ke siapa pun

3. **Admin User**
   - Buat admin utama setelah migrasi database
   - Email: `fipp@mail.unnes.ac.id` (atau sesuai keinginan)
   - Password: Gunakan yang kuat

4. **Backup Database**
   - Setup automated backup di aaPanel
   - Backup sebelum update aplikasi
   - Test restore backup secara berkala

## 📞 Troubleshooting Quick Links

- Backend logs: `/www/server/nodejs/vhost/logs/`
- Nginx logs: `/www/wwwlogs/`
- PostgreSQL logs: `/www/server/postgresql/logs/`
- aaPanel docs: https://doc.aapanel.com/

## ✨ Setelah Deployment

1. Monitor aplikasi selama 24 jam pertama
2. Test semua fitur dengan data real
3. Setup monitoring & alerting
4. Backup database pertama kali
5. Document any custom configurations

---

**Status: SIAP UNTUK DEPLOYMENT** ✅

Semua file sudah lengkap dan siap di-zip untuk upload ke server aaPanel Anda.
