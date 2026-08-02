import { Category, Project, SiteSettings, ThemeSettings } from "./types";

export const DEFAULT_SITE: SiteSettings = {
  title: "Archive",
  subtitle: "06 SECTIONS",
  hint: "Scroll wheel, drag, or use ← → keys to browse sections — click a section to open projects."
};

export const DEFAULT_THEME: ThemeSettings = {
  bg: "#121316",
  surface: "#1a1c20",
  surface2: "#202329",
  text: "#ece9e3",
  muted: "#8d9199",
  line: "#2b2e34",

  accentWeb: "#8b7bff",
  accent3d: "#ffb74d",
  accentPhoto: "#4fd1c5",
  accentVideo: "#ff6fa5",

  catForm: "#d9a94c",
  catUiux: "#8b7bff",
  catProduct: "#ff9a5a",
  catInteractive: "#5ec8e8",
  catSustainable: "#7fbf8f",
  catSpatial: "#c98bd9"
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "form",
    short: "FORM",
    label: "Form & Aesthetics",
    color: "#d9a94c",
    desc: "Studies in shape, material, and composition — work concerned with how something looks and feels before anything else."
  },
  {
    id: "uiux",
    short: "UI/UX",
    label: "UI/UX Design",
    color: "#8b7bff",
    desc: "Interfaces and flows built around how people actually move through digital software and interactive platforms."
  },
  {
    id: "product",
    short: "PRODUCT",
    label: "Product Design",
    color: "#ff9a5a",
    desc: "End-to-end physical objects and digital systems, from early concept sketching through tangible production."
  },
  {
    id: "interactive",
    short: "INTERACT",
    label: "Interactive Design",
    color: "#5ec8e8",
    desc: "Work built to respond — dynamic motion, user input, generative canvas algorithms, and behavioral feedback."
  },
  {
    id: "sustainable",
    short: "SUSTAIN",
    label: "Sustainable Development",
    color: "#7fbf8f",
    desc: "Design constrained by ecological impact, material cycles, and long-term consequence rather than quick consumption."
  },
  {
    id: "spatial",
    short: "SPATIAL",
    label: "Spatial Design",
    color: "#c98bd9",
    desc: "Work concerned with physical and virtual spaces — environment, lighting, installation architecture, and spatial flow."
  }
];

const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231a1c20'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%238d9199' font-family='monospace' font-size='18'>Upload Cover Image</text></svg>";

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "001",
    title: "Fieldnote — Minimal Journaling App",
    category: "uiux",
    type: "web",
    year: "2026",
    tags: ["product", "react", "ux-research"],
    desc: "A minimal daily-journaling web application with mood tracking, typography presets, and weekly recaps.",
    cover: PLACEHOLDER_COVER,
    link: "https://example.com",
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  },
  {
    id: "002",
    title: "Tidepool Lounge Chair Form Study",
    category: "product",
    type: "3d",
    year: "2025",
    tags: ["furniture", "3d-modeling", "ergonomics"],
    desc: "A form study for an ergonomic lounge chair, modeled with an emphasis on a single continuous curved shell.",
    cover: PLACEHOLDER_COVER,
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  },
  {
    id: "003",
    title: "Northern Coastal Roads Series",
    category: "form",
    type: "photo",
    year: "2025",
    tags: ["travel", "35mm", "landscape"],
    desc: "A collection of architectural and natural stills from a week driving along the northern Pacific coastline.",
    cover: PLACEHOLDER_COVER,
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  },
  {
    id: "004",
    title: "Ledger — Financial Invoicing Dashboard",
    category: "interactive",
    type: "web",
    year: "2024",
    tags: ["dashboard", "data-viz", "react"],
    desc: "An invoicing and time-tracking dashboard featuring interactive canvas charts, real-time metrics, and dark mode UI.",
    cover: PLACEHOLDER_COVER,
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  },
  {
    id: "005",
    title: "Marrow Organic Vase Collection",
    category: "sustainable",
    type: "3d",
    year: "2024",
    tags: ["sculpture", "material-study", "biomimicry"],
    desc: "A series of vessel forms exploring bone-like internal lattice structures, developed around a low-waste ceramic 3D casting process.",
    cover: PLACEHOLDER_COVER,
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  },
  {
    id: "006",
    title: "Night Market Spatial Survey",
    category: "spatial",
    type: "photo",
    year: "2023",
    tags: ["street", "night", "architecture"],
    desc: "A photographic spatial study analyzing how temporary stalls and ambient neon light organize human traffic in night markets.",
    cover: PLACEHOLDER_COVER,
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  },
  {
    id: "007",
    title: "Kinetic Sculpture Reel & Motion Loop",
    category: "interactive",
    type: "video",
    year: "2026",
    tags: ["motion", "kinetic", "video"],
    desc: "A motion study exploring physical inertia, magnetic linkage, and sound design in parametric kinetic art.",
    cover: PLACEHOLDER_COVER,
    processImages: [],
    finalImages: [],
    videos: [],
    models: []
  }
];

const STORAGE_KEY = "portfolio_archive_data_v1";

export function loadPortfolioState(): {
  site: SiteSettings;
  theme: ThemeSettings;
  categories: Category[];
  projects: Project[];
} {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Clean old sample/unsplash URLs from local cache if present
      const cleanedProjects = (parsed.projects || []).map((p: Project) => {
        const isUnsplashCover = p.cover && p.cover.includes("unsplash.com");
        const cleanProcess = (p.processImages || []).filter((url) => !url.includes("unsplash.com"));
        const cleanFinal = (p.finalImages || []).filter((url) => !url.includes("unsplash.com"));
        const cleanVideos = (p.videos || []).filter((url) => !url.includes("gtv-videos-bucket"));
        const cleanModels = (p.models || []).filter((url) => !url.includes("modelviewer.dev"));

        return {
          ...p,
          cover: isUnsplashCover ? PLACEHOLDER_COVER : p.cover || PLACEHOLDER_COVER,
          processImages: cleanProcess,
          finalImages: cleanFinal,
          videos: cleanVideos,
          models: cleanModels
        };
      });

      return {
        site: { ...DEFAULT_SITE, ...parsed.site },
        theme: { ...DEFAULT_THEME, ...parsed.theme },
        categories: parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES,
        projects: (parsed.projects !== undefined && Array.isArray(parsed.projects)) ? cleanedProjects : DEFAULT_PROJECTS
      };
    }
  } catch (e) {
    console.error("Failed to load portfolio state from localStorage:", e);
  }
  return {
    site: DEFAULT_SITE,
    theme: DEFAULT_THEME,
    categories: DEFAULT_CATEGORIES,
    projects: DEFAULT_PROJECTS
  };
}

export function savePortfolioState(data: {
  site: SiteSettings;
  theme: ThemeSettings;
  categories: Category[];
  projects: Project[];
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save portfolio state to localStorage:", e);
  }
}
