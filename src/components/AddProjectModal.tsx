import React, { useState } from "react";
import { Category, Project, MediaType } from "../types";
import { X, Plus, Upload } from "lucide-react";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeCategoryId?: string;
  onAddProject: (newProj: Project) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  categories,
  activeCategoryId,
  onAddProject
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(activeCategoryId || categories[0]?.id || "form");
  const [type, setType] = useState<MediaType>("web");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [desc, setDesc] = useState("");
  const [cover, setCover] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80");
  const [processImage, setProcessImage] = useState("https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80");
  const [coverFit, setCoverFit] = useState<"cover" | "contain">("cover");
  const [link, setLink] = useState("");
  const [model, setModel] = useState("");
  const [video, setVideo] = useState("");
  const [tagsInput, setTagsInput] = useState("design, archive");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCover(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProcessImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = String(Math.floor(100 + Math.random() * 900));
    const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

    const procImg = processImage.trim() || cover;

    const newProj: Project = {
      id,
      title: title.trim(),
      category,
      type,
      year: year.trim() || "2026",
      tags,
      desc: desc.trim() || "A new portfolio project.",
      cover,
      coverFit,
      link: link.trim() || undefined,
      processImages: [procImg],
      finalImages: [cover],
      model: type === "3d" ? model.trim() || "https://modelviewer.dev/shared-assets/models/Astronaut.glb" : undefined,
      video: type === "video" ? video.trim() || undefined : undefined,
      images: type === "photo" ? [cover] : undefined
    };

    onAddProject(newProj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-md p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-2xl mb-1 text-[var(--text)]">Add New Project</h3>
        <p className="text-xs text-[var(--muted)] mb-6 font-mono">
          Add a project to any section in your portfolio archive.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[var(--muted)] mb-1">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fieldnote App, Kinetic Sculpture"
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--muted)] mb-1">Section Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.short})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[var(--muted)] mb-1">Media Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MediaType)}
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              >
                <option value="web">Web Application</option>
                <option value="3d">3D Model (.glb / .obj)</option>
                <option value="photo">Photography / Gallery</option>
                <option value="video">Video / Motion</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--muted)] mb-1">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--muted)] mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="react, 3d, design"
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Overview of this work, tools used, client or concept context..."
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Project Thumbnail / Card Cover (URL or Upload)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              />
              <label className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent-web)] rounded cursor-pointer flex items-center gap-1 text-[var(--text)]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Process Image / Exploration Sketch (URL or Upload)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={processImage}
                onChange={(e) => setProcessImage(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              />
              <label className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent-web)] rounded cursor-pointer flex items-center gap-1 text-[var(--text)]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input type="file" onChange={handleProcessFileUpload} accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Thumbnail Fit Mode</label>
            <select
              value={coverFit}
              onChange={(e) => setCoverFit(e.target.value as "cover" | "contain")}
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            >
              <option value="cover">Crop to Fill Frame (Default)</option>
              <option value="contain">Fit Whole Image (Uncropped with Black Space)</option>
            </select>
          </div>

          {type === "3d" && (
            <div>
              <label className="block text-[var(--muted)] mb-1">3D Model URL (.glb / .gltf / .obj)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              />
            </div>
          )}

          {type === "video" && (
            <div>
              <label className="block text-[var(--muted)] mb-1">Video File URL (.mp4 / .webm)</label>
              <input
                type="text"
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                placeholder="https://commondatastorage.googleapis.com/.../BigBuckBunny.mp4"
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[var(--muted)] mb-1">Live Project Link (optional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://mywebsite.com"
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-[var(--line)] text-[var(--muted)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-[var(--accent-web)] text-white font-semibold hover:opacity-90 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
