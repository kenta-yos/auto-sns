const MAX_DIMENSION = 2048;
const MAX_BYTES = 750_000; // ~750KB per image (base64 ≈ 1MB, 4 images fit in Vercel 4.5MB)
const INITIAL_QUALITY = 0.85;
const QUALITY_STEP = 0.05;
const MIN_QUALITY = 0.5;

export type CompressedImage = {
  data: string; // base64 (no data URL prefix)
  mimeType: string;
  sizeBytes: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const img = await loadImage(file);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = INITIAL_QUALITY;

  while (quality >= MIN_QUALITY) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];
    const sizeBytes = Math.ceil((base64.length * 3) / 4);

    if (sizeBytes <= MAX_BYTES) {
      return { data: base64, mimeType: "image/jpeg", sizeBytes };
    }
    quality -= QUALITY_STEP;
  }

  // Return at minimum quality even if over limit
  const dataUrl = canvas.toDataURL("image/jpeg", MIN_QUALITY);
  const base64 = dataUrl.split(",")[1];
  const sizeBytes = Math.ceil((base64.length * 3) / 4);
  return { data: base64, mimeType: "image/jpeg", sizeBytes };
}
