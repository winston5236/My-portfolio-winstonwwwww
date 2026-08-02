import { doc, onSnapshot, setDoc } from "firebase/firestore";
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

let isQuotaExceeded = false;

export function getQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  const localData = loadPortfolioState();

  return onSnapshot(
    PORTFOLIO_DOC,
    async (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.data();
        const firestoreProjects = val.projects && Array.isArray(val.projects) && val.projects.length ? val.projects : DEFAULT_PROJECTS;
        const currentLocal = loadPortfolioState();

        // If local storage has more projects than Firestore (e.g. freshly added locally before sync), prioritize local and write to Firestore
        const useLocalProjects = currentLocal.projects.length > firestoreProjects.length;

        const data: PortfolioData = {
          site: { ...DEFAULT_SITE, ...(val.site || {}) },
          theme: { ...DEFAULT_THEME, ...(val.theme || {}) },
          categories: val.categories && Array.isArray(val.categories) && val.categories.length ? val.categories : DEFAULT_CATEGORIES,
          projects: useLocalProjects ? currentLocal.projects : firestoreProjects
        };

        if (useLocalProjects) {
          saveToFirestore(data);
        } else {
          savePortfolioState(data);
        }
        onData(data);
      } else {
        // First time initialization in Firestore using local data fallback if available
        const currentLocal = loadPortfolioState();
        const initial: PortfolioData = {
          site: currentLocal.site || DEFAULT_SITE,
          theme: currentLocal.theme || DEFAULT_THEME,
          categories: currentLocal.categories?.length ? currentLocal.categories : DEFAULT_CATEGORIES,
          projects: currentLocal.projects?.length ? currentLocal.projects : DEFAULT_PROJECTS
        };
        try {
          await setDoc(PORTFOLIO_DOC, {
            ...initial,
            updatedAt: new Date().toISOString()
          });
        } catch (err: any) {
          if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
            isQuotaExceeded = true;
          }
          console.warn("Could not seed initial portfolio to Firestore (using local storage):", err);
        }
        onData(initial);
      }
    },
    (error: any) => {
      console.warn("Firestore snapshot notice (using local storage fallback):", error);
      if (error?.code === "resource-exhausted" || error?.message?.includes("Quota limit exceeded")) {
        isQuotaExceeded = true;
      }
      // Offline / Quota Fallback: Load local storage state
      const fallbackLocal = loadPortfolioState();
      onData(fallbackLocal);
    }
  );
}

// Debounced save to prevent write quota exhaustion
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSaveData: PortfolioData | null = null;

export async function saveToFirestore(data: PortfolioData) {
  // Always save locally immediately for zero latency & offline persistence
  savePortfolioState(data);
  pendingSaveData = data;

  if (isQuotaExceeded) {
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    if (!pendingSaveData) return;
    const toSave = pendingSaveData;
    pendingSaveData = null;

    try {
      await setDoc(
        PORTFOLIO_DOC,
        {
          site: toSave.site,
          theme: toSave.theme,
          categories: toSave.categories,
          projects: toSave.projects,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err: any) {
      if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
        isQuotaExceeded = true;
        console.warn("Firestore Quota Limit Exceeded for today. Operating smoothly in local storage mode.");
      } else {
        console.error("Error saving portfolio to Firestore:", err);
      }
    }
  }, 1000);
}

