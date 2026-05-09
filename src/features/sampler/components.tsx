import { Download } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ProcessedTextureSet, TextureMap } from "@/features/sampler/types";
import { downloadMap } from "@/lib/image/export";

export type BatchStatus = "queued" | "processing" | "ready" | "error";

export interface BatchItem {
  id: string;
  name: string;
  status: BatchStatus;
  detail: string;
}

interface ControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function Control({ label, value, min, max, step, onChange }: ControlProps) {
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

export function BatchList({ items }: { items: BatchItem[] }) {
  return (
    <ul className="batch-list" aria-label="Batch input status">
      {items.map((item) => (
        <li key={item.id} data-batch-status={item.status}>
          <strong>{item.name}</strong>
          <span>{item.detail}</span>
        </li>
      ))}
    </ul>
  );
}

export function AnalysisPanel({ result }: { result: ProcessedTextureSet }) {
  return (
    <section className="analysis-panel" aria-label="Texture analysis">
      <div>
        <span className="eyebrow">Detected</span>
        <strong data-testid="material-kind">{result.analysis.material}</strong>
        <span data-testid="material-confidence">{result.analysis.materialConfidenceLabel}</span>
      </div>
      <div>
        <span className="eyebrow">Source</span>
        <strong>{result.analysis.sourceConfidenceLabel}</strong>
        <span>{Math.round(result.analysis.sourceConfidence * 100)}%</span>
      </div>
      <ul className="warning-list" aria-label="Analysis warnings">
        {result.analysis.warnings.map((item) => (
          <li key={item.id} data-warning-id={item.id} className={item.severity}>
            <strong>{item.title}</strong>
            <span>{item.what}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MapTile({ map }: { map: TextureMap }) {
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
        <span className={`confidence ${map.confidenceLabel}`}>{map.confidenceLabel}</span>
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

export function DebugPanel({ result }: { result: ProcessedTextureSet }) {
  return (
    <section className="debug-panel" aria-label="Debug analysis">
      <pre>
        {JSON.stringify(
          { report: result.report, analysis: result.analysis, metadata: result.metadata },
          null,
          2
        )}
      </pre>
    </section>
  );
}
