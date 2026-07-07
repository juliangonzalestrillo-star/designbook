import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Settings, ChevronUp } from "lucide-react";
import { useTheme, THEMES } from "../contexts/ThemeContext";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { theme, setThemeId, saturation, setSaturation, gradientStyle } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={gradientStyle}>

      {/* ── Main content — vertically centered in the available space ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
           initial={{ y: -16, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.7, delay: 0.1 }}
           className="mb-6"
          >
            <div
              className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl"
              style={{ backgroundColor: theme.accent + "22", border: `2px solid ${theme.accent}44` }}
            >
              <BookOpen
                className="w-12 h-12"
                style={{ color: theme.accent }}
                strokeWidth={1.4}
              />
            </div>
            <h1
              className="text-6xl font-light mb-2 tracking-wide"
              style={{ color: theme.titleColor }}
            >
              BookDesign
            </h1>
            <p className="text-lg font-light tracking-wider" style={{ color: theme.subtitleColor }}>
              Organiza tus ideas de forma creativa
            </p>
          </motion.div>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <button
              onClick={() => navigate("/projects")}
              className="px-12 py-4 rounded-full text-lg font-light shadow-lg transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: theme.accent,
                color: theme.accentText,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.accentHover)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.accent)
              }
            >
              Comenzar
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Settings panel pinned to bottom ── */}
      <div className="w-full">
        {/* Toggle bar */}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 transition-colors"
          style={{ color: theme.subtitleColor }}
        >
          <Settings className="w-4 h-4 opacity-60" />
          <span className="text-sm font-light opacity-70">Personalización</span>
          <motion.div
            animate={{ rotate: settingsOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-4 h-4 opacity-50" />
          </motion.div>
        </button>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              key="settings"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className="mx-4 mb-4 rounded-2xl p-5 space-y-5 shadow-lg backdrop-blur-sm"
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                {/* Color palettes */}
                <div>
                  <p
                    className="text-xs font-medium mb-3 tracking-wide uppercase opacity-60"
                    style={{ color: theme.titleColor }}
                  >
                    Combinación de colores
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        title={t.name}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-light transition-all duration-150 active:scale-95"
                        style={{
                          background: `linear-gradient(90deg, ${t.from}, ${t.via})`,
                          border: theme.id === t.id
                            ? `2px solid ${t.accent}`
                            : `2px solid ${t.borderColor}`,
                          color: t.titleColor,
                          boxShadow: theme.id === t.id ? `0 0 0 2px ${t.accent}40` : undefined,
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.accent }}
                        />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Saturation slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className="text-xs font-medium tracking-wide uppercase opacity-60"
                      style={{ color: theme.titleColor }}
                    >
                      Saturación
                    </p>
                    <span
                      className="text-xs font-light opacity-50"
                      style={{ color: theme.titleColor }}
                    >
                      {Math.round(saturation * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-40" style={{ color: theme.titleColor }}>
                      Suave
                    </span>
                    <input
                      type="range"
                      min="0.2"
                      max="2"
                      step="0.05"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        accentColor: theme.accent,
                        background: `linear-gradient(to right, ${theme.accent} 0%, ${theme.accent} ${
                          ((saturation - 0.2) / 1.8) * 100
                        }%, ${theme.borderColor} ${((saturation - 0.2) / 1.8) * 100}%, ${theme.borderColor} 100%)`,
                      }}
                    />
                    <span className="text-xs opacity-40" style={{ color: theme.titleColor }}>
                      Vívido
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
