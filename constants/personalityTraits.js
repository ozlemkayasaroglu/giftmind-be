// Kişilik Özellikleri - Türkçe
// Persona oluştururken kullanılacak kişilik özellikleri listesi

const PERSONALITY_TRAITS = {
  // Sosyal Özellikler
  social: {
    category: "Sosyal Özellikler",
    traits: [
      "Dışa dönük",
      "İçe dönük",
      "Sosyal",
      "Utangaç",
      "Konuşkan",
      "Sessiz",
      "Arkadaş canlısı",
      "Çekingen",
      "Lider ruhlu",
      "Takipçi",
      "Empati kurabilen",
      "Anlayışlı",
      "Yardımsever",
      "Bağımsız",
      "Takım oyuncusu",
      "Diplomatik",
      "Açık sözlü",
      "Nazik",
      "Samimi",
      "Güvenilir",
    ],
  },

  // Duygusal Özellikler
  emotional: {
    category: "Duygusal Özellikler",
    traits: [
      "Sakin",
      "Enerjik",
      "Sabırlı",
      "Aceleci",
      "Optimist",
      "Pesimist",
      "Duygusal",
      "Mantıklı",
      "Hassas",
      "Güçlü",
      "Neşeli",
      "Ciddi",
      "Romantik",
      "Pratik",
      "Spontan",
      "Planlı",
      "Rahat",
      "Gergin",
      "Pozitif",
      "Eleştirel",
    ],
  },

  // Zihinsel Özellikler
  intellectual: {
    category: "Zihinsel Özellikler",
    traits: [
      "Meraklı",
      "Analitik",
      "Yaratıcı",
      "Sezgisel",
      "Detaycı",
      "Büyük resmi gören",
      "Öğrenmeyi seven",
      "Araştırmacı",
      "Yenilikçi",
      "Geleneksel",
      "Deneyci",
      "Eleştirel düşünen",
      "Açık fikirli",
      "Kararlı",
      "Esnek",
      "Odaklı",
      "Dağınık",
      "Organize",
      "Sistematik",
    ],
  },

  // Yaşam Tarzı
  lifestyle: {
    category: "Yaşam Tarzı",
    traits: [
      "Aktif",
      "Maceracı",
      "Güvenli oynamayı seven",
      "Seyahat seven",
      "Ev tipi",
      "Spor seven",
      "Kitap kurdu",
      "Teknoloji meraklısı",
      "Doğa seven",
      "Şehir hayatını seven",
      "Kırsal yaşamı tercih eden",
      "Gece kuşu",
      "Sabah insanı",
      "Minimalist",
      "Koleksiyoncu",
      "Tasarruflu",
      "Cömert",
    ],
  },

  // İş ve Kariyer
  professional: {
    category: "İş ve Kariyer",
    traits: [
      "Hırslı",
      "Mütevazı",
      "Çalışkan",
      "Perfeksiyonist",
      "Rekabetçi",
      "İşbirlikçi",
      "Risk alan",
      "Güvenli oynayan",
      "Lider",
      "Destekleyici",
      "Bağımsız çalışan",
      "Takım halinde çalışan",
      "Detay odaklı",
      "Strateji odaklı",
      "Sonuç odaklı",
      "Süreç odaklı",
    ],
  },

  // Hobiler ve İlgi Alanları
  interests: {
    category: "Hobiler ve İlgi Alanları",
    traits: [
      "Sanat seven",
      "Müzik seven",
      "Film/dizi meraklısı",
      "Oyun seven",
      "Spor yapan",
      "Yemek pişirmeyi seven",
      "Bahçıvanlık yapan",
      "El işi yapan",
      "Fotoğraf çeken",
      "Yazı yazan",
      "Blog tutan",
      "Sosyal medya aktif",
      "Teknoloji takipçisi",
      "Moda takipçisi",
      "Antika meraklısı",
      "DIY projeleri yapan",
      "Gönüllü çalışan",
      "Eğitim alan",
      "Öğreten",
    ],
  },
};

// Tüm özellikleri düz liste olarak
const ALL_TRAITS = Object.values(PERSONALITY_TRAITS)
  .flatMap((category) => category.traits)
  .sort();

// Kategorilere göre gruplu liste
const TRAITS_BY_CATEGORY = Object.entries(PERSONALITY_TRAITS).map(
  ([key, value]) => ({
    key,
    category: value.category,
    traits: value.traits,
  })
);

// API endpoint için
const getPersonalityTraits = () => ({
  success: true,
  data: {
    all: ALL_TRAITS,
    byCategory: TRAITS_BY_CATEGORY,
    categories: Object.keys(PERSONALITY_TRAITS),
  },
});

module.exports = {
  PERSONALITY_TRAITS,
  ALL_TRAITS,
  TRAITS_BY_CATEGORY,
  getPersonalityTraits,
};
