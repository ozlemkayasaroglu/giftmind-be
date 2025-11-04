// PersonaForm API test
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "your-jwt-token-here";

// Test verisi - PersonaForm formatı
const testPersonaData = {
  name: "API Test Persona",
  birthDate: "1990-05-15",
  interests: ["teknoloji", "kitap", "müzik"],
  notes: "Bu bir API test persona'sıdır.",
};

async function testPersonaAPI() {
  console.log("🧪 PersonaForm API Testi\n");
  console.log("📍 API URL:", API_BASE_URL);
  console.log(
    "🔑 Token:",
    TEST_TOKEN ? "Mevcut" : "Eksik (TEST_TOKEN env var ayarla)"
  );
  console.log("─".repeat(50));

  if (!TEST_TOKEN || TEST_TOKEN === "your-jwt-token-here") {
    console.log("❌ Geçerli bir TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-actual-jwt-token"');
    return;
  }

  try {
    // 1. Persona oluştur
    console.log("📤 Persona oluşturuluyor...");
    const createResponse = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(testPersonaData),
    });

    const createResult = await createResponse.json();

    if (createResponse.ok) {
      console.log("✅ Persona oluşturuldu!");
      console.log("📋 ID:", createResult.persona?.id);
      console.log("📋 Name:", createResult.persona?.name);

      // 2. Persona'ları listele
      console.log("\n📋 Persona listesi alınıyor...");
      const listResponse = await fetch(`${API_BASE_URL}/api/personas`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      });

      const listResult = await listResponse.json();
      if (listResponse.ok) {
        console.log("✅ Liste alındı!");
        console.log("📊 Toplam:", listResult.personas?.length || 0);
      } else {
        console.log("❌ Liste hatası:", listResult.message);
      }
    } else {
      console.log("❌ Persona oluşturulamadı:");
      console.log("Status:", createResponse.status);
      console.log("Error:", createResult.message);
      console.log("Details:", createResult);
    }
  } catch (error) {
    console.error("❌ Network hatası:", error.message);
  }
}

testPersonaAPI();
