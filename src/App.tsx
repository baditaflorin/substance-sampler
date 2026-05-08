import {
  Box,
  Cpu,
  Download,
  Github,
  Heart,
  ImagePlus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThreePreview } from "@/features/preview/ThreePreview";
import { createProcessorClient } from "@/features/sampler/processorClient";
import {
  defaultSettings,
  type ProcessedTextureSet,
  type TextureMap,
  type TextureSettings
} from "@/features/sampler/types";
import { fallbackBuildInfo, fetchBuildInfo, PAYPAL_URL, REPO_URL } from "@/lib/build-info";
import { downloadMap, downloadZip } from "@/lib/image/export";
import { loadSettings, saveSettings } from "@/lib/storage/projects";

type GeometryMode = "sphere" | "box" | "plane";

export function App() {
  const processor = useMemo(() => createProcessorClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<TextureSettings>(defaultSettings);
  const [source, setSource] = useState<ImageData | null>(null);
  const [sourceName, setSourceName] = useState("No photo loaded");
  const [result, setResult] = useState<ProcessedTextureSet | null>(null);
  const [status, setStatus] = useState("Ready");
  const [isProcessing, setIsProcessing] = useState(false);
  const [geometry, setGeometry] = useState<GeometryMode>("sphere");
  const [error, setError] = useState<string | null>(null);
  const buildInfoQuery = useQuery({
    queryKey: ["build-info"],
    queryFn: fetchBuildInfo,
    placeholderData: fallbackBuildInfo
  });
  const buildInfo = buildInfoQuery.data ?? fallbackBuildInfo;

  useEffect(() => {
    loadSettings()
      .then((saved) => {
        if (saved) {
          setSettings({ ...defaultSettings, ...saved });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => () => processor.terminate(), [processor]);

  const process = useCallback(
    async (input: ImageData, nextSettings = settings) => {
      setIsProcessing(true);
      setError(null);
      setStatus("Processing maps");

      try {
        await saveSettings(nextSettings);
        const processed = await processor.api.process(input, nextSettings);
        setResult(processed);
        setStatus(
          `Maps ready: ${processed.report.outputWidth} x ${processed.report.outputHeight}, ${processed.report.accelerator.toUpperCase()}, ${processed.report.elapsedMs} ms`
        );
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Texture processing failed.";
        setError(message);
        setStatus("Processing failed");
      } finally {
        setIsProcessing(false);
      }
    },
    [processor.api, settings]
  );

  const loadFile = useCallback(
    async (file: File) => {
      setStatus("Loading photo");
      setError(null);

      try {
        const imageData = await fileToImageData(file);
        setSource(imageData);
        setSourceName(file.name);
        await process(imageData);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not load the selected photo.";
        setError(message);
        setStatus("Load failed");
      }
    },
    [process]
  );

  const updateSetting = useCallback(
    <K extends keyof TextureSettings>(key: K, value: TextureSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const regenerate = useCallback(() => {
    if (source) {
      void process(source, settings);
    }
  }, [process, settings, source]);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files.item(0);
      if (file) {
        void loadFile(file);
      }
    },
    [loadFile]
  );

  const canExport = Boolean(result?.maps.length);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Substance Sampler</h1>
          <p>{sourceName}</p>
        </div>
        <nav aria-label="Project links">
          <a className="toplink" href={REPO_URL} target="_blank" rel="noreferrer">
            <Github size={18} aria-hidden="true" />
            Star on GitHub
          </a>
          <a className="toplink support" href={PAYPAL_URL} target="_blank" rel="noreferrer">
            <Heart size={18} aria-hidden="true" />
            PayPal
          </a>
        </nav>
      </header>

      <main className="workspace">
        <aside className="tool-panel" aria-label="Sampler controls">
          <section className="tool-section">
            <div className="panel-heading">
              <h2>Source</h2>
              <ImagePlus size={18} aria-hidden="true" />
            </div>
            <label
              className="drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.currentTarget.files?.item(0);
                  if (file) {
                    void loadFile(file);
                  }
                }}
              />
              <span>Drop a photo</span>
              <strong>Browse</strong>
            </label>
          </section>

          <section className="tool-section">
            <div className="panel-heading">
              <h2>Maps</h2>
              <SlidersHorizontal size={18} aria-hidden="true" />
            </div>
            <Control
              label="Size"
              value={settings.outputSize}
              min={256}
              max={2048}
              step={256}
              onChange={(value) => updateSetting("outputSize", value)}
            />
            <Control
              label="Tile"
              value={settings.tileStrength}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => updateSetting("tileStrength", value)}
            />
            <Control
              label="Normal"
              value={settings.normalStrength}
              min={1}
              max={16}
              step={0.5}
              onChange={(value) => updateSetting("normalStrength", value)}
            />
            <Control
              label="Height"
              value={settings.heightContrast}
              min={0.5}
              max={2.5}
              step={0.05}
              onChange={(value) => updateSetting("heightContrast", value)}
            />
            <Control
              label="Rough"
              value={settings.roughnessBias}
              min={0.15}
              max={0.95}
              step={0.05}
              onChange={(value) => updateSetting("roughnessBias", value)}
            />
            <Control
              label="Detail"
              value={settings.detailStrength}
              min={0}
              max={1.2}
              step={0.05}
              onChange={(value) => updateSetting("detailStrength", value)}
            />
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.preferWebGpu}
                onChange={(event) => updateSetting("preferWebGpu", event.currentTarget.checked)}
              />
              <span>WebGPU</span>
              <Cpu size={16} aria-hidden="true" />
            </label>
            <div className="segmented" aria-label="Upscale">
              {[1, 2].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  className={settings.upscale === scale ? "active" : ""}
                  onClick={() => updateSetting("upscale", scale as 1 | 2)}
                >
                  {scale}x
                </button>
              ))}
            </div>
            <button
              className="primary-action"
              type="button"
              disabled={!source || isProcessing}
              onClick={regenerate}
            >
              <RefreshCw size={18} aria-hidden="true" />
              Regenerate
            </button>
          </section>

          <section className="tool-section">
            <div className="panel-heading">
              <h2>Preview</h2>
              <Box size={18} aria-hidden="true" />
            </div>
            <div className="segmented" aria-label="Preview geometry">
              {(["sphere", "box", "plane"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={geometry === mode ? "active" : ""}
                  onClick={() => setGeometry(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              className="secondary-action"
              type="button"
              disabled={!canExport}
              onClick={() => result && void downloadZip(result.maps)}
            >
              <Download size={18} aria-hidden="true" />
              Download ZIP
            </button>
          </section>
        </aside>

        <section className="stage" aria-label="Generated texture maps">
          <div className="status-strip" role="status" aria-live="polite">
            <span className={isProcessing ? "pulse-dot busy" : "pulse-dot"} />
            <span>{status}</span>
            {error ? <strong>{error}</strong> : null}
          </div>

          {result ? (
            <>
              <ThreePreview maps={result.maps} geometry={geometry} />
              <section className="map-grid" aria-label="Texture map outputs">
                {result.maps.map((map) => (
                  <MapTile key={map.kind} map={map} />
                ))}
              </section>
            </>
          ) : (
            <section className="empty-state" aria-label="Waiting for image">
              <Sparkles size={32} aria-hidden="true" />
              <h2>Photo to PBR</h2>
              <p>Albedo, normal, roughness, height, and AO maps render here.</p>
            </section>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>v{buildInfo.version}</span>
        <span>commit {buildInfo.commit}</span>
        <span>repo https://github.com/baditaflorin/substance-sampler</span>
      </footer>
    </div>
  );
}

interface ControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Control({ label, value, min, max, step, onChange }: ControlProps) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <output>{Number.isInteger(value) ? value : value.toFixed(2)}</output>
    </label>
  );
}

function MapTile({ map }: { map: TextureMap }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    canvas.width = map.imageData.width;
    canvas.height = map.imageData.height;
    ctx.putImageData(map.imageData, 0, 0);
  }, [map]);

  return (
    <article className="map-tile">
      <div className="map-meta">
        <h3>{map.label}</h3>
        <button
          type="button"
          onClick={() => void downloadMap(map)}
          aria-label={`Download ${map.label}`}
        >
          <Download size={16} aria-hidden="true" />
        </button>
      </div>
      <canvas ref={canvasRef} aria-label={`${map.label} texture map`} />
    </article>
  );
}

async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 2048;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not read the photo.");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return ctx.getImageData(0, 0, width, height);
}
