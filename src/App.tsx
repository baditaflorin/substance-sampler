import {
  Box,
  Clipboard,
  Copy,
  Cpu,
  Download,
  FileJson,
  Github,
  Heart,
  ImagePlus,
  Link as LinkIcon,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThreePreview } from "@/features/preview/ThreePreview";
import {
  AnalysisPanel,
  BatchList,
  Control,
  DebugPanel,
  MapTile,
  type BatchItem
} from "@/features/sampler/components";
import { createProcessorClient, type ProcessorClient } from "@/features/sampler/processorClient";
import {
  defaultSettings,
  type GeometryMode,
  type ProcessedTextureSet,
  type SettingKey,
  type TextureSettings,
  type UserFacingError
} from "@/features/sampler/types";
import { fallbackBuildInfo, fetchBuildInfo, PAYPAL_URL, REPO_URL } from "@/lib/build-info";
import { downloadJson, downloadZip } from "@/lib/image/export";
import { validateImageFile } from "@/lib/input/fileValidation";
import {
  createSampleTextureFile,
  fileFromUrl,
  filesFromPaste,
  fileToLoadedSource,
  readClipboardImage,
  type LoadedSource
} from "@/lib/input/loadSource";
import {
  createProjectState,
  decodeShareState,
  encodeShareState,
  parseProjectStateText,
  projectStateFileName,
  projectStateToFile,
  type ProjectState
} from "@/lib/project/state";
import {
  clearStoredState,
  loadLastProject,
  loadSettings,
  saveLastProject,
  saveSettings
} from "@/lib/storage/projects";
import { userError } from "@/lib/substance/warnings";

interface LoadOptions {
  settings?: TextureSettings;
  userOwnedSettings?: SettingKey[];
  label?: string;
}

