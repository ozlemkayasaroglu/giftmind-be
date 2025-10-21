# 🚀 Hızlı API Test Rehberi

Bu dosya token almak ve API'yi test etmek için basit adımları içerir.

## 🔧 Hazırlık

1. **Server'ı başlat:**
   ```bash
   npm run dev
   ```

2. **Email confirmation'ı deaktive et (Opsiyonel ama önerilen):**
   - Supabase Dashboard → Settings → Authentication
   - "Enable email confirmations" seçeneğini kapat
   - Bu sayede hemen login yapabilirsin

## 🎯 Adım Adım Test

### 1️⃣ Kullanıcı Kaydı
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mytest@gmail.com",
    "password": "123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2️⃣ Login ve Token Al
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mytest@gmail.com",
    "password": "123456"
  }'
```

**Response'dan token'ı kopyala:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3️⃣ Token ile Test Et

**Persona Oluştur:**
```bash
curl -X POST http://localhost:3001/api/personas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_BURAYA_YAPISTIR" \
  -d '{
    "name": "John Doe",
    "birth_date": "1990-05-15",
    "interests": ["reading", "cooking"],
    "notes": ["Loves books"]
  }'
```

**Personaları Listele:**
```bash
curl -X GET http://localhost:3001/api/personas \
  -H "Authorization: Bearer TOKEN_BURAYA_YAPISTIR"
```

**Gift Önerisi Al:**
```bash
curl -X POST http://localhost:3001/api/gift/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_BURAYA_YAPISTIR" \
  -d '{
    "personaId": "PERSONA_ID_BURAYA"
  }'
```

## 📋 Postman İçin

1. **Postman Collection Import Et:**
   - `postman_collection.json` dosyasını Postman'e import et
   
2. **Variables Ayarla:**
   - `baseUrl`: `http://localhost:3001`
   - `authToken`: Login'den aldığın token

3. **Test Sırası:**
   1. Register User
   2. Login User (token otomatik kaydedilir)
   3. Create Persona (persona ID otomatik kaydedilir)
   4. Diğer endpoint'leri test et

## 🔑 Token Örnekleri

Login başarılıysa şöyle bir response gelir:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOTIyZWNjOC00Mzk1LTQyYmMtYTI0OC01N2JjZGUyZmNiNTUiLCJlbWFpbCI6InRlc3R1c2Vyb2tAZ21haWwuY29tIiwiaWF0IjoxNzYxMDM2Nzg2LCJleHAiOjE3NjEwNDAzODZ9.1FsLQnk2vZjKQeEe5YE5k3pLh4YrXqUvMXnF7Wm2Bcg",
  "user": {
    "id": "2922ecc8-4395-42bc-a248-57bcde2fcb55",
    "email": "testuserok@gmail.com"
  }
}
```

Bu token'ı `Authorization: Bearer TOKEN` header'ında kullan!

## ⚠️ Önemli Notlar

- **Email Format:** Gmail formatı kullan (@gmail.com)
- **Password:** En az 6 karakter
- **Token Süresi:** 1 saat (3600 saniye)
- **UUID Format:** Persona ID'ler UUID formatında gelir

## 🐛 Sorun Giderme

- **"Email not confirmed"**: Supabase'de email confirmation'ı kapat
- **"Invalid token"**: Yeni token al (login yap)
- **"UUID format error"**: Persona ID'yi doğru kopyaladığından emin ol
