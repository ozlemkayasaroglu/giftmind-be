const express = require("express");
const multer = require("multer");
const router = express.Router();

// Simple avatar upload - stores as base64 in personas table
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    console.log("📁 File filter:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      console.log("❌ Invalid file type:", file.mimetype);
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// POST /api/personas/:id/avatar-simple - Upload avatar as base64
router.post("/:id/avatar-simple", upload.single("avatar"), async (req, res) => {
  try {
    console.log("🖼️ Avatar upload request:", {
      personaId: req.params.id,
      hasFile: !!req.file,
      fileSize: req.file?.size,
      fileType: req.file?.mimetype,
      userId: req.user?.id,
    });

    const { id: personaId } = req.params;

    if (!req.file) {
      console.log("❌ No file in request");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Verify persona ownership
    const { data: persona, error: personaError } = await req.supabase
      .from("personas")
      .select("id")
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .single();

    if (personaError || !persona) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    // Convert image to base64
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Update persona with avatar_url
    const { data, error } = await req.supabase
      .from("personas")
      .update({ avatar_url: base64Image })
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      console.error("Avatar update error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar_url: base64Image,
      persona: data,
    });
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET /api/personas/:id/avatar-simple - Get avatar
router.get("/:id/avatar-simple", async (req, res) => {
  try {
    const { id: personaId } = req.params;

    // Get persona with avatar
    const { data: persona, error } = await req.supabase
      .from("personas")
      .select("id, name, avatar_url")
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .single();

    if (error || !persona) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    res.status(200).json({
      success: true,
      avatar_url: persona.avatar_url,
      persona: persona,
    });
  } catch (error) {
    console.error("Get avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// DELETE /api/personas/:id/avatar-simple - Remove avatar
router.delete("/:id/avatar-simple", async (req, res) => {
  try {
    const { id: personaId } = req.params;

    // Remove avatar from persona
    const { data, error } = await req.supabase
      .from("personas")
      .update({ avatar_url: null })
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Avatar removed successfully",
      persona: data,
    });
  } catch (error) {
    console.error("Remove avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
