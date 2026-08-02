import React, { useState, useEffect, useRef } from "react";
import { Project } from "../types";
import { ThreeModelViewer } from "./ThreeModelViewer";
import { EditableText } from "./EditableText";
import { X, ExternalLink, Plus, Trash2, Upload, Box, Image as ImageIcon, Video as VideoIcon, ChevronLeft, ChevronRight, Maximize2, ZoomIn, Crop, Check, Sparkles, Globe, GripVertical, ArrowLeft, ArrowRight } from "lucide-react";
import { compressImageFile } from "../lib/imageCompressor";

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
  const carouselRef = useRef<HTMLDivElement>(null);

  // Quadrant active slide indices
  const [processIdx, setProcessIdx] = useState<number>(0);
  const [finalIdx, setFinalIdx] = useState<number>(0);
  const [videoIdx, setVideoIdx] = useState<number>(0);
  const [modelIdx, setModelIdx] = useState<number>(0);

  // Card order state for the 4 media reel cards
  const [cardOrder, setCardOrder] = useState<string[]>(
    project?.cardOrder && project.cardOrder.length === 4
      ? project.cardOrder
      : ["process", "final", "video", "model"]
  );

  useEffect(() => {
    if (project?.cardOrder && project.cardOrder.length === 4) {
      setCardOrder(project.cardOrder);
    } else {
      setCardOrder(["process", "final", "video", "model"]);
    }

    setProcessIdx(0);
    setFinalIdx(0);
    setVideoIdx(0);
    setModelIdx(0);

    // Explicitly reset carousel scroll position to the far left (0px)
    const t1 = setTimeout(() => {
      if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    }, 20);
    const t2 = setTimeout(() => {
      if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    }, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [project?.id, project?.cardOrder]);

  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const handleMoveCard = (cardKey: string, direction: "left" | "right") => {
    const idx = cardOrder.indexOf(cardKey);
    if (idx === -1) return;
    const newIdx = direction === "left" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cardOrder.length) return;

    const newOrder = [...cardOrder];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(newIdx, 0, moved);

    setCardOrder(newOrder);
    if (project) {
      onUpdateProject(project.id, "cardOrder" as any, newOrder);
    }
  };

  const handleDropCard = (targetCardKey: string) => {
    if (!draggedCard || draggedCard === targetCardKey) return;
    const fromIdx = cardOrder.indexOf(draggedCard);
    const toIdx = cardOrder.indexOf(targetCardKey);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...cardOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    setCardOrder(newOrder);
    setDraggedCard(null);
    if (project) {
      onUpdateProject(project.id, "cardOrder" as any, newOrder);
    }
  };

  // Lightbox Modal state for full uncropped pop-up slideshow
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxType, setLightboxType] = useState<"process" | "final">("process");
  const [lightboxIdx, setLightboxIdx] = useState<number>(0);

  // Upload/Edit media modal state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [targetQuadrant, setTargetQuadrant] = useState<MediaTargetQuadrant>("processImages");
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");

  // Get quadrant media arrays cleanly without fallback copying
  const processItems = project
    ? (project.processImages !== undefined
        ? project.processImages
        : (project.images && project.images.length > 0 ? project.images : []))
    : [];

  const finalItems = project
    ? (project.finalImages !== undefined ? project.finalImages : [])
    : [];

  const videoItems = project
    ? (project.videos !== undefined ? project.videos : (project.video ? [project.video] : []))
    : [];

  const modelItems = project
    ? (project.models !== undefined ? project.models : (project.model ? [project.model] : []))
    : [];

  // Keyboard Navigation for Lightbox & Esc to Close
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      const items = lightboxType === "process" ? processItems : finalItems;
      if (items.length === 0) return;

      if (e.key === "ArrowLeft") {
        setLightboxIdx((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        setLightboxIdx((prev) => (prev + 1) % items.length);
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, lightboxType, processItems, finalItems, project]);

  if (!project) return null;

  const handleCoverChange = (newCoverUrl: string) => {
    onUpdateProject(project.id, "cover", newCoverUrl);
  };

  const handleCoverFileUpload = async (file: File) => {
    try {
      const dataUrl = await compressImageFile(file);
      handleCoverChange(dataUrl);
    } catch (err) {
      console.error("Error compressing cover upload:", err);
    }
  };

  // Safe index bounds
  const currentProcessImg = processItems.length > 0 ? processItems[processIdx % processItems.length] : null;
  const currentFinalImg = finalItems.length > 0 ? finalItems[finalIdx % finalItems.length] : null;
  const currentVideo = videoItems.length > 0 ? videoItems[videoIdx % videoItems.length] : null;
  const currentModel = modelItems.length > 0 ? modelItems[modelIdx % modelItems.length] : null;

  // Open Full Uncropped Lightbox
  const handleOpenLightbox = (type: "process" | "final", initialIdx: number) => {
    setLightboxType(type);
    setLightboxIdx(initialIdx);
    setLightboxOpen(true);
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageFile(file);
      saveMediaValue(dataUrl);
    } catch (err) {
      console.error("Error processing file upload:", err);
    }
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
            SLIDABLE MEDIA SHOWCASE REEL (Process, Final, Video, 3D Model)
            ========================================================================= */}
        <div className="w-full bg-[#0d0e11] border-b border-[var(--line)] py-3 px-3">
          {/* Header Controls & Scroll Hints */}
          <div className="flex items-center justify-between px-1 mb-2.5 font-mono text-[11px] text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-web)] animate-pulse" />
              <span className="uppercase tracking-wider font-semibold text-[#ece9e3]">
                Media Reel ({cardOrder.filter(k => isEditorActive || (k === "video" ? videoItems.length > 0 : k === "model" ? modelItems.length > 0 : true)).length} Cards)
              </span>
              {isEditorActive && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="hidden sm:inline-flex items-center gap-1 text-amber-400 text-[10px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    <GripVertical className="w-3 h-3" /> Drag cards or use ← →
                  </span>
                  {videoItems.length === 0 && (
                    <button
                      onClick={() => handleOpenUpload("videos")}
                      className="text-[10px] text-[var(--accent-video)] bg-[var(--accent-video)]/10 hover:bg-[var(--accent-video)]/20 px-2 py-0.5 rounded border border-[var(--accent-video)]/30 transition-colors cursor-pointer"
                    >
                      + Add Video
                    </button>
                  )}
                  {modelItems.length === 0 && (
                    <button
                      onClick={() => handleOpenUpload("models")}
                      className="text-[10px] text-[var(--accent-3d)] bg-[var(--accent-3d)]/10 hover:bg-[var(--accent-3d)]/20 px-2 py-0.5 rounded border border-[var(--accent-3d)]/30 transition-colors cursor-pointer"
                    >
                      + Add 3D Model
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] opacity-75">← Slide or use buttons to view media →</span>
              <button
                onClick={() => {
                  if (carouselRef.current) carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
                }}
                className="p-1 rounded bg-[#1a1c20] hover:bg-[#282b32] text-white border border-[var(--line)] cursor-pointer transition-colors"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (carouselRef.current) carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
                }}
                className="p-1 rounded bg-[#1a1c20] hover:bg-[#282b32] text-white border border-[var(--line)] cursor-pointer transition-colors"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-[var(--line)] scrollbar-track-transparent"
          >
            {cardOrder.map((cardKey, cardIdx) => {
              // Hide empty cards in View Mode
              if (!isEditorActive) {
                if (cardKey === "process" && processItems.length === 0) return null;
                if (cardKey === "final" && finalItems.length === 0) return null;
                if (cardKey === "video" && videoItems.length === 0) return null;
                if (cardKey === "model" && modelItems.length === 0) return null;
              }

              if (cardKey === "process") {
                return (
                  <div
                    key="process"
                    draggable={isEditorActive}
                    onDragStart={(e) => {
                      if (isEditorActive) {
                        e.dataTransfer.setData("text/plain", "process");
                        setDraggedCard("process");
                      }
                    }}
                    onDragOver={(e) => {
                      if (isEditorActive) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (isEditorActive) {
                        e.preventDefault();
                        handleDropCard("process");
                      }
                    }}
                    onDragEnd={() => setDraggedCard(null)}
                    className={`relative w-[58%] sm:w-[35%] md:w-[32%] lg:w-[28%] min-w-[210px] max-w-[360px] flex-shrink-0 snap-start aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q1 border rounded-sm flex items-center justify-center shadow-lg transition-all ${
                      draggedCard === "process" ? "opacity-50 border-amber-400 scale-95" : "border-[var(--line)]/60"
                    } ${isEditorActive ? "cursor-grab active:cursor-grabbing hover:border-amber-400/80" : ""}`}
                  >
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-web)] font-bold shadow-md">
                      {isEditorActive && (
                        <span className="flex items-center gap-1 pr-1 border-r border-[var(--line)] text-amber-400" title="Drag to reorder position">
                          <GripVertical className="w-3 h-3 cursor-grab" />
                          <span className="text-[9px]">#{cardIdx + 1}</span>
                        </span>
                      )}
                      <ImageIcon className="w-3 h-3 text-[var(--accent-web)]" />
                      <span>PROCESS ({processItems.length > 0 ? `${(processIdx % processItems.length) + 1}/${processItems.length}` : "0/0"})</span>
                    </div>

                    {/* Reorder Shift Arrow Buttons in Editor Mode */}
                    {isEditorActive && (
                      <div className="absolute top-2.5 right-11 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-full border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("process", "left"); }}
                          disabled={cardIdx === 0}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("process", "right"); }}
                          disabled={cardIdx === cardOrder.length - 1}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Expand Full Lightbox Button */}
                    {currentProcessImg && (
                      <button
                        onClick={() => handleOpenLightbox("process", processIdx % processItems.length)}
                        className="absolute top-2.5 right-2.5 z-20 p-1.5 bg-[#121316]/90 hover:bg-black text-white backdrop-blur-md rounded-full border border-[var(--line)] opacity-80 group-hover/q1:opacity-100 transition-all cursor-pointer shadow-md"
                        title="View Full Uncropped Image"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[var(--accent-web)]" />
                      </button>
                    )}

                    {currentProcessImg ? (
                      <img
                        src={currentProcessImg}
                        alt={`${project.title} process`}
                        onClick={() => handleOpenLightbox("process", processIdx % processItems.length)}
                        className="w-full h-full object-cover transition-all duration-300 cursor-zoom-in"
                      />
                    ) : (
                      <div
                        onClick={() => handleOpenUpload("processImages")}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer hover:bg-[var(--surface)] transition-colors text-[var(--muted)]"
                      >
                        <Upload className="w-6 h-6 text-[var(--accent-web)]" />
                        <span className="text-xs font-mono">+ Add Process Image</span>
                      </div>
                    )}

                    {/* Prev / Next Arrows */}
                    {processItems.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProcessIdx((prev) => (prev - 1 + processItems.length) % processItems.length);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q1:opacity-100 transition-opacity cursor-pointer shadow-lg"
                          title="Previous Process Slide"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProcessIdx((prev) => (prev + 1) % processItems.length);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q1:opacity-100 transition-opacity cursor-pointer shadow-lg"
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
                          className="flex items-center gap-1 text-[var(--accent-web)] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Image</span>
                        </button>
                        {processItems.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenUpload("processImages", processIdx % processItems.length)}
                              className="text-[var(--muted)] hover:text-white cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              onClick={() => handleRemoveMediaItem("processImages", processIdx % processItems.length)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (cardKey === "final") {
                return (
                  <div
                    key="final"
                    draggable={isEditorActive}
                    onDragStart={(e) => {
                      if (isEditorActive) {
                        e.dataTransfer.setData("text/plain", "final");
                        setDraggedCard("final");
                      }
                    }}
                    onDragOver={(e) => {
                      if (isEditorActive) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (isEditorActive) {
                        e.preventDefault();
                        handleDropCard("final");
                      }
                    }}
                    onDragEnd={() => setDraggedCard(null)}
                    className={`relative w-[58%] sm:w-[35%] md:w-[32%] lg:w-[28%] min-w-[210px] max-w-[360px] flex-shrink-0 snap-start aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q2 border rounded-sm flex items-center justify-center shadow-lg transition-all ${
                      draggedCard === "final" ? "opacity-50 border-amber-400 scale-95" : "border-[var(--line)]/60"
                    } ${isEditorActive ? "cursor-grab active:cursor-grabbing hover:border-amber-400/80" : ""}`}
                  >
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-photo)] font-bold shadow-md">
                      {isEditorActive && (
                        <span className="flex items-center gap-1 pr-1 border-r border-[var(--line)] text-amber-400" title="Drag to reorder position">
                          <GripVertical className="w-3 h-3 cursor-grab" />
                          <span className="text-[9px]">#{cardIdx + 1}</span>
                        </span>
                      )}
                      <ImageIcon className="w-3 h-3 text-[var(--accent-photo)]" />
                      <span>FINAL ({finalItems.length > 0 ? `${(finalIdx % finalItems.length) + 1}/${finalItems.length}` : "0/0"})</span>
                    </div>

                    {/* Reorder Shift Arrow Buttons in Editor Mode */}
                    {isEditorActive && (
                      <div className="absolute top-2.5 right-11 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-full border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("final", "left"); }}
                          disabled={cardIdx === 0}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("final", "right"); }}
                          disabled={cardIdx === cardOrder.length - 1}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Expand Full Lightbox Button */}
                    {currentFinalImg && (
                      <button
                        onClick={() => handleOpenLightbox("final", finalIdx % finalItems.length)}
                        className="absolute top-2.5 right-2.5 z-20 p-1.5 bg-[#121316]/90 hover:bg-black text-white backdrop-blur-md rounded-full border border-[var(--line)] opacity-80 group-hover/q2:opacity-100 transition-all cursor-pointer shadow-md"
                        title="View Full Uncropped Image"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[var(--accent-photo)]" />
                      </button>
                    )}

                    {currentFinalImg ? (
                      <img
                        src={currentFinalImg}
                        alt={`${project.title} final`}
                        onClick={() => handleOpenLightbox("final", finalIdx % finalItems.length)}
                        className="w-full h-full object-cover transition-all duration-300 cursor-zoom-in"
                      />
                    ) : (
                      <div
                        onClick={() => handleOpenUpload("finalImages")}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer hover:bg-[var(--surface)] transition-colors text-[var(--muted)]"
                      >
                        <Upload className="w-6 h-6 text-[var(--accent-photo)]" />
                        <span className="text-xs font-mono">+ Add Final Image</span>
                      </div>
                    )}

                    {/* Prev / Next Arrows */}
                    {finalItems.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFinalIdx((prev) => (prev - 1 + finalItems.length) % finalItems.length);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q2:opacity-100 transition-opacity cursor-pointer shadow-lg"
                          title="Previous Final Slide"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFinalIdx((prev) => (prev + 1) % finalItems.length);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q2:opacity-100 transition-opacity cursor-pointer shadow-lg"
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
                          className="flex items-center gap-1 text-[var(--accent-photo)] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Image</span>
                        </button>
                        {finalItems.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenUpload("finalImages", finalIdx % finalItems.length)}
                              className="text-[var(--muted)] hover:text-white cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              onClick={() => handleRemoveMediaItem("finalImages", finalIdx % finalItems.length)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (cardKey === "video") {
                return (
                  <div
                    key="video"
                    draggable={isEditorActive}
                    onDragStart={(e) => {
                      if (isEditorActive) {
                        e.dataTransfer.setData("text/plain", "video");
                        setDraggedCard("video");
                      }
                    }}
                    onDragOver={(e) => {
                      if (isEditorActive) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (isEditorActive) {
                        e.preventDefault();
                        handleDropCard("video");
                      }
                    }}
                    onDragEnd={() => setDraggedCard(null)}
                    className={`relative w-[58%] sm:w-[35%] md:w-[32%] lg:w-[28%] min-w-[210px] max-w-[360px] flex-shrink-0 snap-start aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q3 border rounded-sm flex items-center justify-center shadow-lg transition-all ${
                      draggedCard === "video" ? "opacity-50 border-amber-400 scale-95" : "border-[var(--line)]/60"
                    } ${isEditorActive ? "cursor-grab active:cursor-grabbing hover:border-amber-400/80" : ""}`}
                  >
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-video)] font-bold shadow-md">
                      {isEditorActive && (
                        <span className="flex items-center gap-1 pr-1 border-r border-[var(--line)] text-amber-400" title="Drag to reorder position">
                          <GripVertical className="w-3 h-3 cursor-grab" />
                          <span className="text-[9px]">#{cardIdx + 1}</span>
                        </span>
                      )}
                      <VideoIcon className="w-3 h-3 text-[var(--accent-video)]" />
                      <span>PROCESS VIDEO ({videoItems.length > 0 ? `${(videoIdx % videoItems.length) + 1}/${videoItems.length}` : "0"})</span>
                    </div>

                    {/* Reorder Shift Arrow Buttons in Editor Mode */}
                    {isEditorActive && (
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-full border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("video", "left"); }}
                          disabled={cardIdx === 0}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("video", "right"); }}
                          disabled={cardIdx === cardOrder.length - 1}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {currentVideo ? (
                      <video
                        src={currentVideo}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-[var(--muted)] font-mono text-xs">
                        <VideoIcon className="w-8 h-8 mb-2 opacity-40 text-[var(--accent-video)]" />
                        <p className="mb-2">No Process Video Attached</p>
                        {isEditorActive && (
                          <button
                            onClick={() => handleOpenUpload("videos")}
                            className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--accent-video)]/50 text-[var(--accent-video)] hover:bg-[var(--accent-video)]/10 text-xs font-semibold cursor-pointer transition-all"
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
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q3:opacity-100 transition-opacity cursor-pointer shadow-lg"
                          title="Previous Video"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVideoIdx((prev) => (prev + 1) % videoItems.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q3:opacity-100 transition-opacity cursor-pointer shadow-lg"
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
                          className="flex items-center gap-1 text-[var(--accent-video)] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Video</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenUpload("videos", videoIdx % videoItems.length)}
                            className="text-[var(--muted)] hover:text-white cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => handleRemoveMediaItem("videos", videoIdx % videoItems.length)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (cardKey === "model") {
                return (
                  <div
                    key="model"
                    draggable={isEditorActive}
                    onDragStart={(e) => {
                      if (isEditorActive) {
                        e.dataTransfer.setData("text/plain", "model");
                        setDraggedCard("model");
                      }
                    }}
                    onDragOver={(e) => {
                      if (isEditorActive) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (isEditorActive) {
                        e.preventDefault();
                        handleDropCard("model");
                      }
                    }}
                    onDragEnd={() => setDraggedCard(null)}
                    className={`relative w-[58%] sm:w-[35%] md:w-[32%] lg:w-[28%] min-w-[210px] max-w-[360px] flex-shrink-0 snap-start aspect-[4/3] bg-[var(--surface-2)] overflow-hidden group/q4 border rounded-sm flex items-center justify-center shadow-lg transition-all ${
                      draggedCard === "model" ? "opacity-50 border-amber-400 scale-95" : "border-[var(--line)]/60"
                    } ${isEditorActive ? "cursor-grab active:cursor-grabbing hover:border-amber-400/80" : ""}`}
                  >
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-[#121316]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--line)] text-[10px] font-mono tracking-wider text-[var(--accent-3d)] font-bold shadow-md">
                      {isEditorActive && (
                        <span className="flex items-center gap-1 pr-1 border-r border-[var(--line)] text-amber-400" title="Drag to reorder position">
                          <GripVertical className="w-3 h-3 cursor-grab" />
                          <span className="text-[9px]">#{cardIdx + 1}</span>
                        </span>
                      )}
                      <Box className="w-3 h-3 text-[var(--accent-3d)]" />
                      <span>FINAL 3D MODEL ({modelItems.length > 0 ? `${(modelIdx % modelItems.length) + 1}/${modelItems.length}` : "0"})</span>
                    </div>

                    {/* Reorder Shift Arrow Buttons in Editor Mode */}
                    {isEditorActive && (
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-full border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("model", "left"); }}
                          disabled={cardIdx === 0}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveCard("model", "right"); }}
                          disabled={cardIdx === cardOrder.length - 1}
                          className="p-0.5 text-gray-300 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                          title="Move card right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

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
                            className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--accent-3d)]/50 text-[var(--accent-3d)] hover:bg-[var(--accent-3d)]/10 text-xs font-semibold cursor-pointer transition-all"
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
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q4:opacity-100 transition-opacity cursor-pointer shadow-lg"
                          title="Previous 3D Model"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setModelIdx((prev) => (prev + 1) % modelItems.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/80 hover:bg-black text-white rounded-full opacity-80 group-hover/q4:opacity-100 transition-opacity cursor-pointer shadow-lg"
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
                          className="flex items-center gap-1 text-[var(--accent-3d)] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add 3D Model</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenUpload("models", modelIdx % modelItems.length)}
                            className="text-[var(--muted)] hover:text-white cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => handleRemoveMediaItem("models", modelIdx % modelItems.length)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
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

          {/* Dedicated Thumbnail & Crop/Fit Settings Bar - ONLY visible in Editor Mode */}
          {isEditorActive && (
            <div className="my-6 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded border border-[var(--line)] overflow-hidden bg-black flex-none relative">
                  <img
                    src={project.cover}
                    alt="Thumbnail"
                    className={`w-full h-full ${project.coverFit === "contain" ? "object-contain" : "object-cover"}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                      Project Thumbnail
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--line)] text-[var(--muted)]">
                      {project.coverFit === "contain" ? "Fit All (Contain)" : "Crop Fill (Cover)"}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
                    Click any image below to set as thumbnail, or choose fit style.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle Fit Mode */}
                <button
                  onClick={() => {
                    const nextFit = project.coverFit === "contain" ? "cover" : "contain";
                    onUpdateProject(project.id, "coverFit", nextFit);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    project.coverFit === "contain"
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                      : "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30"
                  }`}
                  title="Toggle between cropping to fill frame vs showing whole image with black space"
                >
                  {project.coverFit === "contain" ? <Maximize2 className="w-3.5 h-3.5" /> : <Crop className="w-3.5 h-3.5" />}
                  <span>{project.coverFit === "contain" ? "Fit Whole Image" : "Crop Fill Image"}</span>
                </button>

                {/* Upload Cover from Computer or Custom URL */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className="px-3 py-1.5 rounded text-xs font-mono bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent-web)] text-[var(--text)] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-[var(--accent-web)]" />
                    <span>Upload from Computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleCoverFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  <button
                    onClick={() => {
                      const newUrl = prompt("Enter thumbnail image URL (or paste link):", project.cover);
                      if (newUrl && newUrl.trim()) {
                        handleCoverChange(newUrl.trim());
                      }
                    }}
                    className="px-3 py-1.5 rounded text-xs font-mono bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Paste Image Link"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Paste Link</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Image Browsing Galleries: LEFT (Final) vs RIGHT (Process) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 pt-6 border-t border-[var(--line)]">
            {/* LEFT SIDE: FINAL DELIVERABLES */}
            <div className="bg-[var(--surface-2)] p-4 rounded-lg border border-[var(--line)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[var(--accent-photo)]" />
                  <h3 className="font-mono text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Left: Final Section ({finalItems.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--muted)]">Scroll / Click to enlarge</span>
              </div>

              {/* Horizontal Scrollable Thumbnail Ribbon */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {finalItems.map((imgUrl, idx) => {
                  const isCurrentThumbnail = project.cover === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={`relative flex-none w-28 aspect-[4/3] rounded border overflow-hidden group transition-all ${
                        isCurrentThumbnail
                          ? "border-[var(--accent-photo)] ring-2 ring-[var(--accent-photo)]/50 scale-105"
                          : "border-[var(--line)] opacity-85 hover:opacity-100 hover:border-[var(--muted)]"
                      }`}
                      title={`Final Image ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Final ${idx + 1}`}
                        onClick={() => {
                          setFinalIdx(idx);
                          handleOpenLightbox("final", idx);
                        }}
                        className="w-full h-full object-cover cursor-pointer"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-1 left-1 right-1 flex items-center justify-between pointer-events-none">
                        <span className="bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                          #{idx + 1}
                        </span>
                        {isCurrentThumbnail && (
                          <span className="bg-[var(--accent-photo)] text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow">
                            COVER
                          </span>
                        )}
                      </div>

                      {/* Hover Controls: Set as Thumbnail & Zoom */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-1">
                        {isEditorActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCoverChange(imgUrl);
                            }}
                            className={`w-full py-1 text-[9px] font-mono font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              isCurrentThumbnail
                                ? "bg-emerald-600 text-white"
                                : "bg-white/20 hover:bg-white text-white hover:text-black"
                            }`}
                          >
                            {isCurrentThumbnail ? <Check className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                            <span>{isCurrentThumbnail ? "Selected" : "Set Cover"}</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFinalIdx(idx);
                            handleOpenLightbox("final", idx);
                          }}
                          className="w-full py-1 text-[9px] font-mono bg-black/80 hover:bg-black text-white rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-2.5 h-2.5" />
                          <span>Uncropped</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE: PROCESS EXPLORATIONS */}
            <div className="bg-[var(--surface-2)] p-4 rounded-lg border border-[var(--line)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[var(--accent-web)]" />
                  <h3 className="font-mono text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Right: Process Section ({processItems.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--muted)]">Scroll / Click to enlarge</span>
              </div>

              {/* Horizontal Scrollable Thumbnail Ribbon */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {processItems.map((imgUrl, idx) => {
                  const isCurrentThumbnail = project.cover === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={`relative flex-none w-28 aspect-[4/3] rounded border overflow-hidden group transition-all ${
                        isCurrentThumbnail
                          ? "border-[var(--accent-web)] ring-2 ring-[var(--accent-web)]/50 scale-105"
                          : "border-[var(--line)] opacity-85 hover:opacity-100 hover:border-[var(--muted)]"
                      }`}
                      title={`Process Image ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Process ${idx + 1}`}
                        onClick={() => {
                          setProcessIdx(idx);
                          handleOpenLightbox("process", idx);
                        }}
                        className="w-full h-full object-cover cursor-pointer"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-1 left-1 right-1 flex items-center justify-between pointer-events-none">
                        <span className="bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                          #{idx + 1}
                        </span>
                        {isCurrentThumbnail && (
                          <span className="bg-[var(--accent-web)] text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow">
                            COVER
                          </span>
                        )}
                      </div>

                      {/* Hover Controls: Set as Thumbnail & Zoom */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-1">
                        {isEditorActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCoverChange(imgUrl);
                            }}
                            className={`w-full py-1 text-[9px] font-mono font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              isCurrentThumbnail
                                ? "bg-emerald-600 text-white"
                                : "bg-white/20 hover:bg-white text-white hover:text-black"
                            }`}
                          >
                            {isCurrentThumbnail ? <Check className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                            <span>{isCurrentThumbnail ? "Selected" : "Set Cover"}</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProcessIdx(idx);
                            handleOpenLightbox("process", idx);
                          }}
                          className="w-full py-1 text-[9px] font-mono bg-black/80 hover:bg-black text-white rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-2.5 h-2.5" />
                          <span>Uncropped</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* External Links Section */}
          <div className="pt-6 mt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4 bg-[var(--surface-2)] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--accent-web)]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  External Website / Live Link
                </h4>
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[var(--accent-web)] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{project.link}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
                    No external website link set for this project.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[var(--accent-web)] hover:bg-[var(--accent-web)]/90 text-black font-mono font-bold text-xs rounded flex items-center gap-2 shadow-md transition-all hover:scale-105"
                >
                  <span>Visit External Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {isEditorActive && (
                <button
                  onClick={() => {
                    const newLink = prompt("Enter external website URL (e.g. https://myproject.com):", project.link || "");
                    if (newLink !== null) {
                      onUpdateProject(project.id, "link", newLink.trim());
                    }
                  }}
                  className="px-3 py-2 bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--muted)] text-xs font-mono text-[var(--text)] rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>{project.link ? "Edit Link" : "+ Add External Link"}</span>
                </button>
              )}
            </div>
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

      {/* =========================================================================
          FULL UNCROPPED LIGHTBOX POP-UP SLIDESHOW MODAL
          ========================================================================= */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
          {/* Lightbox Header */}
          <div className="w-full flex items-center justify-between text-white border-b border-white/10 pb-3 z-10">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                  lightboxType === "process"
                    ? "bg-[var(--accent-web)]/20 border-[var(--accent-web)] text-[var(--accent-web)]"
                    : "bg-[var(--accent-photo)]/20 border-[var(--accent-photo)] text-[var(--accent-photo)]"
                }`}
              >
                {lightboxType === "process" ? "Process Exploration" : "Final Deliverable"}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {project.title} — Image {lightboxIdx + 1} of{" "}
                {lightboxType === "process" ? processItems.length : finalItems.length}
              </span>
            </div>

            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Uncropped Image Area */}
          <div className="relative flex-1 w-full flex items-center justify-center my-2 overflow-hidden select-none">
            {/* Previous Image Arrow */}
            {(lightboxType === "process" ? processItems.length : finalItems.length) > 1 && (
              <button
                onClick={() => {
                  const items = lightboxType === "process" ? processItems : finalItems;
                  setLightboxIdx((prev) => (prev - 1 + items.length) % items.length);
                }}
                className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all cursor-pointer hover:scale-110 shadow-2xl"
                title="Previous Image (Left Arrow Key)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Uncropped Image Display (Strict object-contain for 0 cropping) */}
            <img
              src={
                lightboxType === "process"
                  ? processItems[lightboxIdx % processItems.length]
                  : finalItems[lightboxIdx % finalItems.length]
              }
              alt={`${project.title} uncropped`}
              className="max-h-[82vh] max-w-[90vw] object-contain rounded shadow-2xl transition-transform duration-200"
            />

            {/* Next Image Arrow */}
            {(lightboxType === "process" ? processItems.length : finalItems.length) > 1 && (
              <button
                onClick={() => {
                  const items = lightboxType === "process" ? processItems : finalItems;
                  setLightboxIdx((prev) => (prev + 1) % items.length);
                }}
                className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all cursor-pointer hover:scale-110 shadow-2xl"
                title="Next Image (Right Arrow Key)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Row */}
          <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 scrollbar-thin">
            {(lightboxType === "process" ? processItems : finalItems).map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIdx(idx)}
                className={`relative flex-none w-16 h-12 rounded border overflow-hidden transition-all cursor-pointer ${
                  idx === lightboxIdx
                    ? "border-white ring-2 ring-white/50 scale-110 opacity-100"
                    : "border-white/20 opacity-50 hover:opacity-100"
                }`}
              >
                <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

