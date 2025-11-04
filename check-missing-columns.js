// Eksik kolonları kontrol et
require("dotenv").config();

// PersonaForm'dan gelen tüm alanlar
const requiredColumns = [
  "user_id",
  "name",
  "birth_date",
  "interests",
  "notes",
  "description",
  "notes_text",
  "role",
  "age_min",
  "age_max",
  "goals",
  "challenges",
  "interests_raw",
  "behavioral_insights",
  "budget_min",
  "budget_max",
  "created_at",
  "updated_at",
];

console.log("📋 PersonaForm için gerekli kolonlar:\n");
requiredColumns.forEach((col, index) => {
  console.log(`${index + 1}. ${col}`);
});

console.log("\n🔍 Supabase tablosunda bu kolonların olması gerekiyor.");
console.log(
  "💡 Eksik olanları eklemek için update_personas_table.sql çalıştır."
);

// SQL oluştur
const sqlCommands = requiredColumns.map((col) => {
  let dataType = "text";

  if (col.includes("_id")) dataType = "uuid";
  else if (col.includes("_at")) dataType = "timestamptz";
  else if (col.includes("_date")) dataType = "date";
  else if (col.includes("_min") || col.includes("_max")) dataType = "integer";
  else if (col === "interests" || col === "notes") dataType = "text[]";

  return `ADD COLUMN IF NOT EXISTS ${col} ${dataType}`;
});

console.log("\n📝 SQL komutları:");
console.log("ALTER TABLE public.personas");
console.log(sqlCommands.join(",\n"));
console.log(";");
