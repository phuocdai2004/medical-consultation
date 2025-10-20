# 🚀 Lệnh Chạy Project

## Option 1: Docker (Recommended) ⭐

### Chạy tất cả (MongoDB + Backend + Frontend):
```powershell
cd d:\medical-consultation
docker-compose up -d
```

### Truy cập:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### Các lệnh Docker:
```powershell
# Xem logs
docker-compose logs -f

# Stop tất cả
docker-compose down

# Restart
docker-compose restart

# Rebuild sau khi sửa code
docker-compose up -d --build

# Xem trạng thái
docker-compose ps
```

---

## Option 2: Chạy riêng từng phần

### Backend:
```powershell
cd d:\medical-consultation\backend
npm install
npm start
```
➡️ API chạy tại: http://localhost:5000

### Frontend:
```powershell
cd d:\medical-consultation\frontend
npm install
npm start
```
➡️ Web chạy tại: http://localhost:3000

### MongoDB (cần cài riêng):
```powershell
# Hoặc dùng MongoDB Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## 🔧 Environment Variables

Tạo file `.env` trong thư mục `backend`:
```env
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/medical_consultation
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 📊 Kiểm tra trạng thái

### Kiểm tra Backend:
```powershell
curl http://localhost:5000/api/health
```

### Kiểm tra MongoDB:
```powershell
docker exec -it medical-consultation-mongodb-1 mongosh
```

### Kiểm tra Frontend:
Mở browser: http://localhost:80

---

## ⚠️ Troubleshooting

### Port 5000 bị chiếm:
```powershell
# Tìm process
Get-NetTCPConnection -LocalPort 5000

# Kill process
Stop-Process -Id <PID> -Force
```

### Docker không start:
```powershell
# Xem lỗi
docker-compose logs

# Restart Docker Desktop
# Hoặc restart services
docker-compose down
docker-compose up -d
```

### MongoDB không connect:
```powershell
# Kiểm tra MongoDB container
docker ps | Select-String mongodb

# Restart MongoDB
docker-compose restart mongodb
```

---

## 🎯 Quick Commands

```powershell
# Start project
cd d:\medical-consultation && docker-compose up -d

# Stop project
cd d:\medical-consultation && docker-compose down

# View logs
cd d:\medical-consultation && docker-compose logs -f

# Rebuild all
cd d:\medical-consultation && docker-compose up -d --build

# Check status
cd d:\medical-consultation && docker-compose ps
```

---

## 📦 Development Workflow

1. **Sửa code** trong `backend/` hoặc `frontend/`
2. **Rebuild Docker**:
   ```powershell
   docker-compose up -d --build
   ```
3. **Xem logs** để debug:
   ```powershell
   docker-compose logs -f backend
   ```
4. **Test** tại http://localhost:80

---

## 🚀 Deploy to Production

### Push lên GitHub:
```powershell
git add .
git commit -m "Update code"
git push origin main
```

➡️ CI/CD tự động build Docker images!

### Pull images:
```powershell
docker pull ghcr.io/phuocdai2004/medical-consultation-backend:latest
docker pull ghcr.io/phuocdai2004/medical-consultation-frontend:latest
```

---

**Chúc bạn code vui! 🎉**
