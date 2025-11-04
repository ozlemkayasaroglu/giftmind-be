// PersonaForm entegrasyonu test dosyası
const fetch = require("node-fetch");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const TEST_TOKEN = process.env.TEST_TOKEN || "your-test-token-here";

// Test verisi - PersonaForm'dan gelecek format
const testPersonaData = {
  name: "Test Persona",
  birthDate: "1990-05-15", // PersonaForm camelCase format
  interests: ["teknoloji", "kitap", "müzik"], // array format
  notes:
    "Bu bir test persona'sıdır. Teknoloji meraklısı ve kitap okumayı seviyor.", // string format
};

// Backend'e gönderilecek format
const backendPayload = {
  name: testPersonaData.name,
  birthDate: testPersonaData.birthDate, // camelCase - backend her ikisini de destekliyor
  interests: testPersonaData.interests,
  notes: testPersonaData.notes, // backend bunu description'a map edecek
  description: testPersonaData.notes, // explicit olarak da gönderebiliriz
};

async function testCreatePersona() {
  console.log("🧪 Testing PersonaForm integration...\n");

  try {
    console.log("📤 Sending data:", JSON.stringify(backendPayload, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(backendPayload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Persona created successfully!");
      console.log("📥 Response:", JSON.stringify(result, null, 2));

      // Test update
      if (result.persona?.id) {
        await testUpdatePersona(result.persona.id);
      }
    } else {
      console.log("❌ Error creating persona:");
      console.log("Status:", response.status);
      console.log("Response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

async function testUpdatePersona(personaId) {
  console.log("\n🔄 Testing persona update...");

  const updateData = {
    name: "Updated Test Persona",
    birthDate: "1985-03-20",
    interests: ["teknoloji", "spor", "seyahat"],
    notes: "Güncellenen test persona'sı. Spor ve seyahat de eklendi.",
  };

  try {
    console.log("📤 Updating with data:", JSON.stringify(updateData, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/personas/${personaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Persona updated successfully!");
      console.log("📥 Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ Error updating persona:");
      console.log("Status:", response.status);
      console.log("Response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

async function testGetPersonas() {
  console.log("\n📋 Testing get all personas...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Personas retrieved successfully!");
      console.log(`📊 Found ${result.personas?.length || 0} personas`);
      if (result.personas?.length > 0) {
        console.log(
          "📥 First persona:",
          JSON.stringify(result.personas[0], null, 2)
        );
      }
    } else {
      console.log("❌ Error getting personas:");
      console.log("Status:", response.status);
      console.log("Response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

// Ana test fonksiyonu
async function runTests() {
  console.log("🚀 PersonaForm Integration Tests\n");
  console.log("API Base URL:", API_BASE_URL);
  console.log(
    "Using Token:",
    TEST_TOKEN ? "Yes" : "No (set TEST_TOKEN env var)"
  );
  console.log("─".repeat(50));

  await testCreatePersona();
  await testGetPersonas();

  console.log("\n✨ Tests completed!");
}

// Eğer doğrudan çalıştırılıyorsa testleri başlat
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreatePersona,
  testUpdatePersona,
  testGetPersonas,
  runTests,
};
