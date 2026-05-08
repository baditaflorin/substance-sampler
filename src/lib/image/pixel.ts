export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampByte(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function sampleScalar(
  values: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
) {
  const wrappedX = (x + width) % width;
  const wrappedY = (y + height) % height;
  return values[wrappedY * width + wrappedX] ?? 0;
}

export function scalarToImageData(
  values: Uint8ClampedArray,
  width: number,
  height: number
): ImageData {
  const output = new ImageData(width, height);

  for (let i = 0; i < values.length; i += 1) {
    const offset = i * 4;
    const value = values[i] ?? 0;
    output.data[offset] = value;
    output.data[offset + 1] = value;
    output.data[offset + 2] = value;
    output.data[offset + 3] = 255;
  }

  return output;
}

export function normalizeScalarField(
  values: Uint8ClampedArray,
  contrast: number
): Uint8ClampedArray {
  let min = 255;
  let max = 0;

  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const range = Math.max(1, max - min);
  const output = new Uint8ClampedArray(values.length);

  for (let i = 0; i < values.length; i += 1) {
    const normalized = ((values[i] ?? 0) - min) / range;
    const contrasted = (normalized - 0.5) * contrast + 0.5;
    output[i] = clampByte(contrasted * 255);
  }

  return output;
}

export function boxBlurScalar(
  values: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  if (radius <= 0) {
    return new Uint8ClampedArray(values);
  }

  const output = new Uint8ClampedArray(values.length);
  const diameter = radius * 2 + 1;
  const area = diameter * diameter;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;

      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          sum += sampleScalar(values, width, height, x + ox, y + oy);
        }
      }

      output[y * width + x] = clampByte(sum / area);
    }
  }

  return output;
}
