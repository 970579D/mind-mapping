import { createFileRoute } from "@tanstack/react-router";
import { MindMap } from "@/components/mindmap/MindMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mindforge — Keyboard-First Mind Mapping" },
      {
        name: "description",
        content:
          "Build mind maps with mouse or keyboard: arrow keys to focus, Enter to edit, Space to branch. Fast, quiet, distraction-free.",
      },
      { property: "og:title", content: "Mindforge — Keyboard-First Mind Mapping" },
      {
        property: "og:description",
        content:
          "Arrow keys move focus, Enter edits, Space adds a node. A mind map editor built for speed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <MindMap />;
}
