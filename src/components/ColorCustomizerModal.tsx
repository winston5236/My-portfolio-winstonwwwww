import React from "react";
import { ThemeSettings, Category } from "../types";
import { X, RotateCcw, Palette } from "lucide-react";

interface ColorCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeSettings;
  categories: Category[];
  onUpdateTheme: (key: keyof ThemeSettings, color: string) => void;
  onUpdateCategoryColor: (catId: string, color: string) => void;
  onResetColors: () => void;
}

const COLOR_LABELS: { [key in keyof ThemeSettings]?: string } = {
  bg: "Background canvas",
  surface: "Card surface",
  surface2: "Surface alt / inputs",
  text: "Primary text",
  muted: "Muted text",
  line: "Borders & grid lines",
  accentWeb: "Web accent color",
  accent3d: "3D accent color",
  accentPhoto: "Photo accent color",
  accentVideo: "Video accent color"
};

export const ColorCustomizerModal: React.FC<ColorCustomizerModalProps> = ({
  isOpen,
  onClose,
  theme,
  categories,
  onUpdateTheme,
  onUpdateCategoryColor,
  onResetColors
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-md p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[var(--accent-web)] font-mono text-xs">
          <Palette className="w-4 h-4" />
          <span>COLOR SYSTEM CUSTOMIZER</span>
        </div>

        <h3 className="font-display font-bold text-2xl mb-1 text-[var(--text)]">Edit Theme Colors</h3>
        <p className="text-xs text-[var(--muted)] mb-6 font-mono">
          Customize global theme tokens and section colors. Changes reflect immediately.
        </p>

        {/* Global Tokens */}
        <div className="space-y-3 mb-8">
          <h4 className="font-mono text-xs font-bold text-[var(--muted)] uppercase border-b border-[var(--line)] pb-1">
            Global Elements
          </h4>
          {(Object.keys(COLOR_LABELS) as (keyof ThemeSettings)[]).map((key) => (
            <div key={key} className="flex items-center justify-between py-1 font-mono text-xs">
              <span className="text-[var(--text)]">{COLOR_LABELS[key]}</span>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted)]">{theme[key]}</span>
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => onUpdateTheme(key, e.target.value)}
                  className="w-8 h-8 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Section Accent Colors */}
        <div className="space-y-3 mb-8">
          <h4 className="font-mono text-xs font-bold text-[var(--muted)] uppercase border-b border-[var(--line)] pb-1">
            Section Accent Colors
          </h4>
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-1 font-mono text-xs">
              <span className="text-[var(--text)]">{cat.label} ({cat.short})</span>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted)]">{cat.color}</span>
                <input
                  type="color"
                  value={cat.color.startsWith("#") ? cat.color : "#d9a94c"}
                  onChange={(e) => onUpdateCategoryColor(cat.id, e.target.value)}
                  className="w-8 h-8 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
          <button
            onClick={onResetColors}
            className="flex items-center gap-1.5 font-mono text-xs text-red-400 hover:text-red-300 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Colors</span>
          </button>

          <button
            onClick={onClose}
            className="bg-[var(--text)] text-[var(--bg)] font-semibold px-6 py-2 rounded-full text-xs cursor-pointer hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
