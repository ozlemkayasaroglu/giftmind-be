// services/aiGiftRecommender.js - Geliştirilmiş versiyon
const generateGiftIdeas = async (persona) => {
  try {
    // Persona bilgilerini detaylı prompt'ta kullan
    const prompt = `
      ${persona.name} isimli kişi için detaylı hediye önerileri oluştur.
      
      KİŞİSEL BİLGİLER:
      - İsim: ${persona.name}
      - Yaş: ${calculateAge(persona.birth_date) || "Belirtilmemiş"}
      - Meslek/Rol: ${persona.role || "Belirtilmemiş"}
      - İlgi Alanları: ${
        Array.isArray(persona.interests)
          ? persona.interests.join(", ")
          : persona.interests || "Belirtilmemiş"
      }
      - Kişilik Özellikleri: ${
        Array.isArray(persona.personality_traits)
          ? persona.personality_traits.join(", ")
          : persona.personality_traits || "Belirtilmemiş"
      }
      - Hedefler: ${persona.goals || "Belirtilmemiş"}
      - Zorluklar: ${persona.challenges || "Belirtilmemiş"}
      - Davranışsal İçgörüler: ${persona.behavioral_insights || "Belirtilmemiş"}
      - Bütçe Aralığı: ${persona.budget_min || 0} - ${
      persona.budget_max || "Belirsiz"
    } TL
      - Notlar: ${persona.notes || "Yok"}
      
      TALEP:
      Bu kişiye özel 5 farklı hediye önerisi oluştur. Öneriler:
      - Kişinin ilgi alanlarına uygun olsun
      - Bütçe aralığına uygun olsun
      - Kişilik özelliklerine uygun olsun
      - Pratik ve anlamlı olsun
      - Farklı kategorilerden olsun (deneyim, ürün, kişiselleştirilmiş vb.)
      
      Yanıtı sadece JSON array formatında ver: ["öneri 1", "öneri 2", "öneri 3", "öneri 4", "öneri 5"]
    `;

    // Gemini API çağrısı
    // ... mevcut kodunuz

    return {
      success: true,
      recommendations: parsedSuggestions,
      age: calculateAge(persona.birth_date),
      ageCategory: getAgeCategory(calculateAge(persona.birth_date)),
      totalOptions: parsedSuggestions.length,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("AI gift recommendation error:", error);
    return { success: false, error: error.message };
  }
};
