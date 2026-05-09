export function fingerprintBytes(bytes: Uint8Array | Uint8ClampedArray): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;

  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }

  return hash.toString(16).padStart(16, "0");
}

export function fingerprintImageData(imageData: ImageData): string {
  return fingerprintBytes(imageData.data);
}
