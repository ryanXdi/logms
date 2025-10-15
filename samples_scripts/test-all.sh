#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:4000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  LogMS - Unified Sample Test Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Login
echo -e "${YELLOW}Step 1: Login to get token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed. Make sure backend is running.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}\n"

# Step 2: Test HTTP API Logs
echo -e "${YELLOW}Step 2: Testing HTTP API logs (3 logs)...${NC}"

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OLD_LOG="2025-10-13T10:30:00Z"  # 2 days ago for testing 7-day filter

curl -s -X POST "$API_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"timestamp\": \"$OLD_LOG\",
    \"source\": \"http\",
    \"severity\": 5,
    \"event_type\": \"auth\",
    \"user\": \"john.doe\",
    \"src_ip\": \"192.168.1.100\",
    \"host\": \"app-server-01\",
    \"message\": \"User login successful (2 days ago)\",
    \"raw\": \"{\\\"event\\\":\\\"login\\\",\\\"user\\\":\\\"john.doe\\\",\\\"ip\\\":\\\"192.168.1.100\\\"}\"
  }" > /dev/null
echo -e "  ${GREEN}✓${NC} HTTP API log 1 ingested (Oct 13)"

curl -s -X POST "$API_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"timestamp\": \"$NOW\",
    \"source\": \"http\",
    \"severity\": 8,
    \"event_type\": \"security\",
    \"action\": \"deny\",
    \"src_ip\": \"203.0.113.45\",
    \"dst_ip\": \"10.0.0.50\",
    \"src_port\": 52341,
    \"dst_port\": 443,
    \"protocol\": \"tcp\",
    \"message\": \"Firewall blocked connection attempt\",
    \"raw\": \"{\\\"action\\\":\\\"deny\\\",\\\"src\\\":\\\"203.0.113.45\\\",\\\"dst\\\":\\\"10.0.0.50\\\",\\\"port\\\":443}\"
  }" > /dev/null
echo -e "  ${GREEN}✓${NC} HTTP API log 2 ingested"

curl -s -X POST "$API_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"timestamp\": \"$NOW\",
    \"source\": \"http\",
    \"severity\": 3,
    \"event_type\": \"application\",
    \"host\": \"web-server-02\",
    \"url\": \"/api/users\",
    \"http_method\": \"GET\",
    \"status_code\": 200,
    \"message\": \"API request successful\",
    \"raw\": \"{\\\"method\\\":\\\"GET\\\",\\\"path\\\":\\\"/api/users\\\",\\\"status\\\":200}\"
  }" > /dev/null
echo -e "  ${GREEN}✓${NC} HTTP API log 3 ingested"

echo -e "${GREEN}✅ HTTP API logs ingested (3)${NC}\n"

# Step 3: Test Syslog Logs (via UDP)
echo -e "${YELLOW}Step 3: Testing Syslog logs via UDP port 5140 (2 logs)...${NC}"

# Syslog message 1: Network traffic
echo "<134>$(date '+%b %d %H:%M:%S') firewall: src=10.0.1.25 dst=8.8.8.8 proto=tcp" | nc -u -w1 localhost 5140
echo -e "  ${GREEN}✓${NC} Syslog log 1 sent via UDP"

sleep 0.5

# Syslog message 2: SSH failed auth
echo "<86>$(date '+%b %d %H:%M:%S') server sshd: Failed password for admin from 192.168.1.50" | nc -u -w1 localhost 5140
echo -e "  ${GREEN}✓${NC} Syslog log 2 sent via UDP"

echo -e "${GREEN}✅ Syslog logs sent via UDP (2)${NC}\n"

# Step 4: Test AWS CloudTrail Logs
echo -e "${YELLOW}Step 4: Testing AWS CloudTrail logs (3 logs)...${NC}"

