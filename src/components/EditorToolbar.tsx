import React from "react";
import { Palette, Plus, Download, LogOut, Sparkles } from "lucide-react";

interface EditorToolbarProps {
  isEditorActive: boolean;
  onOpenColorModal: () => void;
  onOpenAddProject: () => void;
  onOpenAddCategory: () => void;
  onExportSite: () => void;
  onExitEditor: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isEditorActive,
  onOpenColorModal,
  onOpenAddProject,
  onOpenAddCategory,
  onExportSite,
  onExitEditor
}) => {
  if (!isEditorActive) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--line)] py-3 px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl animate-slideUp">
      <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent-video)]">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="font-semibold">EDITOR MODE</span>
        <span className="hidden sm:inline text-[var(--muted)]">
          — click any text or media element to edit live
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
        <button
          onClick={onOpenColorModal}
          className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--muted)] text-[var(--text)] px-3.5 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
        >
          <Palette className="w-3.5 h-3.5 text-[var(--accent-3d)]" />
          <span>Colors</span>
        </button>

        <button
          onClick={onOpenAddCategory}
          className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--muted)] text-[var(--text)] px-3.5 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--accent-web)]" />
          <span>+ Section</span>
        </button>

        <button
          onClick={onOpenAddProject}
          className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--muted)] text-[var(--text)] px-3.5 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--accent-photo)]" />
          <span>+ Project</span>
        </button>

        <button
          onClick={onExportSite}
          className="flex items-center gap-1.5 bg-[var(--text)] text-[var(--bg)] px-4 py-1.5 rounded-full font-mono text-xs font-semibold hover:opacity-90 cursor-pointer shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Site Data</span>
        </button>

        <button
          onClick={onExitEditor}
          className="flex items-center gap-1.5 bg-transparent border border-[var(--line)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--text)] px-3 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
          title="Exit Editor Mode"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
};
