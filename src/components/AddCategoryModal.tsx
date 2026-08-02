import React, { useState } from "react";
import { Category } from "../types";
import { X, Plus } from "lucide-react";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (newCat: Category) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory
}) => {
  const [label, setLabel] = useState("");
  const [short, setShort] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("#8b7bff");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const id = label.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || `cat_${Date.now()}`;
    const newCat: Category = {
      id,
      label: label.trim(),
      short: (short.trim() || label.slice(0, 6)).toUpperCase(),
      desc: desc.trim() || "A new section added to the portfolio archive.",
      color
    };

    onAddCategory(newCat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-md p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-2xl mb-1 text-[var(--text)]">Add New Section</h3>
        <p className="text-xs text-[var(--muted)] mb-6 font-mono">
          Create a new wedge on the focus wheel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[var(--muted)] mb-1">Section Title</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Motion Design, Sound Art"
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Wheel Short Label (Max 8 chars)</label>
            <input
              type="text"
              value={short}
              onChange={(e) => setShort(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="e.g. MOTION"
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short overview of work in this section..."
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0"
              />
              <span className="text-[var(--muted)]">{color}</span>
            </div>
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
              <span>Create Section</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
