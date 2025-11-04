// Frontend Avatar Component - React
import React from "react";

// Avatar Display Component
export function AvatarDisplay({
  avatarUrl,
  size = 100,
  className = "",
  alt = "Avatar",
}) {
  // Avatar varsa ve geçerli base64 formatındaysa göster
  if (avatarUrl && avatarUrl.startsWith("data:image/")) {
    return (
      <img
        src={avatarUrl}
        alt={alt}
        className={`avatar-image ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #e0e0e0",
        }}
        onError={(e) => {
          console.error("Avatar yüklenemedi:", avatarUrl);
          e.target.style.display = "none";
        }}
      />
    );
  }

  // Avatar yoksa placeholder göster
  return (
    <div
      className={`avatar-placeholder ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#666",
        fontSize: size * 0.12,
        border: "2px solid #e0e0e0",
      }}
    >
      {avatarUrl === null ? "👤" : avatarUrl === "" ? "📷" : "❌"}
    </div>
  );
}

// Avatar Upload Component
export function AvatarUpload({
  personaId,
  currentAvatarUrl,
  onAvatarChange,
  uploading = false,
}) {
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir resim dosyası seçin");
      return;
    }

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Dosya boyutu 2MB'dan küçük olmalı");
      return;
    }

    try {
      // API'ye upload et
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`/api/personas/${personaId}/avatar-simple`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Avatar yüklendi:", result.avatar_url);
        onAvatarChange?.(result.avatar_url);
      } else {
        console.error("❌ Avatar yüklenemedi:", result.message);
        alert("Avatar yüklenemedi: " + result.message);
      }
    } catch (error) {
      console.error("❌ Upload hatası:", error);
      alert("Upload hatası: " + error.message);
    }
  };

  return (
    <div className="avatar-upload">
      <AvatarDisplay avatarUrl={currentAvatarUrl} size={120} />

      <div style={{ marginTop: 10 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: "none" }}
          id={`avatar-upload-${personaId}`}
        />

        <label
          htmlFor={`avatar-upload-${personaId}`}
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#4285f4",
            color: "white",
            borderRadius: "4px",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Yükleniyor..." : "Avatar Değiştir"}
        </label>
      </div>
    </div>
  );
}

// Persona Card'da Avatar Kullanımı
export function PersonaCard({ persona }) {
  return (
    <div className="persona-card">
      <AvatarDisplay
        avatarUrl={persona.avatar_url}
        size={80}
        alt={`${persona.name} Avatar`}
      />

      <div className="persona-info">
        <h3>{persona.name}</h3>
        <p>{persona.description}</p>
      </div>
    </div>
  );
}

// PersonaDetail sayfasında Avatar
export function PersonaDetailAvatar({ persona, onAvatarUpdate }) {
  const [uploading, setUploading] = React.useState(false);

  const handleAvatarChange = (newAvatarUrl) => {
    onAvatarUpdate?.({ ...persona, avatar_url: newAvatarUrl });
  };

  return (
    <div className="persona-detail-avatar">
      <AvatarUpload
        personaId={persona.id}
        currentAvatarUrl={persona.avatar_url}
        onAvatarChange={handleAvatarChange}
        uploading={uploading}
      />
    </div>
  );
}

// Kullanım Örnekleri:
/*
// 1. Basit avatar gösterimi
<AvatarDisplay avatarUrl={persona.avatar_url} />

// 2. Büyük avatar
<AvatarDisplay avatarUrl={persona.avatar_url} size={150} />

// 3. Avatar upload
<AvatarUpload 
  personaId={persona.id}
  currentAvatarUrl={persona.avatar_url}
  onAvatarChange={(newUrl) => setPersona({...persona, avatar_url: newUrl})}
/>

// 4. Persona card'da
<PersonaCard persona={persona} />
*/
