# LogMS - Log Management System

A full-stack log management and alerting system built with Node.js, Express, React, and MongoDB.

## 🚀 Features

- **Multi-tenant Architecture** - Isolated data per tenant
- **Real-time Log Ingestion** - HTTP API, Syslog (UDP/TCP), File Upload, AWS CloudTrail
- **Advanced Search & Filtering** - Search by severity, time range, host, user, IPs, etc.
- **Alert Engine** - Threshold, frequency, and pattern-based alerting
- **Email Notifications** - Automatic email alerts via Resend
- **Role-Based Access Control** - Admin and viewer roles
- **Statistics Dashboard** - Visual insights into log data

## 📦 Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Resend (Email Service)
- Rate Limiting & Security (Helmet, CORS)

### Frontend
- React 18
- React Router
- Axios
- CSS3

## 🏗️ Architecture

The application is deployed as a **unified monorepo** on Render:
- Backend serves API routes on `/api/*`
- Backend also serves the static React build in production
- Single deployment = simpler infrastructure

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd LogDemo
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure environment variables**

Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/logms-demo
JWT_SECRET=your-secret-key-here
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=admin123
DEFAULT_TENANT=default
PORT=4000

# Optional: Email Alerts
RESEND_API_KEY=re_your_api_key
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=your-email@example.com

# Syslog Server (optional)
SYSLOG_UDP_PORT=5140
SYSLOG_TCP_PORT=5140
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or using docker-compose
docker-compose up -d mongo
```

5. **Run the application**

**Development mode (separate frontend/backend):**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Frontend: http://localhost:3000
Backend API: http://localhost:4000

**Production mode (unified deployment):**
```bash
cd backend
npm run build  # Builds the frontend
NODE_ENV=production npm start
```

Then visit: http://localhost:4000

## 📤 Deployment on Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Render will automatically detect `render.yaml` and create:
   - MongoDB instance
   - Web service (unified app)

### Option 2: Manual Setup

1. **Create MongoDB Database**
   - Type: Private Service
   - Image: `mongo:7.0`
   - Add persistent disk at `/data/db`

2. **Create Web Service**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment Variables:
     - `NODE_ENV=production`
     - `PORT=10000` (Render auto-assigns)
     - `MONGODB_URI` (from MongoDB service)
     - `JWT_SECRET` (generate random value)
     - `APP_ADMIN_EMAIL`
     - `APP_ADMIN_PASSWORD`

## 🔐 Default Admin Account

```
Email: admin@example.com
Password: admin123
```

**⚠️ Change these credentials in production!**

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Log Ingestion
- `POST /api/ingest` - JSON logs
- `POST /api/ingest/file` - File upload (JSON/JSONL/TXT)
- `POST /api/ingest/aws` - AWS CloudTrail events
- `POST /api/ingest/syslog` - Syslog messages
- Syslog Server: UDP/TCP port 5140

### Search & Analytics
- `POST /api/search` - Search logs
- `POST /api/search/stats` - Get statistics
- `GET /api/search/tenants` - List tenants (admin only)

### Alert Management
- `GET /api/alerts/rules` - List alert rules
- `POST /api/alerts/rules` - Create alert rule (admin only)
- `PATCH /api/alerts/rules/:id/toggle` - Enable/disable rule
- `DELETE /api/alerts/rules/:id` - Delete rule (admin only)
- `GET /api/alerts/notifications` - List notifications
- `PATCH /api/alerts/notifications/:id/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/notifications/:id/resolve` - Resolve alert

## 🧪 Testing

See `samples/` directory for test scripts:

```bash
# Test file uploads
./samples/test-file-upload.sh

# Test AWS CloudTrail ingestion
./samples/test-aws.sh
```

## 📊 Log Schema

All logs are normalized to:
```javascript
{
  timestamp: Date,
  tenant: String,
  source: String,
  severity: Number (1-10),
  host: String,
  user: String,
  src_ip: String,
  dst_ip: String,
  event_type: String,
  message: String,
  raw: String,
  _tags: [String]
}
```

## 🔔 Alert Rules

Three alert types:
- **Threshold** - Trigger when field meets condition
- **Frequency** - Trigger when count exceeds threshold in time window
- **Pattern** - Trigger when message matches regex pattern

## 📧 Email Alerts

Configure Resend API key to enable email notifications for critical/high severity alerts.

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Helmet.js security headers
- CORS protection
- Input validation
- Multi-tenant data isolation

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📞 Support

For issues or questions, please open a GitHub issue.
