import { doc, onSnapshot, setDoc, collection, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Category, Project, SiteSettings, ThemeSettings } from "./types";
import { DEFAULT_SITE, DEFAULT_THEME, DEFAULT_CATEGORIES, DEFAULT_PROJECTS, savePortfolioState, loadPortfolioState } from "./defaultData";

export interface PortfolioData {
  site: SiteSettings;
  theme: ThemeSettings;
  categories: Category[];
  projects: Project[];
}

const PORTFOLIO_DOC = doc(db, "portfolio", "main");
const PROJECTS_COLL = collection(db, "portfolio_projects");

let isQuotaExceeded = false;
let knownProjectIds = new Set<string>();

export function getQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  let currentSite = DEFAULT_SITE;
  let currentTheme = DEFAULT_THEME;
  let currentCategories = DEFAULT_CATEGORIES;
  let currentProjectOrder: string[] = [];
  let projectsMap = new Map<string, Project>();
  let isMainLoaded = false;
  let isProjectsLoaded = false;

  function notify() {
    if (!isMainLoaded || !isProjectsLoaded) return;

    // Order projects according to currentProjectOrder, fallback to remaining map items
    const orderedProjects: Project[] = [];
    const seen = new Set<string>();

    for (const id of currentProjectOrder) {
      if (projectsMap.has(id)) {
        orderedProjects.push(projectsMap.get(id)!);
        seen.add(id);
      }
    }

    for (const [id, proj] of projectsMap.entries()) {
      if (!seen.has(id)) {
        orderedProjects.push(proj);
      }
    }

    const finalProjects = orderedProjects.length > 0 ? orderedProjects : DEFAULT_PROJECTS;
    knownProjectIds = new Set(finalProjects.map((p) => p.id));

    const portfolioData: PortfolioData = {
      site: currentSite,
      theme: currentTheme,
      categories: currentCategories,
      projects: finalProjects,
    };

    savePortfolioState(portfolioData);
    onData(portfolioData);
  }

  // 1. Listen to main config (site, theme, categories, project list)
  const unsubMain = onSnapshot(
    PORTFOLIO_DOC,
    async (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.data();
        currentSite = { ...DEFAULT_SITE, ...(val.site || {}) };
        currentTheme = { ...DEFAULT_THEME, ...(val.theme || {}) };
        currentCategories =
          val.categories && Array.isArray(val.categories) && val.categories.length
            ? val.categories
            : DEFAULT_CATEGORIES;

        if (Array.isArray(val.projectIds)) {
          currentProjectOrder = val.projectIds;
        }

        // Migration check: if main doc has legacy projects array and projectsMap is empty
        if (Array.isArray(val.projects) && val.projects.length > 0 && projectsMap.size === 0) {
          for (const proj of val.projects) {
            projectsMap.set(proj.id, proj);
            // Save to individual project doc
            setDoc(doc(db, "portfolio_projects", proj.id), proj, { merge: true }).catch(console.warn);
          }
        }
      } else {
        // Seed default config
        const local = loadPortfolioState();
        currentSite = local.site || DEFAULT_SITE;
        currentTheme = local.theme || DEFAULT_THEME;
        currentCategories = local.categories?.length ? local.categories : DEFAULT_CATEGORIES;

        try {
          await setDoc(PORTFOLIO_DOC, {
            site: currentSite,
            theme: currentTheme,
            categories: currentCategories,
            projectIds: (local.projects || DEFAULT_PROJECTS).map((p) => p.id),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Error initializing portfolio main doc:", err);
        }
      }
      isMainLoaded = true;
      notify();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, "portfolio/main");
      isMainLoaded = true;
      notify();
    }
  );

  // 2. Listen to projects collection for real-time individual project updates
  const unsubProjects = onSnapshot(
    PROJECTS_COLL,
    (snapshot) => {
      const newMap = new Map<string, Project>();
      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          const proj = docSnap.data() as Project;
          if (proj && proj.id) {
            newMap.set(proj.id, proj);
          }
        }
      });

      // If Firestore has project documents, use them
      if (newMap.size > 0) {
        projectsMap = newMap;
        knownProjectIds = new Set(newMap.keys());
      } else if (isMainLoaded && currentProjectOrder !== null) {
        // Main document exists and specifies project order (even if empty [])
        projectsMap = newMap;
        knownProjectIds = new Set();
      } else {
        // Fallback to local saved state if initial setup
        const local = loadPortfolioState();
        const fallbackProjs = local.projects !== undefined ? local.projects : DEFAULT_PROJECTS;
        projectsMap = new Map();
        for (const p of fallbackProjs) {
          projectsMap.set(p.id, p);
        }
        knownProjectIds = new Set(projectsMap.keys());
      }

      isProjectsLoaded = true;
      notify();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, "portfolio_projects");
      isProjectsLoaded = true;
      notify();
    }
  );

  return () => {
    unsubMain();
    unsubProjects();
  };
}

// Debounced save for Firestore
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSaveData: PortfolioData | null = null;

export async function saveToFirestore(data: PortfolioData) {
  // Always save locally immediately for zero latency & offline persistence
  savePortfolioState(data);
  pendingSaveData = data;

  if (isQuotaExceeded) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    if (!pendingSaveData) return;
    const toSave = pendingSaveData;
    pendingSaveData = null;

    try {
      // 1. Save main config (site, theme, categories, projectIds order)
      await setDoc(
        PORTFOLIO_DOC,
        {
          site: toSave.site,
          theme: toSave.theme,
          categories: toSave.categories,
          projectIds: toSave.projects.map((p) => p.id),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Save each project into its own individual document
      const currentIds = new Set<string>();
      for (const proj of toSave.projects) {
        currentIds.add(proj.id);
        await setDoc(doc(db, "portfolio_projects", proj.id), proj, { merge: true });
      }

      // 3. Delete any projects removed locally
      for (const oldId of knownProjectIds) {
        if (!currentIds.has(oldId)) {
          deleteDoc(doc(db, "portfolio_projects", oldId)).catch(console.warn);
        }
      }
      knownProjectIds = currentIds;
    } catch (err: any) {
      if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
        isQuotaExceeded = true;
        console.warn("Firestore Quota Limit Exceeded for today. Operating smoothly in local storage mode.");
      } else {
        handleFirestoreError(err, OperationType.WRITE, "portfolio_projects");
      }
    }
  }, 800);
}


