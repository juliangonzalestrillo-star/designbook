import { useState, useEffect, useRef } from "react";
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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const didPanRef = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`desingbook_project_${projectId}`);
    if (saved) {
      setProjectData(JSON.parse(saved));
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`desingbook_project_${projectId}`, JSON.stringify(projectData));
    }
  }, [projectData, projectId]);

  const currentSheet = projectData.sheets.find((s) => s.id === projectData.currentSheetId);

  const addNode = (x: number, y: number) => {
    const newNode: NodeData = {
      id: Date.now().toString(),
      x: x - panOffset.x,
      y: y - panOffset.y,
      color: selectedColor,
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
  };

  const updateNode = (nodeId: string, updates: Partial<NodeData>) => {
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.id === prev.currentSheetId
          ? {
              ...sheet,
              nodes: sheet.nodes.map((node) =>
                node.id === nodeId ? { ...node, ...updates } : node
              ),
            }
          : sheet
      ),
    }));
  };

  const deleteNode = (nodeId: string) => {
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.id === prev.currentSheetId
          ? {
              ...sheet,
              nodes: sheet.nodes.filter((node) => node.id !== nodeId),
            }
          : sheet
      ),
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current && !didPanRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      addNode(e.clientX - rect.left, e.clientY - rect.top);
    }
    didPanRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      didPanRef.current = false;
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      didPanRef.current = true;
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const addSheet = () => {
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Hoja ${projectData.sheets.length + 1}`,
      nodes: [],
    };
    setProjectData((prev) => ({
      ...prev,
      sheets: [...prev.sheets, newSheet],
      currentSheetId: newSheet.id,
    }));
  };

  const renameSheet = (sheetId: string, newName: string) => {
    setProjectData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.id === sheetId ? { ...sheet, name: newName } : sheet
      ),
    }));
  };

  const switchSheet = (sheetId: string) => {
    setProjectData((prev) => ({
      ...prev,
      currentSheetId: sheetId,
    }));
  };

  const deleteSheet = (sheetId: string) => {
    if (projectData.sheets.length <= 1) return;
    
    const newSheets = projectData.sheets.filter((s) => s.id !== sheetId);
    setProjectData((prev) => ({
      sheets: newSheets,
      currentSheetId: prev.currentSheetId === sheetId ? newSheets[0].id : prev.currentSheetId,
    }));
  };

  return (
    <div className="h-screen flex flex-col" style={{ ...gradientStyle, minHeight: "100vh" }}>
        {/* Header */}
        <div className="backdrop-blur-sm border-b px-4 py-2 flex items-center gap-3"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/projects")}
            style={{ color: theme.accent }}
            className="hover:opacity-80"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Proyectos
          </Button>
          <Button
            variant="ghost"
            size="sm"
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

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-move"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            backgroundImage: `
              linear-gradient(to right, ${theme.accent}18 1px, transparent 1px),
              linear-gradient(to bottom, ${theme.accent}18 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          }}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
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

          {/* Instrucción inicial */}
          {currentSheet?.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-blue-400 font-light">
                <p className="text-lg mb-2">Haz clic en cualquier lugar del lienzo</p>
                <p>para crear tu primera idea</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
