const express = require("express");
const router = express.Router();

// Temporary events routes - return empty responses until table migration

// GET /api/personas/:personaId/events - Get events for a persona
router.get("/:personaId/events", async (req, res) => {
  try {
    const { personaId } = req.params;

    // Verify persona exists (using public schema)
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

    // Return empty events array
    console.log(
      `📝 Events requested for persona ${personaId} - returning empty array`
    );

    res.status(200).json({
      success: true,
      data: [], // Empty until events table is migrated
      message: "Events feature temporarily unavailable",
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/personas/:personaId/events - Create new event (disabled)
router.post("/:personaId/events", async (req, res) => {
  try {
    const { personaId } = req.params;

    // Verify persona exists
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

    console.log(
      `📝 Event creation requested for persona ${personaId} - feature disabled`
    );

    res.status(501).json({
      success: false,
      message:
        "Event creation temporarily unavailable - table migration pending",
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// PUT /api/personas/events/:eventId - Update event (disabled)
router.put("/events/:eventId", async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Event update temporarily unavailable - table migration pending",
  });
});

// DELETE /api/personas/events/:eventId - Delete event (disabled)
router.delete("/events/:eventId", async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Event deletion temporarily unavailable - table migration pending",
  });
});

module.exports = router;
