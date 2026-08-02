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
let pendingSaveData: PortfolioData | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function getQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  const localState = loadPortfolioState();

  let unsubMain = () => {};

  try {
    unsubMain = onSnapshot(
      PORTFOLIO_DOC,
      (snapshot) => {
        const currentLocal = loadPortfolioState();
        const localTime = currentLocal.updatedAt || 0;

        if (snapshot.exists()) {
          const val = snapshot.data();
          const remoteTime = typeof val.updatedAtMs === "number"
            ? val.updatedAtMs
            : (val.updatedAt ? new Date(val.updatedAt).getTime() : 0);

          // If local data is newer or updated recently, preserve local data
          if (localTime > remoteTime) {
            onData({
              site: currentLocal.site,
              theme: currentLocal.theme,
              categories: currentLocal.categories,
              projects: currentLocal.projects,
            });
            return;
          }

          // Remote data is newer or equal: adopt remote
          const remoteSite = { ...DEFAULT_SITE, ...(val.site || {}) };
          const remoteTheme = { ...DEFAULT_THEME, ...(val.theme || {}) };
          const remoteCategories = Array.isArray(val.categories) && val.categories.length ? val.categories : DEFAULT_CATEGORIES;
          const remoteProjects = Array.isArray(val.projects) ? val.projects : DEFAULT_PROJECTS;

          const newData: PortfolioData = {
            site: remoteSite,
            theme: remoteTheme,
            categories: remoteCategories,
            projects: remoteProjects,
          };

          savePortfolioState({ ...newData, updatedAt: remoteTime || Date.now() });
          onData(newData);
        } else {
          // Initialize remote doc with local data if doc doesn't exist
          onData({
            site: localState.site,
            theme: localState.theme,
            categories: localState.categories,
            projects: localState.projects,
          });
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
          isQuotaExceeded = true;
        } else {
          console.warn("Firestore snapshot notice:", err?.message || err);
        }
        const fallback = loadPortfolioState();
        onData({
          site: fallback.site,
          theme: fallback.theme,
          categories: fallback.categories,
          projects: fallback.projects,
        });
      }
    );
  } catch (err: any) {
    if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
      isQuotaExceeded = true;
    }
    const fallback = loadPortfolioState();
    onData({
      site: fallback.site,
      theme: fallback.theme,
      categories: fallback.categories,
      projects: fallback.projects,
    });
  }

  return () => {
    unsubMain();
  };
}

export async function saveToFirestore(data: PortfolioData) {
  const now = Date.now();

  // 1. ALWAYS save to LocalStorage immediately for instant persistence across refreshes
  savePortfolioState({ ...data, updatedAt: now });

  if (isQuotaExceeded) {
    return;
  }

  pendingSaveData = data;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    if (!pendingSaveData) return;
    const toSave = pendingSaveData;

    try {
      await setDoc(
        PORTFOLIO_DOC,
        {
          site: toSave.site,
          theme: toSave.theme,
          categories: toSave.categories,
          projects: toSave.projects,
          updatedAtMs: now,
          updatedAt: new Date(now).toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
        isQuotaExceeded = true;
      } else {
        console.warn("Firestore save notice:", err?.message || err);
      }
    } finally {
      pendingSaveData = null;
    }
  }, 150);
}
