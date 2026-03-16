import type { NodeData, EdgeData } from "../lib/types";
import { getEdgePath } from "../lib/geometry";

interface EdgeProps {
  edge: EdgeData;
  fromNode: NodeData;
  toNode: NodeData;
  labelPos?: { x: number; y: number };
  fontSize: number;
  dimmed: boolean;
  highlighted: boolean;
}

const STROKE_DASHARRAY: Record<string, string | undefined> = {
  solid: undefined,
  dashed: "8 4",
  dotted: "3 3",
};

export default function Edge({
  edge,
  fromNode,
  toNode,
  labelPos,
  fontSize,
  dimmed,
  highlighted,
}: EdgeProps) {
  const { x1, y1, x2, y2 } = getEdgePath(fromNode, toNode);
  const mid = labelPos ?? {
    x: (fromNode.x + toNode.x) / 2,
    y: (fromNode.y + toNode.y) / 2,
  };
  const dashArray = STROKE_DASHARRAY[edge.style || "solid"];

  const opacity = dimmed
    ? "var(--opacity-edge-dimmed)"
    : highlighted
      ? 1
      : "var(--opacity-edge-default)";

  return (
    <g
      opacity={opacity}
      style={{ transition: "opacity var(--transition-fast)" }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--color-text)"
        strokeWidth={highlighted ? "var(--stroke-edge-highlighted)" : "var(--stroke-edge-default)"}
        strokeDasharray={dashArray}
        markerEnd="url(#arrowhead)"
      />
      {edge.label && (
        <>
          {/* Background outline for legibility (renders reliably in SVG exports) */}
          <text
            x={mid.x}
            y={mid.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fill="none"
            fontFamily="var(--font-body)"
            stroke="var(--color-bg)"
            strokeWidth={4}
            strokeLinejoin="round"
            style={{ pointerEvents: "none" }}
          >
            {edge.label.split("\n").map((line, i, arr) => (
              <tspan
                key={i}
                x={mid.x}
                dy={i === 0 ? `${-(arr.length - 1) * 0.5}em` : "1.1em"}
              >
                {line}
              </tspan>
            ))}
          </text>
          {/* Foreground text */}
          <text
            x={mid.x}
            y={mid.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fill="var(--color-text)"
            fontFamily="var(--font-body)"
            style={{ pointerEvents: "none" }}
          >
            {edge.label.split("\n").map((line, i, arr) => (
              <tspan
                key={i}
                x={mid.x}
                dy={i === 0 ? `${-(arr.length - 1) * 0.5}em` : "1.1em"}
              >
                {line}
              </tspan>
            ))}
          </text>
        </>
      )}
    </g>
  );
}
