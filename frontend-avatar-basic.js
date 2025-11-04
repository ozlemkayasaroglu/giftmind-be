// Frontend Avatar Basic - File'ı base64'e çevirip gönder

// File'ı base64'e çeviren fonksiyon
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Basic avatar upload API
export const avatarBasicAPI = {
  async upload(personaId, file) {
    try {
      // File'ı base64'e çevir
      const base64Data = await fileToBase64(file);

      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("railway_token");
      const response = await fetch(`/api/personas/${personaId}/avatar-basic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar_data: base64Data,
        }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        data: result,
        error: response.ok ? null : result,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message },
      };
    }
  },

  async get(personaId) {
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("railway_token");
      const response = await fetch(`/api/personas/${personaId}/avatar-basic`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return {
        success: response.ok,
        data: result,
        error: response.ok ? null : result,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message },
      };
    }
  },
};

// React Avatar Upload Component (Basic)
export function AvatarUploadBasic({
  personaId,
  currentAvatarUrl,
  onAvatarChange,
}) {
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validations
    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir resim dosyası seçin");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Dosya boyutu 2MB'dan küçük olmalı");
      return;
    }

    setUploading(true);

    try {
      const result = await avatarBasicAPI.upload(personaId, file);

      if (result.success) {
        console.log("✅ Avatar yüklendi:", result.data.avatar_url);
        onAvatarChange?.(result.data.avatar_url);
        alert("Avatar başarıyla yüklendi!");
      } else {
        console.error("❌ Avatar yüklenemedi:", result.error);
        alert("Avatar yüklenemedi: " + result.error.message);
      }
    } catch (error) {
      console.error("❌ Upload hatası:", error);
      alert("Upload hatası: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload-basic">
      {/* Avatar Display */}
      <div style={{ marginBottom: 10 }}>
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ddd",
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ddd",
            }}
          >
            📷
          </div>
        )}
      </div>

      {/* Upload Button */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: "none" }}
        id={`avatar-basic-${personaId}`}
      />

      <label
        htmlFor={`avatar-basic-${personaId}`}
        style={{
          display: "inline-block",
          padding: "8px 16px",
          backgroundColor: uploading ? "#ccc" : "#4285f4",
          color: "white",
          borderRadius: "4px",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Yükleniyor..." : "Avatar Değiştir"}
      </label>
    </div>
  );
}

// Test fonksiyonu
export async function testAvatarBasic(personaId) {
  console.log("🧪 Basic Avatar Test");

  // Test için 1x1 pixel kırmızı PNG oluştur
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 1, 1);

  const base64Data = canvas.toDataURL("image/png");
  console.log("📤 Test base64:", base64Data.substring(0, 50) + "...");

  const result = await avatarBasicAPI.upload(personaId, base64Data);
  console.log("📥 Result:", result);

  return result;
}
