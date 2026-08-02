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

let lastLocalWriteTime = 0;
let pendingSaveData: PortfolioData | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

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
  let currentProjectOrder: string[] | null = null;
  let projectsMap = new Map<string, Project>();
  let isMainLoaded = false;
  let isProjectsLoaded = false;

  function notify() {
    if (!isMainLoaded || !isProjectsLoaded) return;

    // Do NOT trigger notify while a local save is pending or within 1.5s of a local write
    // to prevent race conditions where stale snapshot data overwrites local updates!
    if (pendingSaveData !== null || Date.now() - lastLocalWriteTime < 1500) {
      return;
    }

    // Build ordered projects based strictly on currentProjectOrder
    const orderedProjects: Project[] = [];

    if (currentProjectOrder !== null && Array.isArray(currentProjectOrder)) {
      for (const id of currentProjectOrder) {
        if (projectsMap.has(id)) {
          orderedProjects.push(projectsMap.get(id)!);
        }
      }
    } else {
      // If project order was never initialized, use all map values
      for (const proj of projectsMap.values()) {
        orderedProjects.push(proj);
      }
    }

    // Once main document is loaded, currentProjectOrder (even if empty []) is authoritative!
    let finalProjects: Project[];
    if (isMainLoaded && currentProjectOrder !== null) {
      finalProjects = orderedProjects;
    } else if (projectsMap.size > 0) {
      finalProjects = Array.from(projectsMap.values());
    } else {
      const local = loadPortfolioState();
      finalProjects = local.projects !== undefined ? local.projects : DEFAULT_PROJECTS;
    }

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
        if (Array.isArray(val.projects) && val.projects.length > 0 && projectsMap.size === 0 && currentProjectOrder === null) {
          currentProjectOrder = val.projects.map((p: Project) => p.id);
          for (const proj of val.projects) {
            projectsMap.set(proj.id, proj);
            setDoc(doc(db, "portfolio_projects", proj.id), proj).catch(console.warn);
          }
        }
      } else {
        // Seed default config if brand new Firestore document
        const local = loadPortfolioState();
        currentSite = local.site || DEFAULT_SITE;
        currentTheme = local.theme || DEFAULT_THEME;
        currentCategories = local.categories?.length ? local.categories : DEFAULT_CATEGORIES;
        const initialProjs = local.projects !== undefined ? local.projects : DEFAULT_PROJECTS;
        currentProjectOrder = initialProjs.map((p) => p.id);

        try {
          await setDoc(PORTFOLIO_DOC, {
            site: currentSite,
            theme: currentTheme,
            categories: currentCategories,
            projectIds: currentProjectOrder,
            updatedAt: new Date().toISOString(),
          });
          for (const p of initialProjs) {
            await setDoc(doc(db, "portfolio_projects", p.id), p).catch(console.warn);
          }
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

      projectsMap = newMap;
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

export async function saveToFirestore(data: PortfolioData) {
  lastLocalWriteTime = Date.now();
  // Save locally immediately for zero latency & offline persistence
  savePortfolioState(data);
  pendingSaveData = data;

  if (isQuotaExceeded) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    if (!pendingSaveData) return;
    const toSave = pendingSaveData;

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
        await setDoc(doc(db, "portfolio_projects", proj.id), proj);
      }

      // 3. Delete any projects removed locally
      for (const oldId of knownProjectIds) {
        if (!currentIds.has(oldId)) {
          await deleteDoc(doc(db, "portfolio_projects", oldId)).catch(console.warn);
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
    } finally {
      pendingSaveData = null;
    }
  }, 200);
}
