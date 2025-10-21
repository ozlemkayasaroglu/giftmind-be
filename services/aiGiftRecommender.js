/**
 * AI Gift Recommender Service
 * Generates personalized gift ideas based on persona information
 */

// Mock gift database categorized by interests
const giftDatabase = {
  // Reading and books
  'kitap': ['Bestseller kitap seti', 'E-kitap okuyucu', 'Kitap ayracı koleksiyonu'],
  'okumak': ['Özel ciltli klasik eser', 'Okuma lambası', 'Kitap standı'],
  'reading': ['Premium bookmark set', 'Reading chair cushion', 'Book light'],
  'books': ['Limited edition book series', 'Bookshelf organizer', 'Literary poster set'],
  
  // Cooking and food
  'yemek': ['Profesyonel bıçak seti', 'Yemek kitabı koleksiyonu', 'Özel baharat seti'],
  'cooking': ['Cast iron cookware', 'Cooking class subscription', 'Gourmet spice collection'],
  'aşçılık': ['Mutfak robotu', 'Ahşap kesme tahtası seti', 'Silikon pişirme kalıpları'],
  
  // Gardening
  'bahçe': ['Özel bitki saksıları', 'Bahçıvanlık araç seti', 'Nadir tohum koleksiyonu'],
  'bahçıvanlık': ['Mini sera kiti', 'Sulama sistemi', 'Organik gübre seti'],
  'gardening': ['Premium garden tools', 'Rare plant seeds', 'Smart watering system'],
  
  // Music
  'müzik': ['Bluetooth kulaklık', 'Vintage plak koleksiyonu', 'Müzik kutusu'],
  'music': ['Wireless headphones', 'Vinyl record collection', 'Portable speaker'],
  'enstrüman': ['Enstrüman aksesuarları', 'Müzik standı', 'Metronom'],
  
  // Art and crafts
  'sanat': ['Profesyonel boyar kalem seti', 'Canvas tuval seti', 'Sanat kitapları'],
  'art': ['Watercolor paint set', 'Sketchbook collection', 'Art easel'],
  'el işi': ['El işi malzemeleri kutusu', 'Örgü şişleri seti', 'Tasarım kalıpları'],
  
  // Sports and fitness
  'spor': ['Fitness tracker', 'Yoga matı', 'Protein shaker seti'],
  'fitness': ['Resistance bands set', 'Foam roller', 'Gym towel set'],
  'yoga': ['Premium yoga mat', 'Meditation cushion', 'Yoga block set'],
  
  // Travel
  'seyahat': ['Seyahat çantası seti', 'Dünya haritası', 'Seyahat günlüğü'],
  'travel': ['Travel organizer set', 'Scratch-off world map', 'Travel pillow'],
  
  // Technology
  'teknoloji': ['Akıllı ev cihazı', 'Wireless charger', 'Bluetooth speaker'],
  'technology': ['Smart home device', 'Portable charger', 'Tech organizer bag'],
  
  // Fashion and beauty
  'moda': ['Özel aksesuar seti', 'Parfüm koleksiyonu', 'Stil danışmanlığı'],
  'beauty': ['Skincare gift set', 'Makeup organizer', 'Beauty tools kit'],
  
  // Coffee and tea
  'kahve': ['Özel kahve çekirdekleri', 'French press', 'Kahve fincan seti'],
  'coffee': ['Coffee bean subscription', 'Espresso machine', 'Coffee grinder'],
  'çay': ['Özel çay koleksiyonu', 'Cam demlik seti', 'Çay kaşığı koleksiyonu'],
  'tea': ['Premium tea collection', 'Tea infuser set', 'Ceramic teapot']
};

// Default gifts for different age groups
const ageBasedGifts = {
  child: ['Eğitici oyuncak seti', 'Çocuk kitap koleksiyonu', 'Sanat malzemeleri kutusu'],
  young: ['Bluetooth kulaklık', 'Trendy aksesuar', 'Deneyim hediyesi'],
  adult: ['Premium ev tekstili', 'Kişisel bakım seti', 'Hobiye özel hediye'],
  senior: ['Rahat ev ayakkabısı', 'Nostaljik müzik koleksiyonu', 'Bahçe bitkileri']
};

// Generic fallback gifts
const genericGifts = [
  'Özel fotoğraf albümü',
  'Aromaterapi difüzörü',
  'Premium çikolata kutusu',
  'Kişiye özel mücevher',
  'Spa deneyim paketi',
  'Gourmet yemek sepeti',
  'Kişiselleştirilmiş kupa',
  'Dekoratif mum seti',
  'Kaliteli cüzdan',
  'Özel tasarım tişört'
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
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  
  return age;
}

/**
 * Get age category for gift recommendations
 */
function getAgeCategory(age) {
  if (!age) return 'adult';
  if (age < 13) return 'child';
  if (age < 30) return 'young';
  if (age < 65) return 'adult';
  return 'senior';
}

/**
 * Extract gift ideas from interests
 */
