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

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "001",
    title: "Fieldnote — Minimal Journaling App",
    category: "uiux",
    type: "web",
    year: "2026",
    tags: ["product", "react", "ux-research"],
    desc: "A minimal daily-journaling web application with mood tracking, typography presets, and weekly recaps. Built front-to-back.",
    cover: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1000&q=80",
    link: "https://example.com",
    processImages: [
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1000&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    ],
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
    cover: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
    model: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    link: "https://sketchfab.com",
    processImages: [
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    ],
    models: [
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
    ]
  },
  {
    id: "003",
    title: "Northern Coastal Roads Series",
    category: "form",
    type: "photo",
    year: "2025",
    tags: ["travel", "35mm", "landscape"],
    desc: "A collection of architectural and natural stills from a week driving along the northern Pacific coastline, shot on medium format film.",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    processImages: [
      "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    ],
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
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
    link: "https://example.com",
    processImages: [
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80"
    ],
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
    cover: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=80",
    model: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    processImages: [
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [],
    models: [
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
    ]
  },
  {
    id: "006",
    title: "Night Market Spatial Survey",
    category: "spatial",
    type: "photo",
    year: "2023",
    tags: ["street", "night", "architecture"],
    desc: "A photographic spatial study analyzing how temporary stalls and ambient neon light organize human traffic in night markets.",
    cover: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80",
    processImages: [
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
    ],
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
    desc: "A 4K motion study exploring physical inertia, magnetic linkage, and sound design in parametric kinetic art.",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    processImages: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80"
    ],
    finalImages: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80"
    ],
    videos: [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    ],
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
      return {
        site: { ...DEFAULT_SITE, ...parsed.site },
        theme: { ...DEFAULT_THEME, ...parsed.theme },
        categories: parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES,
        projects: parsed.projects && parsed.projects.length ? parsed.projects : DEFAULT_PROJECTS
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
