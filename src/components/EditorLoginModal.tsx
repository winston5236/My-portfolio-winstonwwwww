import React, { useState } from "react";
import { Lock, X, AlertCircle } from "lucide-react";

interface EditorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const EditorLoginModal: React.FC<EditorLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "win5236" && password === "manekas6235") {
      setError(null);
      setUsername("");
      setPassword("");
      onLoginSuccess();
    } else {
      setError("Incorrect username or password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--line)] rounded-md p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[var(--accent-web)] font-mono text-xs">
          <Lock className="w-4 h-4" />
          <span>PORTFOLIO EDITOR ACCESS</span>
        </div>

        <h3 className="font-display font-bold text-2xl mb-1 text-[var(--text)]">Editor Login</h3>
        <p className="text-xs text-[var(--muted)] mb-6 font-mono">
          Enter credentials to enable live text, media, 3D model, and color editing.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs font-mono text-red-400 bg-red-950/40 border border-red-500/30 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[var(--muted)] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="win5236"
              autoFocus
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2.5 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--muted)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] focus:border-[var(--accent-web)] text-[var(--text)] px-3 py-2.5 rounded outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded bg-[var(--text)] text-[var(--bg)] hover:opacity-90 font-semibold cursor-pointer"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
