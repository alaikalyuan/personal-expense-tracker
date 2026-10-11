/**
 * Client-side image compression utility.
 * Resizes images to max 1280px edge and encodes as JPEG (0.8 quality).
 * Keeps payload lightweight (~150-300 KB) for DeepSeek vision API.
 */
export async function compressImageToDataUrl(
  file: File | Blob | string,
  maxDimension: number = 1280,
  quality: number = 0.8
): Promise<{ dataUrl: string; sizeBytes: number; width: number; height: number }> {
  if (typeof file !== "string") {
    if (!file.type.startsWith("image/")) {
      throw new Error("File yang dipilih bukan gambar yang valid.");
    }

    // Pre-filter: abort if raw file > 25MB to prevent memory exhaustion
    if (file.size > 25 * 1024 * 1024) {
      throw new Error("Ukuran file terlalu besar (maksimal 25MB).");
    }
  }

  return new Promise((resolve, reject) => {
    const processImageSource = (src: string) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memproses format gambar."));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-preserving scaled dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Browser canvas tidak didukung."));
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // Estimate byte size from base64 length
        const sizeBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          sizeBytes,
          width,
          height,
        });
      };
      img.src = src;
    };

    if (typeof file === "string") {
      processImageSource(file);
    } else {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
      reader.onload = () => {
        processImageSource(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  });
}
