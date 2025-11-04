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

// Enhanced gift database with popular culture and age-specific items
const giftDatabase = {
  // Popular Culture Characters
  "küçük prens": [
    "Küçük Prens özel ciltli koleksiyon",
    "Küçük Prens figür ve gezegen seti",
    "Küçük Prens temalı not defteri ve kalem seti",
    "Küçük Prens yıldız haritası",
  ],
  "little prince": [
    "Little Prince collector's edition",
    "Little Prince figurine set",
    "Little Prince themed journal",
  ],
  gabby: [
    "Gabby's Dollhouse oyuncak evi",
    "Gabby karakterli puzzle seti",
    "Gabby temalı çanta ve aksesuarlar",
    "Gabby figür koleksiyonu",
  ],
  disney: [
    "Disney klasikleri özel kutu seti",
    "Mickey Mouse vintage koleksiyon",
    "Disney prenses figür seti",
    "Disney temalı ev dekorasyonu",
  ],
  "harry potter": [
    "Hogwarts kabul mektubu seti",
    "Harry Potter büyücü asası koleksiyonu",
    "Marauder's Map replikası",
    "Hogwarts ev renkleri eşarp seti",
  ],
  anime: [
    "Anime figür koleksiyonu",
    "Manga çizim seti ve kalemleri",
    "Cosplay aksesuarları",
    "Anime poster koleksiyonu",
  ],

  // Reading and books
  kitap: [
    "Bestseller kitap seti",
    "E-kitap okuyucu",
    "Kitap ayracı koleksiyonu",
    "Kişiye özel kitap damgası",
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
    // Aliases from frontend
    preferences,
    behavioralInsights,
    personalityTraits,
    // Events list injected by API
    events,
  } = persona || {};

  const age = calculateAge(birth_date);
  const ageCategory = getAgeCategory(age);

  let prompt = `Sen bir hediye uzmanısın. Aşağıdaki kişi için 3 adet çok kişisel ve düşünceli hediye önerisi hazırla.\n\n`;

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
  const allTraits = personality_traits || personalityTraits || [];
  if (Array.isArray(allTraits) && allTraits.length > 0) {
    prompt += `\n🧠 KİŞİLİK ÖZELLİKLERİ:\n`;
    allTraits.forEach((trait) => {
      prompt += `• ${trait}\n`;
    });
    prompt += `Bu kişilik özelliklerine uygun hediyeler seç.\n`;
  }

  // Interests and hobbies with popular culture detection
  const interestList =
    Array.isArray(interests) && interests.length
      ? interests
      : Array.isArray(preferences)
      ? preferences
      : [];
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
      if (
        lowerInterest.includes("harry potter") ||
        lowerInterest.includes("hogwarts")
      ) {
        prompt += `  ⭐ ÖZEL NOT: Harry Potter sevgisi - Hogwarts temalı ürünler, büyücülük aksesuarları veya koleksiyon ürünleri tercih et!\n`;
      }
      if (lowerInterest.includes("anime") || lowerInterest.includes("manga")) {
        prompt += `  ⭐ ÖZEL NOT: Anime/Manga sevgisi - Figürler, manga serileri, cosplay aksesuarları veya anime temalı hediyeler tercih et!\n`;
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
  const insights = behavioral_insights ?? behavioralInsights;
  if (insights) {
    prompt += `\n🔍 DAVRANIŞSAL ANALİZ:\n${String(insights)}\n`;
    prompt += `Bu davranış kalıplarına uygun hediyeler seç.\n`;
  }

  // Budget considerations
  if (budget_min != null || budget_max != null) {
    const budgetText = `${budget_min != null ? budget_min : "0"} - ${
      budget_max != null ? budget_max : "∞"
    } TL`;
    prompt += `\n💰 BÜTÇE ARALIĞI: ${budgetText}\n`;
  }

  // Recent events context
  if (Array.isArray(events) && events.length) {
    prompt += `\n📅 SON YAŞAM OLAYLARI:\n`;
    const recent = events
      .slice(0, 5)
      .map((e) => {
        const d = e.occurred_at
          ? new Date(e.occurred_at).toISOString().split("T")[0]
          : "";
        const t = e.title || e.event_type || "";
        const desc = e.description || "";
        return `• ${t}${d ? ` (${d})` : ""}${desc ? `: ${desc}` : ""}`;
      })
      .join("\n");
    prompt += `${recent}\n`;
    prompt += `Bu olayları göz önünde bulundurarak hediye seç.\n`;
  }

  prompt += `\n🎁 HEDİYE ÖNERİLERİ İÇİN TALİMATLAR:\n`;
  prompt += `• Her hediye önerisini kişinin yaşına, kişilik özelliklerine, ilgi alanlarına ve hedeflerine göre özelleştir\n`;
  prompt += `• Popüler kültür referansları varsa (Küçük Prens, Gabby, Disney vb.) mutlaka bunları kullan\n`;
  prompt += `• Bütçe aralığına uygun hediyeler öner\n`;
  prompt += `• Her hediye için neden bu kişiye uygun olduğunu detaylı açıkla\n`;
  prompt += `• Genel hediyeler yerine çok spesifik ve kişisel hediyeler tercih et\n`;
  prompt += `• Yaş grubuna uygun hediyeler seç (çocuk için oyuncak, yetişkin için kaliteli ürünler)\n`;
  prompt += `• Kişinin davranışsal özelliklerini ve zorluklarını çözecek hediyeler düşün\n\n`;

  prompt += `ÇIKTI FORMATI:\n`;
  prompt += `1. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;
  prompt += `2. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;
  prompt += `3. [Hediye Adı] - [Bu hediyenin neden bu kişiye mükemmel uyduğunun detaylı açıklaması]\n`;

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
 * Enhanced fallback function with popular culture and personality awareness
 */
function generateFallbackGifts(persona) {
  const {
    interests,
    birth_date,
    notes,
    description,
    personality_traits,
    personalityTraits,
  } = persona;
  const age = calculateAge(birth_date);
  const ageCategory = getAgeCategory(age);

  let giftIdeas = [];
  let popularCultureGifts = [];

  // Check for popular culture references in interests
  const allInterests = Array.isArray(interests) ? interests : [];
  allInterests.forEach((interest) => {
    const lowerInterest = interest.toLowerCase();

    if (
      lowerInterest.includes("küçük prens") ||
      lowerInterest.includes("little prince")
    ) {
      popularCultureGifts.push(
        "Küçük Prens özel ciltli kitap seti",
        "Küçük Prens figür koleksiyonu",
        "Küçük Prens temalı not defteri"
      );
    }
    if (lowerInterest.includes("gabby")) {
      popularCultureGifts.push(
        "Gabby's Dollhouse oyuncak seti",
        "Gabby karakterli puzzle",
        "Gabby temalı çanta"
      );
    }
    if (lowerInterest.includes("disney")) {
      popularCultureGifts.push(
        "Disney klasikleri koleksiyon kutusu",
        "Mickey Mouse vintage poster",
        "Disney prenses figür seti"
      );
    }
    if (lowerInterest.includes("harry potter")) {
      popularCultureGifts.push(
        "Hogwarts mektup seti",
        "Harry Potter büyücü asası",
        "Marauder's Map replikası"
      );
    }
    if (lowerInterest.includes("anime") || lowerInterest.includes("manga")) {
      popularCultureGifts.push(
        "Anime figür koleksiyonu",
        "Manga çizim seti",
        "Cosplay aksesuarları"
      );
    }
  });

  // Add popular culture gifts first (they're most personal)
  giftIdeas.push(...popularCultureGifts);

  // Personality-based gifts
  const allTraits = personality_traits || personalityTraits || [];
  if (Array.isArray(allTraits)) {
    allTraits.forEach((trait) => {
      const lowerTrait = trait.toLowerCase();

      if (lowerTrait.includes("yaratıcı") || lowerTrait.includes("sanat")) {
        giftIdeas.push(
          "Profesyonel sanat malzemeleri seti",
          "Yaratıcılık atölyesi kursu"
        );
      }
      if (lowerTrait.includes("kitap") || lowerTrait.includes("okuma")) {
        giftIdeas.push("Özel ciltli klasik eser koleksiyonu", "Okuma lambası");
      }
      if (lowerTrait.includes("teknoloji")) {
        giftIdeas.push("Akıllı ev cihazı", "Teknoloji aksesuarları");
      }
      if (lowerTrait.includes("spor") || lowerTrait.includes("aktif")) {
        giftIdeas.push("Fitness tracker", "Spor ekipmanları seti");
      }
      if (lowerTrait.includes("müzik")) {
        giftIdeas.push("Kaliteli kulaklık", "Müzik enstrümanı aksesuarları");
      }
    });
  }

  // Age-appropriate gifts
  const ageGifts = ageBasedGifts[ageCategory] || ageBasedGifts.adult;
  giftIdeas.push(...ageGifts);

  // Interest-based gifts
  const interestGifts = getGiftsFromInterests(interests);
  giftIdeas.push(...interestGifts);

  // Notes and description based
  const combinedNotes = Array.isArray(notes) ? [...notes] : [];
  if (description) combinedNotes.push(String(description));
  const noteGifts = getGiftsFromNotes(combinedNotes);
  giftIdeas.push(...noteGifts);

  // Remove duplicates and prioritize popular culture gifts
  giftIdeas = [...new Set(giftIdeas)];

  // Ensure popular culture gifts are prioritized
  const prioritizedGifts = [
    ...popularCultureGifts,
    ...giftIdeas.filter((gift) => !popularCultureGifts.includes(gift)),
  ];

  // Fill with generic gifts if needed
  if (prioritizedGifts.length < 3) {
    const remaining = 3 - prioritizedGifts.length;
    const shuffledGeneric = [...genericGifts].sort(() => Math.random() - 0.5);
    prioritizedGifts.push(...shuffledGeneric.slice(0, remaining));
  }

  const selected = prioritizedGifts.slice(0, 3);
  return selected.map((gift, index) => ({
    id: index + 1,
    title: gift,
    reason: generateEnhancedReason(gift, persona),
    confidence: popularCultureGifts.includes(gift)
      ? Math.floor(Math.random() * 10) + 90 // 90-100% for popular culture matches
      : Math.floor(Math.random() * 30) + 70, // 70-100% for others
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
 * Generate enhanced reasoning for gift recommendation
 */
function generateEnhancedReason(gift, persona) {
  const {
    name,
    interests,
    notes,
    description,
    personality_traits,
    personalityTraits,
    role,
    goals,
    challenges,
  } = persona;
  const age = calculateAge(persona.birth_date);
  const giftLower = gift.toLowerCase();

  // Popular culture specific reasons
  if (
    giftLower.includes("küçük prens") ||
    giftLower.includes("little prince")
  ) {
    return `${name}'in Küçük Prens sevgisine özel olarak seçilmiş, bu eşsiz hikayenin büyüsünü yaşatacak hediye`;
  }
  if (giftLower.includes("gabby")) {
    return `Gabby's Dollhouse tutkusuna uygun, yaratıcılığını ve hayal gücünü destekleyecek özel hediye`;
  }
  if (
    giftLower.includes("disney") ||
    giftLower.includes("mickey") ||
    giftLower.includes("minnie")
  ) {
    return `Disney sevgisini yansıtan, çocukluk anılarını canlandıracak nostaljik ve özel hediye`;
  }
  if (giftLower.includes("harry potter") || giftLower.includes("hogwarts")) {
    return `Harry Potter dünyasına olan tutkusunu besleyecek, büyücülük hissini yaşatacak koleksiyon hediyesi`;
  }
  if (giftLower.includes("anime") || giftLower.includes("manga")) {
    return `Anime/manga sevgisine uygun, Japon kültürüne olan ilgisini destekleyecek özel hediye`;
  }

  // Age-specific reasoning
  if (age) {
    if (
      age <= 12 &&
      (giftLower.includes("oyuncak") || giftLower.includes("eğitici"))
    ) {
      return `${age} yaşındaki ${name} için yaş grubuna uygun, öğrenmeyi eğlenceli hale getirecek hediye`;
    }
    if (
      age >= 13 &&
      age <= 17 &&
      (giftLower.includes("teknoloji") || giftLower.includes("trend"))
    ) {
      return `Genç yaşta olan ${name}'in teknoloji ilgisine ve trend takibine uygun modern hediye`;
    }
    if (
      age >= 18 &&
      age <= 30 &&
      (giftLower.includes("kariyer") || giftLower.includes("gelişim"))
    ) {
      return `Genç yetişkin ${name}'in kariyer hedeflerini destekleyecek, kişisel gelişimine katkı sağlayacak hediye`;
    }
  }

  // Personality traits matching
  const allTraits = personality_traits || personalityTraits || [];
  if (Array.isArray(allTraits)) {
    for (const trait of allTraits) {
      const traitLower = trait.toLowerCase();
      if (
        traitLower.includes("yaratıcı") &&
        (giftLower.includes("sanat") || giftLower.includes("yaratıc"))
      ) {
        return `${name}'in yaratıcı kişiliğine mükemmel uyum sağlayan, sanatsal yeteneklerini geliştirecek hediye`;
      }
      if (traitLower.includes("kitap") && giftLower.includes("kitap")) {
        return `Kitap seven kişiliğine uygun, okuma keyfini artıracak özenle seçilmiş hediye`;
      }
      if (traitLower.includes("teknoloji") && giftLower.includes("teknoloji")) {
        return `Teknoloji meraklısı kişiliğine uygun, günlük yaşamını kolaylaştıracak yenilikçi hediye`;
      }
      if (
        traitLower.includes("spor") &&
        (giftLower.includes("spor") || giftLower.includes("fitness"))
      ) {
        return `Aktif ve spor seven kişiliğine uygun, sağlıklı yaşam tarzını destekleyecek hediye`;
      }
    }
  }

  // Role-based reasoning
  if (role) {
    const roleLower = String(role).toLowerCase();
    if (roleLower.includes("öğretmen") && giftLower.includes("eğitim")) {
      return `Öğretmen olan ${name}'in mesleğini destekleyecek, eğitim kalitesini artıracak hediye`;
    }
    if (roleLower.includes("doktor") && giftLower.includes("sağlık")) {
      return `Sağlık alanında çalışan ${name}'in meslek hayatına katkı sağlayacak hediye`;
    }
    if (roleLower.includes("mühendis") && giftLower.includes("teknoloji")) {
      return `Mühendis olan ${name}'in teknik ilgisine uygun, profesyonel gelişimini destekleyecek hediye`;
    }
  }

  // Goals-based reasoning
  if (goals && giftLower.includes("gelişim")) {
    return `${name}'in "${goals}" hedefine ulaşmasına destek olacak, kişisel gelişimini hızlandıracak hediye`;
  }

  // Interest matching with enhanced descriptions
  if (interests && Array.isArray(interests)) {
    for (const interest of interests) {
      const interestLower = interest.toLowerCase();
      if (
        giftLower.includes(interestLower) ||
        interestLower.includes(giftLower.split(" ")[0])
      ) {
        return `${name}'in ${interest} tutkusuna özel olarak seçilmiş, bu ilgi alanındaki deneyimini zenginleştirecek hediye`;
      }
    }
  }

  // Description and notes matching
  const allText = [description, ...(Array.isArray(notes) ? notes : [notes])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (allText) {
    if (allText.includes("yoga") && giftLower.includes("yoga")) {
      return `Yoga pratiğine olan bağlılığını destekleyecek, iç huzurunu artıracak özel hediye`;
    }
    if (
      allText.includes("müzik") &&
      (giftLower.includes("müzik") || giftLower.includes("music"))
    ) {
      return `Müzik tutkusunu besleyecek, melodi dünyasındaki yolculuğunu zenginleştirecek hediye`;
    }
    if (allText.includes("bahçe") && giftLower.includes("bahçe")) {
      return `Bahçıvanlık sevgisine uygun, doğayla bağını güçlendirecek yeşil hediye`;
    }
    if (allText.includes("kahve") && giftLower.includes("kahve")) {
      return `Kahve ritüellerini önemseyen ${name} için, bu özel anları daha keyifli hale getirecek hediye`;
    }
  }

  // Default enhanced reasons
  const enhancedTemplates = [
    `${name}'in benzersiz kişiliğine özel olarak düşünülmüş, yaşam kalitesini artıracak hediye`,
    `Kişisel özelliklerine mükemmel uyum sağlayan, günlük yaşamına değer katacak özenli seçim`,
    `${name}'in ilgi alanlarını destekleyecek, yeni deneyimler yaşamasını sağlayacak hediye`,
    `Kişisel zevklerine hitap eden, uzun süre kullanacağı kaliteli ve düşünceli hediye`,
    `${name}'in yaşam tarzına uygun, hem pratik hem de anlamlı olan özel hediye`,
  ];

  return enhancedTemplates[
    Math.floor(Math.random() * enhancedTemplates.length)
  ];
}

/**
 * Generate reasoning for gift recommendation (legacy function)
 */
function generateReason(gift, persona) {
  return generateEnhancedReason(gift, persona);
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
