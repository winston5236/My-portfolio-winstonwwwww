export type MediaType = "web" | "3d" | "photo" | "video";

export interface Category {
  id: string;
  short: string;
  label: string;
  color: string;
  desc: string;
}

export interface MediaBox {
  id: string;
  type: "process" | "final" | "video" | "model" | "custom_image";
  title: string;
  items: string[];
}

export interface Project {
  id: string;
  title: string;
  category: string;
  type: MediaType;
  year: string;
  tags: string[];
  desc: string;
  cover: string;
  coverFit?: "cover" | "contain"; // "cover" (crop to fill) or "contain" (fit entire image with black space)
  link?: string;
  embed?: string;

  // 4 Quadrant Media Sections & Custom Reel Boxes
  processImages?: string[]; // Process images slideshow
  finalImages?: string[];   // Final images slideshow
  videos?: string[];        // Optional video files/URLs slideshow
  models?: string[];        // Optional 3D OBJ / GLB model URLs slideshow
  cardOrder?: string[];     // Customizable order for media reel cards: e.g. ["process", "final", "video", "model"]
  customBoxes?: MediaBox[]; // Flexible multi-box media reel items

  // Backward compatibility
  model?: string;
  images?: string[];
  video?: string;
}

export interface SiteSettings {
  title: string;
  hint: string;
  subtitle: string;
}

export interface ThemeSettings {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  line: string;
  accentWeb: string;
  accent3d: string;
  accentPhoto: string;
  accentVideo: string;
  catForm: string;
  catUiux: string;
  catProduct: string;
  catInteractive: string;
  catSustainable: string;
  catSpatial: string;
}

export interface EditorAuthState {
  isLoggedIn: boolean;
}
