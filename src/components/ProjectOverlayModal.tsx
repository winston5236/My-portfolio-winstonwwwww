import React, { useState } from "react";
import { Project } from "../types";
import { ThreeModelViewer } from "./ThreeModelViewer";
import { EditableText } from "./EditableText";
import { X, ExternalLink, Plus, Trash2, Upload, RefreshCw, Box, Image as ImageIcon, Video as VideoIcon, ChevronLeft, ChevronRight, Play } from "lucide-react";

interface ProjectOverlayModalProps {
  project: Project | null;
  onClose: () => void;
  isEditorActive: boolean;
  onUpdateProject: (projId: string, field: keyof Project, value: any) => void;
  categoryName?: string;
  categoryColor?: string;
}

type MediaTargetQuadrant = "processImages" | "finalImages" | "videos" | "models";

export const ProjectOverlayModal: React.FC<ProjectOverlayModalProps> = ({
  project,
  onClose,
  isEditorActive,
  onUpdateProject,
  categoryName = "General",
  categoryColor = "#8b7bff"
}) => {
  if (!project) return null;

  // Quadrant active slide indices
  const [processIdx, setProcessIdx] = useState<number>(0);
  const [finalIdx, setFinalIdx] = useState<number>(0);
  const [videoIdx, setVideoIdx] = useState<number>(0);
  const [modelIdx, setModelIdx] = useState<number>(0);

  // Upload/Edit media modal state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [targetQuadrant, setTargetQuadrant] = useState<MediaTargetQuadrant>("processImages");
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");

  // Get quadrant media arrays with fallback defaults
  const processItems = (project.processImages && project.processImages.length > 0)
    ? project.processImages
    : (project.images && project.images.length > 0 ? project.images : [project.cover]);

  const finalItems = (project.finalImages && project.finalImages.length > 0)
    ? project.finalImages
    : [project.cover];

  const videoItems = (project.videos && project.videos.length > 0)
    ? project.videos
    : (project.video ? [project.video] : []);

  const modelItems = (project.models && project.models.length > 0)
    ? project.models
    : (project.model ? [project.model] : []);

  // Safe index bounds
  const currentProcessImg = processItems[processIdx % processItems.length] || project.cover;
  const currentFinalImg = finalItems[finalIdx % finalItems.length] || project.cover;
  const currentVideo = videoItems[videoIdx % videoItems.length];
  const currentModel = modelItems[modelIdx % modelItems.length];

  const handleOpenUpload = (quadrant: MediaTargetQuadrant, idxToReplace: number | null = null) => {
    setTargetQuadrant(quadrant);
    setReplaceIndex(idxToReplace);
    setUrlInput("");
    setUploadModalOpen(true);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const val = urlInput.trim();
    saveMediaValue(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      saveMediaValue(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const saveMediaValue = (val: string) => {
    let currentArray: string[] = [];
    if (targetQuadrant === "processImages") currentArray = [...processItems];
    else if (targetQuadrant === "finalImages") currentArray = [...finalItems];
    else if (targetQuadrant === "videos") currentArray = [...videoItems];
    else if (targetQuadrant === "models") currentArray = [...modelItems];

    if (replaceIndex !== null && replaceIndex >= 0 && replaceIndex < currentArray.length) {
      currentArray[replaceIndex] = val;
    } else {
      currentArray.push(val);
    }

    onUpdateProject(project.id, targetQuadrant, currentArray);

    // Also sync legacy fallback fields if needed
    if (targetQuadrant === "videos" && val) {
      onUpdateProject(project.id, "video", val);
    }
    if (targetQuadrant === "models" && val) {
      onUpdateProject(project.id, "model", val);
    }

    setUploadModalOpen(false);
  };

  const handleRemoveMediaItem = (quadrant: MediaTargetQuadrant, indexToRemove: number) => {
    let currentArray: string[] = [];
    if (quadrant === "processImages") currentArray = [...processItems];
    else if (quadrant === "finalImages") currentArray = [...finalItems];
    else if (quadrant === "videos") currentArray = [...videoItems];
    else if (quadrant === "models") currentArray = [...modelItems];

    currentArray.splice(indexToRemove, 1);
    onUpdateProject(project.id, quadrant, currentArray);
  };

  const handleAddTag = () => {
    const tag = prompt("Enter new tag name (e.g., 'react', '3d', 'render'):");
    if (tag && tag.trim()) {
      const newTags = [...(project.tags || []), tag.trim().toLowerCase()];
      onUpdateProject(project.id, "tags", newTags);
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = [...(project.tags || [])];
    newTags.splice(index, 1);
    onUpdateProject(project.id, "tags", newTags);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0a0a0c]/85 backdrop-blur-md transition-opacity"
      />

      {/* Main Dialog Panel */}
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-2xl animate-pop">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full border border-[var(--line)] bg-[#121316]/80 text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center justify-center cursor-pointer transition-colors shadow-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* =========================================================================
            4 QUADRANTS MEDIA DISPLAY AREA (1/4 Process, 1/4 Final, 1/4 Videos, 1/4 3D OBJ)
            ========================================================================= */}
        <div className="w-full bg-[#0d0e11] border-b border-[var(--line)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-black/40">

            {/* QUADRANT 1: PROCESS SLIDESHOW */}
            <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q1 border border-[var(--line)]/50 rounded-sm">
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-web)] font-bold">
                <ImageIcon className="w-3 h-3 text-[var(--accent-web)]" />
                <span>PROCESS ({processItems.length > 0 ? `${(processIdx % processItems.length) + 1}/${processItems.length}` : "0/0"})</span>
              </div>

              <img
                src={currentProcessImg}
                alt={`${project.title} process`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next Arrows */}
              {processItems.length > 1 && (
                <>
                  <button
                    onClick={() => setProcessIdx((prev) => (prev - 1 + processItems.length) % processItems.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q1:opacity-100 transition-opacity"
                    title="Previous Process Slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProcessIdx((prev) => (prev + 1) % processItems.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q1:opacity-100 transition-opacity"
                    title="Next Process Slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Editor Overlay Controls */}
              {isEditorActive && (
                <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between bg-black/85 backdrop-blur-md p-1.5 rounded text-[11px] font-mono border border-[var(--line)] opacity-90 group-hover/q1:opacity-100">
                  <button
                    onClick={() => handleOpenUpload("processImages")}
                    className="flex items-center gap-1 text-[var(--accent-web)] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Image</span>
                  </button>
                  {processItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenUpload("processImages", processIdx % processItems.length)}
                        className="text-[var(--muted)] hover:text-white"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleRemoveMediaItem("processImages", processIdx % processItems.length)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QUADRANT 2: FINAL SLIDESHOW */}
            <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q2 border border-[var(--line)]/50 rounded-sm">
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-photo)] font-bold">
                <ImageIcon className="w-3 h-3 text-[var(--accent-photo)]" />
                <span>FINAL ({finalItems.length > 0 ? `${(finalIdx % finalItems.length) + 1}/${finalItems.length}` : "0/0"})</span>
              </div>

              <img
                src={currentFinalImg}
                alt={`${project.title} final`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next Arrows */}
              {finalItems.length > 1 && (
                <>
                  <button
                    onClick={() => setFinalIdx((prev) => (prev - 1 + finalItems.length) % finalItems.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q2:opacity-100 transition-opacity"
                    title="Previous Final Slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFinalIdx((prev) => (prev + 1) % finalItems.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q2:opacity-100 transition-opacity"
                    title="Next Final Slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Editor Overlay Controls */}
              {isEditorActive && (
                <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between bg-black/85 backdrop-blur-md p-1.5 rounded text-[11px] font-mono border border-[var(--line)] opacity-90 group-hover/q2:opacity-100">
                  <button
                    onClick={() => handleOpenUpload("finalImages")}
                    className="flex items-center gap-1 text-[var(--accent-photo)] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Image</span>
                  </button>
                  {finalItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenUpload("finalImages", finalIdx % finalItems.length)}
                        className="text-[var(--muted)] hover:text-white"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleRemoveMediaItem("finalImages", finalIdx % finalItems.length)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QUADRANT 3: OPTIONAL VIDEOS SLIDESHOW */}
            <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q3 border border-[var(--line)]/50 rounded-sm flex items-center justify-center">
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-video)] font-bold">
                <VideoIcon className="w-3 h-3 text-[var(--accent-video)]" />
                <span>OPTIONAL VIDEOS ({videoItems.length > 0 ? `${(videoIdx % videoItems.length) + 1}/${videoItems.length}` : "0"})</span>
              </div>

              {currentVideo ? (
                <video
                  src={currentVideo}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[var(--muted)] font-mono text-xs">
                  <VideoIcon className="w-8 h-8 mb-2 opacity-40 text-[var(--accent-video)]" />
                  <p className="mb-2">No Video Files Attached</p>
                  {isEditorActive && (
                    <button
                      onClick={() => handleOpenUpload("videos")}
                      className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--accent-video)]/50 text-[var(--accent-video)] hover:bg-[var(--accent-video)]/10 text-xs font-semibold"
                    >
                      + Upload Video
                    </button>
                  )}
                </div>
              )}

              {/* Prev / Next Arrows for Video Slideshow */}
              {videoItems.length > 1 && (
                <>
                  <button
                    onClick={() => setVideoIdx((prev) => (prev - 1 + videoItems.length) % videoItems.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q3:opacity-100 transition-opacity"
                    title="Previous Video"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVideoIdx((prev) => (prev + 1) % videoItems.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q3:opacity-100 transition-opacity"
                    title="Next Video"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Editor Overlay Controls */}
              {isEditorActive && currentVideo && (
                <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between bg-black/85 backdrop-blur-md p-1.5 rounded text-[11px] font-mono border border-[var(--line)] opacity-90 group-hover/q3:opacity-100">
                  <button
                    onClick={() => handleOpenUpload("videos")}
                    className="flex items-center gap-1 text-[var(--accent-video)] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Video</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenUpload("videos", videoIdx % videoItems.length)}
                      className="text-[var(--muted)] hover:text-white"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => handleRemoveMediaItem("videos", videoIdx % videoItems.length)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QUADRANT 4: OPTIONAL 3D OBJ / GLB FILES */}
            <div className="relative aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q4 border border-[var(--line)]/50 rounded-sm flex items-center justify-center">
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-3d)] font-bold">
                <Box className="w-3 h-3 text-[var(--accent-3d)]" />
                <span>OPTIONAL 3D OBJ / GLB ({modelItems.length > 0 ? `${(modelIdx % modelItems.length) + 1}/${modelItems.length}` : "0"})</span>
              </div>

              {currentModel ? (
                <ThreeModelViewer
                  modelUrl={currentModel}
                  altText={project.title}
                  accentColor={categoryColor}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[var(--muted)] font-mono text-xs">
                  <Box className="w-8 h-8 mb-2 opacity-40 text-[var(--accent-3d)]" />
                  <p className="mb-2">No 3D Model Attached</p>
                  {isEditorActive && (
                    <button
                      onClick={() => handleOpenUpload("models")}
                      className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--accent-3d)]/50 text-[var(--accent-3d)] hover:bg-[var(--accent-3d)]/10 text-xs font-semibold"
                    >
                      + Upload .obj / .glb
                    </button>
                  )}
                </div>
              )}

              {/* Prev / Next Arrows for 3D Models */}
              {modelItems.length > 1 && (
                <>
                  <button
                    onClick={() => setModelIdx((prev) => (prev - 1 + modelItems.length) % modelItems.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q4:opacity-100 transition-opacity"
                    title="Previous 3D Model"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModelIdx((prev) => (prev + 1) % modelItems.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-80 group-hover/q4:opacity-100 transition-opacity"
                    title="Next 3D Model"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Editor Overlay Controls */}
              {isEditorActive && currentModel && (
                <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between bg-black/85 backdrop-blur-md p-1.5 rounded text-[11px] font-mono border border-[var(--line)] opacity-90 group-hover/q4:opacity-100">
                  <button
                    onClick={() => handleOpenUpload("models")}
                    className="flex items-center gap-1 text-[var(--accent-3d)] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add 3D Model</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenUpload("models", modelIdx % modelItems.length)}
                      className="text-[var(--muted)] hover:text-white"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => handleRemoveMediaItem("models", modelIdx % modelItems.length)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Project Meta & Editable Content */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3 font-mono text-xs">
            <span className="text-[var(--muted)]">N°{project.id}</span>
            <span
              className="px-2.5 py-0.5 rounded-full border border-[var(--line)] font-bold uppercase"
              style={{ color: categoryColor }}
            >
              {project.type}
            </span>
            <span className="text-[var(--muted)]">•</span>
            <span className="text-[var(--muted)]">{categoryName}</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-[var(--text)]">
            <EditableText
              value={project.title}
              onSave={(val) => onUpdateProject(project.id, "title", val)}
              isEditorActive={isEditorActive}
              tagName="span"
            />
          </h2>

          <p className="text-[var(--muted)] text-base leading-relaxed mb-6 max-w-2xl">
            <EditableText
              value={project.desc}
              onSave={(val) => onUpdateProject(project.id, "desc", val)}
              isEditorActive={isEditorActive}
              tagName="span"
              multiline
            />
          </p>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {project.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-mono text-[var(--muted)] border border-[var(--line)] px-3 py-1 rounded-full"
              >
                #{tag}
                {isEditorActive && (
                  <button
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-red-400 ml-1 text-xs cursor-pointer"
                    title="Remove tag"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditorActive && (
              <button
                onClick={handleAddTag}
                className="text-xs font-mono text-[var(--accent-web)] border border-dashed border-[var(--accent-web)]/50 hover:border-[var(--accent-web)] px-2.5 py-1 rounded-full cursor-pointer"
              >
                + Tag
              </button>
            )}
          </div>

          {/* External Links */}
          <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text)] hover:text-[var(--accent-web)] border-b border-[var(--accent-web)] pb-0.5 transition-colors"
              >
                <span>Visit live project</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : isEditorActive ? (
              <button
                onClick={() => {
                  const link = prompt("Enter live project URL (e.g. https://myproject.com):");
                  if (link) onUpdateProject(project.id, "link", link);
                }}
                className="text-xs font-mono text-[var(--accent-web)] hover:underline cursor-pointer"
              >
                + Add Live Link URL
              </button>
            ) : null}

            {isEditorActive && project.link && (
              <button
                onClick={() => {
                  const newLink = prompt("Edit link URL:", project.link);
                  if (newLink !== null) onUpdateProject(project.id, "link", newLink);
                }}
                className="text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Edit Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload & Media Source Picker Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-lg w-full max-w-md shadow-2xl animate-pop">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[var(--text)] uppercase tracking-wide">
                Update {targetQuadrant} Media
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-[var(--muted)] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-mono text-[var(--muted)] mb-4">
              Upload a local file or paste a direct web URL for this quadrant.
            </p>

            {/* Direct URL Input */}
            <div className="mb-4">
              <label className="block text-xs font-mono text-[var(--muted)] mb-1">Direct Web URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/file.jpg, .mp4 or .obj/.glb"
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--accent-web)] outline-none"
                />
                <button
                  onClick={handleApplyUrl}
                  className="bg-[var(--accent-web)] text-white px-4 py-2 rounded text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--line)]" />
              </div>
              <span className="relative bg-[var(--surface)] px-2 font-mono text-[10px] text-[var(--muted)] uppercase">
                OR
              </span>
            </div>

            {/* File Upload Button */}
            <div>
              <label className="block text-xs font-mono text-[var(--muted)] mb-1">Upload Local File</label>
              <label className="flex items-center justify-center gap-2 w-full p-4 border border-dashed border-[var(--line)] hover:border-[var(--accent-web)] rounded-lg cursor-pointer bg-[var(--surface-2)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent-web)] transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choose Local File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.glb,.gltf,.obj"
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

