# LogMS - Log Management System

A multi-tenant log management platform with support for multiple ingestion methods, real-time alerting, and advanced search capabilities.

## Features

- **4 Ingestion Methods**: HTTP API, Syslog (UDP/TCP), AWS CloudTrail, File Upload
- **Multi-Tenant**: Complete tenant isolation with RBAC (admin/viewer roles)
- **Real-time Alerts**: Rule-based alerting with email notifications and duplicate suppression
- **Advanced Search**: Time-range filtering, field queries, and visual statistics
- **Normalized Schema**: All logs normalized to unified format for consistent searching
- **Dual Deployment**: Docker appliance mode or SaaS platform

## Tech Stack

**Backend**: Node.js, Express, MongoDB, JWT, Syslog server  
**Frontend**: React, React Router, Axios

## Quick Start

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Services:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **MongoDB**: localhost:27017

Default login: `admin@example.com` / `admin123`

### Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Environment Variables

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb://logms:logms@mongo:27017/logms?authSource=admin
JWT_SECRET=your_secret_key
PORT=4000
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=admin123
SYSLOG_UDP_PORT=5140
SYSLOG_TCP_PORT=5140

# Optional: Email alerts
RESEND_API_KEY=your_resend_key
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:4000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (returns JWT)

### Log Ingestion
- `POST /api/ingest` - HTTP API ingestion
- `POST /api/ingest/aws` - AWS CloudTrail logs
- `POST /api/ingest/file` - File upload (multipart)
- Syslog: Send to UDP/TCP port 5140

### Search & Analytics
- `POST /api/search` - Search logs
- `POST /api/search/stats` - Get statistics
- `GET /api/search/tenants` - List tenants (admin)

### Alerts
- `GET /api/alerts/rules` - List alert rules
- `POST /api/alerts/rules` - Create alert rule
- `GET /api/alerts/notifications` - List notifications
- `PUT /api/alerts/notifications/:id` - Update status

## Log Schema

All logs normalized to:
```javascript
{
  timestamp: Date,
  tenant: String,
  source: String,          // http, syslog, aws-cloudtrail, file-upload
  severity: Number,        // 1-10
  event_type: String,      // auth, security, network, application
  action: String,          // allow, deny, create, delete
  src_ip: String,
  dst_ip: String,
  user: String,
  host: String,
  message: String,
  raw: String,             // Original log
  cloud: { account_id, region, service }
}
```

## Testing

Run automated tests:

```bash
# All 4 ingestion methods (11 logs)
./samples_scripts/test-all.sh

# Acceptance criteria (8 tests)
./samples_scripts/test-acceptance.sh

# RBAC tenant isolation
./samples_scripts/test-rbac.sh
```

## User Roles

**Admin**:
- View/manage all tenants
- Create users and alert rules
- Cross-tenant data access

**Viewer**:
- View only assigned tenant
- Read-only access
- Cannot create rules

## Project Structure

```
LogDemo/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── index.js      # Main server
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   └── services/     # Normalizer, syslog, alerts, email
│   └── tests/
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── pages/        # Login, Logs, Alerts
│   │   ├── components/   # SearchBar, LogTable, Stats
│   │   └── utils/        # API helpers
│   └── build/
├── samples_scripts/      # Test scripts
├── docker-compose.yml
└── README.md
```

## Alert Rules

Create rules with conditions:
- **Threshold**: Field value comparison (e.g., severity >= 8)
- **Count**: Log count exceeds limit in time window
- **Pattern**: Message matches regex

Example:
```json
{
  "name": "Critical Alerts",
  "conditionType": "threshold",
  "field": "severity",
  "operator": "gte",
  "value": "9"
}
```

## Rate Limits

- General API: 10,000 req/15min
- Authentication: 50 req/15min
- Search: 3,000 req/1min
- Ingest: 1,000 req/1min

## Deployment

### Docker Compose (Appliance Mode)
```bash
docker-compose up -d
```

### Production (SaaS)
1. Deploy backend to cloud platform (e.g., Render)
2. Use MongoDB Atlas for database
3. Build frontend: `npm run build`
4. Serve frontend with static hosting or with backend

## Security

- JWT authentication with 24h expiration
- Password hashing (bcryptjs)
- Tenant isolation (RBAC)
- Rate limiting per IP
- Security headers (Helmet.js)
- CORS protection

## Troubleshooting

**MongoDB connection failed:**
```bash
docker logs logms-lite-mongo
```

**Syslog not receiving:**
- Check ports 5140 exposed in docker-compose.yml
- Test: `echo "test" | nc -u localhost 5140`

**Clear database:**
```bash
docker exec logms-lite-mongo mongosh -u logms -p logms \
  --authenticationDatabase admin logms \
  --eval 'db.logs.deleteMany({}); db.alertnotifications.deleteMany({});'
```

## License

MIT
