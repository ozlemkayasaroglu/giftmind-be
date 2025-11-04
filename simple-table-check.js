// Basit tablo kontrolü
require("dotenv").config();
const supabase = require("./config/supabaseClient");

async function checkPersonasTable() {
  console.log("🔍 Personas tablosunu kontrol ediliyor...\n");

  try {
    // Personas tablosundan 1 kayıt çek (varsa)
    const { data, error, count } = await supabase
      .schema("private")
      .from("personas")
      .select("*", { count: "exact" })
      .limit(1);

    if (error) {
      console.log("❌ Hata:", error.message);
      console.log("💡 Muhtemel nedenler:");
      console.log("   - Tablo mevcut değil");
      console.log("   - RLS policy sorunu");
      console.log("   - Schema sorunu (private vs public)");
      return;
    }

    console.log("✅ Personas tablosu erişilebilir");
    console.log("📊 Toplam kayıt sayısı:", count);

    if (data && data.length > 0) {
      console.log("📋 Mevcut kolonlar:", Object.keys(data[0]));
      console.log("🔍 Örnek kayıt:", data[0]);
    } else {
      console.log("📝 Tablo boş (henüz kayıt yok)");
    }
  } catch (error) {
    console.error("❌ Beklenmeyen hata:", error.message);
  }
}

async function checkEventsTable() {
  console.log("\n🔍 Events tablosunu kontrol ediliyor...\n");

  try {
    const { data, error, count } = await supabase
      .schema("private")
      .from("persona_events")
      .select("*", { count: "exact" })
      .limit(1);

    if (error) {
      console.log("❌ Events tablosu hatası:", error.message);
      return;
    }

    console.log("✅ Events tablosu erişilebilir");
    console.log("📊 Toplam kayıt sayısı:", count);

    if (data && data.length > 0) {
      console.log("📋 Mevcut kolonlar:", Object.keys(data[0]));
    } else {
      console.log("📝 Events tablosu boş");
    }
  } catch (error) {
    console.error("❌ Events tablosu hatası:", error.message);
  }
}

async function main() {
  console.log("🚀 Supabase Tablo Kontrolü\n");
  console.log("📍 URL:", process.env.SUPABASE_URL);
  console.log(
    "🔑 Anon Key:",
    process.env.SUPABASE_ANON_KEY ? "Mevcut" : "Eksik"
  );
  console.log("─".repeat(50));

  await checkPersonasTable();
  await checkEventsTable();

  console.log("\n✨ Kontrol tamamlandı!");
}

main().catch(console.error);
