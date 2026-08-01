import React, { useState, useEffect, useRef } from "react";
import { Category, Project, SiteSettings, ThemeSettings } from "./types";
import { loadPortfolioState, DEFAULT_THEME } from "./defaultData";
import { subscribeToPortfolio, saveToFirestore } from "./firestoreSync";

import { Header } from "./components/Header";
import { FocusWheel } from "./components/FocusWheel";
import { CategoryView } from "./components/CategoryView";
import { ProjectOverlayModal } from "./components/ProjectOverlayModal";
import { EditorLoginModal } from "./components/EditorLoginModal";
import { ColorCustomizerModal } from "./components/ColorCustomizerModal";
import { EditorToolbar } from "./components/EditorToolbar";
import { AddCategoryModal } from "./components/AddCategoryModal";
import { AddProjectModal } from "./components/AddProjectModal";

export default function App() {
  // Load initial portfolio state from local storage or defaults
  const [initialData] = useState(loadPortfolioState);
  const [site, setSite] = useState<SiteSettings>(initialData.site);
  const [theme, setTheme] = useState<ThemeSettings>(initialData.theme);
  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [projects, setProjects] = useState<Project[]>(initialData.projects);

  // View state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Editor & Modals state
  const [isEditorActive, setIsEditorActive] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [colorModalOpen, setColorModalOpen] = useState<boolean>(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState<boolean>(false);
  const [addProjectModalOpen, setAddProjectModalOpen] = useState<boolean>(false);

  // Synchronize CSS custom variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--surface", theme.surface);
    root.style.setProperty("--surface-2", theme.surface2);
    root.style.setProperty("--text", theme.text);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--line", theme.line);
    root.style.setProperty("--accent-web", theme.accentWeb);
    root.style.setProperty("--accent-3d", theme.accent3d);
    root.style.setProperty("--accent-photo", theme.accentPhoto);
    root.style.setProperty("--accent-video", theme.accentVideo);

    if (isEditorActive) {
      document.body.classList.add("editor-active");
    } else {
      document.body.classList.remove("editor-active");
    }
  }, [theme, isEditorActive]);

  // Track if state update originated from Firestore snapshot
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);

  // Subscribe to real-time Firestore database updates
  useEffect(() => {
    const unsubscribe = subscribeToPortfolio((remoteData) => {
      isRemoteUpdateRef.current = true;
      setSite(remoteData.site);
      setTheme(remoteData.theme);
      setCategories(remoteData.categories);
      setProjects(remoteData.projects);
    });
    return () => unsubscribe();
  }, []);

  // Sync state changes to Firestore & localStorage
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveToFirestore({ site, theme, categories, projects });
    }, 300);

    return () => clearTimeout(timer);
  }, [site, theme, categories, projects]);

  // Update handlers
  const handleUpdateSite = (key: keyof SiteSettings, value: string) => {
    setSite((prev) => {
      const updated = { ...prev, [key]: value };
      saveToFirestore({ site: updated, theme, categories, projects });
      return updated;
    });
  };

  const handleUpdateTheme = (key: keyof ThemeSettings, value: string) => {
    setTheme((prev) => {
      const updated = { ...prev, [key]: value };
      saveToFirestore({ site, theme: updated, categories, projects });
      return updated;
    });
  };

  const handleUpdateCategory = (catId: string, field: keyof Category, value: string) => {
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === catId ? { ...c, [field]: value } : c));
      saveToFirestore({ site, theme, categories: updated, projects });
      return updated;
    });
    if (activeCategory && activeCategory.id === catId) {
      setActiveCategory((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const handleUpdateCategoryColor = (catId: string, color: string) => {
    handleUpdateCategory(catId, "color", color);
  };

  const handleUpdateProject = (projId: string, field: keyof Project, value: any) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === projId ? { ...p, [field]: value } : p));
      saveToFirestore({ site, theme, categories, projects: updated });
      return updated;
    });
    if (selectedProject && selectedProject.id === projId) {
      setSelectedProject((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => {
      const updated = [...prev, newCat];
      saveToFirestore({ site, theme, categories: updated, projects });
      return updated;
    });
    setFocusedIndex(categories.length); // focus newly created section
    setActiveCategory(newCat); // Open the new section's dedicated page immediately
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catId);
      saveToFirestore({ site, theme, categories: updated, projects });
      return updated;
    });
    setFocusedIndex(0);
    if (activeCategory && activeCategory.id === catId) {
      setActiveCategory(null);
    }
  };

  const handleAddProject = (newProj: Project) => {
    setProjects((prev) => {
      const updated = [newProj, ...prev];
      saveToFirestore({ site, theme, categories, projects: updated });
      return updated;
    });
  };

  const handleDeleteProject = (projId: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== projId);
      saveToFirestore({ site, theme, categories, projects: updated });
      return updated;
    });
    if (selectedProject && selectedProject.id === projId) {
      setSelectedProject(null);
    }
  };

  const handleResetColors = () => {
    setTheme(DEFAULT_THEME);
    saveToFirestore({ site, theme: DEFAULT_THEME, categories, projects });
  };

  // Export standalone portfolio config
  const handleExportSite = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ site, theme, categories, projects }, null, 2)
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `portfolio_archive_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 relative selection:bg-[var(--accent-web)] selection:text-white">
      {/* Background Subtle Grain Effect */}
      <div className="grain" />

      {/* Header Masthead */}
      <Header
        site={site}
        onUpdateSite={handleUpdateSite}
        sectionCount={categories.length}
        isEditorActive={isEditorActive}
        onOpenLogin={() => setIsEditorActive(!isEditorActive ? setLoginModalOpen(true) : setIsEditorActive(false))}
        onOpenAddCategory={() => setAddCategoryModalOpen(true)}
        onOpenAddProject={() => setAddProjectModalOpen(true)}
        onGoHome={() => {
          setActiveCategory(null);
          setSelectedProject(null);
        }}
      />

      {/* Main Content Stage */}
      <main className="relative z-10 pb-20">
        {!activeCategory ? (
          <FocusWheel
            categories={categories}
            site={site}
            focusedIndex={focusedIndex}
            onSetFocusedIndex={setFocusedIndex}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            isEditorActive={isEditorActive}
            onUpdateCategory={handleUpdateCategory}
            onUpdateSite={handleUpdateSite}
            onDeleteCategory={handleDeleteCategory}
          />
        ) : (
          <CategoryView
            category={activeCategory}
            categoryIndex={categories.findIndex((c) => c.id === activeCategory.id)}
            totalCategories={categories.length}
            projects={projects}
            onBackToWheel={() => setActiveCategory(null)}
            onSelectProject={(proj) => setSelectedProject(proj)}
            isEditorActive={isEditorActive}
            onUpdateCategory={handleUpdateCategory}
            onUpdateProject={handleUpdateProject}
            onAddProject={() => setAddProjectModalOpen(true)}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </main>

      {/* Project Detail Overlay Modal */}
      <ProjectOverlayModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        isEditorActive={isEditorActive}
        onUpdateProject={handleUpdateProject}
        categoryName={activeCategory?.label || categories.find((c) => c.id === selectedProject?.category)?.label}
        categoryColor={activeCategory?.color || categories.find((c) => c.id === selectedProject?.category)?.color}
      />

      {/* Login Modal */}
      <EditorLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsEditorActive(true);
          setLoginModalOpen(false);
        }}
      />

      {/* Color Customizer Modal */}
      <ColorCustomizerModal
        isOpen={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        theme={theme}
        categories={categories}
        onUpdateTheme={handleUpdateTheme}
        onUpdateCategoryColor={handleUpdateCategoryColor}
        onResetColors={handleResetColors}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={addCategoryModalOpen}
        onClose={() => setAddCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={addProjectModalOpen}
        onClose={() => setAddProjectModalOpen(false)}
        categories={categories}
        activeCategoryId={activeCategory?.id}
        onAddProject={handleAddProject}
      />

      {/* Editor Floating Toolbar */}
      <EditorToolbar
        isEditorActive={isEditorActive}
        onOpenColorModal={() => setColorModalOpen(true)}
        onOpenAddProject={() => setAddProjectModalOpen(true)}
        onOpenAddCategory={() => setAddCategoryModalOpen(true)}
        onExportSite={handleExportSite}
        onExitEditor={() => setIsEditorActive(false)}
      />
    </div>
  );
}
