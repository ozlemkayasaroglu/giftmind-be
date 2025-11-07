/**
 * AI Gift Recommender Service
 * Generates personalized gift ideas based on persona information using Gemini (Google Generative AI)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client (set GEMINI_API_KEY in environment)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
// Use gemini-pro as default (compatible with v1beta API used by current SDK version)
// Note: gemini-1.5-flash requires v1 API which needs SDK update
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";
let genAI = null;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (_) {
    genAI = null;
  }
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    return age - 1;
  }

  return age;
}

/**
 * Get age category for gift recommendations
 */
function getAgeCategory(age) {
  if (!age) return "adult";
  if (age < 13) return "child";
  if (age < 30) return "young";
  if (age < 65) return "adult";
  return "senior";
}

/**
 * Create a detailed and personalized prompt for the AI model
 */
function createGiftPrompt(persona) {
  const {
    name,
    interests,
    birth_date,
    notes,
    description,
    role,
    goals,
    challenges,
    behavioral_insights,
    budget_min,
    budget_max,
    personality_traits,
  } = persona || {};

  const age = calculateAge(birth_date);
  const ageCategory = getAgeCategory(age);

  let prompt = `Sen bir hediye uzmanısın. Aşağıdaki kişi için 4 adet çok kişisel ve düşünceli hediye önerisi hazırla.\n\n`;

  prompt += `🎯 KİŞİ PROFİLİ:\n`;
  prompt += `İsim: ${name}\n`;

  // Age and life stage analysis
  if (age) {
    prompt += `Yaş: ${age} yaşında\n`;
    if (age <= 12) {
      prompt += `Yaş Grubu: Çocuk - Eğitici, yaratıcı ve eğlenceli hediyeler tercih et\n`;
    } else if (age <= 17) {
      prompt += `Yaş Grubu: Genç - Trend, teknoloji ve sosyal aktiviteler odaklı hediyeler\n`;
    } else if (age <= 30) {
      prompt += `Yaş Grubu: Genç Yetişkin - Kariyer, hobiler ve yaşam tarzı geliştirici hediyeler\n`;
    } else if (age <= 50) {
      prompt += `Yaş Grubu: Yetişkin - Kaliteli, pratik ve kişisel gelişim odaklı hediyeler\n`;
    } else {
      prompt += `Yaş Grubu: Olgun - Konfor, nostalji ve deneyim odaklı hediyeler\n`;
    }
  }

  if (role) {
    prompt += `Meslek/Rol: ${String(role)}\n`;
  }

  // Personality traits analysis
  const allTraits = personality_traits || [];
  if (Array.isArray(allTraits) && allTraits.length > 0) {
    prompt += `\n🧠 KİŞİLİK ÖZELLİKLERİ:\n`;
    allTraits.forEach((trait) => {
      prompt += `• ${trait}\n`;
    });
    prompt += `Bu kişilik özelliklerine uygun hediyeler seç.\n`;
  }

  // Interests and hobbies with popular culture detection
  const interestList =
    Array.isArray(interests) && interests.length ? interests : [];
  if (interestList.length > 0) {
    prompt += `\n🎨 İLGİ ALANLARI VE HOBİLER:\n`;
    interestList.forEach((interest) => {
      prompt += `• ${interest}\n`;

      // Check for popular culture references
      const lowerInterest = interest.toLowerCase();
      if (
        lowerInterest.includes("küçük prens") ||
        lowerInterest.includes("little prince")
      ) {
        prompt += `  ⭐ ÖZEL NOT: Küçük Prens sevgisi - Bu karakterle ilgili özel koleksiyon ürünleri, kitap serileri, figürler veya temalı hediyeler tercih et!\n`;
      }
      if (
        lowerInterest.includes("gabby") ||
        lowerInterest.includes("gabby's dollhouse")
      ) {
        prompt += `  ⭐ ÖZEL NOT: Gabby's Dollhouse sevgisi - Bu karakterle ilgili oyuncaklar, figürler, puzzle veya temalı hediyeler tercih et!\n`;
      }
      if (
        lowerInterest.includes("disney") ||
        lowerInterest.includes("mickey") ||
        lowerInterest.includes("minnie")
      ) {
        prompt += `  ⭐ ÖZEL NOT: Disney sevgisi - Disney karakterli özel koleksiyon ürünleri, vintage posterler veya temalı hediyeler tercih et!\n`;
      }
    });
  }

  // Goals and aspirations
  if (goals) {
    prompt += `\n🎯 HEDEFLER VE AMAÇLAR:\n${String(goals)}\n`;
    prompt += `Bu hedefleri destekleyecek hediyeler düşün.\n`;
  }

  // Challenges and pain points
  if (challenges) {
    prompt += `\n⚡ ZORLUKLAR VE İHTİYAÇLAR:\n${String(challenges)}\n`;
    prompt += `Bu zorlukları çözmeye yardımcı olacak hediyeler öner.\n`;
  }

  // Personal description and notes
  if (description) {
    prompt += `\n📝 KİŞİSEL AÇIKLAMA:\n${String(description)}\n`;
  }

  if (notes) {
    const notesText =
      typeof notes === "string"
        ? notes
        : Array.isArray(notes)
        ? notes.join(", ")
        : String(notes);
    prompt += `\n💭 EK NOTLAR:\n${notesText}\n`;
  }

  // Behavioral insights
  if (behavioral_insights) {
    prompt += `\n🔍 DAVRANIŞSAL ANALİZ:\n${String(behavioral_insights)}\n`;
    prompt += `Bu davranış kalıplarına uygun hediyeler seç.\n`;
  }

  // Budget considerations
  if (budget_min != null || budget_max != null) {
    const budgetText = `${budget_min != null ? budget_min : "0"} - ${
      budget_max != null ? budget_max : "∞"
    } TL`;
    prompt += `\n💰 BÜTÇE ARALIĞI: ${budgetText}\n`;
  }

  prompt += `\n🎁 HEDİYE ÖNERİLERİ İÇİN TALİMATLAR:\n`;
  prompt += `• Her hediye önerisini kişinin yaşına, kişilik özelliklerine, ilgi alanlarına ve hedeflerine göre özelleştir\n`;
  prompt += `• Popüler kültür referansları varsa (Küçük Prens, Gabby, Disney vb.) mutlaka bunları kullan\n`;
  prompt += `• Bütçe aralığına uygun hediyeler öner\n`;
  prompt += `• Her hediye için neden bu kişiye uygun olduğunu detaylı açıkla\n`;
  prompt += `• Genel hediyeler yerine çok spesifik ve kişisel hediyeler tercih et\n`;
  prompt += `• Yaş grubuna uygun hediyeler seç (çocuk için oyuncak, yetişkin için kaliteli ürünler)\n\n`;

  prompt += `ÇIKTI FORMATI:\n`;
  prompt += `1. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;
  prompt += `2. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;
  prompt += `3. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;
  prompt += `4. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response, persona) {
  const lines = response.split("\n").filter((line) => line.trim());
  const recommendations = [];

  for (let i = 0; i < lines.length && recommendations.length < 4; i++) {
    const line = lines[i].trim();

    // Look for numbered lists (1., 2., 3.) or bullet points
    const match = line.match(/^[\d\-\*•]\s*\.?\s*(.+?)(?:\s*-\s*(.+))?$/);

    if (match) {
      const [, giftPart, reasonPart] = match;

      // Split gift and reason if they're in the same line
      let title = giftPart.trim();
      let reason = reasonPart ? reasonPart.trim() : "";

      // If no reason provided, generate a default one
      if (!reason) {
        reason = `Özel olarak ${persona.name} için seçilmiş hediye`;
      }

      recommendations.push({
        id: recommendations.length + 1,
        title: title,
        reason: reason,
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence for AI recommendations
      });
    }
  }

  return recommendations;
}

