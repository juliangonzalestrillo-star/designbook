import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { X, Link, ChevronDown, ChevronRight, Type, ImageIcon, Palette, GripHorizontal } from "lucide-react";
import type { NodeData } from "./EditorScreen";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface NodeProps {
  node: NodeData;
  onUpdate: (nodeId: string, updates: Partial<NodeData>) => void;
  onDelete: (nodeId: string) => void;
  allNodes: NodeData[];
}

const NODE_COLORS = [
  "#90CAF9", "#64B5F6", "#42A5F5", "#1E88E5",
  "#A5D6A7", "#81C784", "#4CAF50",
  "#FFE082", "#FFD54F", "#FFC107",
  "#FFAB91", "#FF8A65", "#FF7043",
  "#CE93D8", "#BA68C8", "#9C27B0",
  "#F48FB1", "#F06292", "#E91E63",
  "#FFFFFF", "#CFD8DC", "#546E7A",
];

const BRUSH_COLORS = ["#1E3A5F", "#E53935", "#43A047", "#FB8C00", "#9C27B0", "#FFFFFF"];
const EDGE_SIZE = 14; // px from edge that counts as drag zone

type Pleat = "text" | "draw" | "color" | null;

export default function Node({ node, onUpdate, onDelete, allNodes }: NodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openPleat, setOpenPleat] = useState<Pleat>(null);
  const [brushColor, setBrushColor] = useState("#1E3A5F");
  const [brushSize, setBrushSize] = useState(3);
  const [isDragging, setIsDragging] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragState = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const isDrawingRef = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // ── Restore drawing when pleat opens ──────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current && node.drawing && openPleat === "draw") {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);
      };
      img.src = node.drawing;
    }
  }, [openPleat]);

  const togglePleat = (pleat: Pleat) =>
    setOpenPleat((prev) => (prev === pleat ? null : pleat));

  // ── Drawing (pointer events — works for mouse + touch) ───────────────────
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const onDrawStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    lastPoint.current = pt;
  };

  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const onDrawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPoint.current) return;
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // getCoalescedEvents gives all intermediate points batched since last frame
    const events: { clientX: number; clientY: number }[] =
      (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent as PointerEvent];

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (const ev of events) {
      const pt = {
        x: (ev.clientX - rect.left) * scaleX,
        y: (ev.clientY - rect.top) * scaleY,
      };
      drawSegment(ctx, lastPoint.current, pt);
      lastPoint.current = pt;
    }
  };

  const onDrawEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.stopPropagation();
    isDrawingRef.current = false;
    lastPoint.current = null;
    if (canvasRef.current) {
      onUpdate(node.id, { drawing: canvasRef.current.toDataURL() });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    onUpdate(node.id, { drawing: "" });
  };

  // ── Edge-only drag (pointer events) ──────────────────────────────────────
  const isNearEdge = useCallback((e: React.PointerEvent, el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return (
      x < EDGE_SIZE || x > rect.width - EDGE_SIZE ||
      y < EDGE_SIZE || y > rect.height - EDGE_SIZE
    );
  }, []);

  const onCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isNearEdge(e, cardRef.current)) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };
    setIsDragging(true);
  };

  const onCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    onUpdate(node.id, {
      x: dragState.current.nodeX + dx,
      y: dragState.current.nodeY + dy,
    });
  };

  const onCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    e.stopPropagation();
    dragState.current = null;
    setIsDragging(false);
  };

  // ── Cursor based on hover zone ────────────────────────────────────────────
  const [isEdgeHover, setIsEdgeHover] = useState(false);
  const onCardPointerMoveForCursor = (e: React.PointerEvent<HTMLDivElement>) => {
    onCardPointerMove(e);
    if (cardRef.current && !dragState.current) {
      setIsEdgeHover(isNearEdge(e, cardRef.current));
    }
  };

  const otherNodes = allNodes.filter((n) => n.id !== node.id);

  const isDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const textColor = isDark(node.color) ? "text-white" : "text-blue-900";
  const mutedColor = isDark(node.color) ? "text-white/70" : "text-blue-600";

  return (
    <>
      {node.connections.map((targetId) => {
        const target = allNodes.find((n) => n.id === targetId);
        if (!target) return null;
        return (
          <svg
            key={`conn-${node.id}-${targetId}`}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: "100%", height: "100%", zIndex: 0 }}
          >
            <line
              x1={node.x + 140} y1={node.y + 32}
              x2={target.x + 140} y2={target.y + 32}
              stroke="#42A5F5" strokeWidth="1.5"
              strokeDasharray="6,4" opacity="0.5"
            />
          </svg>
        );
      })}

      <div
        ref={cardRef}
        style={{
          position: "absolute",
          left: node.x,
          top: node.y,
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 50 : isExpanded ? 20 : 1,
          width: isExpanded ? 320 : 240,
          pointerEvents: "auto",
          cursor: isDragging ? "grabbing" : isEdgeHover ? "grab" : "default",
          touchAction: "none",
        }}
        className="transition-[width,opacity] duration-200"
        onPointerDown={onCardPointerDown}
        onPointerMove={onCardPointerMoveForCursor}
        onPointerUp={onCardPointerUp}
        onPointerLeave={() => { setIsEdgeHover(false); }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Edge grab hint ring */}
        {isEdgeHover && !isDragging && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{ boxShadow: "0 0 0 2px rgba(66,165,245,0.6)", borderRadius: 16 }}
          />
        )}

        {/* Card */}
        <div
          className="rounded-2xl shadow-lg overflow-hidden select-none"
          style={{ backgroundColor: node.color, border: `2px solid ${node.color}` }}
        >
          {/* Header */}
          <div className="px-3 pt-2 pb-2 flex items-center gap-2">
            {/* Grip icon in corner as visual hint */}
            <GripHorizontal className={`w-3 h-3 opacity-40 flex-shrink-0 ${mutedColor}`} />

            <Input
              value={node.title}
              onChange={(e) => onUpdate(node.id, { title: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className={`border-0 bg-white/20 placeholder:text-white/50 font-medium text-sm flex-1 h-7 px-2 focus:bg-white/40 rounded-lg ${textColor}`}
              placeholder="Idea..."
            />

            {/* Connect */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0 ${mutedColor}`}
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-52 bg-white p-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-medium mb-2 text-blue-900">Conectar con:</p>
                {otherNodes.length === 0 ? (
                  <p className="text-xs text-blue-400">No hay otros nodos</p>
                ) : (
                  <div className="space-y-1">
                    {otherNodes.map((n) => (
                      <button
                        key={n.id}
                        className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                          node.connections.includes(n.id)
                            ? "bg-blue-100 text-blue-800"
                            : "hover:bg-blue-50 text-blue-700"
                        }`}
                        onClick={() => {
                          const isConn = node.connections.includes(n.id);
                          onUpdate(node.id, {
                            connections: isConn
                              ? node.connections.filter((id) => id !== n.id)
                              : [...node.connections, n.id],
                          });
                        }}
                      >
                        {n.title}
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Expand */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((v) => !v);
                if (isExpanded) setOpenPleat(null);
              }}
              className={`p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0 ${mutedColor}`}
            >
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Delete */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="p-1 rounded hover:bg-red-400/30 transition-colors text-red-500 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pleats */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="pleats"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="bg-white/20 mx-2 mb-2 rounded-xl overflow-hidden">

                  {/* ── Text pleat ── */}
                  <PleatHeader
                    icon={<Type className="w-3.5 h-3.5" />}
                    label="Texto"
                    open={openPleat === "text"}
                    onToggle={() => togglePleat("text")}
                    textColor={textColor}
                  />
                  <AnimatePresence initial={false}>
                    {openPleat === "text" && (
                      <motion.div
                        key="text-body"
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 bg-white/30">
                          <Textarea
                            value={node.content}
                            onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            placeholder="Escribe tu idea aquí..."
                            className="min-h-[120px] text-sm bg-white/80 border-0 rounded-lg resize-none focus:bg-white font-light text-blue-900 placeholder:text-blue-300"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-px bg-black/10 mx-2" />

                  {/* ── Draw pleat ── */}
                  <PleatHeader
                    icon={<ImageIcon className="w-3.5 h-3.5" />}
                    label="Boceto"
                    open={openPleat === "draw"}
                    onToggle={() => togglePleat("draw")}
                    textColor={textColor}
                  />
                  <AnimatePresence initial={false}>
                    {openPleat === "draw" && (
                      <motion.div
                        key="draw-body"
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 bg-white/30 space-y-2">
                          {/* Brush controls */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex gap-1.5">
                              {BRUSH_COLORS.map((c) => (
                                <button
                                  key={c}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => setBrushColor(c)}
                                  className="w-6 h-6 rounded-full transition-transform active:scale-90"
                                  style={{
                                    backgroundColor: c,
                                    outline: brushColor === c ? "2.5px solid #1E88E5" : "2px solid rgba(0,0,0,0.15)",
                                    outlineOffset: "1px",
                                    boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px rgba(0,0,0,0.2)" : undefined,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex gap-1 ml-auto items-center">
                              {[2, 5, 10].map((s) => (
                                <button
                                  key={s}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => setBrushSize(s)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                  style={{
                                    background: brushSize === s ? "rgba(66,165,245,0.25)" : "transparent",
                                    outline: brushSize === s ? "1.5px solid #42A5F5" : "none",
                                  }}
                                >
                                  <div
                                    className="rounded-full"
                                    style={{
                                      width: Math.min(s, 12),
                                      height: Math.min(s, 12),
                                      backgroundColor: brushColor === "#FFFFFF" ? "#999" : brushColor,
                                    }}
                                  />
                                </button>
                              ))}
                            </div>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={clearCanvas}
                              className="text-xs text-blue-700 hover:text-blue-900 underline ml-1"
                            >
                              Limpiar
                            </button>
                          </div>

                          {/* Canvas */}
                          <canvas
                            ref={canvasRef}
                            width={560}
                            height={360}
                            className="w-full rounded-xl bg-white border border-blue-100 block"
                            style={{
                              touchAction: "none",
                              cursor: "crosshair",
                            }}
                            onPointerDown={onDrawStart}
                            onPointerMove={onDrawMove}
                            onPointerUp={onDrawEnd}
                            onPointerCancel={onDrawEnd}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-px bg-black/10 mx-2" />

                  {/* ── Color pleat ── */}
                  <PleatHeader
                    icon={<Palette className="w-3.5 h-3.5" />}
                    label="Color del nodo"
                    open={openPleat === "color"}
                    onToggle={() => togglePleat("color")}
                    textColor={textColor}
                  />
                  <AnimatePresence initial={false}>
                    {openPleat === "color" && (
                      <motion.div
                        key="color-body"
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-white/30">
                          <div className="grid grid-cols-7 gap-1.5">
                            {NODE_COLORS.map((c) => (
                              <button
                                key={c}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onUpdate(node.id, { color: c })}
                                className="w-7 h-7 rounded-lg transition-transform active:scale-90 hover:scale-110"
                                style={{
                                  backgroundColor: c,
                                  outline: node.color === c ? "2.5px solid #1E88E5" : "1.5px solid rgba(0,0,0,0.12)",
                                  outlineOffset: node.color === c ? "1px" : "0px",
                                  boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function PleatHeader({
  icon, label, open, onToggle, textColor,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  textColor: string;
}) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-black/10 active:bg-black/15 transition-colors ${textColor}`}
    >
      {icon}
      <span className="text-xs font-medium flex-1 text-left">{label}</span>
      <ChevronRight
        className="w-3 h-3 opacity-50 transition-transform duration-150"
        style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      />
    </button>
  );
}
