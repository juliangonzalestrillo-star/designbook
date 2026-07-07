import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import Toolbar from "./Toolbar";
import Node from "./Node";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";

export interface NodeData {
  id: string;
  x: number;
  y: number;
  color: string;
  title: string;
  content: string;
  drawing: string;
  connections: string[];
}

export interface Sheet {
  id: string;
  name: string;
  nodes: NodeData[];
}

export interface ProjectData {
  sheets: Sheet[];
  currentSheetId: string;
}

export default function EditorScreen() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { theme, gradientStyle } = useTheme();

  const [projectData, setProjectData] = useState<ProjectData>({
    sheets: [{ id: "sheet-1", name: "Hoja 1", nodes: [] }],
    currentSheetId: "sheet-1",
  });
  const [selectedTool, setSelectedTool] = useState<"cursor" | "node" | "brush">("cursor");
  const [selectedColor, setSelectedColor] = useState("#90CAF9");
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Refs to avoid stale closures in pointer handlers
  const canvasRef = useRef<HTMLDivElement>(null);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const didMoveRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  useEffect(() => {
    const saved = localStorage.getItem(`desingbook_project_${projectId}`);
    if (saved) setProjectData(JSON.parse(saved));
  }, [projectId]);

  useEffect(() => {
    if (projectId)
      localStorage.setItem(`desingbook_project_${projectId}`, JSON.stringify(projectData));
  }, [projectData, projectId]);

  const currentSheet = projectData.sheets.find((s) => s.id === projectData.currentSheetId);

  const addNode = useCallback((screenX: number, screenY: number) => {
    const offset = panOffsetRef.current;
    const newNode: NodeData = {
      id: Date.now().toString(),
      x: screenX - offset.x,
      y: screenY - offset.y,
      color: "#90CAF9",
      title: "Nueva Idea",
      content: "",
      drawing: "",
      connections: [],
    };
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.id === prev.currentSheetId
          ? { ...sheet, nodes: [...sheet.nodes, newNode] }
          : sheet
      ),
    }));
  }, []);

  const updateNode = (nodeId: string, updates: Partial<NodeData>) => {
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.id === prev.currentSheetId
          ? { ...sheet, nodes: sheet.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)) }
          : sheet
      ),
    }));
  };

  const deleteNode = (nodeId: string) => {
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.id === prev.currentSheetId
          ? { ...sheet, nodes: sheet.nodes.filter((n) => n.id !== nodeId) }
          : sheet
      ),
    }));
  };

  // ── Canvas pointer handlers (mouse + touch via Pointer Events API) ────────
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isPanningRef.current = true;
    didMoveRef.current = false;
    panStartRef.current = {
      x: e.clientX - panOffsetRef.current.x,
      y: e.clientY - panOffsetRef.current.y,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const nx = e.clientX - panStartRef.current.x;
    const ny = e.clientY - panStartRef.current.y;
    // Only count as a pan if moved more than 6px (distinguishes tap from drag)
    if (
      Math.abs(nx - panOffsetRef.current.x) > 6 ||
      Math.abs(ny - panOffsetRef.current.y) > 6
    ) {
      didMoveRef.current = true;
    }
    setPanOffset({ x: nx, y: ny });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    if (!didMoveRef.current && e.target === canvasRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      addNode(e.clientX - rect.left, e.clientY - rect.top);
    }
    didMoveRef.current = false;
  };

  // ── Sheet management ───────────────────────────────────────────────────────
  const addSheet = () => {
    const s: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Hoja ${projectData.sheets.length + 1}`,
      nodes: [],
    };
    setProjectData((prev) => ({ ...prev, sheets: [...prev.sheets, s], currentSheetId: s.id }));
  };

  const renameSheet = (id: string, name: string) =>
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => (s.id === id ? { ...s, name } : s)),
    }));

  const switchSheet = (id: string) =>
    setProjectData((prev) => ({ ...prev, currentSheetId: id }));

  const deleteSheet = (id: string) => {
    if (projectData.sheets.length <= 1) return;
    const remaining = projectData.sheets.filter((s) => s.id !== id);
    setProjectData((prev) => ({
      sheets: remaining,
      currentSheetId: prev.currentSheetId === id ? remaining[0].id : prev.currentSheetId,
    }));
  };

  return (
    <div className="h-screen flex flex-col" style={{ ...gradientStyle, minHeight: "100dvh" }}>
      {/* Header */}
      <div
        className="backdrop-blur-sm border-b px-4 py-2 flex items-center gap-2 flex-shrink-0"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
      >
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate("/projects")}
          style={{ color: theme.accent }}
          className="hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Proyectos
        </Button>
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate("/")}
          style={{ color: theme.subtitleColor }}
          className="hover:opacity-80"
        >
          <Home className="w-4 h-4 mr-1" />
          Inicio
        </Button>
        <div className="flex-1" />
        <span className="font-light text-sm" style={{ color: theme.titleColor }}>DesingBook</span>
      </div>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        sheets={projectData.sheets}
        currentSheetId={projectData.currentSheetId}
        onAddSheet={addSheet}
        onSwitchSheet={switchSheet}
        onRenameSheet={renameSheet}
        onDeleteSheet={deleteSheet}
      />

      {/* Canvas — pointer events handle both mouse and touch */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          touchAction: "none", // prevent browser scroll/zoom hijacking touch
          cursor: isPanningRef.current ? "grabbing" : "crosshair",
          backgroundImage: `
            linear-gradient(to right, ${theme.accent}22 1px, transparent 1px),
            linear-gradient(to bottom, ${theme.accent}22 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        {/* World transform layer — pointer-events:none so clicks reach canvas */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            pointerEvents: "none",
          }}
        >
          {currentSheet?.nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              onUpdate={updateNode}
              onDelete={deleteNode}
              allNodes={currentSheet.nodes}
            />
          ))}
        </div>

        {currentSheet?.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center font-light" style={{ color: theme.subtitleColor }}>
              <p className="text-lg mb-1 opacity-60">Toca el lienzo para crear tu primera idea</p>
              <p className="text-sm opacity-40">Arrastra por los bordes del nodo para moverlo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
