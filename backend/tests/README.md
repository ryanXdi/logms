#  API tests for LogDemo backend

# How to Run

cd backend
npm run dev

# Run tests:
node tests/ingest-severity.test.js
node tests/alert-rules.test.js


# Tests

**`ingest-severity.test.js`** - Tests log ingestion → statistics → filtering
- Ingest logs with different severities (3, 5, 8, 10)
- Retrieve severity distribution stats
- Filter high severity logs (>= 8)

**`alert-rules.test.js`** - Tests alerting system
- Create alert rule (severity >= 9)
- Trigger alert with critical log
- Check notifications
- Delete rule (cleanup)

## 📝 Test Credentials

- Email: `admin@example.com`
- Password: `admin123`
