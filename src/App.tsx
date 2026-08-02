import React, { useState, useEffect, useRef } from "react";
import { Category, Project, SiteSettings, ThemeSettings } from "./types";
import { loadPortfolioState, DEFAULT_THEME } from "./defaultData";
import { subscribeToPortfolio, saveToFirestore, subscribeSyncStatus, SyncStatus } from "./firestoreSync";

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

  const stateRef = useRef({ site, theme, categories, projects });
  stateRef.current = { site, theme, categories, projects };

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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  // Subscribe to real-time cloud sync status
  useEffect(() => {
    const unsub = subscribeSyncStatus((st) => setSyncStatus(st));
    return () => unsub();
  }, []);

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

  // Subscribe to real-time Firestore database updates
  useEffect(() => {
    const unsubscribe = subscribeToPortfolio((remoteData) => {
      setSite(remoteData.site);
      setTheme(remoteData.theme);
      setCategories(remoteData.categories);
      setProjects(remoteData.projects);
    });
    return () => unsubscribe();
  }, []);

  // Update handlers with immediate persistence
  const handleUpdateSite = (key: keyof SiteSettings, value: string) => {
    const nextSite = { ...site, [key]: value };
    setSite(nextSite);
    saveToFirestore({ ...stateRef.current, site: nextSite });
  };

  const handleUpdateTheme = (key: keyof ThemeSettings, value: string) => {
    const nextTheme = { ...theme, [key]: value };
    setTheme(nextTheme);
    saveToFirestore({ ...stateRef.current, theme: nextTheme });
  };

  const handleUpdateCategory = (catId: string, field: keyof Category, value: string) => {
    const nextCats = categories.map((c) => (c.id === catId ? { ...c, [field]: value } : c));
    setCategories(nextCats);
    saveToFirestore({ ...stateRef.current, categories: nextCats });
    if (activeCategory && activeCategory.id === catId) {
      setActiveCategory((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const handleUpdateCategoryColor = (catId: string, color: string) => {
    handleUpdateCategory(catId, "color", color);
  };

  const handleUpdateProject = (projId: string, field: keyof Project, value: any) => {
    const nextProjects = projects.map((p) => (p.id === projId ? { ...p, [field]: value } : p));
    setProjects(nextProjects);
    saveToFirestore({ ...stateRef.current, projects: nextProjects });
    if (selectedProject && selectedProject.id === projId) {
      setSelectedProject((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const handleAddCategory = (newCat: Category) => {
    const nextCats = [...categories, newCat];
    setCategories(nextCats);
    saveToFirestore({ ...stateRef.current, categories: nextCats });
    setFocusedIndex(categories.length); // focus newly created section
    setActiveCategory(newCat); // Open the new section's dedicated page immediately
  };

  const handleDeleteCategory = (catId: string) => {
    const nextCats = categories.filter((c) => c.id !== catId);
    setCategories(nextCats);
    saveToFirestore({ ...stateRef.current, categories: nextCats });
    setFocusedIndex(0);
    if (activeCategory && activeCategory.id === catId) {
      setActiveCategory(null);
    }
  };

  const handleAddProject = (newProj: Project) => {
    const nextProjects = [newProj, ...projects];
    setProjects(nextProjects);
    saveToFirestore({ ...stateRef.current, projects: nextProjects });
  };

  const handleDeleteProject = (projId: string) => {
    const nextProjects = projects.filter((p) => p.id !== projId);
    setProjects(nextProjects);
    saveToFirestore({ ...stateRef.current, projects: nextProjects });
    if (selectedProject && selectedProject.id === projId) {
      setSelectedProject(null);
    }
  };

  const handleClearAllProjects = () => {
    if (window.confirm("Are you sure you want to clear all projects? This will leave your portfolio clean so you can manually add your own projects.")) {
      setProjects([]);
      saveToFirestore({ ...stateRef.current, projects: [] });
      setSelectedProject(null);
    }
  };

  const handleResetColors = () => {
    setTheme(DEFAULT_THEME);
    saveToFirestore({ ...stateRef.current, theme: DEFAULT_THEME });
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

  // Import JSON portfolio config
  const handleImportSite = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.site && data.categories && data.projects) {
        setSite(data.site);
        if (data.theme) setTheme(data.theme);
        setCategories(data.categories);
        setProjects(data.projects);
        saveToFirestore({
          site: data.site,
          theme: data.theme || DEFAULT_THEME,
          categories: data.categories,
          projects: data.projects
        });
        alert("Portfolio configuration imported successfully!");
      } else {
        alert("Invalid portfolio JSON format. Missing required fields.");
      }
    } catch (err) {
      alert("Error reading JSON file. Please ensure it is a valid JSON export.");
    }
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
        isCompact={!!activeCategory}
        onOpenLogin={() => {
          if (!isEditorActive) {
            setLoginModalOpen(true);
          } else {
            setIsEditorActive(false);
          }
        }}
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
            projects={projects}
            focusedIndex={focusedIndex}
            onSetFocusedIndex={setFocusedIndex}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            onSelectProject={(proj) => setSelectedProject(proj)}
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
        project={selectedProject ? (projects.find((p) => p.id === selectedProject.id) || selectedProject) : null}
        onClose={() => setSelectedProject(null)}
        isEditorActive={isEditorActive}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        categoryName={activeCategory?.label || categories.find((c) => c.id === (selectedProject ? (projects.find((p) => p.id === selectedProject.id)?.category || selectedProject.category) : undefined))?.label}
        categoryColor={activeCategory?.color || categories.find((c) => c.id === (selectedProject ? (projects.find((p) => p.id === selectedProject.id)?.category || selectedProject.category) : undefined))?.color}
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
        syncStatus={syncStatus}
        onOpenColorModal={() => setColorModalOpen(true)}
        onOpenAddProject={() => setAddProjectModalOpen(true)}
        onOpenAddCategory={() => setAddCategoryModalOpen(true)}
        onClearAllProjects={handleClearAllProjects}
        onExportSite={handleExportSite}
        onImportSite={handleImportSite}
        onExitEditor={() => setIsEditorActive(false)}
      />
    </div>
  );
}
