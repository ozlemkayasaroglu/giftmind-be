// Personas tablosu kolonlarını kontrol et
require("dotenv").config();
const supabase = require("./config/supabaseClient");

async function checkColumns() {
  console.log("🔍 Personas tablosu kolonları kontrol ediliyor...\n");

  try {
    // Bir kayıt çek ve kolonları gör
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .limit(1);

    if (error) {
      console.log("❌ Hata:", error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log("✅ Mevcut kolonlar:");
      const columns = Object.keys(data[0]);
      columns.forEach((col) => {
        console.log(
          `   - ${col}: ${typeof data[0][col]} (${
            data[0][col] === null ? "null" : "has value"
          })`
        );
      });

      // PersonaForm için gerekli alanları kontrol et
      const requiredFields = [
        "name",
        "birth_date",
        "interests",
        "description",
        "notes_text",
        "interests_raw",
      ];
      console.log("\n📋 PersonaForm için gerekli alanlar:");

      requiredFields.forEach((field) => {
        const exists = columns.includes(field);
        console.log(`   ${exists ? "✅" : "❌"} ${field}`);
      });
    } else {
      console.log("📝 Tablo boş - test kaydı oluşturalım");

      // Test kaydı oluştur
      const testData = {
        name: "Test Persona",
        user_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
        description: "Test açıklaması",
        interests: ["test"],
      };

      const { data: newData, error: insertError } = await supabase
        .from("personas")
        .insert([testData])
        .select("*")
        .single();

      if (insertError) {
        console.log("❌ Test kaydı oluşturulamadı:", insertError.message);
      } else {
        console.log("✅ Test kaydı oluşturuldu");
        console.log("📋 Kolonlar:", Object.keys(newData));
      }
    }
  } catch (error) {
    console.error("❌ Beklenmeyen hata:", error.message);
  }
}

checkColumns();
