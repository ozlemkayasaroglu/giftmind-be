// Frontend API Client - PersonaForm entegrasyonu için
// Bu dosya frontend'de kullanılacak API client fonksiyonlarını içerir
//
// Desteklenen alanlar ve camelCase aliasları:
// - name (required)
// - role
// - goals
// - challenges
// - description
// - interests (array)
// - personality_traits / personalityTraits (array)
// - budget_min / budgetMin (number)
// - budget_max / budgetMax (number)
// - behavioral_insights / behavioralInsights (string)
// - notes (string)
// - birth_date / birthDate (date string)
// - metadata (object)

const API_BASE_URL =
  (typeof window !== "undefined" && window.VITE_API_BASE_URL) ||
  process.env.VITE_API_BASE_URL ||
  "https://giftmind-be-production.up.railway.app";

// Auth token helper
const getAuthToken = () => {
  const token =
    localStorage.getItem("railway_token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("supabase.auth.token") ||
    "";

  // Debug: log token status (remove in production)
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("🔑 Auth token status:", token ? "✅ Found" : "❌ Missing");
  }

  return token;
};

// Base fetch wrapper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Debug logging for development
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      console.log(
        `🌐 API Request: ${config.method || "GET"} ${endpoint} - Status: ${
          response.status
        }`
      );
    }

    const data = await response.json();

    // Enhanced error handling for auth issues
    if (response.status === 401) {
      console.warn(
        "🔒 Authentication failed - token may be invalid or expired"
      );
      // Optionally clear invalid tokens
      if (typeof window !== "undefined") {
        localStorage.removeItem("railway_token");
        localStorage.removeItem("authToken");
      }
    }

    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? data : null,
      error: response.ok ? null : data,
    };
  } catch (error) {
    console.error("🚨 API Request failed:", error);
    return {
      success: false,
      status: 0,
      data: null,
      error: { message: error.message },
    };
  }
}

// Helper function to map frontend form data to backend API format
function mapFormDataToAPI(formData) {
  return {
    // Required field
    name: formData.name,

    // Simple fields
    role: formData.role || null,
    goals: formData.goals || null,
    challenges: formData.challenges || null,
    description: formData.description || null,
    interests: formData.interests || [],
    notes: formData.notes || null,
    metadata: formData.metadata || {},

    // Fields with camelCase aliases
    personality_traits:
      formData.personalityTraits || formData.personality_traits || [],
    budget_min: formData.budgetMin || formData.budget_min || null,
    budget_max: formData.budgetMax || formData.budget_max || null,
    behavioral_insights:
      formData.behavioralInsights || formData.behavioral_insights || null,
    birth_date: formData.birthDate || formData.birth_date || null,
  };
}

// Helper function to create update payload (only includes defined fields)
function createUpdatePayload(formData) {
  const payload = {};

  // Simple fields
  if (formData.name !== undefined) payload.name = formData.name;
  if (formData.role !== undefined) payload.role = formData.role;
  if (formData.goals !== undefined) payload.goals = formData.goals;
  if (formData.challenges !== undefined)
    payload.challenges = formData.challenges;
  if (formData.description !== undefined)
    payload.description = formData.description;
  if (formData.interests !== undefined) payload.interests = formData.interests;
  if (formData.notes !== undefined) payload.notes = formData.notes;
  if (formData.metadata !== undefined) payload.metadata = formData.metadata;

  // Fields with camelCase aliases - prioritize camelCase
  if (formData.personalityTraits !== undefined) {
    payload.personality_traits = formData.personalityTraits;
  } else if (formData.personality_traits !== undefined) {
    payload.personality_traits = formData.personality_traits;
  }

  if (formData.budgetMin !== undefined) {
    payload.budget_min = formData.budgetMin;
  } else if (formData.budget_min !== undefined) {
    payload.budget_min = formData.budget_min;
  }

  if (formData.budgetMax !== undefined) {
    payload.budget_max = formData.budgetMax;
  } else if (formData.budget_max !== undefined) {
    payload.budget_max = formData.budget_max;
  }

  if (formData.behavioralInsights !== undefined) {
    payload.behavioral_insights = formData.behavioralInsights;
  } else if (formData.behavioral_insights !== undefined) {
    payload.behavioral_insights = formData.behavioral_insights;
  }

  if (formData.birthDate !== undefined) {
    payload.birth_date = formData.birthDate;
  } else if (formData.birth_date !== undefined) {
    payload.birth_date = formData.birth_date;
  }

  // Active status
  if (formData.isActive !== undefined) {
    payload.is_active = formData.isActive;
  } else if (formData.is_active !== undefined) {
    payload.is_active = formData.is_active;
  }

  return payload;
}

