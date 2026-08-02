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

export type SyncStatus = "synced" | "saving" | "quota_exceeded" | "offline";

const PORTFOLIO_DOC = doc(db, "portfolio", "main");

let isQuotaExceeded = false;
let pendingSaveData: PortfolioData | null = null;
let pendingTimestamp: number | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
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

// Flush pending save immediately (e.g. before page unload/refresh)
async function flushPendingSave() {
  if (isQuotaExceeded || !pendingSaveData || !pendingTimestamp) return;
  const toSave = pendingSaveData;
  const ts = pendingTimestamp;
  pendingSaveData = null;
  pendingTimestamp = null;
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  try {
    await setDoc(
      PORTFOLIO_DOC,
      {
        site: toSave.site,
        theme: toSave.theme,
        categories: toSave.categories,
        projects: toSave.projects,
        updatedAtMs: ts,
        updatedAt: new Date(ts).toISOString(),
      },
      { merge: true }
    );
    setStatus("synced");
  } catch (err: any) {
    if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded") || err?.toString()?.includes("Quota limit exceeded")) {
      isQuotaExceeded = true;
      setStatus("quota_exceeded");
    } else {
      console.warn("Firestore flush notice:", err?.message || err);
      setStatus("synced");
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    flushPendingSave();
  });
}

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  let unsubMain = () => {};

  try {
    unsubMain = onSnapshot(
      PORTFOLIO_DOC,
      (snapshot) => {
        const localState = loadPortfolioState();
        const localUpdatedAtMs = localState.updatedAt || 0;

        if (snapshot.exists()) {
          const val = snapshot.data();
          const remoteUpdatedAtMs = val.updatedAtMs || 0;

          const remoteSite = { ...DEFAULT_SITE, ...(val.site || {}) };
          const remoteTheme = { ...DEFAULT_THEME, ...(val.theme || {}) };
          const remoteCategories = Array.isArray(val.categories) && val.categories.length ? val.categories : DEFAULT_CATEGORIES;
          const remoteProjects = Array.isArray(val.projects) ? val.projects : DEFAULT_PROJECTS;

          const remoteData: PortfolioData = {
            site: remoteSite,
            theme: remoteTheme,
            categories: remoteCategories,
            projects: remoteProjects,
          };

          // Smart Conflict Resolution:
          // If local storage has NEWER edits than remote document (and quota is NOT exceeded), preserve local edits
          if (localUpdatedAtMs > remoteUpdatedAtMs + 500) {
            onData({
              site: localState.site,
              theme: localState.theme,
              categories: localState.categories,
              projects: localState.projects,
            });
            if (!isQuotaExceeded) {
              saveToFirestore({
                site: localState.site,
                theme: localState.theme,
                categories: localState.categories,
                projects: localState.projects,
              });
            }
          } else {
            // Remote is newer or equal: accept remote data and save to LocalStorage
            savePortfolioState({ ...remoteData, updatedAt: remoteUpdatedAtMs || Date.now() });
            onData(remoteData);
            if (!isQuotaExceeded) {
              setStatus("synced");
            }
          }
        } else {
          // Document doesn't exist yet in Firestore: load local state
          onData({
            site: localState.site,
            theme: localState.theme,
            categories: localState.categories,
            projects: localState.projects,
          });
          if (!isQuotaExceeded) {
            saveToFirestore({
              site: localState.site,
              theme: localState.theme,
              categories: localState.categories,
              projects: localState.projects,
            });
          }
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded") || err?.toString()?.includes("Quota limit exceeded")) {
          isQuotaExceeded = true;
          setStatus("quota_exceeded");
        } else {
          console.warn("Firestore snapshot notice:", err?.message || err);
          if (!isQuotaExceeded) setStatus("synced");
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
    if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded") || err?.toString()?.includes("Quota limit exceeded")) {
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
 * Automatically saves to LocalStorage instantly and debounces auto-sync to Firestore (400ms).
 */
export function saveToFirestore(data: PortfolioData) {
  const now = Date.now();

  // 1. ALWAYS save to LocalStorage immediately for zero latency local persistence
  savePortfolioState({ ...data, updatedAt: now });

  if (isQuotaExceeded) {
    setStatus("quota_exceeded");
    return;
  }

  pendingSaveData = data;
  pendingTimestamp = now;
  setStatus("saving");

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    if (!pendingSaveData || isQuotaExceeded) return;
    const toSave = pendingSaveData;
    const ts = pendingTimestamp || Date.now();
    pendingSaveData = null;
    pendingTimestamp = null;

    try {
      await setDoc(
        PORTFOLIO_DOC,
        {
          site: toSave.site,
          theme: toSave.theme,
          categories: toSave.categories,
          projects: toSave.projects,
          updatedAtMs: ts,
          updatedAt: new Date(ts).toISOString(),
        },
        { merge: true }
      );
      setStatus("synced");
    } catch (err: any) {
      if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded") || err?.toString()?.includes("Quota limit exceeded")) {
        isQuotaExceeded = true;
        setStatus("quota_exceeded");
      } else {
        console.warn("Firestore save notice:", err?.message || err);
        setStatus("synced");
      }
    }
  }, 400);
}

export function saveLocalState(data: PortfolioData) {
  saveToFirestore(data);
}
