import { useRef, useCallback, useEffect, type ReactNode } from "react";
import type { ViewTransform } from "../lib/types";

interface CanvasProps {
  transform: ViewTransform;
  onTransformChange: (transform: ViewTransform) => void;
  onBackgroundClick: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  ariaLabel?: string;
  children: ReactNode;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;

export default function Canvas({
  transform,
  onTransformChange,
  onBackgroundClick,
  svgRef,
  ariaLabel,
  children,
}: CanvasProps) {
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, transform.scale * zoomFactor)
      );

      // Zoom centered on cursor position
      const scaleChange = newScale / transform.scale;
      const newX = mouseX - (mouseX - transform.x) * scaleChange;
      const newY = mouseY - (mouseY - transform.y) * scaleChange;

      onTransformChange({ x: newX, y: newY, scale: newScale });
    },
    [transform, onTransformChange, svgRef]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only start panning on direct SVG/background clicks
      if ((e.target as SVGElement).closest("g[data-node]")) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      (e.target as SVGElement).setPointerCapture(e.pointerId);
    },
    [transform.x, transform.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return;
      onTransformChange({
        ...transform,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    },
    [transform, onTransformChange]
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Deselect when clicking on empty canvas
      if (
        e.target === svgRef.current ||
        (e.target as SVGElement).tagName === "rect"
      ) {
        onBackgroundClick();
      }
    },
    [svgRef, onBackgroundClick]
  );

  // Touch pinch-to-zoom and two-finger pan
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function getTouchDistance(t1: Touch, t2: Touch): number {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function getTouchMidpoint(t1: Touch, t2: Touch) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastTouchDist.current = getTouchDistance(e.touches[0], e.touches[1]);
        lastTouchMid.current = getTouchMidpoint(e.touches[0], e.touches[1]);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      if (lastTouchDist.current === null || lastTouchMid.current === null) return;
      e.preventDefault();

      const t = transformRef.current;
      const newDist = getTouchDistance(e.touches[0], e.touches[1]);
      const newMid = getTouchMidpoint(e.touches[0], e.touches[1]);

      // Zoom
      const zoomFactor = newDist / lastTouchDist.current;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * zoomFactor));
      const scaleChange = newScale / t.scale;

      // Pan + zoom centered on midpoint
      const rect = svg!.getBoundingClientRect();
      const midX = newMid.x - rect.left;
      const midY = newMid.y - rect.top;
      const panDx = newMid.x - lastTouchMid.current.x;
      const panDy = newMid.y - lastTouchMid.current.y;

      const newX = midX - (midX - t.x) * scaleChange + panDx;
      const newY = midY - (midY - t.y) * scaleChange + panDy;

      onTransformChange({ x: newX, y: newY, scale: newScale });

      lastTouchDist.current = newDist;
      lastTouchMid.current = newMid;
    }

    function handleTouchEnd() {
      lastTouchDist.current = null;
      lastTouchMid.current = null;
    }

    svg.addEventListener("touchstart", handleTouchStart, { passive: false });
    svg.addEventListener("touchmove", handleTouchMove, { passive: false });
    svg.addEventListener("touchend", handleTouchEnd);

    return () => {
      svg.removeEventListener("touchstart", handleTouchStart);
      svg.removeEventListener("touchmove", handleTouchMove);
      svg.removeEventListener("touchend", handleTouchEnd);
    };
  }, [svgRef, onTransformChange]);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 1020 860"
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: "100%",
        height: "100vh",
        display: "block",
        background: "var(--color-bg)",
        touchAction: "none",
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      <defs>
        {/* Marker dims mirror --size-marker-width/height tokens.
            SVG marker attributes don't support CSS vars. */}
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M 0 0 L 8 3 L 0 6 Z" fill="var(--color-text)" />
        </marker>
      </defs>
      <g
        data-canvas
        transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
      >
        {children}
      </g>
    </svg>
  );
}
