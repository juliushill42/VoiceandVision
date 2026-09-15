import { normalizeProject } from "./project-engine.ts";
import type {
  AspectId,
  CaptionCue,
  CaptionStyleId,
  LookId,
  Overlay,
  Project,
  Scene,
  SceneKind,
} from "./types.ts";

const ASPECTS = new Set<AspectId>(["9:16", "16:9", "1:1"]);
const CAPTION_STYLES = new Set<CaptionStyleId>(["clean", "box", "editorial", "karaoke"]);
const LOOKS = new Set<LookId>(["native", "tungsten", "silver", "night", "paper"]);
const SCENE_KINDS = new Set<SceneKind>(["still", "video", "solid"]);
const PLACEMENTS = new Set<Overlay["placement"]>(["title", "lower", "center"]);

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function text(value: unknown, fallback = "", max = 100_000): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value ? value.slice(0, 512) : undefined;
}

function decodeKenBurns(value: unknown, fallback: Scene["kenBurns"]): Scene["kenBurns"] {
  const v = record(value);
  if (!v) return fallback;
  return {
    fromScale: finite(v.fromScale, fallback.fromScale),
    toScale: finite(v.toScale, fallback.toScale),
    fromX: finite(v.fromX, fallback.fromX),
    fromY: finite(v.fromY, fallback.fromY),
    toX: finite(v.toX, fallback.toX),
    toY: finite(v.toY, fallback.toY),
  };
}

function decodeScene(value: unknown, fallback: Scene): Scene | null {
  const v = record(value);
  if (!v) return null;
  const kind = typeof v.kind === "string" && SCENE_KINDS.has(v.kind as SceneKind)
    ? v.kind as SceneKind
    : null;
  if (!kind) return null;
  const edit = record(v.edit);
  return {
    id: text(v.id, fallback.id, 256) || fallback.id,
    kind,
    src: text(v.src, "", 2_000_000),
    label: text(v.label, "Untitled media", 512) || "Untitled media",
    duration: finite(v.duration, fallback.duration),
    kenBurns: decodeKenBurns(v.kenBurns, fallback.kenBurns),
    assetId: optionalText(v.assetId),
    mime: optionalText(v.mime),
    sizeBytes: typeof v.sizeBytes === "number" && Number.isFinite(v.sizeBytes) && v.sizeBytes >= 0
      ? v.sizeBytes
      : undefined,
    edit: edit
      ? {
          sourceDuration: finite(edit.sourceDuration, finite(v.duration, fallback.duration)),
          trimStart: finite(edit.trimStart, 0),
          trimEnd: finite(edit.trimEnd, finite(edit.sourceDuration, finite(v.duration, fallback.duration))),
          playbackRate: finite(edit.playbackRate, 1),
          reverse: Boolean(edit.reverse),
          freezeAt: edit.freezeAt == null ? null : finite(edit.freezeAt, 0),
        }
      : undefined,
  };
}

function decodeCaption(value: unknown): CaptionCue | null {
  const v = record(value);
  if (!v) return null;
  const start = finite(v.start, NaN);
  const end = finite(v.end, NaN);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const cueText = text(v.text, "", 20_000);
  const words = Array.isArray(v.words)
    ? v.words.slice(0, 5_000).flatMap((word) => {
        const w = record(word);
        if (!w) return [];
        const ws = finite(w.start, NaN);
        const we = finite(w.end, NaN);
        if (!Number.isFinite(ws) || !Number.isFinite(we) || we <= ws) return [];
        return [{ text: text(w.text, "", 512), start: ws, end: we }];
      })
    : [];
  return { id: text(v.id, `cue-${start}`, 256), text: cueText, start, end, words };
}

function decodeOverlay(value: unknown): Overlay | null {
  const v = record(value);
  if (!v) return null;
  const start = finite(v.start, NaN);
  const end = finite(v.end, NaN);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const placement = typeof v.placement === "string" && PLACEMENTS.has(v.placement as Overlay["placement"])
    ? v.placement as Overlay["placement"]
    : "center";
  return {
    id: text(v.id, `overlay-${start}`, 256),
    text: text(v.text, "", 20_000),
    start,
    end,
    placement,
  };
}

export function decodeProjectSnapshot(value: unknown, fallback: Project): Project {
  const v = record(value);
  if (!v) return normalizeProject(fallback);
  const fallbackScene = fallback.scenes[0] ?? {
    id: "scene-fallback",
    kind: "solid" as const,
    src: "",
    label: "Blank",
    duration: 3,
    kenBurns: { fromScale: 1, toScale: 1, fromX: 0, fromY: 0, toX: 0, toY: 0 },
  };
  const scenes = Array.isArray(v.scenes)
    ? v.scenes.slice(0, 1_000).map((scene) => decodeScene(scene, fallbackScene)).filter((scene): scene is Scene => Boolean(scene))
    : fallback.scenes;
  const captions = Array.isArray(v.captions)
    ? v.captions.slice(0, 20_000).map(decodeCaption).filter((cue): cue is CaptionCue => Boolean(cue))
    : fallback.captions;
  const overlays = Array.isArray(v.overlays)
    ? v.overlays.slice(0, 10_000).map(decodeOverlay).filter((overlay): overlay is Overlay => Boolean(overlay))
    : fallback.overlays;
  const aspect = typeof v.aspect === "string" && ASPECTS.has(v.aspect as AspectId)
    ? v.aspect as AspectId
    : fallback.aspect;
  const captionStyle = typeof v.captionStyle === "string" && CAPTION_STYLES.has(v.captionStyle as CaptionStyleId)
    ? v.captionStyle as CaptionStyleId
    : fallback.captionStyle;
  const look = typeof v.look === "string" && LOOKS.has(v.look as LookId)
    ? v.look as LookId
    : fallback.look;

  return normalizeProject({
    ...fallback,
    id: text(v.id, fallback.id, 256) || fallback.id,
    title: text(v.title, fallback.title, 160) || fallback.title,
    aspect,
    script: text(v.script, fallback.script, 500_000),
    scenes: scenes.length ? scenes : fallback.scenes,
    captions,
    overlays,
    captionStyle,
    look,
    voiceoverUrl: typeof v.voiceoverUrl === "string" ? v.voiceoverUrl.slice(0, 2_000_000) : null,
    voiceoverName: typeof v.voiceoverName === "string" ? v.voiceoverName.slice(0, 512) : null,
    voiceoverAssetId: typeof v.voiceoverAssetId === "string" ? v.voiceoverAssetId.slice(0, 512) : null,
    updatedAt: finite(v.updatedAt, fallback.updatedAt),
    schemaVersion: finite(v.schemaVersion, fallback.schemaVersion ?? 1),
    revision: finite(v.revision, fallback.revision ?? 0),
  });
}

export function decodeFlowSessions(value: unknown): import("./types.ts").FlowSession[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).flatMap((entry) => {
    const v = record(entry);
    if (!v) return [];
    const body = text(v.text, "", 500_000).trim();
    if (!body) return [];
    const createdAt = finite(v.createdAt, Date.now());
    const words = body.split(/\s+/).filter(Boolean).length;
    return [{
      id: text(v.id, `session-${createdAt}`, 256),
      title: text(v.title, body.split(/\s+/).slice(0, 8).join(" "), 512),
      text: body,
      createdAt,
      durationMs: Math.max(0, finite(v.durationMs, 0)),
      wordCount: Math.max(0, Math.trunc(finite(v.wordCount, words))),
    }];
  });
}
