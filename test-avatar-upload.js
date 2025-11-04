// Avatar upload test
const FormData = require("form-data");
const fs = require("fs");
const fetch = require("node-fetch");
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

async function testAvatarUpload() {
  console.log("🖼️ Avatar Upload Test\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla:");
    console.log('   export TEST_TOKEN="your-jwt-token"');
    return;
  }

  // Test için basit bir image buffer oluştur (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x37, 0x6e, 0xf9, 0x24, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  try {
    // 1. Önce bir persona oluştur
    console.log("📤 Creating test persona...");
    const personaResponse = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        name: "Avatar Test Persona",
        birthDate: "1990-01-01",
        interests: ["test"],
        notes: "Avatar upload test persona",
      }),
    });

    const personaResult = await personaResponse.json();

    if (!personaResponse.ok || !personaResult.success) {
      console.log("❌ Persona oluşturulamadı:", personaResult.message);
      return;
    }

    const personaId = personaResult.persona.id;
    console.log("✅ Persona oluşturuldu:", personaId);

    // 2. Avatar upload
    console.log("\n📤 Uploading avatar...");

    const formData = new FormData();
    formData.append("avatar", testImageBuffer, {
      filename: "test-avatar.png",
      contentType: "image/png",
    });

    const uploadResponse = await fetch(
      `${API_BASE_URL}/api/personas/${personaId}/avatar-simple`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    const uploadResult = await uploadResponse.json();

    console.log("📥 Upload Response:");
    console.log("Status:", uploadResponse.status);
    console.log("Success:", uploadResult.success);

    if (uploadResult.success) {
      console.log("✅ Avatar uploaded successfully!");
      console.log("Avatar ID:", uploadResult.avatar?.id);
      console.log("Object Path:", uploadResult.path);
      console.log(
        "Preview URL:",
        uploadResult.previewUrl ? "Generated" : "Not generated"
      );

      // 3. Avatar'ı geri al
      console.log("\n📥 Getting avatar...");
      const getResponse = await fetch(
        `${API_BASE_URL}/api/personas/${personaId}/avatar-simple`,
        {
          headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        }
      );

      const getResult = await getResponse.json();

      if (getResult.success) {
        console.log("✅ Avatar retrieved successfully!");
        console.log("Avatar data:", getResult.avatar);
      } else {
        console.log("❌ Avatar retrieval failed:", getResult.message);
      }
    } else {
      console.log("❌ Avatar upload failed:", uploadResult.message);
      console.log("Details:", uploadResult);
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testAvatarUpload();
