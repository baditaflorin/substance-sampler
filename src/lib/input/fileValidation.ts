import type {
  FileValidationReport,
  SubstanceWarning,
  UserFacingError
} from "@/features/sampler/types";
import { fingerprintBytes } from "@/lib/hash/fingerprint";
import { userError, warning } from "@/lib/substance/warnings";

const formatMime = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  unknown: "application/octet-stream"
} as const;

export async function validateImageFile(file: File): Promise<{
  report: FileValidationReport | null;
  error: UserFacingError | null;
}> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = extensionFor(file.name);
  const detectedFormat = detectFormat(bytes);
  const warnings: SubstanceWarning[] = [];
  const reportBase = {
    fileName: file.name,
    extension,
    mimeType: file.type || "unknown",
    detectedFormat,
    byteLength: bytes.byteLength,
    sourceFingerprint: fingerprintBytes(bytes)
  };

  if (bytes.byteLength === 0) {
    return {
      report: { ...reportBase, warnings },
      error: userError(
        "empty-file",
        "Empty image",
        "The selected file has no image bytes.",
        "A texture source needs actual PNG, JPEG, or WebP image data before maps can be generated.",
        "Choose a non-empty photo or re-export the source image, then try again."
      )
    };
  }

  if (detectedFormat === "unknown") {
    return {
      report: { ...reportBase, warnings },
      error: userError(
        "unsupported-format",
        "Unsupported image format",
        "The file is not a recognizable PNG, JPEG, or WebP image.",
        "The byte signature does not match the image formats Substance Sampler can decode in-browser.",
        "Export the source as PNG, JPEG, or WebP and upload that file."
      )
    };
  }

  if (detectedFormat === "jpeg" && !hasJpegEndMarker(bytes)) {
    return {
      report: { ...reportBase, warnings },
      error: userError(
        "truncated-jpeg",
        "Partial JPEG",
        "The JPEG starts correctly but appears to end before the image data is complete.",
        "This usually means the file was partially downloaded, copied, or exported.",
        "Re-download or re-export the source photo, then upload the complete file."
      )
    };
  }

  if (
    extension &&
    extension !== detectedFormat &&
    !(extension === "jpg" && detectedFormat === "jpeg")
  ) {
    warnings.push(
      warning(
        "format-mismatch",
        "File type corrected",
        `The file name says .${extension}, but the bytes are ${detectedFormat.toUpperCase()}.`,
        "Browser decoders use the actual bytes, not just the extension.",
        "The app will process the detected image data and include this note in the export metadata.",
        0.02,
        "info"
      )
    );
  }

  if (file.type && file.type !== formatMime[detectedFormat]) {
    warnings.push(
      warning(
        "format-mismatch",
        "MIME type corrected",
        `The browser reported ${file.type}, but the bytes are ${detectedFormat.toUpperCase()}.`,
        "Drag-and-drop sources sometimes carry stale MIME metadata.",
        "No action is needed if the preview looks right.",
        0.02,
        "info"
      )
    );
  }

  if (bytes.byteLength > 8 * 1024 * 1024) {
    warnings.push(
      warning(
        "huge-source",
        "Large source image",
        "This source is large enough that the browser will downsample it before map generation.",
        "Downsampling keeps the app responsive but can remove fine texture detail.",
        "Use a tighter crop or raise the output size if the source contains important micro-detail.",
        0.06
      )
    );
  }

  return {
    report: { ...reportBase, warnings },
    error: null
  };
}

function extensionFor(fileName: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  const value = match?.[1]?.toLowerCase() ?? "";
  return value === "jpg" ? "jpg" : value;
}

function detectFormat(bytes: Uint8Array): FileValidationReport["detectedFormat"] {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  return "unknown";
}

function hasJpegEndMarker(bytes: Uint8Array): boolean {
  for (let i = Math.max(0, bytes.length - 128); i < bytes.length - 1; i += 1) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
      return true;
    }
  }

  return false;
}
