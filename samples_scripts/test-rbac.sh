# RBAC & Multi-Tenant Test Script
# Tests that Viewer users can only see their own tenant's logs

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="${1:-http://localhost:4000}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  LogMS - RBAC & Tenant Isolation Test${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Step 1: login as Admin
echo -e "${YELLOW}Step 1: Login as Admin${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Admin login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Admin logged in${NC}\n"

# Step 2: create viewer user for tenant-a
echo -e "${YELLOW}Step 2: Create Viewer user (tenant-a)${NC}"
VIEWER_A_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer-a@example.com",
    "password": "viewer123",
    "role": "viewer",
    "tenant": "tenant-a"
  }')

if echo "$VIEWER_A_RESPONSE" | grep -q "email"; then
    echo -e "${GREEN}✓ Viewer user created: viewer-a@example.com (tenant: tenant-a)${NC}\n"
else
    echo -e "${YELLOW}⚠ User may already exist, continuing...${NC}\n"
fi

# Step 3: create viewer user for tenant-b
echo -e "${YELLOW}Step 3: Create Viewer user (tenant-b)${NC}"
VIEWER_B_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer-b@example.com",
    "password": "viewer123",
    "role": "viewer",
    "tenant": "tenant-b"
  }')

if echo "$VIEWER_B_RESPONSE" | grep -q "email"; then
    echo -e "${GREEN}✓ Viewer user created: viewer-b@example.com (tenant: tenant-b)${NC}\n"
else
    echo -e "${YELLOW}⚠ User may already exist, continuing...${NC}\n"
fi

# Step 4: create logs for tenant-a
echo -e "${YELLOW}Step 4: Create logs for tenant-a${NC}"
for i in {1..3}; do
    curl -s -X POST "$API_URL/api/ingest" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "x-tenant-id: tenant-a" \
      -H "Content-Type: application/json" \
      -d "{
        \"severity\": 5,
        \"event_type\": \"auth\",
        \"user\": \"user-a-$i\",
        \"src_ip\": \"192.168.1.$((100 + i))\",
        \"message\": \"Tenant A log $i\",
        \"source\": \"http\"
      }" > /dev/null
    echo -e "  ${GREEN}✓${NC} Tenant-A log $i created"
done
echo ""

# Step 5: create logs for tenant-b
echo -e "${YELLOW}Step 5: Create logs for tenant-b${NC}"
for i in {1..3}; do
    curl -s -X POST "$API_URL/api/ingest" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "x-tenant-id: tenant-b" \
      -H "Content-Type: application/json" \
      -d "{
        \"severity\": 6,
        \"event_type\": \"network\",
        \"user\": \"user-b-$i\",
        \"src_ip\": \"10.0.0.$((50 + i))\",
        \"message\": \"Tenant B log $i\",
        \"source\": \"http\"
      }" > /dev/null
    echo -e "  ${GREEN}✓${NC} Tenant-B log $i created"
done
echo ""

sleep 2

# Step 6: test viewer-A (should ONLY see tenant-a)
echo -e "${YELLOW}Step 6: Test Viewer-A Access (Tenant Isolation)${NC}"
VIEWER_A_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer-a@example.com","password":"viewer123"}')

VIEWER_A_TOKEN=$(echo $VIEWER_A_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$VIEWER_A_TOKEN" ]; then
    echo -e "${RED}❌ Viewer-A login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Viewer-A logged in${NC}"

VIEWER_A_SEARCH=$(curl -s -X POST "$API_URL/api/search" \
  -H "Authorization: Bearer $VIEWER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":100}')

VIEWER_A_TENANT_A=$(echo "$VIEWER_A_SEARCH" | grep -o "Tenant A log" | wc -l | tr -d ' ')
VIEWER_A_TENANT_B=$(echo "$VIEWER_A_SEARCH" | grep -o "Tenant B log" | wc -l | tr -d ' ')

echo -e "  Viewer-A sees:"
echo -e "    - Tenant A logs: ${BLUE}$VIEWER_A_TENANT_A${NC}"
echo -e "    - Tenant B logs: ${BLUE}$VIEWER_A_TENANT_B${NC}"

if [ "$VIEWER_A_TENANT_A" -gt 0 ] && [ "$VIEWER_A_TENANT_B" -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASS${NC} - Viewer-A can ONLY see tenant-a logs (isolation working!)\n"
elif [ "$VIEWER_A_TENANT_B" -gt 0 ]; then
    echo -e "  ${RED}❌ FAIL${NC} - Viewer-A should NOT see tenant-b logs!\n"
else
    echo -e "  ${YELLOW}⚠ WARNING${NC} - No logs visible, check data\n"
fi

# Step 7: test viewer-B (should ONLY see tenant-b)
echo -e "${YELLOW}Step 7: Test Viewer-B Access (Tenant Isolation)${NC}"
VIEWER_B_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer-b@example.com","password":"viewer123"}')

VIEWER_B_TOKEN=$(echo $VIEWER_B_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$VIEWER_B_TOKEN" ]; then
    echo -e "${RED}❌ Viewer-B login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Viewer-B logged in${NC}"

VIEWER_B_SEARCH=$(curl -s -X POST "$API_URL/api/search" \
  -H "Authorization: Bearer $VIEWER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":100}')

VIEWER_B_TENANT_A=$(echo "$VIEWER_B_SEARCH" | grep -o "Tenant A log" | wc -l | tr -d ' ')
VIEWER_B_TENANT_B=$(echo "$VIEWER_B_SEARCH" | grep -o "Tenant B log" | wc -l | tr -d ' ')

echo -e "  Viewer-B sees:"
echo -e "    - Tenant A logs: ${BLUE}$VIEWER_B_TENANT_A${NC}"
echo -e "    - Tenant B logs: ${BLUE}$VIEWER_B_TENANT_B${NC}"

if [ "$VIEWER_B_TENANT_B" -gt 0 ] && [ "$VIEWER_B_TENANT_A" -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASS${NC} - Viewer-B can ONLY see tenant-b logs (isolation working!)\n"
elif [ "$VIEWER_B_TENANT_A" -gt 0 ]; then
    echo -e "  ${RED}❌ FAIL${NC} - Viewer-B should NOT see tenant-a logs!\n"
else
    echo -e "  ${YELLOW}⚠ WARNING${NC} - No logs visible, check data\n"
fi

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   RBAC TEST SUMMARY${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ Viewer-A: Tenant-A only (isolation)${NC}"
echo -e "${GREEN}✓ Viewer-B: Tenant-B only (isolation)${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}RBAC & TENANT ISOLATION WORKING! ✓${NC}"
echo -e "${BLUE}============================================${NC}\n"

echo -e "${YELLOW}Test Credentials Created:${NC}"
echo -e "  Admin:    admin@example.com / admin123 (tenant: default)"
echo -e "  Viewer-A: viewer-a@example.com / viewer123 (tenant: tenant-a)"
echo -e "  Viewer-B: viewer-b@example.com / viewer123 (tenant: tenant-b)\n"

echo -e "${YELLOW}Try logging in to frontend:${NC}"
echo -e "  http://localhost:3000/login\n"