function getGiftsFromInterests(interests) {
  const giftIdeas = [];
  
  if (!interests || !Array.isArray(interests)) {
    return giftIdeas;
  }
  
  interests.forEach(interest => {
    const normalizedInterest = interest.toLowerCase().trim();
    
    // Direct match
    if (giftDatabase[normalizedInterest]) {
      giftIdeas.push(...giftDatabase[normalizedInterest]);
    }
    
    // Partial match
    Object.keys(giftDatabase).forEach(key => {
      if (normalizedInterest.includes(key) || key.includes(normalizedInterest)) {
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
  
  const allNotes = notes.join(' ').toLowerCase();
  
  // Check for keywords in notes
  Object.keys(giftDatabase).forEach(keyword => {
    if (allNotes.includes(keyword)) {
      giftIdeas.push(...giftDatabase[keyword]);
    }
  });
  
  return [...new Set(giftIdeas)]; // Remove duplicates
}

/**
 * Generate personalized gift recommendations
 */
function generateGiftIdeas(persona) {
  try {
    const { name, interests, birth_date, notes } = persona;
    
    // Validate input
    if (!name) {
      throw new Error('Persona name is required');
    }
    
    let giftIdeas = [];
    
    // 1. Get gifts based on interests
    const interestGifts = getGiftsFromInterests(interests);
    giftIdeas.push(...interestGifts);
    
    // 2. Get gifts based on notes
    const noteGifts = getGiftsFromNotes(notes);
    giftIdeas.push(...noteGifts);
    
    // 3. Add age-appropriate gifts
    const age = calculateAge(birth_date);
    const ageCategory = getAgeCategory(age);
    const ageGifts = ageBasedGifts[ageCategory] || ageBasedGifts.adult;
    giftIdeas.push(...ageGifts);
    
    // 4. Remove duplicates
    giftIdeas = [...new Set(giftIdeas)];
    
    // 5. If we don't have enough gifts, add generic ones
    if (giftIdeas.length < 3) {
      const remainingCount = 3 - giftIdeas.length;
      const shuffledGeneric = [...genericGifts].sort(() => Math.random() - 0.5);
      giftIdeas.push(...shuffledGeneric.slice(0, remainingCount));
    }
    
    // 6. Shuffle and select top 3
    const shuffledGifts = giftIdeas.sort(() => Math.random() - 0.5);
    const selectedGifts = shuffledGifts.slice(0, 3);
    
    // 7. Format response
    return {
      success: true,
      personaName: name,
      age: age,
      ageCategory: ageCategory,
      recommendations: selectedGifts.map((gift, index) => ({
        id: index + 1,
        title: gift,
        reason: generateReason(gift, persona),
        confidence: Math.floor(Math.random() * 30) + 70 // 70-100% confidence
      })),
      generatedAt: new Date().toISOString(),
      totalOptions: giftIdeas.length
    };
    
  } catch (error) {
    console.error('Gift recommendation error:', error);
    return {
      success: false,
      error: error.message,
      recommendations: []
    };
  }
}

/**
 * Generate reasoning for gift recommendation
 */
function generateReason(gift, persona) {
  const { name, interests, notes } = persona;
  
  // Simple reasoning based on keywords
  const reasonTemplates = [
    `${name} için ilgi alanlarına uygun seçim`,
    `Kişisel notlarına dayanarak önerilen hediye`,
    `${name}'in zevklerine göre seçilmiş özel hediye`,
    `İlgi alanları göz önünde bulundurularak önerilen`,
    `Kişisel özelliklerine uygun düşünülmüş hediye`
  ];
  
  // Check if gift relates to specific interests or notes
  if (interests && Array.isArray(interests)) {
    for (const interest of interests) {
      if (gift.toLowerCase().includes(interest.toLowerCase()) || 
          interest.toLowerCase().includes(gift.toLowerCase().split(' ')[0])) {
        return `${interest} ilgisine uygun özel seçim`;
      }
    }
  }
  
  // Return random template
  const randomIndex = Math.floor(Math.random() * reasonTemplates.length);
  return reasonTemplates[randomIndex];
}

/**
 * Get gift categories for filtering
 */
function getGiftCategories() {
  return [
    { id: 'books', name: 'Kitap & Okuma', keywords: ['kitap', 'okumak', 'reading', 'books'] },
    { id: 'cooking', name: 'Yemek & Mutfak', keywords: ['yemek', 'cooking', 'aşçılık'] },
    { id: 'gardening', name: 'Bahçıvanlık', keywords: ['bahçe', 'bahçıvanlık', 'gardening'] },
    { id: 'music', name: 'Müzik', keywords: ['müzik', 'music', 'enstrüman'] },
    { id: 'art', name: 'Sanat & El İşi', keywords: ['sanat', 'art', 'el işi'] },
    { id: 'sports', name: 'Spor & Fitness', keywords: ['spor', 'fitness', 'yoga'] },
    { id: 'travel', name: 'Seyahat', keywords: ['seyahat', 'travel'] },
    { id: 'technology', name: 'Teknoloji', keywords: ['teknoloji', 'technology'] },
    { id: 'fashion', name: 'Moda & Güzellik', keywords: ['moda', 'beauty'] },
    { id: 'beverages', name: 'Kahve & Çay', keywords: ['kahve', 'coffee', 'çay', 'tea'] }
  ];
}

module.exports = {
  generateGiftIdeas,
  getGiftCategories,
  calculateAge,
  getAgeCategory
};
