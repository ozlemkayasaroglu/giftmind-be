// Ek detaylar alanları test
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

// PersonaForm'dan gelecek ek detaylar verisi
const ekDetaylarData = {
  // Temel alanlar
  name: "Ek Detaylar Test Persona",
  birthDate: "1990-05-15",
  interests: ["teknoloji", "kitap"],
  notes: "Temel notlar alanı",

  // Ek detaylar bölümü
  description:
    "Bu genel açıklama alanıdır. Persona hakkında detaylı bilgi içerir.",
  behavioralInsights:
    "Davranışsal içgörüler: Analitik düşünen, problem çözme odaklı, detaycı yaklaşım sergiler.",
  notes_text: "İç notlar: Özel notlar ve gözlemler burada yer alır.",

  // Diğer alanlar
  role: "Test Role",
  goals: "Test hedefleri",
  challenges: "Test zorlukları",
};

async function testEkDetaylar() {
  console.log("🧪 Ek Detaylar Alanları Test\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-jwt-token"');
    console.log("\n💡 Token olmadan sadece veri yapısını kontrol ediyoruz...");

    console.log("\n📊 Gönderilecek ek detaylar:");
    console.log("1. Genel Açıklama:", ekDetaylarData.description);
    console.log("2. Davranışsal İçgörüler:", ekDetaylarData.behavioralInsights);
    console.log("3. İç Notlar:", ekDetaylarData.notes_text);
    console.log("\n📋 Backend mapping:");
    console.log("   description → personas.description");
    console.log("   behavioralInsights → personas.behavioral_insights");
    console.log("   notes_text → personas.notes_text");
    return;
  }

  try {
    console.log("📤 Ek detaylarla persona oluşturuluyor...");
    console.log("📊 Test verisi:");
    console.log(JSON.stringify(ekDetaylarData, null, 2));
    console.log("\n" + "─".repeat(60));

    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(ekDetaylarData),
    });

    const result = await response.json();

    console.log("📥 Response:");
    console.log("Status:", response.status);
    console.log("Success:", result.success);

    if (response.ok && result.success) {
      console.log("✅ Persona oluşturuldu!");

      const persona = result.persona;
      console.log("\n📋 Ek detaylar kontrolü:");
      console.log(
        "1. Genel Açıklama (description):",
        persona.description ? "✅ Var" : "❌ Yok"
      );
      console.log("   Değer:", persona.description);

      console.log(
        "2. Davranışsal İçgörüler (behavioral_insights):",
        persona.behavioral_insights ? "✅ Var" : "❌ Yok"
      );
      console.log("   Değer:", persona.behavioral_insights);

      console.log(
        "3. İç Notlar (notes_text):",
        persona.notes_text ? "✅ Var" : "❌ Yok"
      );
      console.log("   Değer:", persona.notes_text);

      console.log("\n📊 Tüm kaydedilen alanlar:");
      Object.entries(persona).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          console.log(
            `   ${key}: ${typeof value} = ${JSON.stringify(value).substring(
              0,
              50
            )}...`
          );
        }
      });
    } else {
      console.log("❌ Persona oluşturulamadı:");
      console.log("Status:", response.status);
      console.log("Message:", result.message);
      console.log("Error Details:", result);

      if (response.status === 500) {
        console.log("\n💡 500 hatası nedenleri:");
        console.log("   - Supabase tablo yapısı eksik");
        console.log("   - RLS policy sorunu");
        console.log("   - Kolon tipi uyumsuzluğu");
        console.log("   - Auth token sorunu");
      }
    }
  } catch (error) {
    console.error("❌ Network hatası:", error.message);
  }
}

testEkDetaylar();
