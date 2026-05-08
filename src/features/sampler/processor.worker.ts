import { expose } from "comlink";
import type { TextureSettings } from "./types";
import { processTexture } from "@/lib/image/texture";

const api = {
  process(imageData: ImageData, settings: TextureSettings) {
    return processTexture(imageData, settings);
  }
};

export type ProcessorWorkerApi = typeof api;

expose(api);
