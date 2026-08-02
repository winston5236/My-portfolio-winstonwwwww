import React, { useState } from "react";
import { Category, Project } from "../types";
import { EditableText } from "./EditableText";
import { ArrowLeft, Plus, Trash2, ExternalLink, Image as ImageIcon, Video, Box, Globe, Crop, Maximize2, Upload } from "lucide-react";

interface CategoryViewProps {
  category: Category;
  categoryIndex: number;
  totalCategories: number;
  projects: Project[];
  onBackToWheel: () => void;
  onSelectProject: (project: Project) => void;
  isEditorActive: boolean;
  onUpdateCategory: (catId: string, field: keyof Category, value: string) => void;
  onUpdateProject: (projId: string, field: keyof Project, value: any) => void;
  onAddProject: () => void;
  onDeleteProject: (projId: string) => void;
}

const MEDIUM_ICONS = {
  web: Globe,
  "3d": Box,
  photo: ImageIcon,
  video: Video
};

const MEDIUM_COLORS = {
  web: "var(--accent-web)",
  "3d": "var(--accent-3d)",
  photo: "var(--accent-photo)",
  video: "var(--accent-video)"
};

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  categoryIndex,
  totalCategories,
  projects,
  onBackToWheel,
  onSelectProject,
  isEditorActive,
  onUpdateCategory,
  onUpdateProject,
  onAddProject,
  onDeleteProject
}) => {
  const categoryProjects = projects.filter((p) => p.category === category.id);

  const handleCoverChange = (projectId: string, newCoverUrl: string) => {
    onUpdateProject(projectId, "cover", newCoverUrl);
  };

  const handleCoverFileUpload = (projectId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        handleCoverChange(projectId, reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-[1180px] mx-auto px-6 sm:px-8 py-3 sm:py-4 min-h-[80vh] animate-fadeIn">
      {/* Top Bar: Back Link & Clear Project Count Indicator */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <button
          onClick={onBackToWheel}
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to wheel</span>
        </button>

        {/* Clear Project Count Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs font-mono shadow-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="font-bold text-[var(--text)]">{categoryProjects.length}</span>
          <span className="text-[var(--muted)] uppercase tracking-wider text-[10px]">
            {categoryProjects.length === 1 ? "Project" : "Projects"}
          </span>
        </div>
      </div>

      {/* Category Header */}
      <div className="mb-5 border-b border-[var(--line)] pb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-mono text-xs text-[var(--muted)] block">
            N°{String(categoryIndex + 1).padStart(2, "0")} / {String(totalCategories).padStart(2, "0")}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-3 mb-2">
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight" style={{ color: category.color }}>
            <EditableText
              value={category.label}
              onSave={(val) => onUpdateCategory(category.id, "label", val)}
              isEditorActive={isEditorActive}
              tagName="span"
            />
          </h2>
          <span className="text-xs font-mono text-[var(--muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded border border-[var(--line)]">
            total of {categoryProjects.length} {categoryProjects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        <p className="text-[var(--muted)] text-xs sm:text-sm max-w-2xl leading-relaxed">
          <EditableText
            value={category.desc}
            onSave={(val) => onUpdateCategory(category.id, "desc", val)}
            isEditorActive={isEditorActive}
            tagName="span"
            multiline
          />
        </p>

        {isEditorActive && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onAddProject}
              className="inline-flex items-center gap-2 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--muted)] px-3.5 py-1.5 rounded-full font-mono text-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--accent-web)]" />
              <span>Add Project to {category.short}</span>
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {categoryProjects.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted)] font-mono text-sm border border-dashed border-[var(--line)] rounded-lg">
          <p className="mb-4">No projects filed under this section yet.</p>
          {isEditorActive && (
            <button
              onClick={onAddProject}
              className="inline-flex items-center gap-2 bg-[var(--text)] text-[var(--bg)] px-5 py-2.5 rounded-full font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categoryProjects.map((project, i) => {
            const Icon = MEDIUM_ICONS[project.type] || Globe;
            const accentColor = MEDIUM_COLORS[project.type] || "var(--accent-web)";

            return (
              <article
                key={project.id}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('[data-editable="true"]') ||
                    target.closest("button") ||
                    target.closest("input") ||
                    target.closest("textarea") ||
                    target.isContentEditable
                  ) {
                    return;
                  }
                  onSelectProject(project);
                }}
                className="group relative bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--muted)] rounded-sm overflow-hidden transition-all hover:-translate-y-1 duration-200"
              >
                {/* Media Thumbnail */}
                <div className={`relative aspect-[4/3] overflow-hidden cursor-pointer ${project.coverFit === "contain" ? "bg-black" : "bg-[var(--surface-2)]"}`}>
                  {project.type === "video" && project.video ? (
                    <video
                      src={project.video}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${project.coverFit === "contain" ? "object-contain" : "object-cover"}`}
                    />
                  ) : (
                    <img
                      src={project.cover}
                      alt={project.title}
                      loading="lazy"
                      className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${project.coverFit === "contain" ? "object-contain" : "object-cover"}`}
                    />
                  )}

                  {/* Medium Stub Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider bg-[#121316]/80 backdrop-blur-md border border-[var(--line)]">
                    <span className="text-[var(--muted)]">N°{project.id}</span>
                    <Icon className="w-3 h-3" style={{ color: accentColor }} />
                    <span className="font-bold uppercase" style={{ color: accentColor }}>
                      {project.type}
                    </span>
                  </div>

                  {/* Editor Overlay Controls on Card */}
                  {isEditorActive && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Toggle Crop vs Fit All */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextFit = project.coverFit === "contain" ? "cover" : "contain";
                            onUpdateProject(project.id, "coverFit", nextFit);
                          }}
                          className="px-2 py-1 bg-black/90 hover:bg-black border border-white/20 text-white rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer shadow-md transition-colors"
                          title={project.coverFit === "contain" ? "Currently: Fit All (Contain). Click to Crop Fill" : "Currently: Crop Fill. Click to Fit All"}
                        >
                          {project.coverFit === "contain" ? (
                            <Maximize2 className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Crop className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>{project.coverFit === "contain" ? "Fit All" : "Crop"}</span>
                        </button>

                        {/* Upload Cover Image from Computer */}
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 bg-black/90 hover:bg-black border border-white/20 text-white hover:border-[var(--accent-web)] rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer shadow-md transition-colors"
                          title="Upload Thumbnail from Computer"
                        >
                          <Upload className="w-3 h-3 text-[var(--accent-web)]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.files?.[0]) {
                                handleCoverFileUpload(project.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {/* Change Cover Image URL */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newUrl = prompt("Enter new cover image URL (or paste image link):", project.cover);
                            if (newUrl && newUrl.trim()) {
                              handleCoverChange(project.id, newUrl.trim());
                            }
                          }}
                          className="px-2 py-1 bg-black/90 hover:bg-black border border-white/20 text-white rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer shadow-md transition-colors"
                          title="Paste Image Link"
                        >
                          <Globe className="w-3 h-3 text-[var(--muted)]" />
                          <span>URL</span>
                        </button>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${project.title}"?`)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1.5 bg-red-950/90 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-full cursor-pointer transition-colors shadow-md ml-auto"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info Footer */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-display font-semibold text-lg mb-1 text-[var(--text)] group-hover:text-[var(--accent-web)] transition-colors">
                    <EditableText
                      value={project.title}
                      onSave={(val) => onUpdateProject(project.id, "title", val)}
                      isEditorActive={isEditorActive}
                      tagName="span"
                      placeholder="Project Title..."
                    />
                  </h3>

                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)] mt-2">
                    <EditableText
                      value={project.year}
                      onSave={(val) => onUpdateProject(project.id, "year", val)}
                      isEditorActive={isEditorActive}
                      tagName="span"
                      placeholder="Year..."
                    />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isEditorActive ? (
                        <EditableText
                          value={project.tags ? project.tags.join(", ") : ""}
                          onSave={(val) => {
                            const newTags = val
                              .split(",")
                              .map((t) => t.trim().replace(/^#/, ""))
                              .filter(Boolean);
                            onUpdateProject(project.id, "tags", newTags);
                          }}
                          isEditorActive={isEditorActive}
                          tagName="span"
                          placeholder="tags (comma separated)..."
                          className="text-[10px] text-[var(--accent-web)]"
                        />
                      ) : (
                        project.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full border border-[var(--line)] text-[10px]">
                            #{tag}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* External Website Link Row */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--line)]/50 flex items-center justify-between text-xs font-mono">
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent-web)] hover:underline"
                        title={`Open external website: ${project.link}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[170px]">{project.link.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : isEditorActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = prompt("Enter external website link (e.g. https://myproject.com):");
                          if (url) onUpdateProject(project.id, "link", url.trim());
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--accent-web)] transition-colors cursor-pointer"
                      >
                        <Globe className="w-3 h-3 text-[var(--accent-web)]" />
                        <span>+ Add External Link</span>
                      </button>
                    ) : null}

                    {isEditorActive && project.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newUrl = prompt("Edit external website link:", project.link);
                          if (newUrl !== null) onUpdateProject(project.id, "link", newUrl.trim());
                        }}
                        className="text-[10px] text-[var(--muted)] hover:text-white transition-colors cursor-pointer ml-auto"
                      >
                        Edit Link
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
