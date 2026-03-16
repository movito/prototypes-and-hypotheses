import React, { useRef, useEffect } from "react";
import type { NodeData, GraphData, SourceData } from "../lib/types";
import graphData from "../data/graph.json";

const data = graphData as GraphData;
const sources: Record<string, SourceData> = data.sources ?? {};

interface DetailPanelProps {
  node: NodeData | null;
  clusterColor: string | null;
}

/**
 * Parse a description string and replace citation keys like
 * "(Ladner, 2014; Geertz, 1973)" with linked React elements.
 */
function renderDescription(text: string): (string | React.JSX.Element)[] {
  // Match parenthesised citation groups: (Author, Year; Author, Year)
  const citationGroupRe = /\(([^)]+,\s*\d{4}(?:;\s*[^)]+,\s*\d{4})*)\)/g;
  const parts: (string | React.JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationGroupRe.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Split individual citations within the group
    const citations = match[1].split(";").map((c) => c.trim());
    const linked: (string | React.JSX.Element)[] = ["("];

    citations.forEach((cite, i) => {
      const source = sources[cite];
      if (source) {
        linked.push(
          <a
            key={`${cite}-${match!.index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link"
            title={source.title}
            aria-label={`${cite} — ${source.title}, opens in new window`}
          >
            {cite}
          </a>
        );
      } else {
        linked.push(cite);
      }
      if (i < citations.length - 1) {
        linked.push("; ");
      }
    });

    linked.push(")");
    parts.push(<span key={`group-${match.index}`}>{linked}</span>);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function DetailPanel({ node, clusterColor }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (node) {
      previousFocus.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [node]);

  if (!node || !clusterColor) return null;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      style={{
        position: "fixed",
        bottom: "var(--space-lg)",
        left: "var(--space-xl)",
        maxWidth: "min(540px, 55vw)",
        maxHeight: "40vh",
        overflowY: "auto",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md) var(--space-lg)",
        fontFamily: "var(--font-body)",
        zIndex: 10,
        animation: "slide-up 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          alignItems: "baseline",
          marginBottom: "var(--space-xs)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: clusterColor,
            flexShrink: 0,
            position: "relative",
            top: "-1px",
          }}
        />
        <div
          style={{
            fontSize: "clamp(12px, 1.8vw, 14px)",
            fontWeight: "var(--type-weight-semibold)",
            color: "var(--color-text)",
          }}
        >
          {node.label.replace(/\n/g, " ")}
        </div>
      </div>
      <div
        style={{
          fontSize: "clamp(11px, 1.6vw, 13px)",
          color: "var(--color-text-secondary)",
          lineHeight: "var(--type-line-height-loose)",
          maxWidth: "min(500px, 50vw)",
        }}
      >
        {renderDescription(node.description)}
      </div>
    </div>
  );
}
