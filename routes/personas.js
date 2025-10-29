const express = require('express');
const supabase = require('../config/supabaseClient');
const router = express.Router();
const { parseBudgetFromBody, applyBudgetToData, normalizeBudgetFields } = require('../utils/personaBudget');
const { createClient } = require('@supabase/supabase-js');

// Helper to coerce array-like fields
function toArray(val) {
  if (Array.isArray(val)) return val.filter(v => v !== undefined && v !== null);
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Get user from Supabase using the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Create a per-request Supabase client bound to the user's JWT so RLS policies evaluate auth.uid()
    req.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/personas - Get all personas for authenticated user
router.get('/', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('personas')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get personas error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const personas = (data || []).map(p => normalizeBudgetFields(p));

    res.status(200).json({
      success: true,
      personas
    });

  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/personas - Create new persona
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { name, birth_date, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const { min, max } = parseBudgetFromBody(req.body);
    if (process.env.DEBUG_BUDGET === '1') {
      console.log('[budget] raw body:', req.body);
      console.log('[budget] parsed -> min:', min, 'max:', max);
    }

    // Prepare persona data
    let personaData = {
      user_id: req.user.id,
      name,
      birth_date: birth_date || null,
      interests: toArray(req.body.interests),
      notes: toArray(req.body.notes),
      description: description ?? null
    };

    personaData = await applyBudgetToData(personaData, min, max);

    const { data, error } = await req.supabase
      .from('personas')
      .insert([personaData])
      .select()
      .single();

    if (error) {
      console.error('Create persona error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Persona created successfully',
      persona: normalizeBudgetFields(data)
    });

  } catch (error) {
    console.error('Create persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/personas/:id - Get specific persona
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      console.error('Get persona error:', error);
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    res.status(200).json({
      success: true,
      persona: normalizeBudgetFields(data)
    });

  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/personas/:id - Update persona
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, birth_date, description } = req.body;

    // Prepare update data (only include provided fields)
    let updateData = {};
    if (name !== undefined) updateData.name = name;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (req.body.interests !== undefined) updateData.interests = toArray(req.body.interests);
    if (req.body.notes !== undefined) updateData.notes = toArray(req.body.notes);
    if (description !== undefined) updateData.description = description;

    const { min, max } = parseBudgetFromBody(req.body);
    if (process.env.DEBUG_BUDGET === '1') {
      console.log('[budget][update]', 'min:', min, 'max:', max);
    }
    updateData = await applyBudgetToData(updateData, min, max);

    const { data, error } = await req.supabase
      .from('personas')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update persona error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Persona updated successfully',
      persona: normalizeBudgetFields(data)
    });

  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/personas/:id - Delete persona
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('personas')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Delete persona error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Persona deleted successfully'
    });

  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
