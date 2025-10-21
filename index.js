require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const supabase = require('./config/supabaseClient');

// Import routes
const authRoutes = require('./routes/auth');
const personasRoutes = require('./routes/personas');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection (optional - using Supabase as primary DB)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error);
    });
} else {
  console.log('📋 MongoDB URI not provided - using Supabase as primary database');
}

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api', authRoutes);
app.use('/api/personas', personasRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to GiftMind Backend API',
    status: 'Server is running successfully',
    endpoints: {
      health: '/health',
      supabaseTest: '/supabase-test',
      register: 'POST /api/register',
      login: 'POST /api/login',
      logout: 'POST /api/logout',
      user: 'GET /api/user',
      personas: {
        list: 'GET /api/personas',
        create: 'POST /api/personas',
        get: 'GET /api/personas/:id',
        update: 'PUT /api/personas/:id',
        delete: 'DELETE /api/personas/:id'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'OK',
    database: dbStatus,
    supabase: 'Connected',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Supabase test endpoint
app.get('/supabase-test', async (req, res) => {
  try {
    // Test Supabase connection by checking the URL
    const { data, error } = await supabase.from('test').select('*').limit(1);
    
    res.json({
      message: 'Supabase client is working',
      status: 'success',
      supabaseUrl: process.env.SUPABASE_URL,
      hasError: !!error,
      error: error?.message || null
    });
  } catch (err) {
    res.status(500).json({
      message: 'Supabase connection error',
      status: 'error',
      error: err.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
});

module.exports = app;
