import React from "react";
import { SiteSettings } from "../types";
import { EditableText } from "./EditableText";
import { Lock, Unlock, Sparkles, Plus } from "lucide-react";

interface HeaderProps {
  site: SiteSettings;
  onUpdateSite: (key: keyof SiteSettings, value: string) => void;
  sectionCount: number;
  isEditorActive: boolean;
  onOpenLogin: () => void;
  onOpenAddCategory?: () => void;
  onOpenAddProject?: () => void;
  onGoHome?: () => void;
  isCompact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  site,
  onUpdateSite,
  sectionCount,
  isEditorActive,
  onOpenLogin,
  onOpenAddCategory,
  onOpenAddProject,
  onGoHome,
  isCompact = false
}) => {
  const formattedCount = String(sectionCount).padStart(2, "0") + " SECTIONS";

  return (
    <header className={`max-w-[1180px] mx-auto px-6 sm:px-8 transition-all duration-300 flex flex-col sm:flex-row sm:items-end justify-between gap-3 ${
      isCompact ? "pt-3 pb-2 sm:pt-4 sm:pb-2 border-b border-[var(--line)]/40" : "pt-10 pb-4"
    }`}>
      <div>
        <span className={`block font-mono tracking-widest text-[var(--muted)] uppercase transition-all ${
          isCompact ? "text-[10px] mb-0.5" : "text-xs mb-1"
        }`}>
          {formattedCount}
        </span>
        <h1
          onClick={() => {
            if (!isEditorActive && onGoHome) {
              onGoHome();
            }
          }}
          className={`font-display font-bold tracking-tight m-0 text-[var(--text)] flex items-baseline transition-all ${
            isCompact ? "text-2xl sm:text-3xl md:text-3xl" : "text-4xl sm:text-5xl md:text-6xl"
          } ${
            !isEditorActive && onGoHome ? "cursor-pointer group hover:opacity-90 transition-opacity" : ""
          }`}
          title={!isEditorActive ? "Return to Home Page" : undefined}
        >
          <EditableText
            value={site.title}
            onSave={(val) => onUpdateSite("title", val)}
            isEditorActive={isEditorActive}
            tagName="span"
          />
          <span className="text-[var(--accent-web)] font-extrabold ml-0.5 group-hover:scale-125 transition-transform inline-block">.</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        {isEditorActive && (
          <div className="flex items-center gap-2">
            {onOpenAddCategory && (
              <button
                onClick={onOpenAddCategory}
                className="flex items-center gap-1.5 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--muted)] px-3 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-web)]" />
                <span>+ Section</span>
              </button>
            )}
            {onOpenAddProject && (
              <button
                onClick={onOpenAddProject}
                className="flex items-center gap-1.5 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--muted)] px-3 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-photo)]" />
                <span>+ Project</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={onOpenLogin}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs border transition-all cursor-pointer ${
            isEditorActive
              ? "bg-[var(--accent-web)]/15 border-[var(--accent-web)] text-[var(--accent-web)] shadow-[0_0_12px_rgba(139,123,255,0.2)]"
              : "bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)]"
          }`}
          title={isEditorActive ? "Editor Mode is active" : "Log in to edit site"}
        >
          {isEditorActive ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Editor Active</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Edit site</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
