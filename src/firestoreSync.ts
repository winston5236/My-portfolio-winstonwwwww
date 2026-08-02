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
const QUOTA_KEY = "portfolio_quota_exceeded_timestamp";

let isQuotaExceeded = false;
let pendingSaveData: PortfolioData | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function getQuotaExceeded(): boolean {
  return isQuotaExceeded || checkQuotaExceeded();
}

function checkQuotaExceeded(): boolean {
  try {
    const timestampStr = localStorage.getItem(QUOTA_KEY);
    if (timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      // Spark free tier quota resets daily (~12 hours fallback)
      if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
        return true;
      } else {
        localStorage.removeItem(QUOTA_KEY);
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

function markQuotaExceeded() {
  isQuotaExceeded = true;
  try {
    localStorage.setItem(QUOTA_KEY, Date.now().toString());
  } catch (e) {}
  console.warn("Firestore daily write quota reached. App is operating seamlessly with Local Storage persistence.");
}

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  isQuotaExceeded = checkQuotaExceeded();

  const localState = loadPortfolioState();

  if (isQuotaExceeded) {
    onData({
      site: localState.site,
      theme: localState.theme,
      categories: localState.categories,
      projects: localState.projects,
    });
    return () => {};
  }

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

          // If local data is newer than remote snapshot, preserve local data!
          if (localTime > remoteTime + 1000) {
            onData({
              site: currentLocal.site,
              theme: currentLocal.theme,
              categories: currentLocal.categories,
              projects: currentLocal.projects,
            });
            // Try pushing local changes to Firestore
            saveToFirestore({
              site: currentLocal.site,
              theme: currentLocal.theme,
              categories: currentLocal.categories,
              projects: currentLocal.projects,
            });
            return;
          }

          // Remote data is equal or newer: adopt remote
          const remoteSite = { ...DEFAULT_SITE, ...(val.site || {}) };
          const remoteTheme = { ...DEFAULT_THEME, ...(val.theme || {}) };
          const remoteCategories = Array.isArray(val.categories) && val.categories.length ? val.categories : DEFAULT_CATEGORIES;
          const remoteProjects = Array.isArray(val.projects) ? val.projects : (currentLocal.projects || DEFAULT_PROJECTS);

          const newData: PortfolioData = {
            site: remoteSite,
            theme: remoteTheme,
            categories: remoteCategories,
            projects: remoteProjects,
          };

          savePortfolioState({ ...newData, updatedAt: remoteTime || Date.now() });
          onData(newData);
        } else {
          // New doc: write localState to Firestore
          saveToFirestore({
            site: localState.site,
            theme: localState.theme,
            categories: localState.categories,
            projects: localState.projects,
          });
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
          markQuotaExceeded();
        } else {
          console.warn("Firestore snapshot notice:", err?.message || err);
        }
        onData({
          site: localState.site,
          theme: localState.theme,
          categories: localState.categories,
          projects: localState.projects,
        });
      }
    );
  } catch (err: any) {
    if (err?.code === "resource-exhausted" || err?.message?.includes("Quota limit exceeded")) {
      markQuotaExceeded();
    }
    onData({
      site: localState.site,
      theme: localState.theme,
      categories: localState.categories,
      projects: localState.projects,
    });
  }

  return () => {
    unsubMain();
  };
}

export async function saveToFirestore(data: PortfolioData) {
  const now = Date.now();

  // 1. Immediately save to LocalStorage with timestamp for zero latency & refresh persistence
  savePortfolioState({ ...data, updatedAt: now });

  if (isQuotaExceeded || checkQuotaExceeded()) {
    isQuotaExceeded = true;
    return;
  }

  pendingSaveData = data;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    if (!pendingSaveData) return;
    const toSave = pendingSaveData;

    try {
      // 1 single atomic write to PORTFOLIO_DOC
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
        markQuotaExceeded();
      } else {
        console.warn("Firestore save notice:", err?.message || err);
      }
    } finally {
      pendingSaveData = null;
    }
  }, 200);
}
