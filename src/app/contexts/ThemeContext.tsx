import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AppTheme {
  id: string;
  name: string;
  swatch: string; // preview color
  from: string;
  via: string;
  to: string;
  accent: string;
  accentHover: string;
  accentText: string;
  titleColor: string;
  subtitleColor: string;
  borderColor: string;
  cardBg: string;
}

export const THEMES: AppTheme[] = [
  {
    id: "blue",
    name: "Azul Suave",
    swatch: "#90CAF9",
    from: "#EFF6FF", via: "#DBEAFE", to: "#ECFEFF",
    accent: "#3B82F6", accentHover: "#2563EB", accentText: "#FFFFFF",
    titleColor: "#1E3A5F", subtitleColor: "#3B82F6",
    borderColor: "rgba(147,197,253,0.5)", cardBg: "rgba(255,255,255,0.7)",
  },
  {
    id: "sage",
    name: "Verde Salvia",
    swatch: "#86EFAC",
    from: "#F0FDF4", via: "#D1FAE5", to: "#ECFDF5",
    accent: "#10B981", accentHover: "#059669", accentText: "#FFFFFF",
    titleColor: "#064E3B", subtitleColor: "#10B981",
    borderColor: "rgba(110,231,183,0.5)", cardBg: "rgba(255,255,255,0.7)",
  },
  {
    id: "lavender",
    name: "Lavanda",
    swatch: "#C4B5FD",
    from: "#FAF5FF", via: "#EDE9FE", to: "#EEF2FF",
    accent: "#8B5CF6", accentHover: "#7C3AED", accentText: "#FFFFFF",
    titleColor: "#2E1065", subtitleColor: "#8B5CF6",
    borderColor: "rgba(196,181,253,0.5)", cardBg: "rgba(255,255,255,0.7)",
  },
  {
    id: "peach",
    name: "Melocotón",
    swatch: "#FCD34D",
    from: "#FFF7ED", via: "#FEF3C7", to: "#FFFBEB",
    accent: "#F59E0B", accentHover: "#D97706", accentText: "#FFFFFF",
    titleColor: "#451A03", subtitleColor: "#B45309",
    borderColor: "rgba(252,211,77,0.5)", cardBg: "rgba(255,255,255,0.7)",
  },
  {
    id: "rose",
    name: "Rosa Niebla",
    swatch: "#FDA4AF",
    from: "#FFF1F2", via: "#FCE7F3", to: "#FDF2F8",
    accent: "#F43F5E", accentHover: "#E11D48", accentText: "#FFFFFF",
    titleColor: "#4C0519", subtitleColor: "#F43F5E",
    borderColor: "rgba(253,164,175,0.5)", cardBg: "rgba(255,255,255,0.7)",
  },
  {
    id: "night",
    name: "Noche Índigo",
    swatch: "#312E81",
    from: "#0F172A", via: "#1E1B4B", to: "#0F172A",
    accent: "#818CF8", accentHover: "#6366F1", accentText: "#FFFFFF",
    titleColor: "#E0E7FF", subtitleColor: "#A5B4FC",
    borderColor: "rgba(129,140,248,0.2)", cardBg: "rgba(30,27,75,0.5)",
  },
];

interface ThemeCtx {
  theme: AppTheme;
  setThemeId: (id: string) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  gradientStyle: React.CSSProperties;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: THEMES[0],
  setThemeId: () => {},
  saturation: 1,
  setSaturation: () => {},
  gradientStyle: {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    return localStorage.getItem("desingbook_theme") ?? "blue";
  });
  const [saturation, setSaturationState] = useState<number>(() => {
    return Number(localStorage.getItem("desingbook_saturation") ?? "1");
  });

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  const setThemeId = (id: string) => {
    setThemeIdState(id);
    localStorage.setItem("desingbook_theme", id);
  };

  const setSaturation = (v: number) => {
    setSaturationState(v);
    localStorage.setItem("desingbook_saturation", String(v));
  };

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 50%, ${theme.to} 100%)`,
    filter: `saturate(${saturation})`,
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeId, saturation, setSaturation, gradientStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
