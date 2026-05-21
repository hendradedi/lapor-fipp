# 🚀 GitHub Auto-Deploy Setup

Panduan untuk setup auto-deploy dari GitHub ke server aaPanel Anda.

## 📋 Prerequisites

- Repository GitHub: https://github.com/hendradedi/lapor-fipp
- Server dengan aaPanel sudah running
- SSH access ke server
- PM2 terinstall di server (untuk manage Node.js process)

## 🔐 Setup GitHub Secrets

Buka repository GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Tambahkan secrets berikut:

### 1. Server Connection

**SERVER_HOST**
```
IP atau domain server Anda
Contoh: 123.456.789.0 atau server.domain.com
```

**SERVER_USER**
```
Username SSH server
Contoh: root atau www
```

**SERVER_SSH_KEY**
```
Private SSH key untuk akses server
Generate dengan: ssh-keygen -t rsa -b 4096 -C "github-actions"
Copy isi file ~/.ssh/id_rsa (PRIVATE KEY)
```

### 2. Server Paths

**FRONTEND_PATH**
```
Path ke folder frontend di server
Contoh: /www/wwwroot/lapor.fipp.unnes.ac.id
```

**BACKEND_PATH**
```
Path ke folder backend di server
Contoh: /www/wwwroot/api.fipp.unnes.ac.id
```

### 3. Environment Variables

**VITE_API_BASE_URL**
```
URL backend API
Contoh: https://api.fipp.unnes.ac.id/api
```

**VITE_APP_NAME**
```
Nama aplikasi
Contoh: Lapor FIPP
```

**VITE_PRIMARY_ADMIN_EMAIL**
```
Email admin utama
Contoh: fipp@mail.unnes.ac.id
```

## 🔑 Setup SSH Key di Server

### 1. Generate SSH Key (di komputer lokal)

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
# Save ke: ~/.ssh/github_actions_key
```

### 2. Copy Public Key ke Server

```bash
# Copy public key
cat ~/.ssh/github_actions_key.pub

# SSH ke server
ssh user@server-ip

# Tambahkan ke authorized_keys
echo "public_key_content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Test SSH Connection

```bash
ssh -i ~/.ssh/github_actions_key user@server-ip
```

### 4. Add Private Key ke GitHub Secrets

```bash
# Copy private key
cat ~/.ssh/github_actions_key

# Paste ke GitHub Secret: SERVER_SSH_KEY
```

## 📦 Setup PM2 di Server

PM2 digunakan untuk manage Node.js backend process.

```bash
# SSH ke server
ssh user@server-ip

# Install PM2 globally
npm install -g pm2

# Setup PM2 startup
pm2 startup

# Save PM2 process list
pm2 save
```

## 🎯 Workflow Deployment

File workflow sudah dibuat di: `.github/workflows/deploy.yml`

### Trigger Deployment

**Otomatis:**
- Push ke branch `main` atau `master`

**Manual:**
- Buka GitHub → **Actions** → **Deploy to aaPanel** → **Run workflow**

### Deployment Steps

1. ✅ Checkout code dari GitHub
2. ✅ Setup Node.js 18
3. ✅ Install frontend dependencies
4. ✅ Build frontend (dengan env variables)
5. ✅ Deploy frontend ke server via SCP
6. ✅ Deploy backend ke server via SCP
7. ✅ Install backend dependencies di server
8. ✅ Run database migrations
9. ✅ Restart backend dengan PM2

## 📝 First Time Setup di Server

Sebelum auto-deploy bisa jalan, setup manual pertama kali:

### 1. Setup Backend

```bash
# SSH ke server
cd /www/wwwroot/api.fipp.unnes.ac.id

# Clone atau upload backend files
# ...

# Install dependencies
npm install --production

# Setup .env
cp .env.example .env
nano .env
# Isi dengan credentials database, JWT secret, dll

# Run migrations
npm run migrate

# Start dengan PM2
pm2 start server.js --name lapor-fipp-api
pm2 save
```

### 2. Setup Frontend

