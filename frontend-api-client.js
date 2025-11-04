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
  // Create persona from PersonaForm data (supports ALL fields)
  async create(formData) {
    const payload = {
      // Temel alanlar
      name: formData.name,
      birthDate: formData.birthDate,
      interests: formData.interests || [],
      notes: formData.notes || "",
      description: formData.description || formData.notes || "",

      // Ek alanlar (varsa gönder)
      role: formData.role || null,
      ageMin: formData.ageMin || null,
      ageMax: formData.ageMax || null,
      goals: formData.goals || null,
      challenges: formData.challenges || null,
      interestsInput: formData.interestsInput || null,
      behavioralInsights: formData.behavioralInsights || null,
      budgetMin: formData.budgetMin || null,
      budgetMax: formData.budgetMax || null,
    };

    return apiRequest("/api/personas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Update persona from PersonaForm data (supports ALL fields)
  async update(personaId, formData) {
    const payload = {
      // Temel alanlar
      name: formData.name,
      birthDate: formData.birthDate,
      interests: formData.interests || [],
      notes: formData.notes || "",
      description: formData.description || formData.notes || "",

      // Ek alanlar (varsa gönder)
      role: formData.role || null,
      ageMin: formData.ageMin || null,
      ageMax: formData.ageMax || null,
      goals: formData.goals || null,
      challenges: formData.challenges || null,
      interestsInput: formData.interestsInput || null,
      behavioralInsights: formData.behavioralInsights || null,
      budgetMin: formData.budgetMin || null,
      budgetMax: formData.budgetMax || null,
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

  events: {
    async list(personaId) {
      const result = await apiRequest(`/api/events/${personaId}`);
      return {
        data: result.success ? result.data?.data : [],
        error: result.error,
      };
    },

    async create(personaId, eventData) {
      const result = await apiRequest(`/api/events/${personaId}`, {
        method: "POST",
        body: JSON.stringify(eventData),
      });
      return {
        data: result.success ? result.data?.data : null,
        error: result.error,
      };
    },

    async update(eventId, eventData) {
      const result = await apiRequest(`/api/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(eventData),
      });
      return {
        data: result.success ? result.data?.data : null,
        error: result.error,
      };
    },

    async delete(eventId) {
      const result = await apiRequest(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      return {
        data: result.success,
        error: result.error,
      };
    },
  },

  // Avatar API
  avatar: {
    async upload(personaId, file) {
      const formData = new FormData();
      formData.append("avatar", file);

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/personas/${personaId}/avatar-simple`,
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: response.ok ? null : data,
      };
    },

    async get(personaId) {
      const result = await apiRequest(
        `/api/personas/${personaId}/avatar-simple`
      );
      return {
        data: result.success ? result.data?.avatar_url : null,
        error: result.error,
      };
    },

    async remove(personaId) {
      const result = await apiRequest(
        `/api/personas/${personaId}/avatar-simple`,
        {
          method: "DELETE",
        }
      );
      return {
        data: result.success,
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

// React hook for Avatar operations
export function useAvatar() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadAvatar = async (personaId, file) => {
    setUploading(true);
    setError(null);

    try {
      const result = await api.avatar.upload(personaId, file);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || "Avatar upload failed");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const getAvatar = async (personaId) => {
    try {
      const result = await api.avatar.get(personaId);
      return result.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const removeAvatar = async (personaId) => {
    try {
      const result = await api.avatar.remove(personaId);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { uploadAvatar, getAvatar, removeAvatar, uploading, error };
}

// Example usage in React component:
/*
import { usePersonaSubmit, useAvatar, api } from './frontend-api-client';

function PersonaFormComponent() {
  const { submitPersona, loading, error } = usePersonaSubmit();
  const { uploadAvatar, uploading } = useAvatar();
  
  const handleSubmit = async (formValues) => {
    try {
      const persona = await submitPersona(formValues);
      console.log('Persona created:', persona);
      // Navigate to success page
    } catch (error) {
      console.error('Failed to create persona:', error);
    }
  };

  const handleAvatarUpload = async (personaId, file) => {
    try {
      const result = await uploadAvatar(personaId, file);
      console.log('Avatar uploaded:', result.avatar_url);
      // Update UI with new avatar
    } catch (error) {
      console.error('Avatar upload failed:', error);
    }
  };

  return (
    <div>
      <PersonaForm 
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => handleAvatarUpload(personaId, e.target.files[0])}
        disabled={uploading}
      />
    </div>
  );
}

// Avatar display component
function AvatarDisplay({ personaId, avatarUrl }) {
  return (
    <div className="avatar-container">
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Persona Avatar" 
          className="avatar-image"
          style={{ width: 100, height: 100, borderRadius: '50%' }}
        />
      ) : (
        <div className="avatar-placeholder">
          No Avatar
        </div>
      )}
    </div>
  );
}
*/
