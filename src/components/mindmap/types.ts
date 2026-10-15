export type NodeColor = "node-1" | "node-2" | "node-3" | "node-4" | "node-5" | "node-6";

export const NODE_COLORS: NodeColor[] = [
  "node-1",
  "node-2",
  "node-3",
  "node-4",
  "node-5",
  "node-6",
];

export const COLOR_VAR: Record<NodeColor, string> = {
  "node-1": "var(--node-1)",
  "node-2": "var(--node-2)",
  "node-3": "var(--node-3)",
  "node-4": "var(--node-4)",
  "node-5": "var(--node-5)",
  "node-6": "var(--node-6)",
};

export interface MindNode {
  id: string;
  parentId: string | null;
  text: string;
  x: number;
  y: number;
  color: NodeColor;
}

export const NODE_W = 176;
export const NODE_H = 52;

export const createId = () => Math.random().toString(36).slice(2, 10);

export const initialNodes: MindNode[] = [
  { id: "root", parentId: null, text: "New Mind Map", x: 520, y: 340, color: "node-2" },
  { id: "a", parentId: "root", text: "Idea", x: 810, y: 220, color: "node-1" },
  { id: "b", parentId: "root", text: "Research", x: 810, y: 340, color: "node-3" },
  { id: "c", parentId: "root", text: "Next steps", x: 810, y: 460, color: "node-4" },
  { id: "d", parentId: "a", text: "Sub topic", x: 1090, y: 220, color: "node-1" },
];
