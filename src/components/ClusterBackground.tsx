import type { ClusterData, NodeData } from "../lib/types";
import { getClusterBounds } from "../lib/geometry";

interface ClusterBackgroundProps {
  clusterKey: string;
  cluster: ClusterData;
  clusterColor: string;
  clusterFill: string;
  nodes: NodeData[];
  fontSize: number;
}

export default function ClusterBackground({
  clusterKey,
  cluster,
  clusterColor,
  clusterFill,
  nodes,
  fontSize,
}: ClusterBackgroundProps) {
  const labelHeight = cluster.label ? fontSize + 8 : 0;
  const bounds = getClusterBounds(clusterKey, nodes, 40, labelHeight);
  if (!bounds || !cluster.label) return null;

  return (
    <g>
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill={clusterFill}
        stroke={clusterColor}
        strokeWidth={1}
        strokeOpacity="var(--opacity-cluster-stroke)"
        style={{ rx: 'var(--radius-lg)', ry: 'var(--radius-lg)' }}
      />
      <text
        x={bounds.x + bounds.width / 2}
        y={bounds.y + fontSize + 12}
        textAnchor="middle"
        fill={clusterColor}
        fontSize={fontSize}
        fontWeight="var(--type-weight-semibold)"
        fontFamily="var(--font-body)"
        opacity="var(--opacity-cluster-label)"
      >
        {cluster.label}
      </text>
    </g>
  );
}
