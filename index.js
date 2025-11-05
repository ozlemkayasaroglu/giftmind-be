require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const supabase = require("./config/supabaseClient");
const { createClient } = require("@supabase/supabase-js");

// Import routes
const authRoutes = require("./routes/auth");
const personasRoutes = require("./routes/personas");
const personaRoutes = require("./routes/persona");
const giftRoutes = require("./routes/gift");
const personalityTraitsRoutes = require("./routes/personality-traits");
// const milestonesRoutes = require("./routes/milestones"); // Removed - file deleted
// const eventsRoutes = require("./routes/events-temp"); // Removed - events system disabled

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection (optional - using Supabase as primary DB)
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas");
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", error);
    });
} else {
  console.log(
    "📋 MongoDB URI not provided - using Supabase as primary database"
  );
}

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Shared auth middleware to bind per-request Supabase client (RLS)
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No authorization token provided" });
    }
    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: { headers: { Authorization: `Bearer ${token}` } },
        db: { schema: "private" },
      }
    );
    req.user = user;
    next();
  } catch (e) {
    console.error("Auth middleware error:", e);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Routes
app.use("/api", authRoutes);
app.use("/api/personas", verifyAuth, personasRoutes);
app.use("/api/persona", verifyAuth, personaRoutes);
// Events system disabled - removed all event routes
app.use("/api/gift", verifyAuth, giftRoutes);
app.use("/api/personality-traits", personalityTraitsRoutes); // No auth required for traits

// Test endpoint without auth (temporary)
app.post("/api/test-gift-ideas", async (req, res) => {
  try {
    const { generateGiftIdeas } = require("./services/aiGiftRecommender");

    // Test persona data
    const testPersona = {
      id: "test-id",
      name: "Test Persona",
      birth_date: "1990-05-15",
      interests: ["teknoloji", "kahve", "kitap"],
      personality_traits: ["analitik", "yaratıcı"],
      role: "Yazılım Geliştirici",
      goals: "Teknik becerilerini geliştirmek",
      challenges: "İş-yaşam dengesi",
      budget_min: 100,
      budget_max: 500,
      behavioral_insights: "Kaliteli ürünleri tercih eder",
    };

    console.log("🧪 Testing gift ideas generation...");

    const giftRecommendations = await generateGiftIdeas(testPersona);

    if (!giftRecommendations.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate gift ideas",
        error: giftRecommendations.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Test gift ideas generated successfully",
      persona: {
        id: testPersona.id,
        name: testPersona.name,
        age: giftRecommendations.age,
        ageCategory: giftRecommendations.ageCategory,
      },
      giftIdeas: giftRecommendations.recommendations,
      metadata: {
        totalOptions: giftRecommendations.totalOptions,
        generatedAt: giftRecommendations.generatedAt,
        aiGenerated: giftRecommendations.aiGenerated,
      },
    });
  } catch (error) {
    console.error("Test gift ideas error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
// app.use("/api", verifyAuth, milestonesRoutes); // Removed - file deleted
// Events system completely removed

// Basic route for testing (must be before 404 handler)
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to GiftMind Backend API",
    status: "Server is running successfully",
    endpoints: {
      health: "/health",
      supabaseTest: "/supabase-test",
      register: "POST /api/register",
      login: "POST /api/login",
      logout: "POST /api/logout",
      user: "GET /api/user",
      personas: {
        list: "GET /api/personas",
        create: "POST /api/personas",
        get: "GET /api/personas/:id",
        update: "PUT /api/personas/:id",
        delete: "DELETE /api/personas/:id",
      },
      persona: {
        list: "GET /api/persona",
        create: "POST /api/persona",
        get: "GET /api/persona/:id",
        update: "PUT /api/persona/:id",
        delete: "DELETE /api/persona/:id",
        giftIdeas: "POST /api/persona/:id/gift-ideas",
        giftCategories: "GET /api/persona/gift-categories",
      },
      gift: {
        recommend: "POST /api/gift/recommend",
        batchRecommend: "POST /api/gift/batch-recommend",
        categories: "GET /api/gift/categories",
        stats: "GET /api/gift/stats",
      },
    },
  });
});

// Health check endpoint (must be before 404 handler)
app.get("/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({
    status: "OK",
    database: dbStatus,
    supabase: "Connected",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Environment check endpoint for Railway debugging
app.get("/env-check", (req, res) => {
  res.json({
    message: "Environment variables check",
    status: "success",
    env: {
      NODE_ENV: process.env.NODE_ENV || "not set",
      PORT: process.env.PORT || "not set",
      SUPABASE_URL: process.env.SUPABASE_URL ? "✅ set" : "❌ missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
        ? "✅ set"
        : "❌ missing",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✅ set" : "❌ missing",
      GEMINI_MODEL: process.env.GEMINI_MODEL || "not set",
    },
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  });
});

// Supabase test endpoint (must be before 404 handler)
app.get("/supabase-test", async (req, res) => {
  try {
    // Test Supabase connection by checking the URL
    const { data, error } = await supabase.from("test").select("*").limit(1);
    res.json({
      message: "Supabase client is working",
      status: "success",
      supabaseUrl: process.env.SUPABASE_URL,
      hasError: !!error,
      error: error?.message || null,
    });
  } catch (err) {
    res.status(500).json({
      message: "Supabase connection error",
      status: "error",
      error: err.message,
    });
  }
});

// JSON 404 fallback (avoid HTML error pages in prod)
app.use((req, res, next) => {
  res
    .status(404)
    .json({ success: false, message: "Not Found", path: req.originalUrl });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📦 Node.js version: ${process.version}`);
});

// Handle server startup errors
server.on("error", (error) => {
  console.error("❌ Server startup error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

module.exports = app;
