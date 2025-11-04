const express = require("express");
const router = express.Router();

// Basic avatar upload without multer - accepts base64 directly
router.post("/:id/avatar-basic", async (req, res) => {
  try {
    console.log("🖼️ Basic avatar upload:", {
      personaId: req.params.id,
      hasBody: !!req.body,
      bodyKeys: Object.keys(req.body || {}),
      userId: req.user?.id,
    });

    const { id: personaId } = req.params;
    const { avatar_data } = req.body;

    if (!avatar_data) {
      return res.status(400).json({
        success: false,
        message: "avatar_data is required (base64 string)",
      });
    }

    // Validate base64 format
    if (!avatar_data.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar format. Must be base64 data URL.",
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
      console.log("❌ Persona not found:", personaError?.message);
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    // Update persona with avatar_url
    const { data, error } = await req.supabase
      .from("personas")
      .update({ avatar_url: avatar_data })
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Avatar update error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.log("✅ Avatar updated successfully");
    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar_url: avatar_data,
      persona: data,
    });
  } catch (error) {
    console.error("❌ Basic avatar upload error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// GET avatar
router.get("/:id/avatar-basic", async (req, res) => {
  try {
    const { id: personaId } = req.params;

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
    console.error("❌ Get basic avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
