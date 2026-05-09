import { expose } from "comlink";
import type { SourceContext, TextureSettings } from "./types";
import { processTexture } from "@/lib/image/texture";

const api = {
  process(imageData: ImageData, settings: TextureSettings, context: SourceContext) {
    return processTexture(imageData, settings, context);
  }
};

export type ProcessorWorkerApi = typeof api;

expose(api);
