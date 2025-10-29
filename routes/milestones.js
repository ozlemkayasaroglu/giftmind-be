const express = require('express');
const router = express.Router();

// All endpoints here expect req.supabase and req.user to be set by verifyAuth in index.js

// List milestones for a persona
router.get('/personas/:id/milestones', async (req, res) => {
  try {
    const personaId = req.params.id;
    const { data, error } = await req.supabase
      .from('persona_milestones')
      .select('*')
      .eq('persona_id', personaId)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, milestones: data || [] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
  }
});

// Create milestone for a persona
router.post('/personas/:id/milestones', async (req, res) => {
  try {
    const personaId = req.params.id;
    const { title, details, category, tags, occurred_at } = req.body || {};
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    const row = {
      user_id: req.user.id,
      persona_id: personaId,
      title,
      details: details ?? null,
      category: category ?? null,
      tags: Array.isArray(tags)
        ? tags
        : (typeof tags === 'string' ? tags.split(',').map(s => s.trim()).filter(Boolean) : []),
      occurred_at: occurred_at || null
    };

    const { data, error } = await req.supabase
      .from('persona_milestones')
      .insert([row])
      .select('*')
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, milestone: data });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to create milestone' });
  }
});

// Update milestone
router.put('/milestones/:mid', async (req, res) => {
  try {
    const mid = req.params.mid;
    const patch = { ...req.body };
    delete patch.user_id;
    delete patch.persona_id;

    if (Array.isArray(patch.tags) === false && typeof patch.tags === 'string') {
      patch.tags = patch.tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    const { data, error } = await req.supabase
      .from('persona_milestones')
      .update(patch)
      .eq('id', mid)
      .select('*')
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, milestone: data });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update milestone' });
  }
});

// Delete milestone
router.delete('/milestones/:mid', async (req, res) => {
  try {
    const mid = req.params.mid;
    const { error } = await req.supabase
      .from('persona_milestones')
      .delete()
      .eq('id', mid);

    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to delete milestone' });
  }
});

module.exports = router;
