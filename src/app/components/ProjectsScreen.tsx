import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, FolderOpen, Trash2, Home } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export default function ProjectsScreen() {
  const navigate = useNavigate();
  const { theme, gradientStyle } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("desingbook_projects");
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      createdAt: new Date().toISOString(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem("desingbook_projects", JSON.stringify(updated));
    localStorage.setItem(
      `desingbook_project_${newProject.id}`,
      JSON.stringify({ sheets: [{ id: "sheet-1", name: "Hoja 1", nodes: [] }], currentSheetId: "sheet-1" })
    );
    setNewProjectName("");
    setIsDialogOpen(false);
    navigate(`/editor/${newProject.id}`);
  };

  const deleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    localStorage.setItem("desingbook_projects", JSON.stringify(updated));
    localStorage.removeItem(`desingbook_project_${projectId}`);
  };

  return (
    <div className="min-h-screen p-8" style={gradientStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-light mb-1" style={{ color: theme.titleColor }}>
              Tus Proyectos
            </h1>
            <p className="font-light" style={{ color: theme.subtitleColor }}>
              Selecciona un proyecto existente o crea uno nuevo
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light transition-all hover:opacity-80 active:scale-95"
            style={{
              backgroundColor: theme.accent + "18",
              color: theme.accent,
              border: `1px solid ${theme.accent}40`,
            }}
          >
            <Home className="w-4 h-4" />
            Inicio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New project card */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <div
                className="p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[200px] flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: theme.accent + "60",
                  backgroundColor: theme.cardBg,
                }}
              >
                <div className="text-center">
                  <Plus
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: theme.accent }}
                  />
                  <p className="font-light" style={{ color: theme.subtitleColor }}>
                    Nuevo Proyecto
                  </p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle style={{ color: theme.titleColor }}>
                  Crear Nuevo Proyecto
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Nombre del proyecto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createProject()}
                  style={{ borderColor: theme.accent + "60" }}
                />
                <button
                  onClick={createProject}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: theme.accent, color: theme.accentText }}
                >
                  Crear Proyecto
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Existing projects */}
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
            >
              <div
                className="p-6 rounded-2xl cursor-pointer transition-all min-h-[200px] flex flex-col justify-between group hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}` }}
              >
                <div onClick={() => navigate(`/editor/${project.id}`)}>
                  <FolderOpen
                    className="w-10 h-10 mb-3"
                    style={{ color: theme.accent }}
                  />
                  <h3
                    className="text-xl font-light mb-1"
                    style={{ color: theme.titleColor }}
                  >
                    {project.name}
                  </h3>
                  <p className="text-sm font-light" style={{ color: theme.subtitleColor }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
