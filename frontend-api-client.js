// Frontend API Client - PersonaForm entegrasyonu için
// Bu dosya frontend'de kullanılacak API client fonksiyonlarını içerir

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://giftmind-be-production.up.railway.app";

// Auth token helper
const getAuthToken = () =>
  localStorage.getItem("railway_token") ||
  localStorage.getItem("authToken") ||
  "";

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
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? data : null,
      error: response.ok ? null : data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: { message: error.message },
    };
  }
}

// PersonaForm API functions
export const personaAPI = {
  // Create persona from PersonaForm data (matches exact Supabase table structure)
  async create(formData) {
    const payload = {
      // Required fields
      name: formData.name,

      // Optional fields matching table structure
      role: formData.role || null,
      goals: formData.goals || null,
      challenges: formData.challenges || null,
      description: formData.description || formData.notes || null,
      interests: formData.interests || [],
      personality_traits:
        formData.personalityTraits || formData.personality_traits || [],
      budget_min: formData.budgetMin || formData.budget_min || null,
      budget_max: formData.budgetMax || formData.budget_max || null,
      behavioral_insights:
        formData.behavioralInsights || formData.behavioral_insights || null,
      notes: formData.notes || null,
      birth_date: formData.birthDate || formData.birth_date || null,
      metadata: formData.metadata || {},
    };

    return apiRequest("/api/personas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Update persona from PersonaForm data (matches exact Supabase table structure)
  async update(personaId, formData) {
    const payload = {
      // Only include fields that are provided
      ...(formData.name !== undefined && { name: formData.name }),
      ...(formData.role !== undefined && { role: formData.role }),
      ...(formData.goals !== undefined && { goals: formData.goals }),
      ...(formData.challenges !== undefined && {
        challenges: formData.challenges,
      }),
      ...(formData.description !== undefined && {
        description: formData.description,
      }),
      ...(formData.interests !== undefined && {
        interests: formData.interests,
      }),
      ...(formData.personalityTraits !== undefined && {
        personality_traits: formData.personalityTraits,
      }),
      ...(formData.personality_traits !== undefined && {
        personality_traits: formData.personality_traits,
      }),
      ...(formData.budgetMin !== undefined && {
        budget_min: formData.budgetMin,
      }),
      ...(formData.budget_min !== undefined && {
        budget_min: formData.budget_min,
      }),
      ...(formData.budgetMax !== undefined && {
        budget_max: formData.budgetMax,
      }),
      ...(formData.budget_max !== undefined && {
        budget_max: formData.budget_max,
      }),
      ...(formData.behavioralInsights !== undefined && {
        behavioral_insights: formData.behavioralInsights,
      }),
      ...(formData.behavioral_insights !== undefined && {
        behavioral_insights: formData.behavioral_insights,
      }),
      ...(formData.notes !== undefined && { notes: formData.notes }),
      ...(formData.birthDate !== undefined && {
        birth_date: formData.birthDate,
      }),
      ...(formData.birth_date !== undefined && {
        birth_date: formData.birth_date,
      }),
      ...(formData.isActive !== undefined && { is_active: formData.isActive }),
      ...(formData.is_active !== undefined && {
        is_active: formData.is_active,
      }),
      ...(formData.metadata !== undefined && { metadata: formData.metadata }),
    };

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

  // Get gift recommendations
  async getGiftRecommendations(personaId) {
    return apiRequest(`/api/persona/${personaId}/gift-ideas`, {
      method: "POST",
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
        data: result.success ? result.data?.giftIdeas : [],
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

// Example usage in React component:
/*
import { usePersonaSubmit, personaAPI } from './frontend-api-client';

function PersonaFormComponent() {
  const { submitPersona, loading, error } = usePersonaSubmit();
  
  const handleSubmit = async (formValues) => {
    try {
      const persona = await submitPersona(formValues);
      console.log('Persona created:', persona);
      // Navigate to success page
    } catch (error) {
      console.error('Failed to create persona:', error);
    }
  };

  return (
    <PersonaForm 
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}
*/
