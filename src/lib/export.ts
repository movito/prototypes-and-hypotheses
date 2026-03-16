import type { NodeData, GraphData } from "./types";
import graphData from "../data/graph.json";

const data = graphData as GraphData;

/** Derive a filename slug from the graph title. */
const fileSlug = data.meta.title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const WIDTH = 1020;
const HEIGHT = 860;

/** Serialize exports so concurrent calls don't race. */
let exportQueue: Promise<void> = Promise.resolve();

function runSerially(task: () => Promise<void>): Promise<void> {
  const run = exportQueue.then(task, task);
  exportQueue = run.then(() => undefined, () => undefined);
  return run;
}

/**
 * Clone the SVG offscreen with pan/zoom reset.
 * The clone stays in the DOM so CSS custom properties resolve via
 * getComputedStyle, but is invisible to the user.
 */
function cloneOffscreen(svgElement: SVGSVGElement): SVGSVGElement {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";
  clone.style.width = `${WIDTH}px`;
  clone.style.height = `${HEIGHT}px`;
  document.body.appendChild(clone);

  const outerG = clone.querySelector("g[data-canvas]");
  if (outerG) outerG.removeAttribute("transform");

  return clone;
}

/** CSS var pattern: var(--some-name) with optional fallback. */
const CSS_VAR_RE = /var\(--[^)]+\)/g;

/**
 * Resolve a CSS var reference against the document's computed styles.
 * Returns the resolved value, or the original string if unresolvable.
 */
function resolveVar(value: string): string {
  const s = getComputedStyle(document.documentElement);
  return value.replace(CSS_VAR_RE, (match) => {
    const inner = match.slice(4, -1);
    const commaIdx = inner.indexOf(",");
    const propName = commaIdx >= 0 ? inner.slice(0, commaIdx).trim() : inner.trim();
    const fallback = commaIdx >= 0 ? inner.slice(commaIdx + 1).trim() : "";
    const resolved = s.getPropertyValue(propName).trim();
    return resolved || fallback || match;
  });
}

/**
 * SVG attributes that may contain CSS var() references.
 */
const SVG_ATTRS_TO_RESOLVE = [
  "fill", "stroke", "stroke-width", "stroke-opacity", "opacity",
  "font-family", "font-weight", "font-size",
];

/**
 * Walk the SVG DOM tree and inline all CSS var references
 * so the exported SVG is self-contained.
 */
function resolveAllVars(root: SVGElement): void {
  const walk = (el: Element) => {
    for (const attr of SVG_ATTRS_TO_RESOLVE) {
      const val = el.getAttribute(attr);
      if (val && val.includes("var(")) {
        el.setAttribute(attr, resolveVar(val));
      }
    }

    if (el instanceof HTMLElement || el instanceof SVGElement) {
      const style = el.style;
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        const val = style.getPropertyValue(prop);
        if (val && val.includes("var(")) {
          style.setProperty(prop, resolveVar(val));
        }
      }
    }

    for (const child of el.children) {
      walk(child);
    }
  };
  walk(root);
}

/**
 * Prepare a clean, self-contained SVG string from the live SVG element.
 * Resolves all CSS vars, strips interactive attributes, sets dimensions.
 */
function buildCleanSVG(svgElement: SVGSVGElement): { svgString: string; clone: SVGSVGElement } {
  const clone = cloneOffscreen(svgElement);

  resolveAllVars(clone);

  clone.querySelectorAll("[data-node]").forEach((el) => {
    el.removeAttribute("data-node");
  });
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const vb = clone.getAttribute("viewBox") || `0 0 ${WIDTH} ${HEIGHT}`;
  clone.setAttribute("viewBox", vb);
  clone.setAttribute("width", String(WIDTH));
  clone.setAttribute("height", String(HEIGHT));

  const hiddenText = clone.querySelector("text[aria-hidden]");
  if (hiddenText) hiddenText.remove();

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  return { svgString, clone };
}

/** Trigger a file download from a Blob. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export the SVG element as a downloadable .svg file.
 * Clones the SVG, resolves all CSS custom properties to inline values,
 * and serializes as a clean, self-contained SVG document.
 */
export function exportSVG(svgElement: SVGSVGElement): Promise<void> {
  return runSerially(async () => {
    const { svgString, clone } = buildCleanSVG(svgElement);
    try {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      downloadBlob(blob, `${fileSlug}.svg`);
    } finally {
      clone.remove();
    }
  });
}

/**
 * Export the SVG element as a downloadable .png file at 2x resolution.
 * Builds a clean SVG with resolved CSS vars, renders it to a canvas
 * via an Image element, then exports as PNG.
 */
export function exportPNG(svgElement: SVGSVGElement): Promise<void> {
  return runSerially(async () => {
    const { svgString, clone } = buildCleanSVG(svgElement);
    clone.remove();

    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * pixelRatio;
    canvas.height = HEIGHT * pixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PNG export failed: could not create canvas context");

    // Fill with background color
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-bg").trim() || "#faf9f7";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the SVG onto the canvas via an Image
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = new Image();
      img.width = WIDTH;
      img.height = HEIGHT;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = () => reject(new Error("PNG export failed: could not render SVG to canvas"));
        img.src = url;
      });

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("PNG export failed: canvas.toBlob returned null"));
        }, "image/png");
      });

      downloadBlob(pngBlob, `${fileSlug}.png`);
    } finally {
      URL.revokeObjectURL(url);
    }
  });
}

/**
 * Dump current node positions as JSON to the console.
 */
export function dumpPositions(nodes: NodeData[]): void {
  const positions = nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));
  console.log(JSON.stringify(positions, null, 2));
}