```bash
# Di server
cd /www/wwwroot/lapor.fipp.unnes.ac.id

# Folder ini akan diisi oleh GitHub Actions
# Pastikan folder sudah ada dan writable
```

### 3. Setup Nginx

Nginx config sudah di-setup via aaPanel (lihat DEPLOYMENT_AAPANEL.md)

## 🔄 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Push ke GitHub (main branch)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Triggered                                    │
│  - Checkout code                                             │
│  - Build frontend                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Deploy via SSH/SCP                                          │
│  - Upload frontend (dist/) ke server                         │
│  - Upload backend ke server                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Server Actions                                              │
│  - npm install backend dependencies                          │
│  - Run database migrations                                   │
│  - PM2 restart backend                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ✅ Deployment Complete!                                     │
│  Frontend: https://lapor.fipp.unnes.ac.id                    │
│  Backend: https://api.fipp.unnes.ac.id                       │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testing Deployment

### 1. Test Manual Deployment

```bash
# Di lokal, push ke GitHub
git add .
git commit -m "Test auto-deploy"
git push origin main
```

### 2. Monitor GitHub Actions

- Buka GitHub → **Actions**
- Lihat workflow "Deploy to aaPanel" running
- Check logs untuk setiap step

### 3. Verify di Server

```bash
# SSH ke server
ssh user@server-ip

# Check backend process
pm2 status
pm2 logs lapor-fipp-api

# Check frontend files
ls -la /www/wwwroot/lapor.fipp.unnes.ac.id/

# Test API
curl https://api.fipp.unnes.ac.id/api/health
```

## 🔧 Troubleshooting

### Deployment Failed: SSH Connection

**Problem:** Cannot connect to server via SSH

**Solution:**
1. Verify SERVER_HOST, SERVER_USER, SERVER_SSH_KEY di GitHub Secrets
2. Test SSH connection manually: `ssh -i key user@host`
3. Check server firewall allows SSH (port 22)
4. Verify public key ada di `~/.ssh/authorized_keys` di server

### Deployment Failed: Permission Denied

**Problem:** Cannot write to deployment directory

**Solution:**
```bash
# SSH ke server
sudo chown -R www:www /www/wwwroot/lapor.fipp.unnes.ac.id
sudo chown -R www:www /www/wwwroot/api.fipp.unnes.ac.id
sudo chmod -R 755 /www/wwwroot/lapor.fipp.unnes.ac.id
sudo chmod -R 755 /www/wwwroot/api.fipp.unnes.ac.id
```

### PM2 Not Found

**Problem:** pm2 command not found

**Solution:**
```bash
# SSH ke server
npm install -g pm2
pm2 startup
```

### Build Failed: Missing Environment Variables

**Problem:** Build fails because env vars not set

**Solution:**
- Verify all VITE_* secrets ada di GitHub Secrets
- Check spelling dan format secrets
- Re-run workflow

## 📊 Monitoring

### GitHub Actions

- Buka **Actions** tab di GitHub
- Lihat history deployments
- Download logs jika ada error

### Server Monitoring

```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs lapor-fipp-api

# Check status
pm2 status

# Restart if needed
pm2 restart lapor-fipp-api
```

## 🔄 Rollback

Jika deployment bermasalah:

```bash
# SSH ke server
cd /www/wwwroot/api.fipp.unnes.ac.id

# Checkout previous commit
git checkout HEAD~1

# Restart
pm2 restart lapor-fipp-api
```

## 📝 Best Practices

1. **Always test locally** sebelum push ke main
2. **Use feature branches** untuk development
3. **Create pull requests** untuk review
4. **Tag releases** untuk tracking versions
5. **Monitor logs** setelah deployment
6. **Backup database** sebelum deploy perubahan besar

## 🎉 Ready to Deploy!

Setelah setup selesai:

1. ✅ GitHub Secrets configured
2. ✅ SSH key setup
3. ✅ PM2 installed
4. ✅ Server paths ready
5. ✅ First manual deployment done

**Sekarang setiap push ke main akan auto-deploy!** 🚀

---

**Repository:** https://github.com/hendradedi/lapor-fipp
