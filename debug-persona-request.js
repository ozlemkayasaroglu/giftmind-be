// Debug: PersonaForm request'ini test et
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

// Frontend'den gelen gerçek veri formatını simüle et
const frontendData = {
  // Temel alanlar (muhtemelen bunlar geliyor)
  name: "Debug Test Persona",
  birthDate: "1990-05-15",
  interests: ["teknoloji", "kitap"],
  notes: "Bu bir debug test persona'sıdır.",

  // Bu alanlar muhtemelen frontend'den gelmiyor
  description: "Explicit description field",
  role: "Test Role",
  ageMin: 25,
  ageMax: 35,
  goals: "Test goals",
  challenges: "Test challenges",
  interestsInput: "Raw interests input",
  behavioralInsights: "Test behavioral insights",
  budgetMin: 100,
  budgetMax: 500,
};

async function debugRequest() {
  console.log("🐛 Debug: PersonaForm Request Test\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-jwt-token"');
    return;
  }

  console.log("📤 Gönderilecek veri:");
  console.log(JSON.stringify(frontendData, null, 2));
  console.log("\n" + "─".repeat(50));

  try {
    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(frontendData),
    });

    const result = await response.json();

    console.log("📥 Yanıt:");
    console.log("Status:", response.status);
    console.log("Success:", result.success);

    if (result.success) {
      console.log("✅ Başarılı!");
      console.log("\n📊 Kaydedilen alanlar:");

      const persona = result.persona;
      console.log("- name:", persona.name);
      console.log("- birth_date:", persona.birth_date);
      console.log("- role:", persona.role);
      console.log("- age_min:", persona.age_min);
      console.log("- age_max:", persona.age_max);
      console.log("- goals:", persona.goals);
      console.log("- challenges:", persona.challenges);
      console.log("- interests_raw:", persona.interests_raw);
      console.log("- behavioral_insights:", persona.behavioral_insights);
      console.log("- budget_min:", persona.budget_min);
      console.log("- budget_max:", persona.budget_max);
    } else {
      console.log("❌ Hata:", result.message);
    }
  } catch (error) {
    console.error("❌ Network hatası:", error.message);
  }
}

debugRequest();
