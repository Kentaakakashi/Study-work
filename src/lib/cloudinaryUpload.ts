// src/lib/cloudinaryUpload.ts

export async function uploadToCloudinary(file: File) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary env vars (cloud name / upload preset).");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  // optional folder
  form.append("folder", "study-zen/uploads");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const data = await res.json();

  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
    width: data.width as number,
    height: data.height as number,
  };
}
