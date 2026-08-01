import React, { useEffect, useRef, useState, useCallback } from "react";
import { Category, Project, SiteSettings } from "../types";
import { EditableText } from "./EditableText";
import {
  ArrowRight,
  MousePointerClick,
  Trash2,
  Grid2x2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image,
  Box,
  Globe,
  Video
} from "lucide-react";

interface FocusWheelProps {
  categories: Category[];
  site: SiteSettings;
  projects?: Project[];
  focusedIndex: number;
  onSetFocusedIndex: (index: number) => void;
  onSelectCategory: (category: Category) => void;
  onSelectProject?: (project: Project) => void;
  isEditorActive: boolean;
  onUpdateCategory: (catId: string, field: keyof Category, value: string) => void;
  onUpdateSite: (field: keyof SiteSettings, value: string) => void;
  onDeleteCategory?: (catId: string) => void;
}

const CENTER = 300;
const R_INNER = 110;
const R_OUTER = 255;
const R_LABEL = 185;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad)
  };
}

function describeWedgePath(cx: number, cy: number, rIn: number, rOut: number, startDeg: number, endDeg: number) {
  // Small gap angle for visual separation between slices
  const gap = 0.8;
  const sDeg = startDeg + gap;
  const eDeg = endDeg - gap;

  const startRad = (sDeg * Math.PI) / 180;
  const endRad = (eDeg * Math.PI) / 180;

  const x1Out = cx + rOut * Math.cos(startRad);
  const y1Out = cy + rOut * Math.sin(startRad);
  const x2Out = cx + rOut * Math.cos(endRad);
  const y2Out = cy + rOut * Math.sin(endRad);

  const x1In = cx + rIn * Math.cos(startRad);
  const y1In = cy + rIn * Math.sin(startRad);
  const x2In = cx + rIn * Math.cos(endRad);
  const y2In = cy + rIn * Math.sin(endRad);

  const largeArcFlag = Math.abs(eDeg - sDeg) <= 180 ? 0 : 1;

  return [
    `M ${x1Out} ${y1Out}`,
    `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2Out} ${y2Out}`,
    `L ${x2In} ${y2In}`,
    `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x1In} ${y1In}`,
    `Z`
  ].join(" ");
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

export const FocusWheel: React.FC<FocusWheelProps> = ({
  categories,
  site,
  projects = [],
  focusedIndex,
  onSetFocusedIndex,
  onSelectCategory,
  onSelectProject,
  isEditorActive,
  onUpdateCategory,
  onUpdateSite,
  onDeleteCategory
}) => {
  const wheelCropRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const N = categories.length;
  const STEP = 360 / Math.max(N, 1);

  const [totalRotation, setTotalRotation] = useState<number>(0);
  const totalRotationRef = useRef<number>(0);
  totalRotationRef.current = totalRotation;

  const rafIdRef = useRef<number | null>(null);
  const scrollLockedRef = useRef<boolean>(false);
  const scrollAccumRef = useRef<number>(0);
  const dragStateRef = useRef<{ startAngle: number; startTotal: number } | null>(null);

  const currentCategory = categories[focusedIndex] || categories[0];
  const currentProjects = projects.filter((p) => p.category === currentCategory.id);

  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);

  useEffect(() => {
    setPreviewSlideIndex(0);
  }, [currentCategory.id]);

  // Animate wheel rotation smoothly to target angle
  const animateRotationTo = useCallback((targetDeg: number, duration = 420) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const startDeg = totalRotationRef.current;
    const t0 = performance.now();

    const stepFunc = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = easeInOutCubic(t);
      const currentDeg = startDeg + (targetDeg - startDeg) * eased;

      setTotalRotation(currentDeg);

      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(stepFunc);
      } else {
        setTotalRotation(targetDeg);
      }
    };

    rafIdRef.current = requestAnimationFrame(stepFunc);
  }, []);

  const nearestRotationForIndex = useCallback((current: number, targetIdx: number) => {
    const currentIdx = (((Math.round(current / STEP)) % N) + N) % N;
    let diff = targetIdx - currentIdx;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    return current + diff * STEP;
  }, [N, STEP]);

  const setFocusedSection = useCallback((idx: number, opts: { enterAfter?: boolean } = {}) => {
    const validIndex = ((idx % N) + N) % N;
    const targetDeg = nearestRotationForIndex(totalRotationRef.current, validIndex);

    animateRotationTo(targetDeg);
    onSetFocusedIndex(validIndex);

    if (opts.enterAfter) {
      setTimeout(() => {
        onSelectCategory(categories[validIndex]);
      }, 350);
    }
  }, [N, nearestRotationForIndex, animateRotationTo, onSetFocusedIndex, onSelectCategory, categories]);

  // Mouse wheel scroll handler to rotate wheel between sections
  useEffect(() => {
    const cropEl = wheelCropRef.current;
    if (!cropEl) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollLockedRef.current) return;

      scrollAccumRef.current += e.deltaY;
      if (Math.abs(scrollAccumRef.current) < 35) return;

      const dir = scrollAccumRef.current > 0 ? 1 : -1;
      scrollAccumRef.current = 0;
      scrollLockedRef.current = true;

      const nextIdx = (((focusedIndex + dir) % N) + N) % N;
      setFocusedSection(nextIdx);

      setTimeout(() => {
        scrollLockedRef.current = false;
      }, 420);
    };

    cropEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      cropEl.removeEventListener("wheel", handleWheel);
    };
  }, [focusedIndex, N, setFocusedSection]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setFocusedSection((focusedIndex + 1) % N);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setFocusedSection((((focusedIndex - 1) % N) + N) % N);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, N, setFocusedSection]);

  // Drag tracking vs click detection
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Pointer drag to rotate
  const pointerAngle = (e: React.PointerEvent) => {
    if (!wheelCropRef.current) return 0;
    const rect = wheelCropRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    dragStateRef.current = {
      startAngle: pointerAngle(e),
      startTotal: totalRotationRef.current
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStateRef.current || !startPosRef.current) return;
    const dist = Math.hypot(e.clientX - startPosRef.current.x, e.clientY - startPosRef.current.y);
    if (dist > 6) {
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        if (svgRef.current) {
          try {
            svgRef.current.setPointerCapture(e.pointerId);
          } catch (_) {}
        }
      }
    }

    if (isDraggingRef.current) {
      const delta = pointerAngle(e) - dragStateRef.current.startAngle;
      const newTotal = dragStateRef.current.startTotal + delta;
      setTotalRotation(newTotal);

      const nearestIdx = (((Math.round(newTotal / STEP)) % N) + N) % N;
      if (nearestIdx !== focusedIndex) {
        onSetFocusedIndex(nearestIdx);
      }
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current && dragStateRef.current) {
      const nearestIdx = (((Math.round(totalRotationRef.current / STEP)) % N) + N) % N;
      setFocusedSection(nearestIdx);
    }
    dragStateRef.current = null;
    startPosRef.current = null;
    isDraggingRef.current = false;
  };

  const handleCategoryClick = (i: number, cat: Category) => {
    if (isDraggingRef.current) return;
    onSetFocusedIndex(i);
    onSelectCategory(cat);
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[calc(100vh-140px)] max-w-[1180px] mx-auto px-6 sm:px-8">
      {/* Top Section Nav Pill Bar for Quick Category Switching */}
      <div className="w-full flex items-center justify-between gap-2 overflow-x-auto pb-3 pt-2 no-scrollbar border-b border-[var(--line)]/50">
        <div className="flex items-center gap-2 flex-nowrap">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mr-1 flex-none font-bold">
            ARCHIVE SECTIONS ({N}):
          </span>
          {categories.map((cat, idx) => {
            const isActive = idx === focusedIndex;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSetFocusedIndex(idx);
                  onSelectCategory(cat);
                }}
                className={`flex-none inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--surface-2)] text-[var(--text)] font-bold border-[#ffffff]/60 shadow-sm"
                    : "bg-transparent text-[var(--muted)] hover:text-[var(--text)] border-[var(--line)] hover:border-[var(--muted)]"
                }`}
                style={{
                  borderColor: isActive ? cat.color : undefined
                }}
                title={`Open ${cat.label} Section Page`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Home Stage */}
      <div className="flex flex-col md:flex-row items-center w-full min-h-[70vh] py-6 gap-8 md:gap-0">
        
        {/* Left Half: Focus Wheel (Gracefully Curved Top, Fully Colored Wedges) */}
        <div
          ref={wheelCropRef}
          className="relative flex-none w-full md:w-[50%] h-[55vh] md:h-[78vh] pt-4 md:pt-0 overflow-visible select-none touch-none flex items-center justify-start"
        >
          <svg
            ref={svgRef}
            id="wheelSvg"
            viewBox="-20 -20 640 640"
            className="w-[62vh] h-[62vh] md:w-[86vh] md:h-[86vh] min-w-[360px] min-h-[360px] md:min-w-[580px] md:min-h-[580px] -translate-x-[42%] md:-translate-x-[52%] block"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="img"
            aria-label="Section focus wheel"
          >
            {/* Outer and Inner Circle Guides */}
            <circle cx={CENTER} cy={CENTER} r={R_OUTER + 4} fill="none" stroke="var(--line)" strokeWidth="1" opacity="0.4" />
            <circle cx={CENTER} cy={CENTER} r={R_INNER - 4} fill="none" stroke="var(--line)" strokeWidth="1" opacity="0.4" />

            {/* Colored Section Wedges (Pie Slices) */}
            <g id="wedgesGroup">
              {categories.map((cat, i) => {
                const baseAngle = i * STEP;
                const startAngle = baseAngle - STEP / 2 - totalRotation;
                const endAngle = baseAngle + STEP / 2 - totalRotation;
                const isActive = i === focusedIndex;

                const wedgeD = describeWedgePath(CENTER, CENTER, R_INNER, R_OUTER, startAngle, endAngle);

                return (
                  <path
                    key={cat.id}
                    d={wedgeD}
                    fill={cat.color}
                    fillOpacity={isActive ? 0.88 : 0.28}
                    stroke={isActive ? "#ffffff" : "var(--line)"}
                    strokeWidth={isActive ? 2.5 : 1}
                    className="cursor-pointer transition-all duration-300 hover:fill-opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(i, cat);
                    }}
                    style={{
                      filter: isActive ? `drop-shadow(0 0 20px ${cat.color}aa)` : "none"
                    }}
                  >
                    <title>Click to open {cat.label} Section Page</title>
                  </path>
                );
              })}
            </g>

            {/* Labels & Square Grid Page Link Icons */}
            <g id="labelsGroup">
              {categories.map((cat, i) => {
                const baseAngle = i * STEP;
                const pos = polar(baseAngle - totalRotation, R_LABEL);
                const isActive = i === focusedIndex;

                return (
                  <g
                    key={cat.id}
                    className={`wheel-label transition-all duration-300 ${
                      isActive ? "is-active scale-110" : "opacity-85 hover:opacity-100"
                    }`}
                    transform={`translate(${pos.x} ${pos.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(i, cat);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <title>Click to open {cat.label} Section Page</title>

                    {/* Large Transparent Hit Circle */}
                    <circle r={42} fill="transparent" />

                    {/* Section Text Label */}
                    <text
                      className="label-text select-none"
                      y={-6}
                      textAnchor="middle"
                      style={{
                        fill: isActive ? "#ffffff" : "var(--text)",
                        fontWeight: isActive ? 800 : 600,
                        fontSize: isActive ? "15px" : "13px",
                        letterSpacing: "0.08em",
                        textShadow: isActive ? "0 2px 8px rgba(0,0,0,0.8)" : "0 1px 4px rgba(0,0,0,0.5)"
                      }}
                    >
                      {cat.short}
                    </text>

                    {/* Icon with many squares (Grid Page Link Button) */}
                    <g
                      transform="translate(0, 14)"
                      className="hover:scale-125 transition-transform"
                    >
                      <circle
                        r={12}
                        fill={isActive ? cat.color : "var(--surface)"}
                        stroke={isActive ? "#ffffff" : cat.color}
                        strokeWidth="1.5"
                      />
                      {/* Grid representation (4 squares) */}
                      <rect x="-5" y="-5" width="4" height="4" rx="0.5" fill={isActive ? "#ffffff" : cat.color} />
                      <rect x="1" y="-5" width="4" height="4" rx="0.5" fill={isActive ? "#ffffff" : cat.color} />
                      <rect x="-5" y="1" width="4" height="4" rx="0.5" fill={isActive ? "#ffffff" : cat.color} />
                      <rect x="1" y="1" width="4" height="4" rx="0.5" fill={isActive ? "#ffffff" : cat.color} />
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right Half: Focus Detail Panel with Mini Slideshow Preview */}
        <aside className="flex-1 max-w-lg px-6 md:px-8 text-center md:text-left z-10 flex flex-col justify-center">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <span className="font-mono text-xs text-[var(--muted)]">
              N°{String(focusedIndex + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: currentCategory.color }}
            />
            <span className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--line)]">
              {currentProjects.length} {currentProjects.length === 1 ? "Project" : "Projects"}
            </span>
          </div>

          {/* Section Title */}
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-[var(--text)] leading-tight">
            <EditableText
              value={currentCategory.label}
              onSave={(val) => onUpdateCategory(currentCategory.id, "label", val)}
              isEditorActive={isEditorActive}
              tagName="span"
            />
          </h2>

          {/* Section Description */}
          <p className="text-[var(--muted)] text-xs sm:text-sm leading-relaxed mb-4 max-w-prose">
            <EditableText
              value={currentCategory.desc}
              onSave={(val) => onUpdateCategory(currentCategory.id, "desc", val)}
              isEditorActive={isEditorActive}
              tagName="span"
              multiline
            />
          </p>

          {/* Mini Slideshow Preview of Section Projects (3 per row) */}
          <div className="mb-5 bg-[var(--surface)] border border-[var(--line)] rounded-lg p-3 text-left shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
                <Eye className="w-3.5 h-3.5 text-[var(--accent-web)]" />
                <span className="font-semibold text-[var(--text)]">Section Works</span>
                {currentProjects.length > 0 && (
                  <span>
                    ({Math.min(currentProjects.length, 3)} of {currentProjects.length})
                  </span>
                )}
              </div>

              {currentProjects.length > 3 && (
                <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--muted)]">
                  <span>
                    {previewSlideIndex + 1}-{Math.min(previewSlideIndex + 3, currentProjects.length)}
                  </span>
                  <button
                    onClick={() => setPreviewSlideIndex((prev) => (prev - 1 + currentProjects.length) % currentProjects.length)}
                    className="p-1 hover:bg-[var(--surface-2)] border border-[var(--line)] rounded text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    title="Previous projects"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setPreviewSlideIndex((prev) => (prev + 1) % currentProjects.length)}
                    className="p-1 hover:bg-[var(--surface-2)] border border-[var(--line)] rounded text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    title="Next projects"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {currentProjects.length === 0 ? (
              <div className="py-6 text-center text-[var(--muted)] font-mono text-xs border border-dashed border-[var(--line)] rounded">
                No projects filed under this section yet.
              </div>
            ) : (
              (() => {
                // Slice 3 visible items starting from previewSlideIndex with cyclic wrap-around if needed
                const visibleProjects = [];
                const total = currentProjects.length;
                const count = Math.min(total, 3);
                for (let i = 0; i < count; i++) {
                  visibleProjects.push(currentProjects[(previewSlideIndex + i) % total]);
                }

                return (
                  <div className="grid grid-cols-3 gap-2">
                    {visibleProjects.map((proj) => {
                      const Icon = MEDIUM_ICONS[proj.type] || Globe;
                      const accentColor = MEDIUM_COLORS[proj.type] || "var(--accent-web)";

                      return (
                        <div
                          key={proj.id}
                          onClick={() => onSelectProject && onSelectProject(proj)}
                          className="group relative bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--muted)] rounded overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                          title={`View ${proj.title}`}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                            {proj.type === "video" && proj.video ? (
                              <video
                                src={proj.video}
                                muted
                                loop
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <img
                                src={proj.cover}
                                alt={proj.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            )}

                            {/* Mini Type Icon Badge */}
                            <div className="absolute top-1 right-1 p-1 rounded-full bg-black/75 backdrop-blur-sm border border-white/10">
                              <Icon className="w-2.5 h-2.5" style={{ color: accentColor }} />
                            </div>

                            {/* Compact Title Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-1.5">
                              <div className="w-full text-white">
                                <p className="font-display font-bold text-[10px] leading-tight truncate">
                                  {proj.title}
                                </p>
                                <p className="font-mono text-[8px] opacity-75">
                                  {proj.year}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
            {/* Primary Action Button to Open Category Page */}
            <button
              onClick={() => onSelectCategory(currentCategory)}
              className="inline-flex items-center gap-2.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-90 px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-md group"
            >
              <Grid2x2 className="w-3.5 h-3.5 text-[var(--bg)]" />
              <span>Open {currentCategory.label} Page ({currentProjects.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            {isEditorActive && onDeleteCategory && categories.length > 1 && (
              <button
                onClick={() => {
                  if (confirm(`Delete category "${currentCategory.label}"?`)) {
                    onDeleteCategory(currentCategory.id);
                  }
                }}
                className="p-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                title="Delete Section"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Wheel Interaction Hint */}
      <div className="max-w-[1180px] mx-auto px-8 py-6 text-center border-t border-[var(--line)]/50">
        <p className="text-xs font-mono text-[var(--muted)] flex items-center justify-center gap-2">
          <MousePointerClick className="w-3.5 h-3.5 text-[var(--accent-web)]" />
          <EditableText
            value={site.hint}
            onSave={(val) => onUpdateSite("hint", val)}
            isEditorActive={isEditorActive}
            tagName="span"
          />
        </p>
      </div>
    </div>
  );
};

