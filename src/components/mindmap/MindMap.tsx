import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import {
  COLOR_VAR,
  NODE_H,
  NODE_W,
  createId,
  initialNodes,
  type MindNode,
  type NodeColor,
} from "./types";

type Dir = "up" | "down" | "left" | "right";

export function MindMap() {
  const [nodes, setNodes] = useState<MindNode[]>(initialNodes);
  const [past, setPast] = useState<MindNode[][]>([]);
  const [future, setFuture] = useState<MindNode[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("root");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  const commit = useCallback((next: MindNode[] | ((prev: MindNode[]) => MindNode[])) => {
    setNodes((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      setPast((p) => [...p.slice(-49), prev]);
      setFuture([]);
      return value;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1]!;
      setNodes((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setNodes((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  /* ---------- node operations ---------- */

  const freeSlot = useCallback((list: MindNode[], x: number, y: number) => {
      let ny = y;
      let guard = 0;
      while (
        guard++ < 60 &&
        list.some((n) => Math.abs(n.x - x) < NODE_W && Math.abs(n.y - ny) < NODE_H + 18)
      ) {
        ny += NODE_H + 24;
      }
      return ny;
    },
    [],
  );

  const addNode = useCallback(
    (mode: "child" | "sibling") => {
      const base = selected ?? byId.get("root");
      if (!base) return;
      const parent =
        mode === "child" ? base : base.parentId ? byId.get(base.parentId)! : base;
      const dir = base.x >= (byId.get("root")?.x ?? 0) ? 1 : -1;
      const id = createId();

      commit((prev) => {
        const x = mode === "child" ? parent.x + dir * 280 : base.x;
        const y = freeSlot(prev, x, mode === "child" ? parent.y : base.y + NODE_H + 24);
        return [
          ...prev,
          {
            id,
            parentId: parent.id,
            text: "",
            x,
            y,
            color: parent.id === "root" ? pickColor(prev) : parent.color,
          },
        ];
      });
      setSelectedId(id);
      setEditingId(id);
      setDraft("");
    },
    [selected, byId, commit, freeSlot],
  );

  const deleteBranch = useCallback(() => {
    if (!selected || selected.parentId === null) return;
    const doomed = new Set<string>([selected.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of nodes) {
        if (n.parentId && doomed.has(n.parentId) && !doomed.has(n.id)) {
          doomed.add(n.id);
          grew = true;
        }
      }
    }
    const nextSel = selected.parentId;
    commit((prev) => prev.filter((n) => !doomed.has(n.id)));
    setSelectedId(nextSel);
  }, [selected, nodes, commit]);

  const setColor = useCallback(
    (color: NodeColor) => {
      if (!selectedId) return;
      commit((prev) => prev.map((n) => (n.id === selectedId ? { ...n, color } : n)));
    },
    [selectedId, commit],
  );

  const beginEdit = useCallback(
    (id: string | null) => {
      if (!id) return;
      setEditingId(id);
      setDraft(byId.get(id)?.text ?? "");
    },
    [byId],
  );

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const text = draft.trim();
    commit((prev) =>
      prev.map((n) => (n.id === editingId ? { ...n, text: text || "Untitled" } : n)),
    );
    setEditingId(null);
    surfaceRef.current?.focus();
  }, [editingId, draft, commit]);

  const cancelEdit = useCallback(() => {
    const id = editingId;
    setEditingId(null);
    commit((prev) =>
      prev.filter((n) => !(n.id === id && n.text === "" && n.parentId !== null)),
    );
    surfaceRef.current?.focus();
  }, [editingId, commit]);

  const nudge = useCallback(
    (dir: Dir) => {
      if (!selectedId) return;
      const step = 20;
      const dx = dir === "left" ? -step : dir === "right" ? step : 0;
      const dy = dir === "up" ? -step : dir === "down" ? step : 0;
      commit((prev) =>
        prev.map((n) => (n.id === selectedId ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
      );
    },
    [selectedId, commit],
  );

  const moveFocus = useCallback(
    (dir: Dir) => {
      if (!selected) {
        setSelectedId(nodes[0]?.id ?? null);
        return;
      }
      let best: { id: string; score: number } | null = null;
      for (const n of nodes) {
        if (n.id === selected.id) continue;
        const dx = n.x - selected.x;
        const dy = n.y - selected.y;
        const along =
          dir === "right" ? dx : dir === "left" ? -dx : dir === "down" ? dy : -dy;
        if (along <= 6) continue;
        const across = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
        const score = along + across * 2.2;
        if (!best || score < best.score) best = { id: n.id, score };
      }
      if (best) setSelectedId(best.id);
    },
    [selected, nodes],
  );

  const tidy = useCallback(() => {
    commit((prev) => {
      const children = new Map<string, MindNode[]>();
      for (const n of prev) {
        if (!n.parentId) continue;
        const arr = children.get(n.parentId) ?? [];
        arr.push(n);
        children.set(n.parentId, arr);
      }
      const positions = new Map<string, { x: number; y: number }>();
      let cursor = 0;
      const ROW = NODE_H + 26;

      const layout = (id: string, depth: number): number => {
        const kids = children.get(id) ?? [];
        let y: number;
        if (!kids.length) {
          y = cursor * ROW;
          cursor += 1;
        } else {
          const ys = kids.map((k) => layout(k.id, depth + 1));
          y = (Math.min(...ys) + Math.max(...ys)) / 2;
        }
        positions.set(id, { x: 240 + depth * 280, y });
        return y;
      };
      const root = prev.find((n) => !n.parentId);
      if (root) layout(root.id, 0);
      return prev.map((n) => {
        const p = positions.get(n.id);
        return p ? { ...n, x: p.x, y: p.y + 320 } : n;
      });
    });
  }, [commit]);

  const recenter = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(0.85);
  }, []);

  /* ---------- keyboard ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingId) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }

      const dirs: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = dirs[e.key];
      if (dir) {
        e.preventDefault();
        if (e.shiftKey) nudge(dir);
        else moveFocus(dir);
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          addNode("child");
          break;
        case "Tab":
          e.preventDefault();
          addNode("sibling");
          break;
        case "Enter":
          e.preventDefault();
          beginEdit(selectedId);
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          deleteBranch();
          break;
        case "l":
        case "L":
          tidy();
          break;
        case "0":
          recenter();
          break;
        case "Escape":
          setSelectedId(null);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    editingId,
    selectedId,
    addNode,
    beginEdit,
    deleteBranch,
    moveFocus,
    nudge,
    redo,
    undo,
    tidy,
    recenter,
  ]);

  /* ---------- mouse ---------- */

  const onNodePointerDown = (e: React.PointerEvent, node: MindNode) => {
    if (editingId === node.id) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(node.id);
    dragRef.current = {
      id: node.id,
      dx: e.clientX / zoom - node.x,
      dy: e.clientY / zoom - node.y,
    };
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const x = e.clientX / zoom - d.dx;
    const y = e.clientY / zoom - d.dy;
    setNodes((prev) => prev.map((n) => (n.id === d.id ? { ...n, x, y } : n)));
  };

  const endDrag = () => {
    if (dragRef.current) {
      dragRef.current = null;
      setPast((p) => [...p.slice(-49), nodes]);
    }
  };

  const onSurfacePointerDown = (e: React.PointerEvent) => {
    setSelectedId(null);
    panRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
  };
  const onSurfacePointerMove = (e: React.PointerEvent) => {
    const p = panRef.current;
    if (!p) return;
    setPan({ x: p.x + (e.clientX - p.px), y: p.y + (e.clientY - p.py) });
  };

  /* ---------- render ---------- */

  const edges = nodes
    .filter((n) => n.parentId && byId.has(n.parentId))
    .map((n) => ({ from: byId.get(n.parentId!)!, to: n }));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Toolbar
        hasSelection={!!selected}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        activeColor={selected?.color ?? null}
        zoom={zoom}
        onAddChild={() => addNode("child")}
        onAddSibling={() => addNode("sibling")}
        onEdit={() => beginEdit(selectedId)}
        onDelete={deleteBranch}
        onColor={setColor}
        onUndo={undo}
        onRedo={redo}
        onTidy={tidy}
        onRecenter={recenter}
        onZoom={(d) => setZoom((z) => Math.min(1.6, Math.max(0.4, +(z + d).toFixed(2))))}
      />

      <main className="relative flex-1">
        <div
          ref={surfaceRef}
          tabIndex={0}
          role="application"
          aria-label="Mind map canvas"
          className="canvas-grid h-full w-full cursor-grab overflow-hidden outline-none active:cursor-grabbing"
          onPointerDown={onSurfacePointerDown}
          onPointerMove={onSurfacePointerMove}
          onPointerUp={() => (panRef.current = null)}
          onPointerLeave={() => (panRef.current = null)}
        >
          <div
            className="relative h-full w-full origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <svg className="pointer-events-none absolute left-0 top-0 h-[4000px] w-[4000px] overflow-visible">
              {edges.map(({ from, to }) => {
                const x1 = from.x + (to.x >= from.x ? NODE_W / 2 : -NODE_W / 2);
                const y1 = from.y;
                const x2 = to.x + (to.x >= from.x ? -NODE_W / 2 : NODE_W / 2);
                const y2 = to.y;
                const mid = (x1 + x2) / 2;
                const active = selectedId === to.id || selectedId === from.id;
                return (
                  <path
                    key={to.id}
                    d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    strokeWidth={active ? 2.5 : 1.75}
                    stroke={active ? COLOR_VAR[to.color] : "var(--link)"}
                    className="transition-all duration-200"
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              const isSelected = selectedId === node.id;
              const isEditing = editingId === node.id;
              return (
                <div
                  key={node.id}
                  data-selected={isSelected}
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={endDrag}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    beginEdit(node.id);
                  }}
                  className={[
                    "node-pop group absolute flex items-center justify-center rounded-xl border-2 px-4 text-center",
                    "bg-card text-card-foreground shadow-node select-none",
                    "transition-[border-color,box-shadow,transform] duration-150",
                    isEditing ? "cursor-text" : "cursor-pointer hover:scale-[1.02]",
                  ].join(" ")}
                  style={{
                    width: NODE_W,
                    minHeight: NODE_H,
                    left: node.x - NODE_W / 2,
                    top: node.y - NODE_H / 2,
                    borderColor: isEditing
                      ? "var(--edit)"
                      : isSelected
                        ? COLOR_VAR[node.color]
                        : "var(--border)",
                    boxShadow: isSelected
                      ? `0 0 0 4px color-mix(in oklch, ${COLOR_VAR[node.color]} 22%, transparent)`
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isEditing)
                      e.currentTarget.style.borderColor = "var(--hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isEditing)
                      e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <span
                    className="absolute -left-1 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: COLOR_VAR[node.color] }}
                  />
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      placeholder="Type an idea…"
                      className="w-full bg-transparent py-3 text-center text-sm font-medium outline-none placeholder:text-muted-foreground"
                    />
                  ) : (
                    <span className="py-3 text-sm font-medium leading-snug">
                      {node.text || "Untitled"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-panel/90 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
          {selected ? (
            <>
              <span className="text-foreground">{selected.text || "Untitled"}</span> selected —
              Space to branch, Enter to rename
            </>
          ) : (
            "Click a node or press an arrow key to focus"
          )}
        </div>
      </main>
    </div>
  );
}

function pickColor(list: MindNode[]): NodeColor {
  const order: NodeColor[] = ["node-1", "node-3", "node-4", "node-5", "node-6", "node-2"];
  return order[list.length % order.length]!;
}
