# SQL Schema Files

Bu klasör Supabase veritabanı şeması dosyalarını içerir.

## 📁 Dosyalar

### `create_personas_table.sql`

- **Amaç**: İlk personas tablosu kurulumu
- **Kullanım**: Yeni Supabase projesi kurulurken
- **İçerik**: Temel personas tablosu + RLS policies

### `update_personas_table.sql`

- **Amaç**: Mevcut personas tablosuna eksik alanları ekler
- **Kullanım**: PersonaForm genişletildiğinde
- **İçerik**: Tüm PersonaForm alanları + triggers

## 🚀 Kullanım

### Yeni Proje Kurulumu:

1. Supabase Dashboard → SQL Editor
2. `create_personas_table.sql` dosyasını çalıştır

### Mevcut Projeyi Güncelleme:

1. Supabase Dashboard → SQL Editor
2. `update_personas_table.sql` dosyasını çalıştır

## 📊 Tablo Yapısı

### Temel Alanlar:

- `id`, `user_id`, `name`, `birth_date`
- `interests`, `notes`, `created_at`

### Genişletilmiş Alanlar:

- `role`, `age_min`, `age_max`
- `goals`, `challenges`, `description`
- `behavioral_insights`, `budget_min/max`
- `interests_raw`, `notes_text`, `updated_at`

## 🔒 Güvenlik

- RLS (Row Level Security) aktif
- Kullanıcılar sadece kendi persona'larını görebilir
- Auth tablosu ile bağlantılı (`auth.users`)

## 📝 Notlar

- Tüm SQL dosyaları `public` schema için yazılmıştır
- `IF NOT EXISTS` kullanılarak güvenli çalıştırma sağlanmıştır
- Trigger'lar otomatik `updated_at` güncellemesi yapar
