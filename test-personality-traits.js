// Kişilik özellikleri API test
require("dotenv").config();

const API_BASE_URL = "http://localhost:3001";

async function testPersonalityTraits() {
  console.log("🧪 Kişilik Özellikleri API Test\n");

  try {
    // 1. Tüm özellikler (düz liste)
    console.log("📋 Tüm özellikler (düz liste):");
    const allResponse = await fetch(
      `${API_BASE_URL}/api/personality-traits/all`
    );
    const allResult = await allResponse.json();

    if (allResult.success) {
      console.log("✅ Toplam özellik sayısı:", allResult.data.length);
      console.log("📝 İlk 10 özellik:", allResult.data.slice(0, 10));
    } else {
      console.log("❌ Hata:", allResult.message);
    }

    // 2. Kategorilere göre gruplu
    console.log("\n📂 Kategorilere göre gruplu:");
    const categoryResponse = await fetch(
      `${API_BASE_URL}/api/personality-traits/categories`
    );
    const categoryResult = await categoryResponse.json();

    if (categoryResult.success) {
      console.log("✅ Kategori sayısı:", categoryResult.data.length);
      categoryResult.data.forEach((category) => {
        console.log(
          `📁 ${category.category}: ${category.traits.length} özellik`
        );
        console.log(`   Örnek: ${category.traits.slice(0, 3).join(", ")}`);
      });
    } else {
      console.log("❌ Hata:", categoryResult.message);
    }

    // 3. Tam veri (tüm bilgiler)
    console.log("\n📊 Tam veri yapısı:");
    const fullResponse = await fetch(`${API_BASE_URL}/api/personality-traits`);
    const fullResult = await fullResponse.json();

    if (fullResult.success) {
      console.log("✅ Veri yapısı:");
      console.log("   - Toplam özellik:", fullResult.data.all.length);
      console.log("   - Kategori sayısı:", fullResult.data.categories.length);
      console.log("   - Kategoriler:", fullResult.data.categories.join(", "));
    } else {
      console.log("❌ Hata:", fullResult.message);
    }

    console.log("\n🎯 Frontend kullanımı:");
    console.log("   GET /api/personality-traits/all - Düz liste");
    console.log("   GET /api/personality-traits/categories - Kategorili");
    console.log("   GET /api/personality-traits - Tam veri");
  } catch (error) {
    console.error("❌ Test hatası:", error.message);
  }
}

testPersonalityTraits();
