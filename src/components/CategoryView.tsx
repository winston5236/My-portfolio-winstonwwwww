import React from "react";
import { Category, Project } from "../types";
import { EditableText } from "./EditableText";
import { ArrowLeft, Plus, Trash2, ExternalLink, Image, Video, Box, Globe } from "lucide-react";

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
  photo: Image,
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

  return (
    <div className="max-w-[1180px] mx-auto px-6 sm:px-8 py-8 min-h-[80vh] animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBackToWheel}
        className="inline-flex items-center gap-2 text-sm font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-8 cursor-pointer bg-transparent border-0 p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to wheel</span>
      </button>

      {/* Category Header */}
      <div className="mb-10 border-b border-[var(--line)] pb-8">
        <span className="font-mono text-xs text-[var(--muted)] block mb-2">
          N°{String(categoryIndex + 1).padStart(2, "0")} / {String(totalCategories).padStart(2, "0")}
        </span>
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-3" style={{ color: category.color }}>
          <EditableText
            value={category.label}
            onSave={(val) => onUpdateCategory(category.id, "label", val)}
            isEditorActive={isEditorActive}
            tagName="span"
          />
        </h2>
        <p className="text-[var(--muted)] text-base max-w-2xl leading-relaxed">
          <EditableText
            value={category.desc}
            onSave={(val) => onUpdateCategory(category.id, "desc", val)}
            isEditorActive={isEditorActive}
            tagName="span"
            multiline
          />
        </p>

        {isEditorActive && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onAddProject}
              className="inline-flex items-center gap-2 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--muted)] px-4 py-2 rounded-full font-mono text-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-[var(--accent-web)]" />
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
                onClick={() => onSelectProject(project)}
                className="group relative bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--muted)] rounded-sm overflow-hidden cursor-pointer transition-all hover:-translate-y-1 duration-200"
              >
                {/* Media Thumbnail */}
                <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden">
                  {project.type === "video" && project.video ? (
                    <video
                      src={project.video}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={project.cover}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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

                  {/* Delete button in Editor Mode */}
                  {isEditorActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${project.title}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="absolute top-3 left-3 p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-full cursor-pointer transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                    />
                  </h3>

                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)] mt-2">
                    <EditableText
                      value={project.year}
                      onSave={(val) => onUpdateProject(project.id, "year", val)}
                      isEditorActive={isEditorActive}
                      tagName="span"
                    />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full border border-[var(--line)] text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
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
