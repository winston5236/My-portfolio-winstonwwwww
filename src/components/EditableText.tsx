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
  const ref = useRef<HTMLElement>(null);
  const Tag = tagName as any;

  // Sync value into DOM content without React JSX children reconciler interfering
  useEffect(() => {
    if (!isEditorActive) return;
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = value || placeholder;
    }
  }, [value, isEditorActive, placeholder]);

  if (!isEditorActive) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    // If showing placeholder, clear it on focus for easy typing
    if (e.currentTarget.textContent === placeholder) {
      e.currentTarget.textContent = "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = (e.currentTarget.textContent || "").trim();
    if (!text) {
      e.currentTarget.textContent = placeholder;
      if (value !== "") {
        onSave("");
      }
    } else if (text !== value && text !== placeholder) {
      onSave(text);
    } else if (text === placeholder) {
      e.currentTarget.textContent = value || placeholder;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditorActive) {
      e.stopPropagation();
    }
  };

  return (
    <Tag
      ref={ref}
      data-editable="true"
      contentEditable
      suppressContentEditableWarning
      onClick={handleClick}
      onMouseDown={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} hover:outline-dashed hover:outline-1 hover:outline-[var(--accent-web)] focus:outline-solid focus:outline-2 focus:outline-[var(--accent-web)] focus:bg-[var(--surface-2)] transition-all rounded px-0.5 cursor-text inline-block min-w-[20px]`}
      title="Click to edit text"
    />
  );
};
