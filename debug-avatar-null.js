// Avatar null sorunu debug
require("dotenv").config();

const API_BASE_URL = "https://giftmind-be-production.up.railway.app";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

async function debugAvatarNull() {
  console.log("🐛 Avatar Null Debug\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla");
    return;
  }

  try {
    // 1. Personas listesini al
    console.log("📋 Personas listesi alınıyor...");
    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });

    const result = await response.json();

    if (!result.success) {
      console.log("❌ API hatası:", result.message);
      return;
    }

    if (!result.personas?.length) {
      console.log("❌ Persona bulunamadı");
      return;
    }

    const persona = result.personas[0];
    console.log("✅ Persona bulundu:", persona.name);
    console.log("🔍 Persona alanları:");

    // Tüm alanları listele
    Object.keys(persona).forEach((key) => {
      const value = persona[key];
      const type = Array.isArray(value) ? "array" : typeof value;
      console.log(`   ${key}: ${type} = ${JSON.stringify(value)}`);
    });

    // Avatar_url özellikle kontrol et
    console.log("\n📸 Avatar durumu:");
    console.log("   avatar_url var mı?", "avatar_url" in persona);
    console.log("   avatar_url değeri:", persona.avatar_url);
    console.log("   avatar_url tipi:", typeof persona.avatar_url);

    // 2. Avatar API'sini test et
    console.log("\n🧪 Avatar API testi...");
    const avatarResponse = await fetch(
      `${API_BASE_URL}/api/personas/${persona.id}/avatar-simple`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );

    const avatarResult = await avatarResponse.json();

    console.log("📥 Avatar API Response:");
    console.log("   Status:", avatarResponse.status);
    console.log("   Success:", avatarResult.success);
    console.log("   Message:", avatarResult.message);
    console.log("   Avatar URL:", avatarResult.avatar_url);

    if (!avatarResponse.ok) {
      console.log(
        "❌ Avatar API hatası - endpoint mevcut değil veya çalışmıyor"
      );
    }
  } catch (error) {
    console.error("❌ Debug hatası:", error.message);
  }
}

debugAvatarNull();
