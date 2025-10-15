# LogMS Setup Guide

## Appliance Mode

### Prerequisites
- Docker & Docker Compose installed
- Ports available: 3000, 4000, 27017, 5140

### 1. Install Docker
```bash
sudo apt update
sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone & Start
```bash
git clone https://github.com/ryanXdi/logms.git
cd logms

# Optional: Configure email alerts
cp .env.example .env
nano .env  # Update RESEND_API_KEY and ALERT_EMAIL_TO

# Start all services
docker-compose up -d
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Default Admin: `admin@example.com` / `admin123`

---

## SaaS Mode

### Prerequisites
- Render account (https://render.com)
- MongoDB Atlas account (https://cloud.mongodb.com)
- Resend account for email alerts (https://resend.com)

### 1. MongoDB Atlas
1. Create free M0 cluster at https://cloud.mongodb.com
2. Database Access → Create user (`logms-user`)
3. Network Access → Add IP: `0.0.0.0/0`
4. Copy connection string

### 2. Deploy Backend (Render)
1. Render → New Web Service → Connect GitHub repo
2. Settings:
   - Docker Context: `./backend`
   - Dockerfile: `./backend/Dockerfile`
3. Environment Variables:
```
MONGODB_URI=mongodb+srv://logms-user:<password>@cluster0.xxxxx.mongodb.net/logms
JWT_SECRET=your-secure-32-char-random-string
PORT=4000
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=admin123
DEFAULT_TENANT=default
RESEND_API_KEY=re_your_key_from_resend
ALERT_EMAIL_FROM=onboarding@resend.dev
ALERT_EMAIL_TO=your-email@example.com
NODE_ENV=production
```
4. Deploy → Copy URL

### 3. Deploy Frontend (Render)
1. Update `frontend/src/utils/api.js` with backend URL
2. Push to GitHub
3. Render → New Static Site
4. Settings:
   - Root: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `build`
5. Environment: `REACT_APP_API_URL=<backend-url>`
6. Deploy

### 4. Access Application
Your app is live at: `https://logms-app.onrender.com` (HTTPS automatic)

---

## Notes

- **Appliance HTTPS:** Self-signed cert optional (not required for demo)
- **SaaS HTTPS:** Automatic via Render (TLS 1.2+, Let's Encrypt)
- **Assignment Requirement:** Both modes must run, HTTPS mandatory for SaaS only
