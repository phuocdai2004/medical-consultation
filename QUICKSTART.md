# ⚡ Quick Start - Medical Consultation System

## 🚀 Chạy Project

### **Backend (Terminal 1):**
```powershell
cd d:\medical-consultation\backend
npm start
```
✅ API: http://localhost:5000

### **Frontend (Terminal 2):**
```powershell
cd d:\medical-consultation\frontend
npm start
```
✅ Web: http://localhost:3000

### **Hoặc chạy TẤT CẢ với Docker:**
```powershell
cd d:\medical-consultation
docker-compose up -d
```

---

## ✅ CI/CD Setup Complete

You now have **ONE powerful CI/CD workflow**:

```
📁 .github/workflows/
    └─ 📄 ci-cd.yml (153 lines - Does everything!)
```

## 🚀 What It Does

```
┌─────────────────────────────────────────────────┐
│         You push code to GitHub                  │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ✅ Backend Tests      ✅ Frontend Build
    with MongoDB          Docker image
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
            ✅ Docker Build
            Both images
                   │
                   ▼
            ✅ Security Scan
            Trivy checker
                   │
                   ▼
    🎉 Images Ready in GHCR
    Ready to deploy!
```

## 📋 Workflow Jobs

| Job | Purpose | Trigger |
|-----|---------|---------|
| `test-backend` | Run tests with MongoDB | Always |
| `build-docker` | Build backend & frontend | After tests pass |
| `security` | Scan vulnerabilities | Always |
| `report` | Show build summary | After all complete |

## ⏱️ Build Timeline

```
0:00  → You push code
0:10  → GitHub Actions starts
0:30  → Backend tests running
1:00  → Docker images building
1:30  → Security scanning
2:00  → ✅ Complete! Images in GHCR
```

## 🎯 How to Use It

### Step 1: Push Code
```bash
cd d:\medical-consultation
git add .
git commit -m "Your changes"
git push origin main
```

### Step 2: Watch Build
Go to: `https://github.com/YOUR_USERNAME/medical-consultation/actions`

Click the workflow run to see:
- ✅ Real-time build logs
- ✅ Test results
- ✅ Image tags
- ✅ Security scan results

### Step 3: Use Images
```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/YOUR_USERNAME/medical-consultation-backend:latest
docker pull ghcr.io/YOUR_USERNAME/medical-consultation-frontend:latest

# Or update docker-compose.yml and run
docker-compose up -d
```

## 🐳 Docker Images Available

After each push, you get:

```
ghcr.io/YOUR_USERNAME/medical-consultation-backend
├── latest           (Always main branch)
├── main            
├── develop
├── v1.0.0          (Version tags)
└── sha-abc123      (Commit hash)

ghcr.io/YOUR_USERNAME/medical-consultation-frontend
├── latest
├── main
├── develop
├── v1.0.0
└── sha-abc123
```

## 📊 Key Features

✅ **Automated** - Every push triggers build
✅ **Tested** - Backend tests run first
✅ **Secure** - Vulnerability scanning
✅ **Versioned** - Automatic image tagging
✅ **Fast** - ~2 minutes with cache
✅ **Simple** - One workflow file
✅ **Public** - Anyone can pull images

## 🔧 Customization

To add deployment, edit `.github/workflows/ci-cd.yml`:

```yaml
  deploy:
    needs: [build-docker, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to cloud
        run: |
          # Your deployment commands here
          echo "Deploying..."
```

## 📞 Next Steps

1. ✅ **Push to GitHub** - Initialize git and push
2. ✅ **Watch Actions** - Go to Actions tab
3. ✅ **Pull Images** - Use from GHCR
4. ✅ **Deploy** - Use anywhere (cloud, servers, etc.)

## 💡 Pro Tips

- **First build**: ~3 minutes (no cache)
- **Later builds**: ~1-2 minutes (with cache)
- **Manual trigger**: Go to Actions → Run workflow
- **Version tags**: Push a tag to auto-build that version
- **Pull requests**: Builds but doesn't push

## 🎉 You're All Set!

Your automatic Docker CI/CD is ready to go!

**Just push code and watch it build automatically!** 🚀

---

### Files You Have:

```
✅ .github/workflows/ci-cd.yml      (Main workflow)
✅ backend/Dockerfile              (Backend image)
✅ frontend/Dockerfile             (Frontend image)
✅ frontend/nginx.conf             (Nginx config)
✅ docker-compose.yml              (Local dev)
✅ .env.example                    (Environment)
✅ README.md                       (Updated)
✅ DOCKER.md                       (Documentation)
✅ CI-CD_READY.md                  (This setup)
```

### Get Started Now:

```bash
git init
git add .
git commit -m "Add automatic Docker CI/CD"
git remote add origin https://github.com/YOUR_USERNAME/medical-consultation.git
git push -u origin main
```

Then watch the magic happen at: `github.com/YOUR_USERNAME/medical-consultation/actions`

**Happy automatic building!** 🎉
