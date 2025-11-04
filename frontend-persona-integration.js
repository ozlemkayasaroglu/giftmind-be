// PersonaForm verilerini backend'e gönderme rehberi
// Bu dosya frontend entegrasyonu için örnek kodları içerir

// 1. PersonaForm'dan gelen veri yapısı
const personaFormData = {
  name: "Ahmet Yılmaz",
  birthDate: "1990-05-15", // ISO format (YYYY-MM-DD)
  interests: ["kitap", "müzik", "spor"], // string array
  notes: "Teknoloji meraklısı, yeni gadget'ları seviyor", // string
};

// 2. Backend'e gönderilecek veri formatı
const backendPayload = {
  name: personaFormData.name,
  birth_date: personaFormData.birthDate, // snake_case
  interests: personaFormData.interests, // array olarak kalır
  description: personaFormData.notes, // notes -> description mapping
  notes_text: personaFormData.notes, // ayrıca notes_text olarak da sakla
  // Opsiyonel alanlar (form genişletilirse)
  role: null,
  age_min: null,
  age_max: null,
  goals: null,
  challenges: null,
  interests_raw: null,
  behavioral_insights: null,
  budget_min: null,
  budget_max: null,
};

// 3. API çağrısı örneği
async function createPersona(formData) {
  const payload = {
    name: formData.name,
    birth_date: formData.birthDate,
    interests: formData.interests,
    description: formData.notes,
    notes_text: formData.notes,
  };

  const response = await fetch("/api/personas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}

// 4. Persona güncelleme örneği
async function updatePersona(personaId, formData) {
  const payload = {
    name: formData.name,
    birth_date: formData.birthDate,
    interests: formData.interests,
    description: formData.notes,
    notes_text: formData.notes,
  };

  const response = await fetch(`/api/personas/${personaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}

// 5. Frontend'de kullanım örneği (React)
const handlePersonaSubmit = async (formValues) => {
  try {
    const result = await createPersona(formValues);
    if (result.success) {
      console.log("Persona created:", result.persona);
      // Başarılı işlem sonrası yönlendirme
      navigate("/dashboard");
    } else {
      console.error("Error:", result.message);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};

export { createPersona, updatePersona, handlePersonaSubmit };
