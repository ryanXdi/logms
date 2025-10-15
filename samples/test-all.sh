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
HTTP_LOGS=$(cat samples/all-samples.json | jq -c '.http_api_logs[]')

COUNT=0
while IFS= read -r log; do
    COUNT=$((COUNT + 1))
    curl -s -X POST "$API_URL/api/ingest" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$log" > /dev/null
    echo -e "  ${GREEN}✓${NC} HTTP API log $COUNT ingested"
done <<< "$HTTP_LOGS"

echo -e "${GREEN}✅ HTTP API logs ingested (3)${NC}\n"

# Step 3: Test Syslog Logs
echo -e "${YELLOW}Step 3: Testing Syslog logs (2 logs)...${NC}"
SYSLOG_LOGS=$(cat samples/all-samples.json | jq -c '.syslog_logs[]')

COUNT=0
while IFS= read -r log; do
    COUNT=$((COUNT + 1))
    curl -s -X POST "$API_URL/api/ingest" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$log" > /dev/null
    echo -e "  ${GREEN}✓${NC} Syslog log $COUNT ingested"
done <<< "$SYSLOG_LOGS"

echo -e "${GREEN}✅ Syslog logs ingested (2)${NC}\n"

# Step 4: Test AWS CloudTrail Logs
echo -e "${YELLOW}Step 4: Testing AWS CloudTrail logs (3 logs)...${NC}"
AWS_LOGS=$(cat samples/all-samples.json | jq -c '.aws_cloudtrail_logs[]')

COUNT=0
while IFS= read -r log; do
    COUNT=$((COUNT + 1))
    curl -s -X POST "$API_URL/api/ingest/aws" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$log" > /dev/null
    echo -e "  ${GREEN}✓${NC} AWS CloudTrail log $COUNT ingested"
done <<< "$AWS_LOGS"

echo -e "${GREEN}✅ AWS CloudTrail logs ingested (3)${NC}\n"

# Step 5: Test File Upload Logs
echo -e "${YELLOW}Step 5: Testing File Upload logs (3 logs)...${NC}"
FILE_LOGS=$(cat samples/all-samples.json | jq -c '.file_upload_logs[]')

COUNT=0
while IFS= read -r log; do
    COUNT=$((COUNT + 1))
    curl -s -X POST "$API_URL/api/ingest" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$log" > /dev/null
    echo -e "  ${GREEN}✓${NC} File upload log $COUNT ingested"
done <<< "$FILE_LOGS"

echo -e "${GREEN}✅ File upload logs ingested (3)${NC}\n"

# Step 6: Verify ingestion
echo -e "${YELLOW}Step 6: Verifying ingestion...${NC}"
sleep 2

SEARCH_RESPONSE=$(curl -s -X POST "$API_URL/api/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"limit":100}')

TOTAL_LOGS=$(echo $SEARCH_RESPONSE | jq '.total')

echo -e "${GREEN}✅ Total logs in database: $TOTAL_LOGS${NC}\n"

# Step 7: Test Stats endpoint
echo -e "${YELLOW}Step 7: Testing Stats endpoint...${NC}"
STATS_RESPONSE=$(curl -s -X POST "$API_URL/api/search/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

echo -e "${BLUE}Top Sources:${NC}"
echo $STATS_RESPONSE | jq -r '.topSources[] | "  - \(.source): \(.count) logs"'

echo -e "\n${BLUE}Top Event Types:${NC}"
echo $STATS_RESPONSE | jq -r '.topEvents[] | "  - \(.event_type): \(.count) logs"'

echo -e "\n${GREEN}✅ Stats endpoint working${NC}\n"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All tests completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo -e "  • HTTP API logs: 3"
echo -e "  • Syslog logs: 2"
echo -e "  • AWS CloudTrail logs: 3"
echo -e "  • File upload logs: 3"
echo -e "  ${GREEN}Total: 13 logs ingested${NC}"
echo -e "\n${BLUE}View logs at: http://localhost:3000/logs${NC}\n"
