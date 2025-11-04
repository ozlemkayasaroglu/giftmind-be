// Basic Avatar System Test
require("dotenv").config();

const API_BASE_URL = "https://giftmind-be-production.up.railway.app";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

// Test için 1x1 pixel kırmızı PNG base64
const TEST_AVATAR_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function testBasicAvatar() {
  console.log("🧪 Basic Avatar System Test\n");
  console.log("🌐 API URL:", API_BASE_URL);
  console.log("🔑 Token:", TEST_TOKEN ? "Mevcut" : "Eksik");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-jwt-token"');
    return;
  }

  try {
    // 1. Önce personas listesini al
    console.log("📋 Personas listesi alınıyor...");
    const listResponse = await fetch(`${API_BASE_URL}/api/personas`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });

    const listResult = await listResponse.json();

    if (!listResult.success || !listResult.personas?.length) {
      console.log("❌ Persona bulunamadı");
      return;
    }

    const persona = listResult.personas[0];
    console.log("✅ Test persona:", persona.name, "(ID:", persona.id, ")");

    // 2. Basic avatar endpoint'ini test et (GET)
    console.log("\n📥 Avatar durumu kontrol ediliyor...");
    const getResponse = await fetch(
      `${API_BASE_URL}/api/personas/${persona.id}/avatar-basic`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );

    console.log("GET Response Status:", getResponse.status);

    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log("✅ GET avatar-basic çalışıyor");
      console.log("📸 Mevcut avatar:", getResult.avatar_url ? "Var" : "Yok");
    } else {
      const getError = await getResponse.json();
      console.log("❌ GET avatar-basic hatası:", getError.message);
    }

    // 3. Avatar upload test et (POST)
    console.log("\n📤 Avatar upload test ediliyor...");
    const uploadResponse = await fetch(
      `${API_BASE_URL}/api/personas/${persona.id}/avatar-basic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          avatar_data: TEST_AVATAR_BASE64,
        }),
      }
    );

    console.log("POST Response Status:", uploadResponse.status);

    const uploadResult = await uploadResponse.json();

    if (uploadResponse.ok) {
      console.log("✅ Avatar upload başarılı!");
      console.log(
        "📸 Yeni avatar URL:",
        uploadResult.avatar_url ? "Kaydedildi" : "Kaydedilemedi"
      );
      console.log("📊 Response:", {
        success: uploadResult.success,
        message: uploadResult.message,
        hasAvatarUrl: !!uploadResult.avatar_url,
      });
    } else {
      console.log("❌ Avatar upload hatası:");
      console.log("   Status:", uploadResponse.status);
      console.log("   Message:", uploadResult.message);
      console.log("   Full response:", uploadResult);
    }

    // 4. Upload sonrası kontrol
    if (uploadResponse.ok) {
      console.log("\n🔍 Upload sonrası kontrol...");
      const checkResponse = await fetch(
        `${API_BASE_URL}/api/personas/${persona.id}/avatar-basic`,
        {
          headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        }
      );

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        console.log("✅ Avatar kaydedildi ve okunabilir");
        console.log(
          "📸 Avatar URL uzunluğu:",
          checkResult.avatar_url?.length || 0
        );
      }
    }
  } catch (error) {
    console.error("❌ Test hatası:", error.message);
  }
}

// Test'i çalıştır
testBasicAvatar();