// PersonaForm API functions
export const personaAPI = {
  // Create persona from PersonaForm data (supports both camelCase and snake_case)
  async create(formData) {
    const payload = mapFormDataToAPI(formData);

    return apiRequest("/api/personas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Update persona from PersonaForm data (supports both camelCase and snake_case)
  async update(personaId, formData) {
    const payload = createUpdatePayload(formData);

    return apiRequest(`/api/personas/${personaId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Get all personas
  async getAll() {
    return apiRequest("/api/personas");
  },

  // Get single persona
  async get(personaId) {
    return apiRequest(`/api/personas/${personaId}`);
  },

  // Delete persona
  async delete(personaId) {
    return apiRequest(`/api/personas/${personaId}`, {
      method: "DELETE",
    });
  },

  // Get gift recommendations - CORRECT ENDPOINT
  async getGiftRecommendations(personaId) {
    return apiRequest(`/api/persona/${personaId}/gift-ideas`, {
      method: "POST",
    });
  },

  // Alternative gift recommendation endpoint
  async getGiftRecommendationsV2(personaId) {
    return apiRequest(`/api/gift/recommend`, {
      method: "POST",
      body: JSON.stringify({ personaId }),
    });
  },
};

// Legacy API object for backward compatibility
export const api = {
  personas: {
    async create(formData) {
      const result = await personaAPI.create(formData);
      return {
        data: result.success ? result.data?.persona : null,
        error: result.error,
      };
    },

    async get(personaId) {
      const result = await personaAPI.get(personaId);
      return {
        data: result.success ? result.data?.persona : null,
        error: result.error,
      };
    },

    async update(personaId, formData) {
      const result = await personaAPI.update(personaId, formData);
      return {
        data: result.success ? result.data?.persona : null,
        error: result.error,
      };
    },

    async delete(personaId) {
      const result = await personaAPI.delete(personaId);
      return {
        data: result.success,
        error: result.error,
      };
    },

    async getAll() {
      const result = await personaAPI.getAll();
      return {
        data: result.success ? result.data?.personas : [],
        error: result.error,
      };
    },
  },

  gifts: {
    async getRecommendations(personaId) {
      const result = await personaAPI.getGiftRecommendations(personaId);
      return {
        data: result.success
          ? result.data?.giftIdeas || result.data?.recommendations
          : [],
        error: result.error,
      };
    },

    // Alternative method using gift service
    async getRecommendationsV2(personaId) {
      const result = await personaAPI.getGiftRecommendationsV2(personaId);
      return {
        data: result.success ? result.data?.recommendations : [],
        error: result.error,
      };
    },
  },

  // Personality Traits API
  personalityTraits: {
    async getAll() {
      const result = await apiRequest("/api/personality-traits/all");
      return {
        data: result.success ? result.data?.data : [],
        error: result.error,
      };
    },

    async getByCategory() {
      const result = await apiRequest("/api/personality-traits/categories");
      return {
        data: result.success ? result.data?.data : [],
        error: result.error,
      };
    },

    async getFull() {
      const result = await apiRequest("/api/personality-traits");
      return {
        data: result.success ? result.data?.data : null,
        error: result.error,
      };
    },
  },
};

// React hook for PersonaForm submission
export function usePersonaSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitPersona = async (formData, personaId = null) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (personaId) {
        result = await personaAPI.update(personaId, formData);
      } else {
        result = await personaAPI.create(formData);
      }

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || "Operation failed");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitPersona, loading, error };
}