/**
 * Generate fallback gifts when AI fails
 */
function generateFallbackGifts(persona) {
  const fallbackGifts = [
    "Kişiye özel fotoğraf albümü",
    "Aromaterapi difüzörü",
    "Premium çikolata kutusu",
    "Kaliteli cüzdan",
    "Özel tasarım kupa",
  ];

  return fallbackGifts.slice(0, 4).map((gift, index) => ({
    id: index + 1,
    title: gift,
    reason: `${persona.name} için özenle seçilmiş hediye`,
    confidence: Math.floor(Math.random() * 30) + 70,
  }));
}

/**
 * Generate personalized gift recommendations using Gemini (Google Generative AI)
 */
async function generateGiftIdeas(persona) {
  try {
    // Use name, role, or a default identifier
    const name = persona.name || persona.role || "Kişi";
    if (!name || name.trim() === "") {
      throw new Error("Persona name or role is required");
    }

    const age = calculateAge(persona.birth_date);
    const ageCategory = getAgeCategory(age);

    let recommendations = [];
    let usedAI = false;

    // Prefer Gemini if API key is available
    if (genAI) {
      try {
        // Remove -latest suffix if present (not supported in v1beta API)
        let modelName = GEMINI_MODEL.replace("-latest", "");
        // Add models/ prefix if not present
        modelName = modelName.startsWith("models/")
          ? modelName
          : `models/${modelName}`;
        console.log("🤖 Using Gemini model:", modelName);
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = createGiftPrompt(persona);
        console.log("📝 Prompt length:", prompt.length, "characters");

        const resp = await model.generateContent(prompt);
        console.log("✅ Gemini response received");

        const text = resp?.response?.text
          ? resp.response.text()
          : (await resp.text?.()) || "";

        console.log("📄 Response text length:", text.length, "characters");
        console.log("📄 Response preview:", text.substring(0, 200));

        if (text && typeof text === "string") {
          const parsed = parseAIResponse(text, persona);
          console.log("🎁 Parsed recommendations:", parsed.length, "items");

          if (parsed && parsed.length >= 1) {
            recommendations = parsed;
            usedAI = true;
            console.log("✅ Using AI-generated recommendations");
          } else {
            console.warn("⚠️ Parsing returned no recommendations");
          }
        } else {
          console.warn("⚠️ No text in Gemini response");
        }
      } catch (e) {
        console.error("❌ Gemini error, falling back:", e?.message || e);
        console.error("Error details:", e);
      }
    } else {
      console.warn("⚠️ Gemini not initialized (no API key)");
    }

    if (!recommendations.length) {
      recommendations = generateFallbackGifts(persona);
    }

    while (recommendations.length < 4) {
      const extra = generateFallbackGifts(persona);
      recommendations.push(...extra.slice(0, 4 - recommendations.length));
    }

    return {
      success: true,
      personaName: name,
      age,
      ageCategory,
      recommendations: recommendations.slice(0, 4),
      generatedAt: new Date().toISOString(),
      aiGenerated: usedAI,
      totalOptions: recommendations.length,
    };
  } catch (error) {
    console.error("Gift recommendation error:", error);
    return { success: false, error: error.message, recommendations: [] };
  }
}

/**
 * Get gift categories for filtering
 */
function getGiftCategories() {
  return [
    {
      id: "books",
      name: "Kitap & Okuma",
      keywords: ["kitap", "okumak", "reading", "books"],
    },
    {
      id: "cooking",
      name: "Yemek & Mutfak",
      keywords: ["yemek", "cooking", "aşçılık"],
    },
    {
      id: "technology",
      name: "Teknoloji",
      keywords: ["teknoloji", "technology"],
    },
    {
      id: "sports",
      name: "Spor & Fitness",
      keywords: ["spor", "fitness", "yoga"],
    },
  ];
}

module.exports = {
  generateGiftIdeas,
  getGiftCategories,
  calculateAge,
  getAgeCategory,
};
