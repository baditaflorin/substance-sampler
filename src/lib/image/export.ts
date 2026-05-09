import { zipSync } from "fflate";
import type { ExportMetadata, TextureMap } from "@/features/sampler/types";

export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create export canvas context.");
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

export async function downloadMap(map: TextureMap): Promise<void> {
  const blob = await imageDataToPngBlob(map.imageData);
  downloadBlob(blob, map.fileName);
}

export async function downloadZip(maps: TextureMap[], metadata?: ExportMetadata): Promise<void> {
  const files: Record<string, Uint8Array> = {};

  for (const map of maps) {
    const blob = await imageDataToPngBlob(map.imageData);
    files[map.fileName] = new Uint8Array(await blob.arrayBuffer());
  }

  if (metadata) {
    files["substance-sampler-metadata.json"] = new TextEncoder().encode(
      `${JSON.stringify(metadata, null, 2)}\n`
    );
  }

  const zip = zipSync(files, { level: 6, mtime: new Date("1980-01-01T00:00:00.000Z") });
  const zipBytes = new Uint8Array(zip.byteLength);
  zipBytes.set(zip);
  downloadBlob(new Blob([zipBytes], { type: "application/zip" }), "substance-sampler-maps.zip");
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
