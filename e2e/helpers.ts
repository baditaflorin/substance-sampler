import type { Page } from "@playwright/test";
import { deflateSync } from "node:zlib";

export const samplePng = makePng(64, 64);

export async function uploadSample(page: Page, name = "sample.png") {
  await page.locator('input[type="file"]').first().setInputFiles({
    name,
    mimeType: "image/png",
    buffer: samplePng
  });
}

export async function expectMapsReady(page: Page) {
  await page.getByText(/Maps ready:/).waitFor({ state: "visible", timeout: 20_000 });
}

export async function readMapPixel(page: Page, label: string): Promise<number[]> {
  return page.getByLabel(label).evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Expected a canvas.");
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Expected a 2D canvas context.");
    }

    const pixel = ctx.getImageData(
      Math.floor(canvas.width / 2),
      Math.floor(canvas.height / 2),
      1,
      1
    );
    return Array.from(pixel.data);
  });
}

function makePng(width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;

    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 4;
      raw[offset] = Math.round((x / (width - 1)) * 255);
      raw[offset + 1] = Math.round((y / (height - 1)) * 255);
      raw[offset + 2] = (x + y) % 2 === 0 ? 72 : 190;
      raw[offset + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
