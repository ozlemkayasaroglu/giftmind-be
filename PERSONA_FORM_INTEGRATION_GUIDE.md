# PersonaForm Supabase Entegrasyonu Rehberi

Bu rehber, PersonaForm'dan gelen verilerin Supabase'e nasıl gönderileceğini adım adım açıklar.

## 📋 PersonaForm Veri Yapısı

PersonaForm şu alanları içerir:

```typescript
type PersonaFormValues = {
  name: string; // Persona adı
  birthDate: string; // Doğum tarihi (YYYY-MM-DD)
  interests: string[]; // İlgi alanları array
  notes: string; // Notlar/açıklama
};
```

## 🗄️ Supabase Tablo Yapısı

### 1. Supabase Tablosunu Güncelle

PersonaForm'dan gelen TÜM verileri kaydetmek için tabloyu güncelle:

```sql
-- sql/update_personas_table.sql dosyasını Supabase SQL Editor'da çalıştır
-- Bu komut TÜM eksik kolonları ekler ve RLS policy'lerini ayarlar
```

### 2. PersonaForm Veri Alanları

✅ Şu alanlar Supabase'e kaydedilecek:

- **Temel**: `name`, `birth_date`, `interests`, `notes`, `description`
- **Profil**: `role`, `age_min`, `age_max`, `goals`, `challenges`
- **Detay**: `interests_raw`, `behavioral_insights`, `notes_text`
- **Bütçe**: `budget_min`, `budget_max`
- **Sistem**: `user_id`, `created_at`, `updated_at`

## 🔄 Veri Mapping'i

PersonaForm → Supabase mapping:

```javascript
const formData = {
  name: "Ahmet Yılmaz",
  birthDate: "1990-05-15",
  interests: ["kitap", "müzik"],
  notes: "Teknoloji meraklısı",
};

// Backend'e gönderilecek format:
const payload = {
  name: formData.name, // → personas.name
  birthDate: formData.birthDate, // → personas.birth_date
  interests: formData.interests, // → personas.interests (array)
  notes: formData.notes, // → personas.notes_text
  description: formData.notes, // → personas.description
};
```

## 🚀 Frontend Kullanımı

### 1. API Client Import

```javascript
import { personaAPI, usePersonaSubmit } from "./frontend-api-client";
```

### 2. React Component'te Kullanım

```javascript
function CreatePersonaPage() {
  const { submitPersona, loading, error } = usePersonaSubmit();
  const navigate = useNavigate();

  const handleSubmit = async (formValues) => {
    try {
      const persona = await submitPersona(formValues);
      console.log("Persona created:", persona);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <PersonaForm onSubmit={handleSubmit} loading={loading} error={error} />
  );
}
```

### 3. Direkt API Kullanımı

```javascript
// Yeni persona oluştur
const result = await personaAPI.create({
  name: "Test Persona",
  birthDate: "1990-01-01",
  interests: ["teknoloji"],
  notes: "Test notları",
});

// Persona güncelle
const updateResult = await personaAPI.update(personaId, {
  name: "Updated Name",
  birthDate: "1985-01-01",
  interests: ["spor", "müzik"],
  notes: "Güncellenmiş notlar",
});
```

## 🛠️ Backend Route'ları

### Mevcut Endpoint'ler:

- `POST /api/personas` - Yeni persona oluştur
- `PUT /api/personas/:id` - Persona güncelle
- `GET /api/personas` - Tüm persona'ları getir
- `GET /api/personas/:id` - Tek persona getir
- `DELETE /api/personas/:id` - Persona sil

### Desteklenen Formatlar:

Backend hem camelCase hem de snake_case formatlarını destekler:

- `birthDate` veya `birth_date`
- `notes` → `description` ve `notes_text`'e map edilir

## 🧪 Test Etme

### 1. Test Dosyasını Çalıştır

```bash
# Test token'ını ayarla
export TEST_TOKEN="your-jwt-token-here"

# Testleri çalıştır
node test-persona-form.js
```

### 2. Manuel Test

```javascript
// Browser console'da test
const testData = {
  name: "Test Persona",
  birthDate: "1990-05-15",
  interests: ["teknoloji", "kitap"],
  notes: "Test açıklaması",
};

fetch("/api/personas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN",
  },
  body: JSON.stringify(testData),
})
  .then((r) => r.json())
  .then(console.log);
```

## ✅ Kontrol Listesi

- [ ] Supabase tablosunu güncelle (`sql/update_personas_table.sql`)
- [ ] Backend route'ları test et
- [ ] Frontend API client'ı import et
- [ ] PersonaForm'u API client ile bağla
- [ ] Test verilerini çalıştır
- [ ] Production'da test et

## 🔍 Troubleshooting

### Yaygın Hatalar:

1. **"Name is required"** → `name` alanı boş gönderilmiş
2. **"Persona not found"** → Yanlış persona ID veya yetki sorunu
3. **"Invalid token"** → Auth token eksik veya geçersiz
4. **"Column does not exist"** → Supabase tablosu güncellenmemiş

### Debug İpuçları:

- Network tab'ında request/response'ları kontrol et
- Backend console log'larını incele
- Supabase dashboard'da RLS policy'lerini kontrol et
- Token'ın geçerli olduğunu doğrula

## 📚 İlgili Dosyalar

- `routes/personas.js` - Backend API routes
- `frontend-api-client.js` - Frontend API client
- `test-persona-form.js` - Test dosyası
- `sql/update_personas_table.sql` - Supabase tablo güncellemesi
- `frontend-persona-integration.js` - Entegrasyon örnekleri
