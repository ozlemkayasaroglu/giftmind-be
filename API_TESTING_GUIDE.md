# GiftMind API Testing Guide

This guide provides comprehensive instructions for testing all API endpoints using Postman or curl.

## Setup

1. **Server Setup**
   ```bash
   npm run dev  # Start in development mode
   ```
   Server runs on: `http://localhost:3001`

2. **Import Postman Collection**
   Import the `postman_collection.json` file into Postman for easy testing.

## Authentication Flow

### 1. Register User
**Endpoint:** `POST /api/register`
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to confirm your account.",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "emailConfirmed": false
  },
  "requiresEmailConfirmation": true
}
```

### 2. Email Confirmation
- Check your email and click the confirmation link
- OR disable email confirmation in Supabase dashboard for testing

### 3. Login User
**Endpoint:** `POST /api/login`
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Important:** Save the `token` value for authenticated requests.

### 4. Get User Profile
**Endpoint:** `GET /api/user`
```bash
curl -X GET http://localhost:3001/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Personas Management

### 1. Create Persona
**Endpoint:** `POST /api/personas`
```bash
curl -X POST http://localhost:3001/api/personas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "birth_date": "1990-05-15",
    "interests": ["reading", "cooking", "technology"],
    "notes": ["Loves sci-fi books", "Professional chef", "Always interested in latest gadgets"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Persona created successfully",
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "birth_date": "1990-05-15",
    "interests": ["reading", "cooking", "technology"],
    "notes": ["Loves sci-fi books", "Professional chef", "Always interested in latest gadgets"],
    "user_id": "user-uuid",
    "created_at": "timestamp"
  }
}
```

### 2. Get All Personas
**Endpoint:** `GET /api/personas`
```bash
curl -X GET http://localhost:3001/api/personas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Single Persona
**Endpoint:** `GET /api/personas/:id`
```bash
curl -X GET http://localhost:3001/api/personas/PERSONA_UUID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update Persona
**Endpoint:** `PUT /api/personas/:id`
```bash
curl -X PUT http://localhost:3001/api/personas/PERSONA_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe Updated",
    "interests": ["reading", "cooking", "technology", "gardening"],
    "notes": ["Loves sci-fi books", "Professional chef", "Started a home garden"]
  }'
```

### 5. Delete Persona
**Endpoint:** `DELETE /api/personas/:id`
```bash
curl -X DELETE http://localhost:3001/api/personas/PERSONA_UUID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Gift Recommendations (AI-Powered)

### 1. Get Gift Recommendation
**Endpoint:** `POST /api/gift/recommend`
```bash
curl -X POST http://localhost:3001/api/gift/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "personaId": "PERSONA_UUID"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "personaName": "John Doe",
  "age": 33,
  "ageCategory": "adult",
  "recommendations": [
    {
      "id": 1,
      "title": "Premium cookbook collection",
      "reason": "cooking ilgisine uygun özel seçim",
      "confidence": 85
    }
  ],
  "generatedAt": "timestamp",
  "aiGenerated": true,
  "totalOptions": 3
}
```

### 2. Get Batch Recommendations
**Endpoint:** `POST /api/gift/batch-recommend`
```bash
curl -X POST http://localhost:3001/api/gift/batch-recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "personaIds": ["PERSONA_UUID_1", "PERSONA_UUID_2"]
  }'
```

### 3. Get Gift Categories
**Endpoint:** `GET /api/gift/categories`
```bash
curl -X GET http://localhost:3001/api/gift/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get User Statistics
**Endpoint:** `GET /api/gift/stats`
```bash
curl -X GET http://localhost:3001/api/gift/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing Checklist

### ✅ Basic Endpoints
- [ ] `GET /` - Welcome message
- [ ] `GET /health` - Health check

### ✅ Authentication
- [ ] `POST /api/register` - User registration
- [ ] `POST /api/login` - User login
- [ ] `GET /api/user` - Get user profile
- [ ] `POST /api/logout` - User logout

### ✅ Personas CRUD
- [ ] `POST /api/personas` - Create persona
- [ ] `GET /api/personas` - List all personas
- [ ] `GET /api/personas/:id` - Get single persona
- [ ] `PUT /api/personas/:id` - Update persona
- [ ] `DELETE /api/personas/:id` - Delete persona

### ✅ Gift Recommendations
- [ ] `POST /api/gift/recommend` - Single recommendation
- [ ] `POST /api/gift/batch-recommend` - Batch recommendations
- [ ] `GET /api/gift/categories` - Available categories
- [ ] `GET /api/gift/stats` - User statistics

## Error Scenarios to Test

1. **Authentication Errors**
   - Missing token
   - Invalid token
   - Expired token

2. **Validation Errors**
   - Missing required fields
   - Invalid data types
   - Invalid UUID format

3. **Permission Errors**
   - Accessing other users' personas
   - Unauthorized operations

## Supabase Configuration Notes

For testing without email confirmation:
1. Go to Supabase Dashboard
2. Settings → Authentication
3. Disable "Enable email confirmations"
4. This allows immediate login after registration

## Environment Variables

Make sure these are set in `.env`:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `HUGGING_FACE_TOKEN` - Your Hugging Face API token (optional)
- `PORT` - Server port (default: 3001)

## Troubleshooting

1. **Server not starting**: Check port conflicts
2. **Database errors**: Verify Supabase credentials
3. **Auth errors**: Check if RLS policies are enabled
4. **AI errors**: Verify Hugging Face token or test fallback mode
