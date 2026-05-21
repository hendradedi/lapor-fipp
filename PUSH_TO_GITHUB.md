# 🚀 Panduan Push ke GitHub

Langkah-langkah untuk push project ke repository GitHub: https://github.com/hendradedi/lapor-fipp

## 📋 Prerequisites

- Git terinstall di komputer
- GitHub account dengan akses ke repository
- SSH key atau Personal Access Token untuk GitHub

## 🔧 Setup Git (Jika Belum)

### 1. Configure Git

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

### 2. Setup SSH Key untuk GitHub (Recommended)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "email@anda.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add SSH key
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Paste ke GitHub: Settings → SSH and GPG keys → New SSH key
```

## 📦 Persiapan Project

### 1. Bersihkan File yang Tidak Perlu

```bash
# Hapus node_modules
rm -rf node_modules backend/node_modules

# Hapus .env files (jangan commit credentials!)
rm -f .env backend/.env src/.env

# Hapus build files
rm -rf dist backend/dist
```

### 2. Verify .gitignore

File `.gitignore` sudah dibuat dan akan mengexclude:
- ✅ node_modules/
- ✅ .env files
- ✅ dist/ dan build files
- ✅ logs
- ✅ OS files (.DS_Store, Thumbs.db)

## 🔄 Initialize Git Repository

### Jika Repository Baru (Fresh Start)

```bash
# Initialize git
git init

# Add remote
git remote add origin git@github.com:hendradedi/lapor-fipp.git

# Verify remote
git remote -v
```

### Jika Repository Sudah Ada

```bash
# Clone repository
git clone git@github.com:hendradedi/lapor-fipp.git
cd lapor-fipp

# Copy semua file baru ke folder ini
# (backend/, src/, dll)
```

## 📤 Push ke GitHub

### 1. Check Status

```bash
# Lihat file yang akan di-commit
git status

# Pastikan tidak ada .env atau credentials
git status | grep .env
# Seharusnya tidak ada output
```

### 2. Add Files

```bash
# Add semua file
git add .

# Atau add specific files/folders
git add backend/
git add src/
git add .github/
git add *.md
git add package.json
git add vite.config.js
```

### 3. Commit Changes

```bash
# Commit dengan message yang jelas
git commit -m "feat: migrate to custom backend (Node.js + Express + PostgreSQL)

- Add backend API with Express and PostgreSQL
- Update frontend to use REST API instead of Firebase
- Add database migrations
- Add GitHub Actions for auto-deploy
- Add comprehensive documentation
- Setup aaPanel deployment configuration"
```

### 4. Push to GitHub

```bash
# Push ke main branch
git push -u origin main

# Atau jika branch default adalah master
git push -u origin master
```

## 🌿 Branching Strategy (Recommended)

### Create Development Branch

```bash
# Create dan switch ke dev branch
git checkout -b development

# Push dev branch
git push -u origin development
```

### Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/nama-fitur

# Work on feature...
git add .
git commit -m "feat: add new feature"

# Push feature branch
git push -u origin feature/nama-fitur

# Create Pull Request di GitHub
# Merge ke development → test → merge ke main
```

## 🔐 Setup GitHub Secrets

Setelah push, setup secrets untuk auto-deploy:

### 1. Buka Repository Settings

GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**

### 2. Add Required Secrets

Klik **New repository secret** dan tambahkan:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SERVER_HOST` | `123.456.789.0` | IP atau domain server |
| `SERVER_USER` | `root` atau `www` | SSH username |
| `SERVER_SSH_KEY` | `-----BEGIN...` | Private SSH key |
| `FRONTEND_PATH` | `/www/wwwroot/lapor.fipp.unnes.ac.id` | Path frontend |
| `BACKEND_PATH` | `/www/wwwroot/api.fipp.unnes.ac.id` | Path backend |
| `VITE_API_BASE_URL` | `https://api.fipp.unnes.ac.id/api` | Backend API URL |
| `VITE_APP_NAME` | `Lapor FIPP` | App name |
| `VITE_PRIMARY_ADMIN_EMAIL` | `fipp@mail.unnes.ac.id` | Admin email |

### 3. Generate SSH Key untuk GitHub Actions

