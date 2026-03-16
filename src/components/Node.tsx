import { useCallback, useRef } from "react";
import type { NodeData } from "../lib/types";

interface NodeProps {
  node: NodeData;
  clusterColor: string;
  fontSize: number;
  selected: boolean;
  dimmed: boolean;
  highlighted: boolean;
  onSelect: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
  onDrag: (id: string, x: number, y: number) => void;
}

export default function Node({
  node,
  clusterColor,
  fontSize,
  selected,
  dimmed,
  highlighted,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onDrag,
}: NodeProps) {
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const groupRef = useRef<SVGGElement>(null);

  /** Convert screen (client) coordinates to SVG coordinate space,
   *  accounting for viewBox mapping, pan, and zoom. */
  const clientToSVG = (clientX: number, clientY: number) => {
    const group = groupRef.current;
    if (!group) return null;
    const ctm = group.getScreenCTM();
    if (!ctm) return null;
    return new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const pt = clientToSVG(e.clientX, e.clientY);
      if (!pt) return;
      dragging.current = true;
      dragOffset.current = { x: pt.x - node.x, y: pt.y - node.y };
      groupRef.current?.setPointerCapture(e.pointerId);
    },
    [node.x, node.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      e.stopPropagation();
      const pt = clientToSVG(e.clientX, e.clientY);
      if (!pt) return;
      onDrag(node.id, pt.x - dragOffset.current.x, pt.y - dragOffset.current.y);
    },
    [node.id, onDrag]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) {
        dragging.current = false;
        e.stopPropagation();
        if (groupRef.current?.hasPointerCapture(e.pointerId)) {
          groupRef.current.releasePointerCapture(e.pointerId);
        }
      }
    },
    []
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    if (groupRef.current?.hasPointerCapture(e.pointerId)) {
      groupRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id);
    },
    [node.id, onSelect]
  );

  const opacity = dimmed ? "var(--opacity-node-dimmed)" : 1;
  const strokeWidth = selected
    ? "var(--stroke-node-selected)"
    : highlighted
      ? "var(--stroke-node-highlighted)"
      : "var(--stroke-node-default)";

  const lines = node.label.split("\n");

  return (
    <g
      ref={groupRef}
      className="node-group"
      tabIndex={0}
      role="button"
      aria-label={node.label.replace(/\n/g, " ")}
      data-node
      style={{
        opacity,
        "--cx": `${node.x}px`,
        "--cy": `${node.y}px`,
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(node.id);
        }
      }}
      onMouseEnter={() => onHoverStart(node.id)}
      onMouseLeave={onHoverEnd}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius}
        fill="var(--color-surface)"
        stroke={clusterColor}
        strokeWidth={strokeWidth}
      />
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="var(--type-weight-medium)"
        fontFamily="var(--font-body)"
        fill="var(--color-text)"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {lines.map((line, i) => (
          <tspan
            key={i}
            x={node.x}
            dy={i === 0 ? `${-(lines.length - 1) * 0.5}em` : "1.2em"}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
