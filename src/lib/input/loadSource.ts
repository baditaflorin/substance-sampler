import type { FileValidationReport, SettingKey, SourceContext } from "@/features/sampler/types";
import { userError } from "@/lib/substance/warnings";

export interface LoadedSource {
  imageData: ImageData;
  context: SourceContext;
  file: File;
}

export async function fileToLoadedSource(
  file: File,
  validation: FileValidationReport,
  userOwnedSettings: SettingKey[]
): Promise<LoadedSource> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 2048;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not read the photo.");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  const context: SourceContext = {
    fileName: file.name,
    originalWidth: bitmap.width,
    originalHeight: bitmap.height,
    normalizedWidth: width,
    normalizedHeight: height,
    sourceFingerprint: validation.sourceFingerprint,
    validation,
    userOwnedSettings
  };
  bitmap.close();

  return {
    imageData: ctx.getImageData(0, 0, width, height),
    context,
    file
  };
}

export async function createSampleTextureFile(): Promise<File> {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create sample texture.");
  }

  ctx.fillStyle = "#6b5746";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 16) {
    for (let x = 0; x < size; x += 16) {
      const value = 82 + ((x * 7 + y * 13) % 52);
      ctx.fillStyle = `rgb(${value + 24}, ${value + 8}, ${value})`;
      ctx.fillRect(x, y, 16, 16);
    }
  }
  ctx.strokeStyle = "rgba(28, 20, 14, 0.55)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Sample export failed."))));
  });

  return new File([blob], "sample-tile.png", { type: "image/png" });
}

export async function fileFromUrl(rawUrl: string): Promise<File> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw userError(
      "url-invalid",
      "Invalid URL",
      "The image URL is not a valid absolute URL.",
      "Browser URL imports need a full http, https, or data URL.",
      "Paste the complete image URL or use file upload instead."
    );
  }

  if (!["http:", "https:", "data:"].includes(url.protocol)) {
    throw userError(
      "url-unsupported",
      "Unsupported URL",
      "This URL scheme cannot be loaded as an image.",
      "Static browser imports can only read http, https, or data URLs.",
      "Use a direct image URL or download the file and upload it."
    );
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      mode: url.protocol === "data:" ? "same-origin" : "cors"
    });
  } catch {
    throw userError(
      "url-fetch-failed",
      "URL image blocked",
      "The browser could not read that image URL.",
      "Most sites block cross-origin image downloads from static apps unless they send CORS headers.",
      "Download the image and upload it, or use a CORS-readable direct image URL."
    );
  }

  if (!response.ok) {
    throw userError(
      "url-fetch-failed",
      "URL image failed",
      `The image URL returned HTTP ${response.status}.`,
      "The browser reached the URL, but the server did not return a usable image response.",
      "Check the URL or download the image and upload it."
    );
  }

  const blob = await response.blob();
  const name = fileNameFromUrl(url, blob.type);
  return new File([blob], name, { type: blob.type || mimeFromName(name) });
}

export async function readClipboardImage(): Promise<File> {
  if (!navigator.clipboard?.read) {
    throw userError(
      "clipboard-unavailable",
      "Clipboard unavailable",
      "This browser does not expose clipboard image reads here.",
      "Clipboard access depends on browser permissions and secure contexts.",
      "Use the system paste shortcut, drag-and-drop, or file upload."
    );
  }

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (imageType) {
        const blob = await item.getType(imageType);
        return new File([blob], `clipboard-image.${extensionFromMime(imageType)}`, {
          type: imageType
        });
      }
    }
  } catch {
    throw userError(
      "clipboard-denied",
      "Clipboard denied",
      "The browser did not allow image clipboard access.",
      "Clipboard reads require a permission prompt and may be blocked in some browsers.",
      "Use the system paste shortcut or upload the file."
    );
  }

  throw userError(
    "clipboard-empty",
    "No image on clipboard",
    "The clipboard did not contain an image.",
    "Only PNG, JPEG, or WebP image clipboard items can become texture sources.",
    "Copy an image, then paste again."
  );
}

export function filesFromPaste(event: ClipboardEvent): File[] {
  const files: File[] = [];
  for (const item of Array.from(event.clipboardData?.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        files.push(
          new File([file], file.name || `pasted-image.${extensionFromMime(item.type)}`, {
            type: item.type
          })
        );
      }
    }
  }
  return files;
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Expected a data URL."));
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  mimeType: string
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType || blob.type });
}

function fileNameFromUrl(url: URL, mimeType: string): string {
  if (url.protocol === "data:") {
    return `url-image.${extensionFromMime(mimeType)}`;
  }

  const candidate = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
  if (candidate.includes(".")) {
    return candidate;
  }
  return `url-image.${extensionFromMime(mimeType)}`;
}

function extensionFromMime(mimeType: string): string {
  if (mimeType.includes("jpeg")) {
    return "jpg";
  }
  if (mimeType.includes("webp")) {
    return "webp";
  }
  return "png";
}

function mimeFromName(fileName: string): string {
  if (/\.jpe?g$/i.test(fileName)) {
    return "image/jpeg";
  }
  if (/\.webp$/i.test(fileName)) {
    return "image/webp";
  }
  return "image/png";
}
