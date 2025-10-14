#!/bin/bash

# AWS CloudTrail Ingestion Test Script
# Tests the /api/ingest/aws endpoint with sample CloudTrail events

echo "🔐 Logging in to get JWT token..."
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Authenticated successfully"
echo ""

# Wait for backend to be fully ready
echo "⏳ Waiting 2 seconds for backend..."
sleep 2

echo "📤 Ingesting AWS CloudTrail events..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/ingest/aws \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @samples/aws-cloudtrail.json)

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract count from response
COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | sed 's/"count"://')

if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
  echo "✅ Successfully ingested $COUNT CloudTrail events"
  echo ""
  echo "📊 Event summary:"
  echo "  - ConsoleLogin (success)"
  echo "  - S3 GetObject"
  echo "  - IAM CreateUser"
  echo "  - EC2 TerminateInstances"
  echo "  - ConsoleLogin (failed)"
  echo "  - S3 DeleteBucket"
  echo ""
  echo "🔍 View logs at: http://localhost:3000/logs"
else
  echo "❌ Ingestion failed or no events processed"
  exit 1
fi
