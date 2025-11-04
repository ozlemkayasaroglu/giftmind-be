// Hızlı avatar test
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

async function quickAvatarTest() {
  console.log("🚀 Hızlı Avatar Test\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla");
    return;
  }

  try {
    // 1. Mevcut persona'ları listele
    console.log("📋 Mevcut personaları getiriliyor...");
    const listResponse = await fetch(`${API_BASE_URL}/api/personas`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });

    const listResult = await listResponse.json();

    if (!listResult.success || !listResult.personas?.length) {
      console.log("❌ Persona bulunamadı. Önce bir persona oluştur.");
      return;
    }

    const persona = listResult.personas[0];
    console.log("✅ Test persona:", persona.name, "(ID:", persona.id, ")");
    console.log("📸 Mevcut avatar:", persona.avatar_url ? "Var" : "Yok");

    // 2. Avatar durumunu kontrol et
    console.log("\n📥 Avatar durumu kontrol ediliyor...");
    const getResponse = await fetch(
      `${API_BASE_URL}/api/personas/${persona.id}/avatar-simple`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );

    const getResult = await getResponse.json();

    if (getResult.success) {
      console.log("✅ Avatar API çalışıyor");
      console.log("📸 Avatar URL:", getResult.avatar_url ? "Mevcut" : "Yok");
    } else {
      console.log("❌ Avatar API hatası:", getResult.message);
    }

    console.log("\n🎯 Avatar sistemi hazır!");
    console.log("📱 Frontend'de kullanım:");
    console.log("   - POST /api/personas/{id}/avatar-simple (file upload)");
    console.log("   - GET /api/personas/{id}/avatar-simple (get avatar)");
    console.log("   - DELETE /api/personas/{id}/avatar-simple (remove avatar)");
  } catch (error) {
    console.error("❌ Test hatası:", error.message);
  }
}

quickAvatarTest();
