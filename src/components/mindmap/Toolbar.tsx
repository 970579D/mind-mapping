import {
  CornerDownRight,
  Minus,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Rows3,
  Trash2,
  Undo2,
  Crosshair,
} from "lucide-react";
import { COLOR_VAR, NODE_COLORS, type NodeColor } from "./types";

interface ToolButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

function ToolButton({
  icon: Icon,
  label,
  shortcut,
  disabled,
  danger,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={[
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        "text-muted-foreground hover:bg-secondary hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        danger ? "hover:bg-destructive/15 hover:text-destructive" : "",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {shortcut ? (
        <kbd className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-sans text-[10px] tracking-wide text-muted-foreground">
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

interface ToolbarProps {
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  activeColor: NodeColor | null;
  zoom: number;
  onAddChild: () => void;
  onAddSibling: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onColor: (c: NodeColor) => void;
  onUndo: () => void;
  onRedo: () => void;
  onTidy: () => void;
  onRecenter: () => void;
  onZoom: (delta: number) => void;
}

export function Toolbar({
  hasSelection,
  canUndo,
  canRedo,
  activeColor,
  zoom,
  onAddChild,
  onAddSibling,
  onEdit,
  onDelete,
  onColor,
  onUndo,
  onRedo,
  onTidy,
  onRecenter,
  onZoom,
}: ToolbarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-5 border-r border-border bg-sidebar p-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">Mindforge</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Mouse or keyboard — never both required.
        </p>
      </div>

      <section className="space-y-1">
        <p className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
          Nodes
        </p>
        <ToolButton
          icon={Plus}
          label="Add child"
          shortcut="Space"
          disabled={!hasSelection}
          onClick={onAddChild}
        />
        <ToolButton
          icon={CornerDownRight}
          label="Add sibling"
          shortcut="Tab"
          disabled={!hasSelection}
          onClick={onAddSibling}
        />
        <ToolButton
          icon={Pencil}
          label="Edit text"
          shortcut="Enter"
          disabled={!hasSelection}
          onClick={onEdit}
        />
        <ToolButton
          icon={Trash2}
          label="Delete branch"
          shortcut="Del"
          danger
          disabled={!hasSelection}
          onClick={onDelete}
        />
      </section>

      <section className="space-y-2">
        <p className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
          <Palette className="mr-1.5 inline h-3 w-3" />
          Color
        </p>
        <div className="flex flex-wrap gap-2 px-3">
          {NODE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={!hasSelection}
              onClick={() => onColor(c)}
              aria-label={`Set color ${c}`}
              className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                backgroundColor: COLOR_VAR[c],
                borderColor:
                  activeColor === c ? "var(--foreground)" : "transparent",
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-1">
        <p className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
          Canvas
        </p>
        <ToolButton icon={Rows3} label="Auto arrange" shortcut="L" onClick={onTidy} />
        <ToolButton icon={Crosshair} label="Center view" shortcut="0" onClick={onRecenter} />
        <ToolButton icon={Undo2} label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={onUndo} />
        <ToolButton
          icon={Redo2}
          label="Redo"
          shortcut="⇧⌘Z"
          disabled={!canRedo}
          onClick={onRedo}
        />
        <div className="mt-1 flex items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => onZoom(-0.1)}
            aria-label="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onZoom(0.1)}
            aria-label="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <div className="mt-auto rounded-lg border border-border bg-background/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Keyboard</p>
        <p>Arrows — move focus between nodes</p>
        <p>Enter — edit, Esc — cancel</p>
        <p>Space — new child node</p>
        <p>Shift + arrows — nudge node</p>
      </div>
    </aside>
  );
}
