import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minimize2, Maximize2, GripVertical, Check } from "lucide-react";

interface FloatingPanelProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export default function FloatingPanel({
  open,
  onClose,
  onConfirm,
  title,
  titleIcon,
  children,
  defaultWidth = 560,
  defaultHeight = 520,
  minWidth = 320,
  minHeight = 300,
}: FloatingPanelProps) {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Center on first open
  useEffect(() => {
    if (open && pos.x === -1) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(defaultWidth, vw - 32);
      const h = Math.min(defaultHeight, vh - 32);
      setSize({ w, h });
      setPos({ x: Math.max(16, (vw - w) / 2), y: Math.max(16, (vh - h) / 2) });
    }
  }, [open, pos.x, defaultWidth, defaultHeight]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Drag
  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging) {
      const x = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 80));
      const y = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 40));
      setPos({ x, y });
    }
    if (resizing) {
      const rs = resizeStart.current;
      const dx = e.clientX - rs.px;
      const dy = e.clientY - rs.py;
      let newW = rs.w;
      let newH = rs.h;
      let newX = pos.x;
      let newY = pos.y;

      if (resizing.includes("e")) newW = Math.max(minWidth, rs.w + dx);
      if (resizing.includes("w")) {
        newW = Math.max(minWidth, rs.w - dx);
        newX = rs.x + (rs.w - newW);
      }
      if (resizing.includes("s")) newH = Math.max(minHeight, rs.h + dy);
      if (resizing.includes("n")) {
        newH = Math.max(minHeight, rs.h - dy);
        newY = rs.y + (rs.h - newH);
      }
      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    }
  }, [dragging, resizing, pos, minWidth, minHeight]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    setResizing(null);
  }, []);

  const onResizeStart = useCallback((handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { x: pos.x, y: pos.y, w: size.w, h: size.h, px: e.clientX, py: e.clientY };
    setResizing(handle);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pos, size]);

  if (!open) return null;

  const resizeHandles = [
    { id: "se", cursor: "nwse-resize", className: "bottom-0 right-0 w-4 h-4" },
    { id: "sw", cursor: "nesw-resize", className: "bottom-0 left-0 w-4 h-4" },
    { id: "ne", cursor: "nesw-resize", className: "top-0 right-0 w-4 h-4" },
    { id: "nw", cursor: "nwse-resize", className: "top-0 left-0 w-4 h-4" },
    { id: "e", cursor: "ew-resize", className: "top-1/2 -translate-y-1/2 right-0 w-2 h-10" },
    { id: "w", cursor: "ew-resize", className: "top-1/2 -translate-y-1/2 left-0 w-2 h-10" },
    { id: "s", cursor: "ns-resize", className: "bottom-0 left-1/2 -translate-x-1/2 w-10 h-2" },
    { id: "n", cursor: "ns-resize", className: "top-0 left-1/2 -translate-x-1/2 w-10 h-2" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={panelRef}
        dir="rtl"
        className="absolute pointer-events-auto bg-card rounded-2xl shadow-2xl border-2 border-muted flex flex-col overflow-hidden"
        style={{
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: minimized ? 52 : size.h,
          transition: dragging || resizing ? "none" : "height 0.2s ease",
        }}
      >
        {/* Drag header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-muted bg-muted/50 cursor-grab active:cursor-grabbing select-none shrink-0"
          onPointerDown={onDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-base font-black flex items-center gap-2">
              {titleIcon} {title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-green-500 hover:text-green-600 hover:bg-green-100 transition-colors"
                onPointerDown={e => e.stopPropagation()}
                title="אישור ושמירה"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMinimized(!minimized)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onPointerDown={e => e.stopPropagation()}
            >
              {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onPointerDown={e => e.stopPropagation()}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!minimized && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        )}

        {/* Resize handles */}
        {!minimized && resizeHandles.map(h => (
          <div
            key={h.id}
            className={`absolute ${h.className} z-10`}
            style={{ cursor: h.cursor }}
            onPointerDown={(e) => onResizeStart(h.id, e)}
          />
        ))}

        {/* Corner grip indicator */}
        {!minimized && (
          <div className="absolute bottom-1 right-1 pointer-events-none opacity-30">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              <circle cx="6" cy="10" r="1.5" fill="currentColor" />
              <circle cx="10" cy="6" r="1.5" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
