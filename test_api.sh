#!/bin/bash

# GiftMind API Automated Testing Script
# Bu script tüm endpoint'leri otomatik test eder

BASE_URL="http://localhost:3001"
EMAIL="testuser$(date +%s)@gmail.com"  # Unique email
PASSWORD="password123"
TOKEN=""
PERSONA_ID=""

echo "🚀 Starting GiftMind API Tests..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Test Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
curl -s $BASE_URL/health > /dev/null
print_result $? "Health Check"

# 2. Test User Registration
echo -e "${YELLOW}2. Testing User Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\"
  }")

echo "Registration Response: $REGISTER_RESPONSE"
print_result $? "User Registration"

# 3. Test User Login
echo -e "${YELLOW}3. Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from response (if successful)
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}🔑 Token obtained: ${TOKEN:0:50}...${NC}"
    print_result 0 "User Login"
else
    echo -e "${RED}❌ Failed to get token. Login unsuccessful.${NC}"
    echo "Note: You may need to confirm email first or disable email confirmation in Supabase"
    exit 1
fi

# 4. Test Get User Profile
echo -e "${YELLOW}4. Testing Get User Profile...${NC}"
USER_RESPONSE=$(curl -s -X GET $BASE_URL/api/user \
  -H "Authorization: Bearer $TOKEN")
echo "User Profile: $USER_RESPONSE"
print_result $? "Get User Profile"

# 5. Test Create Persona
echo -e "${YELLOW}5. Testing Create Persona...${NC}"
CREATE_PERSONA_RESPONSE=$(curl -s -X POST $BASE_URL/api/personas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Doe Test",
    "birth_date": "1990-05-15",
    "interests": ["reading", "cooking", "technology"],
    "notes": ["Loves sci-fi books", "Professional chef", "Tech enthusiast"]
  }')

echo "Create Persona Response: $CREATE_PERSONA_RESPONSE"

# Extract persona ID
if echo "$CREATE_PERSONA_RESPONSE" | grep -q '"id"'; then
    PERSONA_ID=$(echo $CREATE_PERSONA_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}👤 Persona created with ID: $PERSONA_ID${NC}"
    print_result 0 "Create Persona"
else
    print_result 1 "Create Persona"
fi

# 6. Test Get All Personas
echo -e "${YELLOW}6. Testing Get All Personas...${NC}"
GET_PERSONAS_RESPONSE=$(curl -s -X GET $BASE_URL/api/personas \
  -H "Authorization: Bearer $TOKEN")
echo "Get Personas Response: $GET_PERSONAS_RESPONSE"
print_result $? "Get All Personas"

# 7. Test Gift Recommendation (if persona was created)
if [ ! -z "$PERSONA_ID" ]; then
    echo -e "${YELLOW}7. Testing Gift Recommendation...${NC}"
    GIFT_RESPONSE=$(curl -s -X POST $BASE_URL/api/gift/recommend \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"personaId\": \"$PERSONA_ID\"
      }")
    echo "Gift Recommendation Response: $GIFT_RESPONSE"
    print_result $? "Gift Recommendation"
else
    echo -e "${YELLOW}7. Skipping Gift Recommendation (no persona ID)${NC}"
fi

# 8. Test Gift Categories
echo -e "${YELLOW}8. Testing Gift Categories...${NC}"
CATEGORIES_RESPONSE=$(curl -s -X GET $BASE_URL/api/gift/categories \
  -H "Authorization: Bearer $TOKEN")
echo "Gift Categories Response: $CATEGORIES_RESPONSE"
print_result $? "Gift Categories"

# 9. Test User Stats
echo -e "${YELLOW}9. Testing User Stats...${NC}"
STATS_RESPONSE=$(curl -s -X GET $BASE_URL/api/gift/stats \
  -H "Authorization: Bearer $TOKEN")
echo "User Stats Response: $STATS_RESPONSE"
print_result $? "User Stats"

echo ""
echo "================================"
echo -e "${GREEN}🎉 Testing completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Your credentials for manual testing:${NC}"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo "Token: $TOKEN"
echo ""
echo -e "${YELLOW}📋 Use these for manual Postman testing:${NC}"
echo "Base URL: $BASE_URL"
echo "Bearer Token: $TOKEN"
if [ ! -z "$PERSONA_ID" ]; then
    echo "Persona ID: $PERSONA_ID"
fi