export function App() {
  const activeClientRef = useRef<ProcessorClient | null>(null);
  const activeJobRef = useRef(0);
  const restoredRef = useRef(false);
  const [settings, setSettings] = useState<TextureSettings>(defaultSettings);
  const [userOwnedSettings, setUserOwnedSettings] = useState<SettingKey[]>([]);
  const [source, setSource] = useState<LoadedSource | null>(null);
  const [sourceName, setSourceName] = useState("No photo loaded");
  const [result, setResult] = useState<ProcessedTextureSet | null>(null);
  const [status, setStatus] = useState("Ready");
  const [isProcessing, setIsProcessing] = useState(false);
  const [geometry, setGeometry] = useState<GeometryMode>("sphere");
  const [error, setError] = useState<UserFacingError | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [copyStatus, setCopyStatus] = useState("");
  const [persistenceReady, setPersistenceReady] = useState(false);
  const debug = useMemo(() => new URLSearchParams(window.location.search).get("debug") === "1", []);
  const buildInfoQuery = useQuery({
    queryKey: ["build-info"],
    queryFn: fetchBuildInfo,
    placeholderData: fallbackBuildInfo
  });
  const buildInfo = buildInfoQuery.data ?? fallbackBuildInfo;

  const process = useCallback(
    async (
      input: LoadedSource,
      nextSettings = settings,
      ownedSettings = userOwnedSettings
    ): Promise<ProcessedTextureSet | null> => {
      const jobId = activeJobRef.current + 1;
      activeJobRef.current = jobId;
      setIsProcessing(true);
      setError(null);
      setStatus("Processing maps");
      activeClientRef.current?.terminate();
      const client = createProcessorClient();
      activeClientRef.current = client;

      try {
        await saveSettings(nextSettings);
        const processed = await client.api.process(input.imageData, nextSettings, {
          ...input.context,
          userOwnedSettings: ownedSettings
        });

        if (jobId !== activeJobRef.current) {
          return null;
        }

        setResult(processed);
        setSettings(processed.settingsUsed);
        setStatus(
          `Maps ready: ${processed.report.outputWidth} x ${processed.report.outputHeight}, ${processed.analysis.material} ${processed.analysis.materialConfidenceLabel}, ${processed.report.accelerator.toUpperCase()}, ${processed.report.elapsedMs} ms`
        );
        return processed;
      } catch (caught) {
        if (jobId !== activeJobRef.current) {
          return null;
        }

        setError(
          userError(
            "processing-failed",
            "Processing failed",
            "The source loaded, but map generation did not complete.",
            caught instanceof Error
              ? caught.message
              : "The browser did not provide a specific error.",
            "Try a smaller crop or lower output size, then regenerate."
          )
        );
        setStatus("Processing failed");
        return null;
      } finally {
        if (jobId === activeJobRef.current) {
          setIsProcessing(false);
          activeClientRef.current = null;
        }
        client.terminate();
      }
    },
    [settings, userOwnedSettings]
  );

  const loadFile = useCallback(
    async (file: File, options: LoadOptions = {}): Promise<{ ok: boolean; detail: string }> => {
      const nextSettings = options.settings ?? settings;
      const ownedSettings = options.userOwnedSettings ?? userOwnedSettings;
      setStatus("Validating source");
      setError(null);
      setCopyStatus("");

      try {
        const validation = await validateImageFile(file);
        if (validation.error || !validation.report) {
          setError(validation.error);
          setStatus("Load failed");
          return { ok: false, detail: validation.error?.code ?? "validation-failed" };
        }

        setStatus("Loading photo");
        const loaded = await fileToLoadedSource(file, validation.report, ownedSettings);
        setSource(loaded);
        setSourceName(options.label ?? file.name);
        setSettings(nextSettings);
        setUserOwnedSettings(ownedSettings);
        const processed = await process(loaded, nextSettings, ownedSettings);
        return processed
          ? { ok: true, detail: processed.analysis.material }
          : { ok: false, detail: "processing-failed" };
      } catch (caught) {
        const nextError =
          caught && typeof caught === "object" && "code" in caught
            ? (caught as UserFacingError)
            : userError(
                "decode-failed",
                "Image decode failed",
                "The browser could not decode this source image.",
                caught instanceof Error
                  ? caught.message
                  : "The decoder did not provide a detailed reason.",
                "Try re-exporting the source as PNG, JPEG, or WebP."
              );
        setError(nextError);
        setStatus("Load failed");
        return { ok: false, detail: nextError.code };
      }
    },
    [process, settings, userOwnedSettings]
  );

  const loadFiles = useCallback(
    async (files: File[], labelPrefix = "Loaded") => {
      const queue = files.filter(Boolean);
      if (!queue.length) {
        return;
      }

      const items = queue.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name || `image-${index + 1}`,
        status: "queued" as const,
        detail: "Waiting"
      }));
      setBatchItems(items);

      for (const item of items) {
        const file = queue[items.indexOf(item)];
        setBatchItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, status: "processing", detail: "Processing" } : entry
          )
        );
        const outcome = await loadFile(file, {
          label: queue.length > 1 ? `${labelPrefix}: ${file.name}` : file.name
        });
        setBatchItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: outcome.ok ? "ready" : "error",
                  detail: outcome.ok ? `Ready: ${outcome.detail}` : outcome.detail
                }
              : entry
          )
        );
      }
    },
    [loadFile]
  );

  useEffect(
    () => () => {
      activeClientRef.current?.terminate();
    },
    []
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = filesFromPaste(event);
      if (files.length) {
        event.preventDefault();
        void loadFiles(files, "Pasted");
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFiles]);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }
    restoredRef.current = true;

    const restore = async () => {
      const shared = decodeShareState(window.location.hash);
      if (shared) {
        setSettings(shared.settings);
        setGeometry(shared.geometry);
        setStatus("Settings link applied");
        setPersistenceReady(true);
        return;
      }

      const savedSettings = await loadSettings();
      const savedProject = await loadLastProject();
      if (savedProject) {
        const file = await projectStateToFile(savedProject);
        const restoredSettings = savedSettings ?? savedProject.settings;
        setGeometry(savedProject.geometry);
        await loadFile(file, {
          settings: restoredSettings,
          userOwnedSettings: savedProject.userOwnedSettings,
          label: `Restored ${savedProject.source.fileName}`
        });
        setPersistenceReady(true);
        return;
      }

      if (savedSettings) {
        setSettings(savedSettings);
      }
      setPersistenceReady(true);
    };

    restore().catch(() => {
      setPersistenceReady(true);
      setStatus("Ready");
    });
  }, [loadFile]);

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }
    void saveSettings(settings);
  }, [persistenceReady, settings]);

  useEffect(() => {
    if (!persistenceReady || !source || !result) {
      return;
    }
    createProjectState(source.file, settings, geometry, userOwnedSettings)
      .then(saveLastProject)
      .catch(() => undefined);
  }, [geometry, persistenceReady, result, settings, source, userOwnedSettings]);

  const updateSetting = useCallback(
    <K extends keyof TextureSettings>(key: K, value: TextureSettings[K]) => {
      setSettings((current) => {
        const next = { ...current, [key]: value };
        void saveSettings(next);
        return next;
      });
      setUserOwnedSettings((current) => (current.includes(key) ? current : [...current, key]));
    },
    []
  );

  const updateGeometry = useCallback((mode: GeometryMode) => {
    setGeometry(mode);
  }, []);

  const regenerate = useCallback(() => {
    if (source) {
      void process(source, settings, userOwnedSettings);
    }
  }, [process, settings, source, userOwnedSettings]);

  const cancelProcessing = useCallback(() => {
    activeJobRef.current += 1;
    activeClientRef.current?.terminate();
    activeClientRef.current = null;
    setIsProcessing(false);
    setStatus(result ? "Cancelled. Previous maps kept." : "Cancelled");
  }, [result]);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      void loadFiles(Array.from(event.dataTransfer.files), "Dropped");
    },
    [loadFiles]
  );

  const loadSample = useCallback(async () => {
    const file = await createSampleTextureFile();
    await loadFiles([file], "Sample");
  }, [loadFiles]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const file = await readClipboardImage();
      await loadFiles([file], "Clipboard");
    } catch (caught) {
      const nextError = caught as UserFacingError;
      setError(nextError);
      setStatus("Paste unavailable");
    }
  }, [loadFiles]);

  const loadUrl = useCallback(async () => {
    try {
      const file = await fileFromUrl(sourceUrl.trim());
      await loadFiles([file], "URL");
    } catch (caught) {
      const nextError = caught as UserFacingError;
      setError(nextError);
      setStatus("URL load failed");
    }
  }, [loadFiles, sourceUrl]);

  const importProjectFile = useCallback(
    async (file: File) => {
      try {
        const project = parseProjectStateText(await file.text());
        const imageFile = await projectStateToFile(project);
        setGeometry(project.geometry);
        await loadFile(imageFile, {
          settings: project.settings,
          userOwnedSettings: project.userOwnedSettings,
          label: `Imported ${project.source.fileName}`
        });
        window.history.replaceState(null, "", window.location.pathname);
      } catch (caught) {
        setError(
          userError(
            "project-import-failed",
            "Project import failed",
            "The selected file is not a valid Substance Sampler project.",
            caught instanceof Error ? caught.message : "The project could not be parsed.",
            "Choose a project JSON exported by this app."
          )
        );
        setStatus("Import failed");
      }
    },
    [loadFile]
  );

  const currentProject = useCallback(async (): Promise<ProjectState | null> => {
    if (!source) {
      return null;
    }
    return createProjectState(source.file, settings, geometry, userOwnedSettings);
  }, [geometry, settings, source, userOwnedSettings]);

  const downloadProject = useCallback(async () => {
    const project = await currentProject();
    if (project) {
      downloadJson(project, projectStateFileName(project));
    }
  }, [currentProject]);

  const copyMetadata = useCallback(async () => {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.metadata, null, 2));
      setCopyStatus("Metadata copied");
    } catch {
      setError(
        userError(
          "clipboard-write-failed",
          "Copy failed",
          "The browser blocked clipboard writing.",
          "Clipboard writes can require focus, permissions, or a secure browser context.",
          "Download the metadata JSON instead."
        )
      );
    }
  }, [result]);

  const copySettingsLink = useCallback(async () => {
    const hash = encodeShareState(settings, geometry);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    window.history.replaceState(null, "", `#${hash}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Settings link copied");
    } catch {
      setCopyStatus("Settings link updated in address bar");
    }
  }, [geometry, settings]);

  const startFresh = useCallback(async () => {
    activeJobRef.current += 1;
    activeClientRef.current?.terminate();
    activeClientRef.current = null;
    await clearStoredState();
    setSettings(defaultSettings);
    setUserOwnedSettings([]);
    setSource(null);
    setResult(null);
    setBatchItems([]);
    setError(null);
    setCopyStatus("");
    setSourceUrl("");
    setSourceName("No photo loaded");
    setGeometry("sphere");
    setStatus("Ready");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const canExport = Boolean(result?.maps.length);
  const canExportProject = Boolean(source);

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
                type="file"
                accept="image/png,image/jpeg,image/webp"
                capture="environment"
                multiple
                onChange={(event) => {
                  void loadFiles(Array.from(event.currentTarget.files ?? []), "Selected");
                  event.currentTarget.value = "";
                }}
              />
              <span>Drop, paste, or choose photos</span>
              <strong>Browse</strong>
            </label>
            <div className="action-grid">
              <button type="button" className="secondary-action compact" onClick={loadSample}>
                <Sparkles size={16} aria-hidden="true" />
                Load sample
              </button>
              <button
                type="button"
                className="secondary-action compact"
                onClick={pasteFromClipboard}
              >
                <Clipboard size={16} aria-hidden="true" />
                Paste image
              </button>
            </div>
            <div className="url-row">
              <input
                type="url"
                value={sourceUrl}
                placeholder="https://example.com/texture.jpg"
                aria-label="Image URL"
                onChange={(event) => setSourceUrl(event.currentTarget.value)}
              />
              <button type="button" onClick={loadUrl} disabled={!sourceUrl.trim()}>
                Load URL
              </button>
            </div>
            {batchItems.length ? <BatchList items={batchItems} /> : null}
          </section>

          <section className="tool-section">
            <div className="panel-heading">
              <h2>Settings</h2>
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
            <Control
              label="Metallic"
              value={settings.metallicBias}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => updateSetting("metallicBias", value)}
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
            <div className="segmented" aria-label="Export scale">
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
            {isProcessing ? (
              <button className="secondary-action" type="button" onClick={cancelProcessing}>
                Cancel
              </button>
            ) : null}
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
                  onClick={() => updateGeometry(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>

          <section className="tool-section">
            <div className="panel-heading">
              <h2>Export</h2>
              <FileJson size={18} aria-hidden="true" />
            </div>
            <button
              className="secondary-action"
              type="button"
              disabled={!canExport}
              onClick={() => result && void downloadZip(result.maps, result.metadata)}
            >
              <Download size={18} aria-hidden="true" />
              Download ZIP
            </button>
            <div className="action-grid">
              <button
                className="secondary-action compact"
                type="button"
                disabled={!result}
                onClick={() =>
                  result && downloadJson(result.metadata, "substance-sampler-metadata.json")
                }
              >
                <FileJson size={16} aria-hidden="true" />
                Metadata
              </button>
              <button
                className="secondary-action compact"
                type="button"
                disabled={!result}
                onClick={copyMetadata}
              >
                <Copy size={16} aria-hidden="true" />
                Copy metadata
              </button>
              <button
                className="secondary-action compact"
                type="button"
                disabled={!canExportProject}
                onClick={downloadProject}
              >
                <Download size={16} aria-hidden="true" />
                Save project
              </button>
              <label className="secondary-action compact import-action">
                <FileJson size={16} aria-hidden="true" />
                Import project
                <input
                  data-testid="project-import-input"
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.item(0);
                    if (file) {
                      void importProjectFile(file);
                      event.currentTarget.value = "";
                    }
                  }}
                />
              </label>
              <button className="secondary-action compact" type="button" onClick={copySettingsLink}>
                <LinkIcon size={16} aria-hidden="true" />
                Copy settings link
              </button>
              <button className="secondary-action compact" type="button" onClick={startFresh}>
                <RotateCcw size={16} aria-hidden="true" />
                Start fresh
              </button>
            </div>
            {copyStatus ? <p className="copy-status">{copyStatus}</p> : null}
          </section>
        </aside>

        <section className="stage" aria-label="Generated texture maps">
          <div className="status-strip" role="status" aria-live="polite">
            <span className={isProcessing ? "pulse-dot busy" : "pulse-dot"} />
            <span>{status}</span>
            {error ? (
              <strong data-testid="error-code" data-error-code={error.code}>
                {error.title}: {error.what} {error.nextStep}
              </strong>
            ) : null}
          </div>

          {result ? (
            <>
              <AnalysisPanel result={result} />
              <ThreePreview maps={result.maps} geometry={geometry} />
              <section className="map-grid" aria-label="Texture map outputs">
                {result.maps.map((map) => (
                  <MapTile key={map.kind} map={map} />
                ))}
              </section>
              {debug ? <DebugPanel result={result} /> : null}
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
