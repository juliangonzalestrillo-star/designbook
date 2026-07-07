import { useState } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  MousePointer,
  Square,
  Brush,
  Palette,
  Music,
  Plus,
  X,
  Edit,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import type { Sheet } from "./EditorScreen";

interface ToolbarProps {
  selectedTool: "cursor" | "node" | "brush";
  onToolChange: (tool: "cursor" | "node" | "brush") => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  sheets: Sheet[];
  currentSheetId: string;
  onAddSheet: () => void;
  onSwitchSheet: (sheetId: string) => void;
  onRenameSheet: (sheetId: string, newName: string) => void;
  onDeleteSheet: (sheetId: string) => void;
}

const colors = [
  "#90CAF9", // Azul claro
  "#64B5F6", // Azul
  "#42A5F5", // Azul medio
  "#A5D6A7", // Verde claro
  "#81C784", // Verde
  "#FFE082", // Amarillo claro
  "#FFD54F", // Amarillo
  "#FFAB91", // Naranja claro
  "#FF8A65", // Naranja
  "#CE93D8", // Púrpura claro
  "#BA68C8", // Púrpura
  "#F48FB1", // Rosa
];

const ambientMusic = [
  { name: "Lluvia Relajante", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112e489.mp3" },
  { name: "Bosque Tranquilo", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4744e401b0.mp3" },
  { name: "Ondas del Océano", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_0929013463.mp3" },
];

export default function Toolbar({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  sheets,
  currentSheetId,
  onAddSheet,
  onSwitchSheet,
  onRenameSheet,
  onDeleteSheet,
}: ToolbarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<HTMLAudioElement | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const playMusic = (url: string) => {
    if (currentTrack) {
      currentTrack.pause();
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play();
    setCurrentTrack(audio);
    setIsPlaying(true);
  };

  const stopMusic = () => {
    if (currentTrack) {
      currentTrack.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  const startRename = (sheetId: string, currentName: string) => {
    setEditingSheetId(sheetId);
    setEditingName(currentName);
  };

  const finishRename = () => {
    if (editingSheetId && editingName.trim()) {
      onRenameSheet(editingSheetId, editingName);
    }
    setEditingSheetId(null);
    setEditingName("");
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-blue-200 px-4 py-3 space-y-3">
      {/* Herramientas principales */}
      <div className="flex items-center gap-4">
        {/* Herramientas de selección */}
        <div className="flex items-center gap-2 border-r border-blue-200 pr-4">
          <Button
            variant={selectedTool === "cursor" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("cursor")}
            className={selectedTool === "cursor" ? "bg-blue-500" : ""}
          >
            <MousePointer className="w-4 h-4 mr-2" />
            Cursor
          </Button>
          <Button
            variant={selectedTool === "node" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("node")}
            className={selectedTool === "node" ? "bg-blue-500" : ""}
          >
            <Square className="w-4 h-4 mr-2" />
            Nodo
          </Button>
        </div>

        {/* Selector de color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-blue-200">
              <Palette className="w-4 h-4 mr-2" />
              Color
              <div
                className="w-4 h-4 rounded ml-2 border border-blue-300"
                style={{ backgroundColor: selectedColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-white">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "#1E88E5" : "#E3F2FD",
                  }}
                  onClick={() => onColorChange(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Música ambiente */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-blue-200">
              <Music className="w-4 h-4 mr-2" />
              {isPlaying ? "Música Activa" : "Música"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-white">
            <div className="space-y-2">
              <p className="text-sm font-light text-blue-900 mb-3">Música de Ambiente/en desarrollo</p>
              {ambientMusic.map((track) => (
                <Button
                  key={track.url}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-blue-700 hover:bg-blue-50"
                  onClick={() => playMusic(track.url)}
                >
                  {track.name}
                </Button>
              ))}
              {isPlaying && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={stopMusic}
                >
                  Detener Música
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Gestión de hojas */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-sm text-blue-700 font-light mr-2">Hojas:</span>
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
              sheet.id === currentSheetId
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-blue-700 border-blue-200 hover:border-blue-400"
            }`}
          >
            {editingSheetId === sheet.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => e.key === "Enter" && finishRename()}
                className="h-6 w-24 px-2 text-sm"
                autoFocus
              />
            ) : (
              <>
                <button
                  onClick={() => onSwitchSheet(sheet.id)}
                  className="text-sm font-light"
                >
                  {sheet.name}
                </button>
                {sheet.id === currentSheetId && (
                  <>
                    <button
                      onClick={() => startRename(sheet.id, sheet.name)}
                      className="hover:opacity-70"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    {sheets.length > 1 && (
                      <button
                        onClick={() => onDeleteSheet(sheet.id)}
                        className="hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddSheet}
          className="text-blue-600 hover:bg-blue-50"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
