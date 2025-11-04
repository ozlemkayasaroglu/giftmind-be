// Test: Frontend'den tam veri gönderme simülasyonu
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

// PersonaForm'dan gelecek TAM veri (tüm alanlar dolu)
const fullFormData = {
  // Temel alanlar (PersonaForm'da var)
  name: "Full Test Persona",
  birthDate: "1990-05-15",
  interests: ["teknoloji", "kitap", "müzik"],
  notes: "Bu tam veri testi için oluşturulmuş persona",

  // Ek alanlar (PersonaForm'da henüz yok ama backend destekliyor)
  description: "Detaylı açıklama alanı",
  role: "Senior Developer",
  ageMin: 25,
  ageMax: 35,
  goals: "Kariyer hedefleri ve kişisel gelişim",
  challenges: "Zaman yönetimi ve iş-yaşam dengesi",
  interestsInput: "Raw interests: AI, ML, React, Node.js",
  behavioralInsights: "Analitik düşünen, problem çözme odaklı",
  budgetMin: 100,
  budgetMax: 500,
};

async function testFullData() {
  console.log("🧪 Full Frontend Data Test\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-jwt-token"');
    return;
  }

  console.log("📤 Gönderilecek TAM veri:");
  console.log(JSON.stringify(fullFormData, null, 2));
  console.log("\n" + "─".repeat(60));

  try {
    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(fullFormData),
    });

    const result = await response.json();

    console.log("📥 Backend Response:");
    console.log("Status:", response.status);
    console.log("Success:", result.success);

    if (result.success && result.persona) {
      console.log("\n✅ Persona oluşturuldu!");
      console.log("\n📊 Kaydedilen alanlar kontrolü:");

      const p = result.persona;
      const checkFields = [
        "name",
        "birth_date",
        "role",
        "age_min",
        "age_max",
        "goals",
        "challenges",
        "interests_raw",
        "behavioral_insights",
        "budget_min",
        "budget_max",
        "description",
        "notes_text",
      ];

      checkFields.forEach((field) => {
        const value = p[field];
        const status = value !== null && value !== undefined ? "✅" : "❌";
        console.log(`${status} ${field}: ${JSON.stringify(value)}`);
      });
    } else {
      console.log("❌ Hata:", result.message);
      console.log("Details:", result);
    }
  } catch (error) {
    console.error("❌ Network hatası:", error.message);
  }
}

testFullData();
