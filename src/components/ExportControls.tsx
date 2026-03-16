interface ExportControlsProps {
  onExportSVG: () => void;
  onExportPNG: () => void;
  onDumpPositions: () => void;
}

export default function ExportControls({
  onExportSVG,
  onExportPNG,
  onDumpPositions,
}: ExportControlsProps) {
  return (
    <div className="export-controls">
      <button type="button" className="export-btn" onClick={onExportSVG} title="Export SVG (S)">
        SVG
      </button>
      <button type="button" className="export-btn" onClick={onExportPNG} title="Export PNG (P)">
        PNG
      </button>
      <button
        type="button"
        className="export-btn"
        onClick={onDumpPositions}
        title="Dump positions (D)"
      >
        Positions
      </button>
    </div>
  );
}
