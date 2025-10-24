#!/bin/bash

# GiftMind API Test Script for Railway Deployment
API_BASE="https://giftmind-be-production.up.railway.app"

echo "🚀 Testing GiftMind API on Railway..."
echo "Base URL: $API_BASE"
echo ""

# Test Health
echo "🔍 Testing Health Check..."
curl -s $API_BASE/health | jq .
echo ""

# Test Registration
echo "🔍 Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $API_BASE/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@railway.com","password":"test123","firstName":"Railway","lastName":"Test"}')

echo $REGISTER_RESPONSE | jq .
echo ""

# Extract token for further tests
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.session.accessToken // empty')

if [ "$TOKEN" != "" ]; then
  echo "🔍 Testing with JWT Token..."
  
  # Test Get User
  echo "📋 Get User Profile..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_BASE/api/user | jq .
  echo ""
  
  # Test Gift Categories
  echo "🎁 Gift Categories..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_BASE/api/gift/categories | jq .
  echo ""
  
else
  echo "❌ No token received, skipping authenticated tests"
fi

echo "✅ Railway API Test Complete!"
