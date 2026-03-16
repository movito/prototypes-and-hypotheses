export type NodeSize = "small" | "default" | "large";

export interface ClusterData {
  label: string;
  color?: string;
}

export interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  cluster: string;
  description: string;
  radius: number;
}

export interface NodeDataInput {
  id: string;
  label: string;
  x: number;
  y: number;
  cluster: string;
  description: string;
  size: NodeSize;
}

export interface EdgeData {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface GraphMeta {
  title: string;
  subtitle: string;
  note: string;
}

export interface SourceData {
  title: string;
  url: string;
}

export interface GraphData {
  meta: GraphMeta;
  sources?: Record<string, SourceData>;
  clusters: Record<string, ClusterData>;
  nodes: NodeDataInput[];
  edges: EdgeData[];
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}
