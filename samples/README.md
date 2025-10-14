# Log Samples & Test Scripts

This directory contains sample log files and test scripts to demonstrate the 4 data ingestion sources.

## 📦 Data Sources

### 1. **HTTP JSON API**
- Endpoint: `POST /api/ingest`
- Format: JSON objects or arrays
- Real-time ingestion
- Use case: Application logs, custom integrations

### 2. **Syslog UDP/TCP** (Firewall/Network Logs)
- Ports: 5514 (UDP/TCP)
- Format: Standard syslog messages (RFC 5424)
- Real-time ingestion
- Use case: Firewall logs, network devices, routers

### 3. **File Upload / Batch Ingestion**
- Endpoint: `POST /api/ingest/file`
- Formats: JSON, JSONL, TXT
- Batch processing
- Use case: Historical data, bulk imports, offline logs

### 4. **AWS CloudTrail** ☁️
- Endpoint: `POST /api/ingest/aws`
- Format: CloudTrail JSON Records
- Real-time or batch ingestion
- Use case: AWS API calls, IAM events, S3 access, EC2 operations

---

## 📁 Sample Files

| File | Format | Description |
|------|--------|-------------|
| `sample-logs.json` | JSON Array | 3 structured log events |
| `sample-logs.jsonl` | JSON Lines | 4 log events (one per line) |
| `sample-logs.txt` | Plain Text | 5 text log lines |

---

## 🧪 Test Scripts

### Test File Upload
```bash
./samples/test-file-upload.sh
```
Tests all 3 file formats (JSON, JSONL, TXT)

### Test AWS CloudTrail
```bash
./samples/test-aws.sh
```
Tests AWS CloudTrail event ingestion (6 sample events including login, S3, IAM, EC2)

---

## 🚀 Quick Test

Run all tests:
```bash
# Test file uploads
./samples/test-file-upload.sh

# Test AWS CloudTrail ingestion
./samples/test-aws.sh
```

---

## 📊 Manual Testing

### Upload a JSON file:
```bash
curl -X POST http://localhost:4000/api/ingest/file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logfile=@samples/sample-logs.json"
```

### Send a webhook:
```bash
curl -X POST http://localhost:4000/api/ingest/webhook \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-webhook-type: test" \
  -d '{"message": "Test webhook", "severity": 5}'
```

---

## ✅ What Gets Normalized

All 4 sources normalize logs to the central schema:
- `timestamp` - ISO 8601 format
- `tenant` - Multi-tenant isolation
- `source` - Origin of the log
- `severity` - 1-10 scale
- `host`, `user`, `src_ip`, `dst_ip` - Extracted fields
- `event_type` - Categorization
- `message` - Human-readable message
- `raw` - Original log (preserved)
- `_tags` - Array of tags

---

## 🔍 Verify Ingestion

After running tests, check logs in the dashboard at:
```
http://localhost:3000
```

Or query via API:
```bash
curl -X POST http://localhost:4000/api/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```
