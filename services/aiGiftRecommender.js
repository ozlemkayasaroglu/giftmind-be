/**
 * AI Gift Recommender Service
 * Generates personalized gift ideas based on persona information using Gemini (Google Generative AI)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client (set GEMINI_API_KEY in environment)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
let genAI = null;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (_) {
    genAI = null;
  }
}

// Backup gift database for fallback scenarios
const giftDatabase = {
  // Reading and books
  kitap: [
    "Bestseller kitap seti",
    "E-kitap okuyucu",
    "Kitap ayracı koleksiyonu",
  ],
  okumak: ["Özel ciltli klasik eser", "Okuma lambası", "Kitap standı"],
  reading: ["Premium bookmark set", "Reading chair cushion", "Book light"],
  books: [
    "Limited edition book series",
    "Bookshelf organizer",
    "Literary poster set",
  ],

  // Cooking and food
  yemek: [
    "Profesyonel bıçak seti",
    "Yemek kitabı koleksiyonu",
    "Özel baharat seti",
  ],
  cooking: [
    "Cast iron cookware",
    "Cooking class subscription",
    "Gourmet spice collection",
  ],
  aşçılık: [
    "Mutfak robotu",
    "Ahşap kesme tahtası seti",
    "Silikon pişirme kalıpları",
  ],

  // Gardening
  bahçe: [
    "Özel bitki saksıları",
    "Bahçıvanlık araç seti",
    "Nadir tohum koleksiyonu",
  ],
  bahçıvanlık: ["Mini sera kiti", "Sulama sistemi", "Organik gübre seti"],
  gardening: [
    "Premium garden tools",
    "Rare plant seeds",
    "Smart watering system",
  ],

  // Music
  müzik: ["Bluetooth kulaklık", "Vintage plak koleksiyonu", "Müzik kutusu"],
  music: ["Wireless headphones", "Vinyl record collection", "Portable speaker"],
  enstrüman: ["Enstrüman aksesuarları", "Müzik standı", "Metronom"],

  // Art and crafts
  sanat: [
    "Profesyonel boyar kalem seti",
    "Canvas tuval seti",
    "Sanat kitapları",
  ],
  art: ["Watercolor paint set", "Sketchbook collection", "Art easel"],
  "el işi": [
    "El işi malzemeleri kutusu",
    "Örgü şişleri seti",
    "Tasarım kalıpları",
  ],

  // Sports and fitness
  spor: ["Fitness tracker", "Yoga matı", "Protein shaker seti"],
  fitness: ["Resistance bands set", "Foam roller", "Gym towel set"],
  yoga: ["Premium yoga mat", "Meditation cushion", "Yoga block set"],

  // Travel
  seyahat: ["Seyahat çantası seti", "Dünya haritası", "Seyahat günlüğü"],
  travel: ["Travel organizer set", "Scratch-off world map", "Travel pillow"],

  // Technology
  teknoloji: ["Akıllı ev cihazı", "Wireless charger", "Bluetooth speaker"],
  technology: ["Smart home device", "Portable charger", "Tech organizer bag"],

  // Fashion and beauty
  moda: ["Özel aksesuar seti", "Parfüm koleksiyonu", "Stil danışmanlığı"],
  beauty: ["Skincare gift set", "Makeup organizer", "Beauty tools kit"],

  // Coffee and tea
  kahve: ["Özel kahve çekirdekleri", "French press", "Kahve fincan seti"],
  coffee: ["Coffee bean subscription", "Espresso machine", "Coffee grinder"],
  çay: ["Özel çay koleksiyonu", "Cam demlik seti", "Çay kaşığı koleksiyonu"],
  tea: ["Premium tea collection", "Tea infuser set", "Ceramic teapot"],
};

// Default gifts for different age groups
const ageBasedGifts = {
  child: [
    "Eğitici oyuncak seti",
    "Çocuk kitap koleksiyonu",
    "Sanat malzemeleri kutusu",
  ],
  young: ["Bluetooth kulaklık", "Trendy aksesuar", "Deneyim hediye kartı"],
  adult: ["Premium ev tekstili", "Kişisel bakım seti", "Hobiye özel hediye"],
  senior: [
    "Rahat ev ayakkabısı",
    "Nostaljik müzik koleksiyonu",
    "Bahçe bitkileri",
  ],
};

// Generic fallback gifts
const genericGifts = [
  "Özel fotoğraf albümü",
  "Aromaterapi difüzörü",
  "Premium çikolata kutusu",
  "Kişiye özel mücevher",
  "Spa deneyim paketi",
  "Gourmet yemek sepeti",
  "Kişiselleştirilmiş kupa",
  "Dekoratif mum seti",
  "Kaliteli cüzdan",
  "Özel tasarım tişört",
];

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
 * Extract gift ideas from interests
 */
