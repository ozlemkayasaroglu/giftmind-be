// Events endpoint test
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";
const TEST_TOKEN = process.env.TEST_TOKEN || "test-token";

async function testEventsEndpoint() {
  console.log("🧪 Events Endpoint Test\n");

  if (!TEST_TOKEN || TEST_TOKEN === "test-token") {
    console.log("❌ TEST_TOKEN ayarla");
    return;
  }

  const testPersonaId = "22a1a89d-77af-48b2-b138-36e33e13111b"; // Frontend'den gelen ID

  try {
    console.log("📤 Testing events endpoint...");
    const response = await fetch(
      `${API_BASE_URL}/api/events/${testPersonaId}`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );

    const result = await response.json();

    console.log("📥 Response:");
    console.log("Status:", response.status);
    console.log("Success:", result.success);
    console.log("Data:", result.data);
    console.log("Message:", result.message);

    if (response.status === 200) {
      console.log("✅ Events endpoint çalışıyor! (Boş array döndürüyor)");
    } else {
      console.log("❌ Hata:", result.message);
    }
  } catch (error) {
    console.error("❌ Network hatası:", error.message);
  }
}

testEventsEndpoint();
