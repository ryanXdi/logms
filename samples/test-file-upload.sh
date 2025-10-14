#!/bin/bash

# Test File Upload Ingestion
# This script demonstrates batch log file ingestion via file upload

echo "==================================="
echo "Testing File Upload Ingestion"
echo "==================================="

# Get authentication token
echo "1. Logging in..."
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi
echo "✅ Login successful"

# Test 1: Upload JSON file
echo ""
echo "2. Uploading JSON file..."
curl -X POST http://localhost:4000/api/ingest/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "logfile=@samples/sample-logs.json"
echo ""

# Test 2: Upload JSONL file
echo ""
echo "3. Uploading JSONL file..."
curl -X POST http://localhost:4000/api/ingest/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "logfile=@samples/sample-logs.jsonl"
echo ""

# Test 3: Upload plain text file
echo ""
echo "4. Uploading plain text file..."
curl -X POST http://localhost:4000/api/ingest/file \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-source: text-file" \
  -F "logfile=@samples/sample-logs.txt"
echo ""

echo ""
echo "==================================="
echo "✅ File upload tests completed!"
echo "==================================="
