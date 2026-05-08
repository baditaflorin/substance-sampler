import { wrap, type Remote } from "comlink";
import type { ProcessorWorkerApi } from "./processor.worker";

export interface ProcessorClient {
  api: Remote<ProcessorWorkerApi>;
  terminate: () => void;
}

export function createProcessorClient(): ProcessorClient {
  const worker = new Worker(new URL("./processor.worker.ts", import.meta.url), { type: "module" });
  return {
    api: wrap<ProcessorWorkerApi>(worker),
    terminate: () => worker.terminate()
  };
}
