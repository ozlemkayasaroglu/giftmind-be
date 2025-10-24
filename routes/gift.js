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

// POST /api/gift/recommend - Generate gift recommendations for a persona
router.post('/recommend', verifyAuth, async (req, res) => {
  try {
    const { personaId } = req.body;

    // Validate required fields
    if (!personaId) {
      return res.status(400).json({
        success: false,
        message: 'Persona ID is required'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(personaId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid persona ID format'
      });
    }

    // Fetch persona from Supabase
    const { data: persona, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      console.error('Fetch persona error:', error);
      return res.status(404).json({
        success: false,
        message: 'Persona not found or you do not have access to it'
      });
    }

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }

    // Generate gift ideas using AI service
    const giftRecommendations = await generateGiftIdeas(persona);

    if (!giftRecommendations.success) {
      console.error('Gift generation error:', giftRecommendations.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate gift recommendations',
        error: giftRecommendations.error
      });
    }

    // Flatten to string suggestions for simple UIs
    const suggestionTitles = (giftRecommendations.recommendations || []).map((r) => {
      if (!r) return '';
      if (typeof r === 'string') return r;
      return r.title || r.name || '';
    }).filter(Boolean);

    // Return successful response (keep detailed + simple forms)
    res.status(200).json({
      success: true,
      message: 'Gift recommendations generated successfully',
      persona: {
        id: persona.id,
        name: persona.name,
        age: giftRecommendations.age,
        ageCategory: giftRecommendations.ageCategory
      },
      // Detailed list with objects
      recommendations: giftRecommendations.recommendations,
      // Simple lists for frontend convenience
      data: suggestionTitles,
      suggestions: suggestionTitles,
      metadata: {
        totalOptions: giftRecommendations.totalOptions,
        generatedAt: giftRecommendations.generatedAt,
        userId: req.user.id,
        personaInterests: persona.interests || [],
        personaNotes: persona.notes || []
      }
    });

  } catch (error) {
    console.error('Gift recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating gift recommendations'
    });
  }
});

// POST /api/gift/batch-recommend - Generate gift recommendations for multiple personas
router.post('/batch-recommend', verifyAuth, async (req, res) => {
  try {
    const { personaIds } = req.body;

    // Validate required fields
    if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Persona IDs array is required and must not be empty'
      });
    }

    // Limit batch size for performance
    if (personaIds.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 personas allowed per batch request'
      });
    }

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of personaIds) {
      if (!uuidRegex.test(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid persona ID format: ${id}`
        });
      }
    }

    // Fetch all personas from Supabase
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .in('id', personaIds)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Fetch personas error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching personas from database'
      });
    }

    if (!personas || personas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No personas found or you do not have access to them'
      });
    }

    // Generate gift ideas for each persona
    const results = [];
    const errors = [];

    for (const persona of personas) {
      try {
        const giftRecommendations = await generateGiftIdeas(persona);
        
        if (giftRecommendations.success) {
          results.push({
            persona: {
              id: persona.id,
              name: persona.name,
              age: giftRecommendations.age,
              ageCategory: giftRecommendations.ageCategory
            },
            recommendations: giftRecommendations.recommendations,
            metadata: {
              totalOptions: giftRecommendations.totalOptions,
              generatedAt: giftRecommendations.generatedAt
            }
          });
        } else {
          errors.push({
            personaId: persona.id,
            personaName: persona.name,
            error: giftRecommendations.error || 'Failed to generate recommendations'
          });
        }
      } catch (error) {
        errors.push({
          personaId: persona.id,
          personaName: persona.name,
          error: error.message
        });
      }
    }

    // Return response with results and errors
    res.status(200).json({
      success: true,
      message: `Generated recommendations for ${results.length} out of ${personas.length} personas`,
      results: results,
      errors: errors,
      summary: {
        totalRequested: personaIds.length,
        totalFound: personas.length,
        totalSuccess: results.length,
        totalErrors: errors.length
      }
    });

  } catch (error) {
    console.error('Batch gift recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating batch gift recommendations'
    });
  }
});

// GET /api/gift/categories - Get available gift categories
router.get('/categories', verifyAuth, async (req, res) => {
  try {
    const categories = getGiftCategories();
    
    res.status(200).json({
      success: true,
      message: 'Gift categories retrieved successfully',
      categories: categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Get gift categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving gift categories'
    });
  }
});

// GET /api/gift/stats - Get gift recommendation statistics for user
router.get('/stats', verifyAuth, async (req, res) => {
  try {
    // Get user's personas count
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name, interests, notes, created_at')
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Fetch personas for stats error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching user personas'
      });
    }

    // Calculate statistics
    const totalPersonas = personas ? personas.length : 0;
    const totalInterests = personas ? personas.reduce((sum, p) => sum + (p.interests?.length || 0), 0) : 0;
    const totalNotes = personas ? personas.reduce((sum, p) => sum + (p.notes?.length || 0), 0) : 0;
    
    // Get most common interests
    const allInterests = personas ? personas.flatMap(p => p.interests || []) : [];
    const interestCounts = {};
    allInterests.forEach(interest => {
      interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });
    
    const popularInterests = Object.entries(interestCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([interest, count]) => ({ interest, count }));

    res.status(200).json({
      success: true,
      message: 'Gift recommendation statistics retrieved successfully',
      stats: {
        totalPersonas,
        totalInterests,
        totalNotes,
        averageInterestsPerPersona: totalPersonas > 0 ? Math.round((totalInterests / totalPersonas) * 100) / 100 : 0,
        averageNotesPerPersona: totalPersonas > 0 ? Math.round((totalNotes / totalPersonas) * 100) / 100 : 0,
        popularInterests,
        availableCategories: getGiftCategories().length
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get gift stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving statistics'
    });
  }
});

module.exports = router;