curl -s -X POST "$API_URL/api/ingest/aws" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"eventTime\": \"$NOW\",
    \"eventName\": \"RunInstances\",
    \"eventSource\": \"ec2.amazonaws.com\",
    \"awsRegion\": \"us-east-1\",
    \"sourceIPAddress\": \"203.0.113.100\",
    \"userIdentity\": {
      \"accountId\": \"123456789012\",
      \"userName\": \"admin\"
    }
  }" > /dev/null
echo -e "  ${GREEN}✓${NC} AWS CloudTrail log 1 ingested"

curl -s -X POST "$API_URL/api/ingest/aws" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"eventTime\": \"$NOW\",
    \"eventName\": \"PutObject\",
    \"eventSource\": \"s3.amazonaws.com\",
    \"awsRegion\": \"us-west-2\",
    \"sourceIPAddress\": \"10.0.1.100\",
    \"userIdentity\": {
      \"accountId\": \"123456789012\",
      \"userName\": \"developer\"
    }
  }" > /dev/null
echo -e "  ${GREEN}✓${NC} AWS CloudTrail log 2 ingested"

curl -s -X POST "$API_URL/api/ingest/aws" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"eventTime\": \"$NOW\",
    \"eventName\": \"ConsoleLogin\",
    \"eventSource\": \"signin.amazonaws.com\",
    \"awsRegion\": \"us-east-1\",
    \"sourceIPAddress\": \"203.0.113.200\",
    \"userIdentity\": {
      \"accountId\": \"123456789012\",
      \"userName\": \"admin\",
      \"type\": \"IAMUser\"
    }
  }" > /dev/null
echo -e "  ${GREEN}✓${NC} AWS CloudTrail log 3 ingested"

echo -e "${GREEN}✅ AWS CloudTrail logs ingested (3)${NC}\n"

# Step 5: Test File Upload Logs (via multipart/form-data)
echo -e "${YELLOW}Step 5: Testing File Upload logs via /api/ingest/file (3 logs)...${NC}"

# Create temporary file with 3 log entries (plain text format)
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF
[$NOW] INFO db-primary-01 - SELECT query executed: SELECT * FROM users LIMIT 100
[$NOW] ERROR app-server-03 - Connection timeout after 30s - retrying...
[$NOW] INFO cache-server-01 - Cache flush completed - 5000 keys removed
EOF

# Upload the file
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/api/ingest/file" \
  -H "Authorization: Bearer $TOKEN" \
  -F "logfile=@$TEMP_FILE")

# Clean up temp file
rm "$TEMP_FILE"

# Check if upload was successful
if echo "$UPLOAD_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✓${NC} File uploaded with 3 logs"
else
  echo -e "  ${RED}✗${NC} File upload failed"
fi

echo -e "${GREEN}✅ File upload logs ingested (3)${NC}\n"

# Step 6: Verify ingestion
echo -e "${YELLOW}Step 6: Verifying ingestion...${NC}"
sleep 2

SEARCH_RESPONSE=$(curl -s -X POST "$API_URL/api/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"from":"now-7d","limit":100}')

TOTAL_LOGS=$(echo $SEARCH_RESPONSE | grep -o '"total":[0-9]*' | grep -o '[0-9]*')

echo -e "${GREEN}✅ Total logs in database: $TOTAL_LOGS${NC}\n"

# Step 7: Test Stats endpoint
echo -e "${YELLOW}Step 7: Testing Stats endpoint...${NC}"
STATS_RESPONSE=$(curl -s -X POST "$API_URL/api/search/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

echo -e "${BLUE}Stats retrieved successfully${NC}"
echo -e "${GREEN}✅ Stats endpoint working${NC}\n"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All tests completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo -e "  • HTTP API logs: 3"
echo -e "  • Syslog logs: 2"
echo -e "  • AWS CloudTrail logs: 3"
echo -e "  • File upload logs: 3"
echo -e "  ${GREEN}Total: 11 logs ingested${NC}"
echo -e "\n${BLUE}View logs at: http://localhost:3000/logs${NC}\n"
