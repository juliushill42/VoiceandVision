export type ViewId = "flow" | "voice" | "cut" | "library";
export type AspectId = "9:16" | "16:9" | "1:1";
export type CaptionStyleId = "clean" | "box" | "editorial" | "karaoke";
export type LookId = "native" | "tungsten" | "silver" | "night" | "paper";
export type SceneKind = "still" | "video" | "solid";
export type OverlayPlacement = "title" | "lower" | "center";

export interface KenBurns {
  fromScale: number;
  toScale: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface WordCue { text: string; start: number; end: number; }
export interface CaptionCue { id: string; text: string; start: number; end: number; words: WordCue[]; }
export interface Overlay { id: string; text: string; start: number; end: number; placement: OverlayPlacement; }

export interface SceneEdit {
  sourceDuration?: number;
  trimStart?: number;
  trimEnd?: number;
  playbackRate?: number;
  reverse?: boolean;
  muted?: boolean;
  freezeAt?: number | null;
}


export interface Scene {
  id: string;
  kind: SceneKind;
  src: string;
  label: string;
  duration: number;
  kenBurns: KenBurns;
  assetId?: string;
  mime?: string;
  sizeBytes?: number;
  edit?: SceneEdit;
}

export interface FlowSession { id: string; title: string; text: string; createdAt: number; durationMs: number; wordCount: number; }

export interface Project {
  id: string;
  title: string;
  aspect: AspectId;
  script: string;
  scenes: Scene[];
  captions: CaptionCue[];
  overlays: Overlay[];
  captionStyle: CaptionStyleId;
  look: LookId;
  voiceoverUrl: string | null;
  voiceoverName: string | null;
  voiceoverAssetId?: string | null;
  updatedAt: number;
  schemaVersion?: number;
  revision?: number;
}

export const ASPECT_SIZE: Record<AspectId, { w: number; h: number }> = {
  "9:16": { w: 720, h: 1280 },
  "16:9": { w: 1280, h: 720 },
  "1:1": { w: 1080, h: 1080 },
};

export const LOOKS: { id: LookId; label: string }[] = [
  { id: "native", label: "Native" },
  { id: "tungsten", label: "Tungsten" },
  { id: "silver", label: "Silver" },
  { id: "night", label: "Night" },
  { id: "paper", label: "Paper" },
];

export const CAPTION_STYLES: { id: CaptionStyleId; label: string }[] = [
  { id: "clean", label: "Clean" },
  { id: "box", label: "Box" },
  { id: "editorial", label: "Editorial" },
  { id: "karaoke", label: "Karaoke" },
];

export const ASPECTS: { id: AspectId; label: string }[] = [
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
  { id: "1:1", label: "1:1" },
];
