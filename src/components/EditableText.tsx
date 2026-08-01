import React, { useRef, useEffect } from "react";

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  isEditorActive: boolean;
  className?: string;
  tagName?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
  placeholder?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  isEditorActive,
  className = "",
  tagName = "span",
  placeholder = "Click to edit text...",
  multiline = false
}) => {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement>(null);

  const Tag = tagName as any;

  if (!isEditorActive) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText || "";
    if (text !== value) {
      onSave(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Tag
      data-editable="true"
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} hover:outline-dashed hover:outline-1 hover:outline-[var(--accent-web)] focus:outline-solid focus:outline-2 focus:outline-[var(--accent-web)] focus:bg-[var(--surface-2)] transition-all rounded px-0.5`}
      title="Click to edit text"
    >
      {value || placeholder}
    </Tag>
  );
};
