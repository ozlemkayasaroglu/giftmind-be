// Supabase tablolarını kontrol etme scripti
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log("🔍 Supabase tablolarını kontrol ediliyor...\n");

  try {
    // 1. Personas tablosunu kontrol et
    console.log("📋 private.personas tablosu:");
    const { data: personas, error: personasError } = await supabase
      .schema("private")
      .from("personas")
      .select("*")
      .limit(1);

    if (personasError) {
      console.log("❌ Personas tablosu hatası:", personasError.message);
    } else {
      console.log("✅ Personas tablosu mevcut");
      if (personas.length > 0) {
        console.log("📊 Örnek veri yapısı:", Object.keys(personas[0]));
      }
    }

    // 2. Persona events tablosunu kontrol et
    console.log("\n📋 private.persona_events tablosu:");
    const { data: events, error: eventsError } = await supabase
      .schema("private")
      .from("persona_events")
      .select("*")
      .limit(1);

    if (eventsError) {
      console.log("❌ Events tablosu hatası:", eventsError.message);
    } else {
      console.log("✅ Events tablosu mevcut");
      if (events.length > 0) {
        console.log("📊 Örnek veri yapısı:", Object.keys(events[0]));
      }
    }

    // 3. Tablo şemasını kontrol et (PostgreSQL)
    console.log("\n🔍 Personas tablo şeması:");
    const { data: schema, error: schemaError } = await supabase.rpc(
      "get_table_schema",
      {
        schema_name: "private",
        table_name: "personas",
      }
    );

    if (schemaError) {
      console.log("⚠️ Şema bilgisi alınamadı:", schemaError.message);
    } else if (schema) {
      console.log("📋 Kolonlar:", schema);
    }
  } catch (error) {
    console.error("❌ Genel hata:", error.message);
  }
}

// PostgreSQL şema bilgisi için RPC fonksiyonu (opsiyonel)
async function createSchemaFunction() {
  const { error } = await supabase.rpc("exec", {
    sql: `
      CREATE OR REPLACE FUNCTION get_table_schema(schema_name text, table_name text)
      RETURNS TABLE(column_name text, data_type text, is_nullable text) AS $$
      BEGIN
        RETURN QUERY
        SELECT c.column_name::text, c.data_type::text, c.is_nullable::text
        FROM information_schema.columns c
        WHERE c.table_schema = schema_name AND c.table_name = table_name
        ORDER BY c.ordinal_position;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (error) {
    console.log("⚠️ RPC fonksiyonu oluşturulamadı:", error.message);
  }
}

// Ana fonksiyon
async function main() {
  await createSchemaFunction();
  await checkTables();
  console.log("\n✨ Kontrol tamamlandı!");
}

main().catch(console.error);
