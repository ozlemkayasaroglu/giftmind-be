const express = require('express');
const supabase = require('../config/supabaseClient');
const { generateGiftIdeas, getGiftCategories } = require('../services/aiGiftRecommender');
const router = express.Router();

// Middleware to verify authentication and extract user
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

// POST /api/persona - Insert persona into personas table
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { name, birth_date, interests, notes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Prepare persona data
    const personaData = {
      user_id: req.user.id,
      name,
      birth_date: birth_date || null,
      interests: interests || [],
      notes: notes || []
    };

    const { data, error } = await supabase
      .from('personas')
      .insert([personaData])
      .select()
      .single();

    if (error) {
      console.error('Insert persona error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Persona created successfully',
      persona: data
    });

  } catch (error) {
    console.error('Create persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/persona - List all personas for the logged-in user
router.get('/', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
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

    res.status(200).json({
      success: true,
      personas: data || [],
      count: data ? data.length : 0
    });

  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/persona/:id - Get one persona
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid persona ID format'
      });
    }

    const { data, error } = await supabase
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
      persona: data
    });

  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/persona/:id - Update persona
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, birth_date, interests, notes } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid persona ID format'
      });
    }

    // Prepare update data (only include provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (interests !== undefined) updateData.interests = interests;
    if (notes !== undefined) updateData.notes = notes;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const { data, error } = await supabase
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
        message: 'Persona not found or you do not have permission to update it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Persona updated successfully',
      persona: data
    });

  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/persona/:id - Delete persona
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid persona ID format'
      });
    }

    // First check if the persona exists and belongs to the user
    const { data: existingPersona, error: fetchError } = await supabase
      .from('personas')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingPersona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found or you do not have permission to delete it'
      });
    }

    // Delete the persona
    const { error } = await supabase
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

// POST /api/persona/:id/gift-ideas - Generate gift ideas for specific persona
router.post('/:id/gift-ideas', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid persona ID format'
      });
    }

    // Get persona from database
    const { data: persona, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Generate gift ideas using AI service
    const giftRecommendations = generateGiftIdeas(persona);

    if (!giftRecommendations.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate gift ideas',
        error: giftRecommendations.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Gift ideas generated successfully',
      persona: {
        id: persona.id,
        name: persona.name,
        age: giftRecommendations.age,
        ageCategory: giftRecommendations.ageCategory
      },
      giftIdeas: giftRecommendations.recommendations,
      metadata: {
        totalOptions: giftRecommendations.totalOptions,
        generatedAt: giftRecommendations.generatedAt
      }
    });

  } catch (error) {
    console.error('Generate gift ideas error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/persona/gift-categories - Get available gift categories
router.get('/gift-categories', (req, res) => {
  try {
    const categories = getGiftCategories();
    
    res.status(200).json({
      success: true,
      categories: categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Get gift categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