function getGiftsFromInterests(interests) {
  const giftIdeas = [];

  if (!interests || !Array.isArray(interests)) {
    return giftIdeas;
  }

  interests.forEach((interest) => {
    const normalizedInterest = interest.toLowerCase().trim();

    // Direct match
    if (giftDatabase[normalizedInterest]) {
      giftIdeas.push(...giftDatabase[normalizedInterest]);
    }

    // Partial match
    Object.keys(giftDatabase).forEach((key) => {
      if (
        normalizedInterest.includes(key) ||
        key.includes(normalizedInterest)
      ) {
        giftIdeas.push(...giftDatabase[key]);
      }
    });
  });

  return [...new Set(giftIdeas)]; // Remove duplicates
}

/**
 * Extract gift ideas from notes using keyword analysis
 */
function getGiftsFromNotes(notes) {
  const giftIdeas = [];

  if (!notes || !Array.isArray(notes)) {
    return giftIdeas;
  }

  const allNotes = notes.join(" ").toLowerCase();

  // Check for keywords in notes
  Object.keys(giftDatabase).forEach((keyword) => {
    if (allNotes.includes(keyword)) {
      giftIdeas.push(...giftDatabase[keyword]);
    }
  });

  return [...new Set(giftIdeas)]; // Remove duplicates
}

/**
 * Create a detailed prompt for the AI model
 */
