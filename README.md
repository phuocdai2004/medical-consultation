# Medical Consultation Website

A comprehensive medical consultation platform built with Node.js and modern web technologies, featuring patient-doctor interactions, appointment scheduling, and **automatic Docker CI/CD**!

## 🌟 Key Features

### ✅ Core Features
- **User Registration** with role selection (Patient, Doctor, Admin)
- **Secure Login** with JWT tokens
- **Password Reset** via email
- **Role-based Access Control** with different dashboards
- **Appointment System** - Booking and management
- **Email Notifications** - Automated alerts

### 🐳 Docker & CI/CD
- ✅ **Automatic Docker Building** - Builds on every push
- ✅ **GitHub Container Registry** - Images auto-pushed to GHCR
- ✅ **CI/CD Pipeline** - Tests, security scanning, code quality
- ✅ **Semantic Versioning** - Automatic image tagging
- ✅ **Docker Compose** - Easy local development

## 🚀 Quick Start

### Using Docker Compose (Recommended)
```bash
# Clone and setup
git clone <repo>
cd medical-consultation
cp .env.example .env

# Start all services
docker-compose up -d

# Access:
# Frontend: http://localhost
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
```

### Using GitHub Container Registry
```bash
# Pull pre-built images
docker pull ghcr.io/YOUR_USERNAME/medical-consultation-backend:latest
docker pull ghcr.io/YOUR_USERNAME/medical-consultation-frontend:latest

# Run with docker-compose or manually
```

## 📁 Project Structure

```
medical-consultation/
├── backend/                    # Node.js API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Web Frontend
│   ├── pages/
│   ├── assets/
│   ├── Dockerfile
│   └── nginx.conf
├── .github/workflows/          # GitHub Actions
│   ├── docker-build.yml       # Auto Docker builds
│   └── ci-cd.yml              # Full CI/CD
├── docker-compose.yml
├── CI-CD_QUICKSTART.md        # Quick reference
├── GITHUB_ACTIONS_SETUP.md    # Detailed setup
└── DOCKER.md                  # Docker docs
```

## 📊 GitHub Actions Workflows

### Docker Build & Push
- ✅ Automatically builds Docker images
- ✅ Pushes to GitHub Container Registry
- ✅ Runs on: push, tags, PRs

### CI/CD Pipeline
- ✅ Backend testing with MongoDB
- ✅ Security scanning (Trivy)
- ✅ Code quality (SonarCloud - optional)

## 🐳 Docker Images

Available at GitHub Container Registry after automatic builds:
```
ghcr.io/YOUR_USERNAME/medical-consultation-backend:latest
ghcr.io/YOUR_USERNAME/medical-consultation-frontend:latest
```

## 👥 User Roles

#### 🏥 Patients
- Dashboard with health overview
- Appointment booking and management
- Doctor search and filtering
- Medical records viewing
- Prescription tracking
- Health data monitoring

#### 👨‍⚕️ Doctors
- Professional profile management
- Appointment scheduling
- Patient management
- Medical record creation
- Prescription management

#### 🔧 Administrators
- User management
- System monitoring
- Analytics and reporting
- Content management

### 🎨 User Interface
- **Responsive Design** for all devices
- **Medical Theme** with professional styling
- **Intuitive Navigation** with role-based menus
- **Real-time Notifications**
- **Accessibility Features**
✅ **Giao diện đẹp** - Responsive design, medical theme

## Cấu trúc dự án

```
medical-consultation/
├── backend/           # API Server (Node.js + Express)
├── frontend/          # Web Client (HTML + CSS + JS)
└── README.md
```

## Công nghệ sử dụng

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt (Hash password)
- Nodemailer (Send email)
- CORS middleware

### Frontend
- HTML5 + CSS3 + JavaScript
- Responsive design
- Modern UI/UX
- Medical theme

## Hướng dẫn cài đặt

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
# Mở index.html trong browser hoặc sử dụng live server
```

### 3. Database Setup
- Cài đặt MongoDB
- Tạo database: `medical_consultation`
- Cấu hình connection string trong `.env`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập  
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### User Management
- `GET /api/users/profile` - Lấy thông tin profile
- `PUT /api/users/profile` - Cập nhật profile
- `GET /api/users` - Danh sách users (Admin only)

### Appointments
- `POST /api/appointments` - Đặt lịch hẹn
- `GET /api/appointments` - Lấy danh sách lịch hẹn
- `PUT /api/appointments/:id` - Cập nhật lịch hẹn

## Roles & Permissions

### Patient
- Đăng ký tài khoản
- Đặt lịch hẹn với bác sĩ
- Xem lịch sử khám bệnh
- Quản lý profile

### Doctor  
- Đăng ký với verification
- Xem danh sách bệnh nhân
- Quản lý lịch hẹn
- Tư vấn trực tuyến

### Admin
- Quản lý tất cả users
- Duyệt tài khoản bác sĩ
- Thống kê hệ thống
- Quản lý nội dung

## Demo Accounts

Sau khi setup, sử dụng các tài khoản demo:

**Admin:**
- Email: admin@medical.com
- Password: admin123

**Doctor:**
- Email: doctor@medical.com  
- Password: doctor123

**Patient:**
- Email: patient@medical.com
- Password: patient123

---

**Phát triển bởi:** Your Name
**Ngày:** 2025