# GiftMind Backend

Backend API for the GiftMind application built with Node.js and Express.

## Features

- Express.js server with CORS enabled
- Supabase integration for authentication and database
- MongoDB Atlas support (optional)
- AI-powered gift recommendations using Hugging Face
- Persona management with CRUD operations
- JWT authentication with Row Level Security (RLS)
- Environment variable configuration
- Comprehensive error handling

## Prerequisites

- Node.js (v14 or higher)
- Supabase account for database and authentication
- Hugging Face account for AI recommendations (optional, fallback available)
- MongoDB Atlas account (optional, for additional data storage)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ozlemkayasaroglu/giftmind-be.git
   cd giftmind-be
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Set your Supabase project URL and anon key
   - Add your Hugging Face token for AI recommendations (optional)
   - Set your MongoDB Atlas connection string (optional)
   - Adjust the port if needed
   
   **⚠️ SECURITY WARNING:** Never commit your `.env` file or expose your actual credentials in any public repository!

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### General
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user profile

### Personas Management
- `GET /api/personas` - Get user's personas
- `POST /api/personas` - Create new persona
- `GET /api/personas/:id` - Get specific persona
- `PUT /api/personas/:id` - Update persona
- `DELETE /api/personas/:id` - Delete persona

### Gift Recommendations (AI-Powered)
- `POST /api/gift/recommend` - Get personalized gift recommendations for a persona
- `POST /api/gift/batch-recommend` - Get recommendations for multiple personas
- `GET /api/gift/categories` - Get available gift categories
- `GET /api/gift/stats` - Get user's recommendation statistics

## Environment Variables

- `PORT` - Server port (default: 5000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `HUGGING_FACE_TOKEN` - Hugging Face API token (optional, fallback available)
- `MONGODB_URI` - MongoDB Atlas connection string (optional)
- `NODE_ENV` - Environment (development/production)

## Hugging Face Integration

The application uses Hugging Face's AI models to generate personalized gift recommendations. 

### Setup
1. Create a free account at [Hugging Face](https://huggingface.co)
2. Go to Settings → Access Tokens
3. Create a new token with read permissions
4. Add the token to your `.env` file as `HUGGING_FACE_TOKEN`

### Fallback
If no Hugging Face token is provided, the system automatically falls back to a comprehensive mock recommendation engine with:
- Interest-based matching
- Age-appropriate suggestions
- Contextual reasoning
- Multiple gift categories

## Project Structure

```
giftmind-be/
├── config/
│   └── supabaseClient.js    # Supabase configuration
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── personas.js          # Persona CRUD operations
│   ├── persona.js           # Additional persona endpoints
│   └── gift.js              # AI gift recommendation endpoints
├── services/
│   └── aiGiftRecommender.js # Hugging Face AI integration
├── sql/
│   └── create_personas_table.sql # Database schema
├── index.js                 # Main server file
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not in repo)
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

## Database Setup

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL script in `sql/create_personas_table.sql` in the SQL Editor
3. This will create the personas table with proper RLS policies

### Authentication
The application uses Supabase Auth with JWT tokens. Users can register, login, and access protected endpoints using Bearer tokens.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
