import { z } from "zod";
import {
  defaultSettings,
  type GeometryMode,
  type SettingKey,
  type TextureSettings
} from "@/features/sampler/types";
import { dataUrlToFile, fileToDataUrl } from "@/lib/input/loadSource";

export const PROJECT_SCHEMA_VERSION = "substance-sampler-project-v1";

export const TextureSettingsSchema = z.object({
  outputSize: z.number().int().min(256).max(2048),
  tileStrength: z.number().min(0).max(1),
  normalStrength: z.number().min(1).max(16),
  heightContrast: z.number().min(0.5).max(2.5),
  roughnessBias: z.number().min(0.15).max(0.95),
  detailStrength: z.number().min(0).max(1.2),
  metallicBias: z.number().min(0).max(1).default(0),
  upscale: z.union([z.literal(1), z.literal(2)]),
  preferWebGpu: z.boolean()
});

export const GeometryModeSchema = z.union([
  z.literal("sphere"),
  z.literal("box"),
  z.literal("plane")
]);

const SettingKeySchema = z.enum([
  "outputSize",
  "tileStrength",
  "normalStrength",
  "heightContrast",
  "roughnessBias",
  "detailStrength",
  "metallicBias",
  "upscale",
  "preferWebGpu"
]);

export const ProjectStateSchema = z.object({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  savedAt: z.string().datetime(),
  source: z.object({
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    dataUrl: z.string().startsWith("data:image/")
  }),
  settings: TextureSettingsSchema,
  geometry: GeometryModeSchema,
  userOwnedSettings: z.array(SettingKeySchema)
});

export const ShareStateSchema = z.object({
  v: z.literal(1),
  settings: TextureSettingsSchema,
  geometry: GeometryModeSchema
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;
export type ShareState = z.infer<typeof ShareStateSchema>;

export function parseTextureSettings(value: unknown): TextureSettings | null {
  const parsed = TextureSettingsSchema.partial().safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return { ...defaultSettings, ...parsed.data };
}

export async function createProjectState(
  sourceFile: File,
  settings: TextureSettings,
  geometry: GeometryMode,
  userOwnedSettings: SettingKey[]
): Promise<ProjectState> {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    source: {
      fileName: sourceFile.name,
      mimeType: sourceFile.type || "image/png",
      dataUrl: await fileToDataUrl(sourceFile)
    },
    settings,
    geometry,
    userOwnedSettings
  };
}

export function parseProjectStateText(text: string): ProjectState {
  const parsedJson = JSON.parse(text) as unknown;
  return ProjectStateSchema.parse(parsedJson);
}

export function projectStateToFile(project: ProjectState): Promise<File> {
  return dataUrlToFile(project.source.dataUrl, project.source.fileName, project.source.mimeType);
}

export function encodeShareState(settings: TextureSettings, geometry: GeometryMode): string {
  return `settings=${encodeBase64Url(JSON.stringify({ v: 1, settings, geometry } satisfies ShareState))}`;
}

export function decodeShareState(hash: string): ShareState | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const value = params.get("settings");
  if (!value) {
    return null;
  }

  try {
    return ShareStateSchema.parse(JSON.parse(decodeBase64Url(value)) as unknown);
  } catch {
    return null;
  }
}

export function projectStateFileName(project: ProjectState): string {
  const base = project.source.fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]+/gi, "-");
  return `${base || "substance-sampler"}-project.json`;
}

function encodeBase64Url(value: string): string {
  return btoa(encodeURIComponent(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeURIComponent(atob(padded));
}
