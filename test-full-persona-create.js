// Tam PersonaForm verisi ile test
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

// PersonaForm'dan gelecek tam veri
const fullPersonaData = {
  // Temel alanlar
  name: "Ahmet Teknoloji Uzmanı",
  birthDate: "1985-03-15",
  interests: ["teknoloji", "yapay zeka", "yazılım geliştirme", "kitap okuma"],
  notes:
    "Teknoloji alanında 10+ yıl deneyimi olan, yeni teknolojileri takip etmeyi seven bir uzman.",

  // Ek alanlar
  description: "Senior yazılım geliştirici ve teknoloji meraklısı",
  role: "Senior Software Developer",
  ageMin: 35,
  ageMax: 45,
  goals: "Yeni teknolojileri öğrenmek ve projelerinde uygulamak",
  challenges: "Hızla değişen teknoloji dünyasına ayak uydurmak",
  interestsInput: "AI, Machine Learning, React, Node.js",
  behavioralInsights: "Detaycı, analitik düşünen, problem çözme odaklı",
  budgetMin: 100,
  budgetMax: 500,
};

async function testFullPersonaCreate() {
  console.log("🧪 Tam PersonaForm Verisi Testi\n");
  console.log("📊 Test verisi:");
  console.log(JSON.stringify(fullPersonaData, null, 2));
  console.log("\n" + "─".repeat(50));

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ Geçerli bir TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-actual-jwt-token"');
    console.log("\n💡 Token olmadan sadece veri yapısını kontrol ediyoruz...");

    // Veri yapısını kontrol et
    console.log("\n📋 Gönderilecek veri alanları:");
    Object.entries(fullPersonaData).forEach(([key, value]) => {
      const type = Array.isArray(value) ? "array" : typeof value;
      console.log(
        `   ${key}: ${type} (${
          Array.isArray(value) ? value.length + " items" : value
        })`
      );
    });
    return;
  }

  try {
    console.log("📤 Persona oluşturuluyor...");

    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(fullPersonaData),
    });

    const result = await response.json();

    console.log("\n📥 Yanıt:");
    console.log("Status:", response.status);
    console.log("Success:", result.success);

    if (response.ok && result.success) {
      console.log("✅ Persona başarıyla oluşturuldu!");
      console.log("\n📋 Oluşturulan persona:");
      console.log("ID:", result.persona?.id);
      console.log("Name:", result.persona?.name);
      console.log("Birth Date:", result.persona?.birth_date);
      console.log("Interests:", result.persona?.interests);
      console.log("Role:", result.persona?.role);
      console.log(
        "Budget:",
        result.persona?.budget_min,
        "-",
        result.persona?.budget_max
      );

      // Tüm alanları göster
      console.log("\n📊 Tüm kaydedilen alanlar:");
      Object.entries(result.persona || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        }
      });
    } else {
      console.log("❌ Hata oluştu:");
      console.log("Message:", result.message);
      console.log("Details:", result);

      if (
        result.message?.includes("column") ||
        result.message?.includes("does not exist")
      ) {
        console.log(
          "\n💡 Çözüm: Supabase'de update_personas_table.sql dosyasını çalıştır"
        );
      }
    }
  } catch (error) {
    console.error("❌ Network hatası:", error.message);
  }
}

testFullPersonaCreate();