```bash
# Generate dedicated key untuk GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key

# Copy private key untuk GitHub Secret
cat ~/.ssh/github_actions_key

# Copy public key untuk server
cat ~/.ssh/github_actions_key.pub

# SSH ke server dan add public key
ssh user@server-ip
echo "paste_public_key_here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 🧪 Test Auto-Deploy

### 1. Make a Small Change

```bash
# Edit README atau file lain
echo "# Test auto-deploy" >> README.md

# Commit dan push
git add README.md
git commit -m "test: verify auto-deploy"
git push origin main
```

### 2. Monitor GitHub Actions

1. Buka GitHub repository
2. Klik tab **Actions**
3. Lihat workflow "Deploy to aaPanel" running
4. Check logs untuk setiap step
5. Verify deployment success

### 3. Verify di Server

```bash
# SSH ke server
ssh user@server-ip

# Check backend
pm2 status
pm2 logs lapor-fipp-api

# Check frontend
ls -la /www/wwwroot/lapor.fipp.unnes.ac.id/

# Test API
curl https://api.fipp.unnes.ac.id/api/health
```

## 📝 Git Commands Cheat Sheet

### Daily Workflow

```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Check status
git status

# Add changes
git add .

# Commit
git commit -m "feat: description"

# Push
git push origin feature/my-feature

# Switch branch
git checkout main

# Merge branch
git merge feature/my-feature

# Delete branch
git branch -d feature/my-feature
```

### Undo Changes

```bash
# Undo unstaged changes
git checkout -- filename

# Undo staged changes
git reset HEAD filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### View History

```bash
# View commit history
git log --oneline

# View changes
git diff

# View specific file history
git log --follow filename
```

## 🔄 Update Workflow

### Regular Updates

```bash
# 1. Pull latest
git pull origin main

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run dev  # frontend
cd backend && npm run dev  # backend

# 4. Commit and push
git add .
git commit -m "feat: your changes"
git push origin main

# 5. Auto-deploy akan trigger
# Monitor di GitHub Actions
```

### Hotfix Workflow

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix bug
# ... edit files ...

# 3. Commit
git commit -m "fix: critical bug description"

# 4. Push
git push origin hotfix/critical-bug

# 5. Create Pull Request
# 6. Merge to main
# 7. Auto-deploy
```

## 🚨 Troubleshooting

### Push Rejected

```bash
# Pull first
git pull origin main --rebase

# Then push
git push origin main
```

### Merge Conflicts

```bash
# Pull latest
git pull origin main

# Resolve conflicts in files
# Edit files, remove conflict markers

# Add resolved files
git add .

# Commit
git commit -m "merge: resolve conflicts"

# Push
git push origin main
```

### Wrong Commit Message

```bash
# Amend last commit message
git commit --amend -m "New message"

# Force push (if already pushed)
git push --force origin main
```

## 📊 Repository Structure

```
lapor-fipp/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── backend/                     # Backend API
│   ├── src/
│   ├── scripts/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── src/                         # Frontend source
│   ├── components/
│   ├── lib/
│   ├── App.jsx
│   └── .env.example
├── public/                      # Static assets
├── .gitignore                   # Git ignore rules
├── .gitattributes              # Git attributes
├── package.json                 # Frontend dependencies
├── vite.config.js              # Vite config
├── README.md                    # Project overview
├── DEPLOYMENT_AAPANEL.md       # Deployment guide
├── GITHUB_AUTO_DEPLOY.md       # Auto-deploy guide
└── PUSH_TO_GITHUB.md           # This file
```

## ✅ Checklist Sebelum Push

- [ ] Hapus `node_modules/` dan `dist/`
- [ ] Hapus semua `.env` files
- [ ] Verify `.gitignore` sudah benar
- [ ] Test build locally: `npm run build`
- [ ] Test backend locally: `cd backend && npm run dev`
- [ ] Update README.md jika perlu
- [ ] Commit message yang jelas dan deskriptif
- [ ] Push ke feature branch dulu (bukan langsung ke main)
- [ ] Create Pull Request untuk review
- [ ] Merge ke main setelah review

## 🎉 Ready to Push!

Setelah semua checklist selesai:

```bash
# Final check
git status

# Add all
git add .

# Commit
git commit -m "feat: complete backend migration and auto-deploy setup"

# Push
git push -u origin main

# Monitor deployment
# GitHub → Actions → Watch deployment
```

---

**Repository:** https://github.com/hendradedi/lapor-fipp

**Auto-deploy akan trigger setiap push ke main branch!** 🚀
