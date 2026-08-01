import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Category, Project, SiteSettings, ThemeSettings } from "./types";
import { DEFAULT_SITE, DEFAULT_THEME, DEFAULT_CATEGORIES, DEFAULT_PROJECTS, savePortfolioState } from "./defaultData";

export interface PortfolioData {
  site: SiteSettings;
  theme: ThemeSettings;
  categories: Category[];
  projects: Project[];
}

const PORTFOLIO_DOC = doc(db, "portfolio", "main");

export function subscribeToPortfolio(onData: (data: PortfolioData) => void) {
  return onSnapshot(PORTFOLIO_DOC, async (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.data();
      const data: PortfolioData = {
        site: { ...DEFAULT_SITE, ...(val.site || {}) },
        theme: { ...DEFAULT_THEME, ...(val.theme || {}) },
        categories: val.categories && Array.isArray(val.categories) && val.categories.length ? val.categories : DEFAULT_CATEGORIES,
        projects: val.projects && Array.isArray(val.projects) && val.projects.length ? val.projects : DEFAULT_PROJECTS
      };
      savePortfolioState(data); // Also mirror to localStorage as offline fallback
      onData(data);
    } else {
      // First time initialization in Firestore
      const initial: PortfolioData = {
        site: DEFAULT_SITE,
        theme: DEFAULT_THEME,
        categories: DEFAULT_CATEGORIES,
        projects: DEFAULT_PROJECTS
      };
      try {
        await setDoc(PORTFOLIO_DOC, {
          ...initial,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to seed initial portfolio to Firestore:", err);
      }
      onData(initial);
    }
  }, (error) => {
    console.error("Firestore snapshot error:", error);
  });
}

export async function saveToFirestore(data: PortfolioData) {
  try {
    savePortfolioState(data); // Save local immediately
    await setDoc(PORTFOLIO_DOC, {
      site: data.site,
      theme: data.theme,
      categories: data.categories,
      projects: data.projects,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Error saving portfolio to Firestore:", err);
  }
}