function createGiftPrompt(persona) {
  const {
    name,
    interests,
    birth_date,
    notes,
    description,
    // New enriched fields
    role,
    age_min,
    age_max,
    goals,
    challenges,
    interests_raw,
    behavioral_insights,
    budget_min,
    budget_max,
    // Aliases from frontend
    preferences,
    behavioralInsights,
    // Events list injected by API
    events,
  } = persona || {};

  const age = calculateAge(birth_date);
  const ageCategory = getAgeCategory(age);

  let prompt = `Generate 3 personalized gift recommendations for ${name}.\n\n`;

  // Age details
  if (age) {
    prompt += `Age: ${age} years old (${ageCategory})\n`;
  } else if (age_min != null || age_max != null) {
    const rangeText = `${age_min != null ? age_min : "?"}-${
      age_max != null ? age_max : "?"
    }`;
    prompt += `Age range: ${rangeText}\n`;
  }

  if (role) prompt += `Role: ${String(role)}\n`;
  if (goals) prompt += `Goals: ${String(goals)}\n`;
  if (challenges) prompt += `Challenges: ${String(challenges)}\n`;

  const interestList =
    Array.isArray(interests) && interests.length
      ? interests
      : Array.isArray(preferences)
      ? preferences
      : [];
  if (interestList.length > 0) {
    prompt += `Interests: ${interestList.join(", ")}\n`;
  }
  if (interests_raw) {
    prompt += `Interests (free text): ${String(interests_raw)}\n`;
  }

  if (description) {
    prompt += `Description: ${String(description)}\n`;
  }
  if (notes && Array.isArray(notes) && notes.length > 0) {
    prompt += `Additional notes: ${notes.join(", ")}\n`;
  }

  const insights = behavioral_insights ?? behavioralInsights;
  if (insights) {
    prompt += `Behavioral insights: ${String(insights)}\n`;
  }

  // Recent events (up to 5)
  if (Array.isArray(events) && events.length) {
    const recent = events
      .slice(0, 5)
      .map((e) => {
        const d = e.occurred_at
          ? new Date(e.occurred_at).toISOString().split("T")[0]
          : "";
        const t = e.title || e.event_type || "";
        const desc = e.description || "";
        return `- ${t}${d ? ` (${d})` : ""}${desc ? `: ${desc}` : ""}`;
      })
      .join("\n");
    prompt += `Recent life events that may influence preferences:\n${recent}\n`;
  }

  if (budget_min != null || budget_max != null) {
    const budgetText = `${budget_min != null ? budget_min : "0"} - ${
      budget_max != null ? budget_max : "∞"
    }`;
    prompt += `Budget range: ${budgetText}\n`;
  }

  prompt += `\nInstructions:\n`;
  prompt += `- Provide 3 specific, thoughtful gift ideas tailored to the information above.\n`;
  prompt += `- Keep suggestions within the budget range if provided.\n`;
  prompt += `- Prefer gifts aligned with interests, role, goals, challenges, description, behavioral insights, and recent events.\n`;
  prompt += `- Briefly explain why each gift matches.\n`;
  prompt += `- Avoid generic items unless strongly justified.\n`;
  prompt += `\nOutput format:\n`;
  prompt += `1. [Gift Name] - [Why it fits]\n2. [Gift Name] - [Why it fits]\n3. [Gift Name] - [Why it fits]\n`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response, persona) {
  const lines = response.split("\n").filter((line) => line.trim());
  const recommendations = [];

  for (let i = 0; i < lines.length && recommendations.length < 3; i++) {
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
 * Fallback function using the original mock logic
 */
function generateFallbackGifts(persona) {
  const { interests, birth_date, notes, description } = persona;

  let giftIdeas = [];

  // Interests-based
  const interestGifts = getGiftsFromInterests(interests);
  giftIdeas.push(...interestGifts);

  // Notes + description based
  const combinedNotes = Array.isArray(notes) ? [...notes] : [];
  if (description) combinedNotes.push(String(description));
  const noteGifts = getGiftsFromNotes(combinedNotes);
  giftIdeas.push(...noteGifts);

  // Age-based
  const age = calculateAge(birth_date);
  const ageCategory = getAgeCategory(age);
  const ageGifts = ageBasedGifts[ageCategory] || ageBasedGifts.adult;
  giftIdeas.push(...ageGifts);

  // Dedup & fill
  giftIdeas = [...new Set(giftIdeas)];
  if (giftIdeas.length < 3) {
    const remaining = 3 - giftIdeas.length;
    const shuffledGeneric = [...genericGifts].sort(() => Math.random() - 0.5);
    giftIdeas.push(...shuffledGeneric.slice(0, remaining));
  }

  const selected = [...giftIdeas].sort(() => Math.random() - 0.5).slice(0, 3);
  return selected.map((gift, index) => ({
    id: index + 1,
    title: gift,
    reason: generateReason(gift, persona),
    confidence: Math.floor(Math.random() * 30) + 70,
  }));
}

/**
 * Generate personalized gift recommendations using Gemini (Google Generative AI)
 */
async function generateGiftIdeas(persona) {
  try {
    const { name } = persona;
    if (!name) throw new Error("Persona name is required");

    const age = calculateAge(persona.birth_date);
    const ageCategory = getAgeCategory(age);

    let recommendations = [];
    let usedAI = false;

    // Prefer Gemini if API key is available
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = createGiftPrompt(persona);
        const resp = await model.generateContent(prompt);
        const text = resp?.response?.text
          ? resp.response.text()
          : (await resp.text?.()) || "";
        if (text && typeof text === "string") {
          const parsed = parseAIResponse(text, persona);
          if (parsed && parsed.length >= 1) {
            recommendations = parsed;
            usedAI = true;
          }
        }
      } catch (e) {
        console.warn("Gemini error, falling back:", e?.message || e);
      }
    }

    if (!recommendations.length) {
      recommendations = generateFallbackGifts(persona);
    }

    while (recommendations.length < 3) {
      const extra = generateFallbackGifts(persona);
      recommendations.push(...extra.slice(0, 3 - recommendations.length));
    }

    return {
      success: true,
      personaName: name,
      age,
      ageCategory,
      recommendations: recommendations.slice(0, 3),
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
 * Generate reasoning for gift recommendation
 */
function generateReason(gift, persona) {
  const { name, interests, notes, description } = persona;

  const reasonTemplates = [
    `${name} için ilgi alanlarına uygun seçim`,
    `Kişisel notlarına dayanarak önerilen hediye`,
    `${name}'in zevklerine göre seçilmiş özel hediye`,
    `İlgi alanları göz önünde bulundurularak önerilen`,
    `Kişisel özelliklerine uygun düşünülmüş hediye`,
  ];

  // Match interests
  if (interests && Array.isArray(interests)) {
    for (const interest of interests) {
      if (
        gift.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(gift.toLowerCase().split(" ")[0])
      ) {
        return `${interest} ilgisine uygun özel seçim`;
      }
    }
  }

  // Match description keywords
  if (description) {
    const desc = String(description).toLowerCase();
    const g = gift.toLowerCase();
    if (desc.includes("yoga") || g.includes("yoga"))
      return "Açıklamasındaki yoga ilgisine uygun seçim";
    if (desc.includes("müzik") || g.includes("müzik") || g.includes("music"))
      return "Müzik zevkine hitap eden bir tercih";
    if (
      desc.includes("bahçe") ||
      desc.includes("bahçıvanlık") ||
      g.includes("bahçe")
    )
      return "Bahçe ilgisine uygun düşünülmüş hediye";
    if (desc.includes("kitap") || desc.includes("okuma") || g.includes("kitap"))
      return "Okuma sevgisine uygun bir hediye";
    if (desc.includes("kahve") || g.includes("kahve") || g.includes("coffee"))
      return "Kahve keyfine uygun seçim";
  }

  return reasonTemplates[Math.floor(Math.random() * reasonTemplates.length)];
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
      id: "gardening",
      name: "Bahçıvanlık",
      keywords: ["bahçe", "bahçıvanlık", "gardening"],
    },
    { id: "music", name: "Müzik", keywords: ["müzik", "music", "enstrüman"] },
    { id: "art", name: "Sanat & El İşi", keywords: ["sanat", "art", "el işi"] },
    {
      id: "sports",
      name: "Spor & Fitness",
      keywords: ["spor", "fitness", "yoga"],
    },
    { id: "travel", name: "Seyahat", keywords: ["seyahat", "travel"] },
    {
      id: "technology",
      name: "Teknoloji",
      keywords: ["teknoloji", "technology"],
    },
    { id: "fashion", name: "Moda & Güzellik", keywords: ["moda", "beauty"] },
    {
      id: "beverages",
      name: "Kahve & Çay",
      keywords: ["kahve", "coffee", "çay", "tea"],
    },
  ];
}

module.exports = {
  generateGiftIdeas,
  getGiftCategories,
  calculateAge,
  getAgeCategory,
};
