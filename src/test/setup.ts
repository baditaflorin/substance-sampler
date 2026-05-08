class TestImageData implements ImageData {
  readonly colorSpace: PredefinedColorSpace = "srgb";
  readonly data: ImageDataArray;
  readonly height: number;
  readonly width: number;

  constructor(width: number, height: number);
  constructor(data: ImageDataArray, width: number, height?: number);
  constructor(dataOrWidth: ImageDataArray | number, width: number, height?: number) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = width;
      this.data = new Uint8ClampedArray(new ArrayBuffer(this.width * this.height * 4));
      return;
    }

    this.data = dataOrWidth;
    this.width = width;
    this.height = height ?? dataOrWidth.length / 4 / width;
  }
}

if (typeof globalThis.ImageData === "undefined") {
  const target = globalThis as typeof globalThis & { ImageData: typeof ImageData };
  target.ImageData = TestImageData;
}
