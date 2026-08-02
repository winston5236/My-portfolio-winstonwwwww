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

export type SyncStatus = "synced" | "unsynced" | "saving" | "quota_exceeded" | "offline";

const PORTFOLIO_DOC = doc(db, "portfolio", "main");

let isQuotaExceeded = false;
let statusListeners: Set<(status: SyncStatus) => void> = new Set();
let currentStatus: SyncStatus = "synced";

function setStatus(status: SyncStatus) {
  currentStatus = status;
  statusListeners.forEach((fn) => fn(status));
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  statusListeners.add(listener);
  listener(currentStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  let unsubMain = () => {};

  try {
    unsubMain = onSnapshot(
      PORTFOLIO_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.data();

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

          // Save received cloud data into local storage
          savePortfolioState({ ...newData, updatedAt: Date.now() });
          onData(newData);
          if (!isQuotaExceeded && currentStatus !== "unsynced") {
            setStatus("synced");
          }
        } else {
          const localState = loadPortfolioState();
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
          setStatus("quota_exceeded");
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
      setStatus("quota_exceeded");
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

/**
 * Saves to LocalStorage immediately so local browser edits are preserved instantly on refresh,
 * WITHOUT making auto-writes to Firestore.
 */
export function saveLocalState(data: PortfolioData) {
  savePortfolioState({ ...data, updatedAt: Date.now() });
  if (!isQuotaExceeded) {
    setStatus("unsynced");
  } else {
    setStatus("quota_exceeded");
  }
}

// Deprecated alias for backwards compatibility
export function saveToFirestore(data: PortfolioData) {
  saveLocalState(data);
}

/**
 * Explicitly pushes current portfolio data to Firestore when user clicks "Sync to Cloud Now".
 */
export async function syncToCloudNow(data: PortfolioData): Promise<boolean> {
  const now = Date.now();
  savePortfolioState({ ...data, updatedAt: now });

  if (isQuotaExceeded) {
    setStatus("quota_exceeded");
    return false;
  }

  setStatus("saving");
  try {
    await setDoc(
      PORTFOLIO_DOC,
      {
        site: data.site,
        theme: data.theme,
        categories: data.categories,
        projects: data.projects,
        updatedAtMs: now,
        updatedAt: new Date(now).toISOString(),
      },
      { merge: true }
    );
    setStatus("synced");
    return true;
  } catch (err: any) {
    if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
      isQuotaExceeded = true;
      setStatus("quota_exceeded");
    } else {
      console.warn("Manual sync error:", err);
    }
    return false;
  }
}
