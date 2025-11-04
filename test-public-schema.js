// Public schema kontrolü
require("dotenv").config();
const supabase = require("./config/supabaseClient");

async function testPublicSchema() {
  console.log("🔍 Public schema kontrolü...\n");

  try {
    // Public schema'da personas tablosu var mı?
    const { data, error } = await supabase
      .from("personas") // schema belirtmeden (default: public)
      .select("*")
      .limit(1);

    if (error) {
      console.log("❌ Public personas hatası:", error.message);
    } else {
      console.log("✅ Public personas tablosu mevcut");
      if (data && data.length > 0) {
        console.log("📋 Kolonlar:", Object.keys(data[0]));
      }
    }

    // Events tablosu
    const { data: events, error: evError } = await supabase
      .from("persona_events")
      .select("*")
      .limit(1);

    if (evError) {
      console.log("❌ Public events hatası:", evError.message);
    } else {
      console.log("✅ Public events tablosu mevcut");
    }
  } catch (error) {
    console.error("❌ Genel hata:", error.message);
  }
}

testPublicSchema();
