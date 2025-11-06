const express = require("express");
const supabase = require("../config/supabaseClient");
const router = express.Router();

// POST /api/register - Register new user using Supabase Auth
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || "",
          last_name: lastName || "",
          full_name: `${firstName || ""} ${lastName || ""}`.trim(),
        },
      },
    });

    if (error) {
      console.error("Registration error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Check if user needs email confirmation
    if (data.user && !data.session) {
      return res.status(200).json({
        success: true,
        message:
          "Registration successful! Please check your email to confirm your account.",
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at ? true : false,
        },
        requiresEmailConfirmation: true,
      });
    }

    // User registered and logged in
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name || "",
        lastName: data.user.user_metadata?.last_name || "",
        fullName: data.user.user_metadata?.full_name || "",
        emailConfirmed: data.user.email_confirmed_at ? true : false,
      },
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

// POST /api/login - Login using Supabase Auth
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Check if user exists and session is created
    if (!data.user || !data.session) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Return user data and access token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: data.session.access_token, // Add token field for compatibility
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name || "",
        lastName: data.user.user_metadata?.last_name || "",
        fullName: data.user.user_metadata?.full_name || "",
        emailConfirmed: data.user.email_confirmed_at ? true : false,
        lastSignIn: data.user.last_sign_in_at,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// POST /api/oauth - OAuth login with provider (Google, GitHub, etc.)
router.post("/oauth", async (req, res) => {
  try {
    const { provider, redirectTo } = req.body;

    // Validate provider
    const supportedProviders = [
      "google",
      "github",
      "discord",
      "facebook",
      "twitter",
    ];
    if (!provider || !supportedProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Provider must be one of: ${supportedProviders.join(", ")}`,
      });
    }

    // Generate OAuth URL with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider.toLowerCase(),
      options: {
        redirectTo:
          redirectTo ||
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Return OAuth URL for frontend to redirect to
    res.status(200).json({
      success: true,
      message: "OAuth URL generated successfully",
      url: data.url,
      provider: provider.toLowerCase(),
    });
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during OAuth",
    });
  }
});

// POST /api/oauth/callback - Handle OAuth callback
router.post("/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data.user || !data.session) {
      return res.status(400).json({
        success: false,
        message: "Failed to create session",
      });
    }

    // Return user data and session
    res.status(200).json({
      success: true,
      message: "OAuth login successful",
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName:
          data.user.user_metadata?.first_name ||
          data.user.user_metadata?.given_name ||
          "",
        lastName:
          data.user.user_metadata?.last_name ||
          data.user.user_metadata?.family_name ||
          "",
        fullName:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "",
        avatar:
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          "",
        provider: data.user.app_metadata?.provider || "oauth",
        emailConfirmed: true, // OAuth users are typically pre-verified
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type,
      },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during OAuth callback",
    });
  }
});

// POST /api/logout - Logout user (optional)
router.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
});

// GET /api/user - Get current user (requires authentication)
router.get("/user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Get user from Supabase using the token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
        fullName: user.user_metadata?.full_name || "",
        emailConfirmed: user.email_confirmed_at ? true : false,
        lastSignIn: user.last_sign_in_at,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/password/forgot - Request password reset (generic response to avoid user enumeration)
router.post("/password/forgot", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Try to trigger Supabase password reset email if available, but do not expose details to the client
    try {
      // v2 client: supabase.auth.resetPasswordForEmail
      if (typeof supabase.auth?.resetPasswordForEmail === "function") {
        await supabase.auth.resetPasswordForEmail(email, {
          // optional redirect after password reset (configure via env if needed)
          redirectTo: process.env.PASSWORD_RESET_REDIRECT || undefined,
        });
      } else if (
        typeof supabase.auth?.api?.resetPasswordForEmail === "function"
      ) {
        // older client variation
        await supabase.auth.api.resetPasswordForEmail(email);
      } else {
        console.warn(
          "Supabase resetPasswordForEmail not available on auth client."
        );
      }
    } catch (providerError) {
      // Log provider errors server-side but do not return error details to client
      console.error("Password reset provider error:", providerError);
    }

    // Always return a generic success message to avoid revealing whether the email is registered
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
