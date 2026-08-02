import React, { useRef } from "react";
import { Palette, Plus, Download, Upload, LogOut, Sparkles, Trash2, CloudCheck, CloudOff, RefreshCw } from "lucide-react";
import { SyncStatus } from "../firestoreSync";

interface EditorToolbarProps {
  isEditorActive: boolean;
  syncStatus?: SyncStatus;
  onOpenColorModal: () => void;
  onOpenAddProject: () => void;
  onOpenAddCategory: () => void;
  onClearAllProjects?: () => void;
  onExportSite: () => void;
  onImportSite?: (jsonData: string) => void;
  onExitEditor: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isEditorActive,
  syncStatus = "synced",
  onOpenColorModal,
  onOpenAddProject,
  onOpenAddCategory,
  onClearAllProjects,
  onExportSite,
  onImportSite,
  onExitEditor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isEditorActive) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onImportSite) {
        onImportSite(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--line)] py-3 px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl animate-slideUp">
      <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
        <div className="flex items-center gap-2 text-[var(--accent-video)]">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="font-semibold">EDITOR MODE</span>
        </div>

        {/* Sync status indicator */}
        {syncStatus === "synced" && (
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px]" title="Real-time automatic Cloud Sync active">
            <CloudCheck className="w-3.5 h-3.5" />
            <span>Cloud Synced</span>
          </div>
        )}
        {syncStatus === "saving" && (
          <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px]" title="Saving changes automatically to Cloud...">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing to Cloud...</span>
          </div>
        )}
        {syncStatus === "quota_exceeded" && (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[11px]" title="Firebase write limit reached. Saved safely in Local Storage & JSON export.">
            <CloudOff className="w-3.5 h-3.5" />
            <span>Saved Locally (Quota Limit)</span>
          </div>
        )}
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

        {onClearAllProjects && (
          <button
            onClick={onClearAllProjects}
            className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900/90 border border-red-500/40 text-red-300 px-3.5 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
            title="Clear all default projects so you can start fresh with your own"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Clear All Projects</span>
          </button>
        )}

        <button
          onClick={onExportSite}
          className="flex items-center gap-1.5 bg-[var(--text)] text-[var(--bg)] px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold hover:opacity-90 cursor-pointer shadow-sm transition-all"
          title="Export JSON portfolio configuration backup"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </button>

        {onImportSite && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--muted)] text-[var(--text)] px-3.5 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
              title="Import portfolio JSON file to instantly load into any browser"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
            </button>
          </>
        )}

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
