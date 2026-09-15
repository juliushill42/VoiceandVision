import type { Project, Scene } from "./types.ts";

export const STUDIO_SCHEMA_VERSION = 2;
export const MIN_SCENE_SECONDS = 0.1;
export const MAX_SCENE_SECONDS = 60 * 60;
export const MIN_PLAYBACK_RATE = 0.125;
export const MAX_PLAYBACK_RATE = 8;

export interface ProjectIssue {
  code: string;
  path: string;
  message: string;
}

export type ProjectCommand =
  | { type: "scene.split"; sceneId: string; at: number }
  | { type: "scene.trim"; sceneId: string; start: number; end: number }
  | { type: "scene.move"; sceneId: string; toIndex: number }
  | { type: "scene.duplicate"; sceneId: string }
  | { type: "scene.speed"; sceneId: string; rate: number }
  | { type: "scene.reverse"; sceneId: string; enabled: boolean }
  | { type: "scene.freeze"; sceneId: string; at: number | null }
;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function nextId(prefix: string): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) return `${prefix}-${cryptoObj.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function bump(project: Project, scenes: Scene[]): Project {
  return {
    ...project,
    scenes,
    schemaVersion: STUDIO_SCHEMA_VERSION,
    revision: (project.revision ?? 0) + 1,
    updatedAt: Date.now(),
  };
}

export function sceneSourceDuration(scene: Scene): number {
  const source = scene.edit?.sourceDuration;
  if (Number.isFinite(source) && (source as number) > 0) return source as number;
  return Math.max(MIN_SCENE_SECONDS, scene.duration * (scene.edit?.playbackRate ?? 1));
}

export function scenePlaybackRate(scene: Scene): number {
  return clamp(scene.edit?.playbackRate ?? 1, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
}

export function sceneTrimRange(scene: Scene): { start: number; end: number } {
  const sourceDuration = sceneSourceDuration(scene);
  const start = clamp(scene.edit?.trimStart ?? 0, 0, Math.max(0, sourceDuration - MIN_SCENE_SECONDS));
  const end = clamp(scene.edit?.trimEnd ?? sourceDuration, start + MIN_SCENE_SECONDS, sourceDuration);
  return { start, end };
}

export function sourceTimeForScene(scene: Scene, localTime: number): number {
  if (scene.kind !== "video") return Math.max(0, localTime);
  const { start, end } = sceneTrimRange(scene);
  const rate = scenePlaybackRate(scene);
  const outputDuration = effectiveSceneDuration(scene);
  const local = clamp(localTime, 0, outputDuration);
  let sourceTime = scene.edit?.reverse
    ? end - local * rate
    : start + local * rate;
  const freezeAt = scene.edit?.freezeAt;
  if (freezeAt != null && Number.isFinite(freezeAt)) {
    const freeze = clamp(freezeAt, start, end);
    if (scene.edit?.reverse) sourceTime = sourceTime <= freeze ? freeze : sourceTime;
    else sourceTime = sourceTime >= freeze ? freeze : sourceTime;
  }
  return clamp(sourceTime, start, end);
}

export function effectiveSceneDuration(scene: Scene): number {
  if (scene.kind === "still" || scene.kind === "solid") {
    return clamp(scene.duration, MIN_SCENE_SECONDS, MAX_SCENE_SECONDS);
  }
  const { start, end } = sceneTrimRange(scene);
  return clamp((end - start) / scenePlaybackRate(scene), MIN_SCENE_SECONDS, MAX_SCENE_SECONDS);
}

export function projectDurationSeconds(project: Pick<Project, "scenes">): number {
  return project.scenes.reduce((sum, scene) => sum + effectiveSceneDuration(scene), 0);
}

export function normalizeScene(scene: Scene): Scene {
  const sourceDuration = sceneSourceDuration(scene);
  const rate = scenePlaybackRate(scene);
  const { start, end } = sceneTrimRange(scene);
  const duration = scene.kind === "video" ? (end - start) / rate : clamp(scene.duration, MIN_SCENE_SECONDS, MAX_SCENE_SECONDS);
  return {
    ...scene,
    duration,
    edit: {
      ...scene.edit,
      sourceDuration,
      trimStart: start,
      trimEnd: end,
      playbackRate: rate,
      reverse: Boolean(scene.edit?.reverse),
      freezeAt:
        scene.edit?.freezeAt == null
          ? null
          : clamp(scene.edit.freezeAt, 0, Math.max(0, sourceDuration - MIN_SCENE_SECONDS)),
    },
  };
}


export function normalizeProject(project: Project): Project {
  const seen = new Set<string>();
  const scenes = project.scenes.map((input, index) => {
    let scene = normalizeScene(input);
    if (!scene.id || seen.has(scene.id)) scene = { ...scene, id: nextId(`scene-${index + 1}`) };
    seen.add(scene.id);
    return scene;
  });
  const maxDuration = projectDurationSeconds({ scenes });
  const captions = project.captions
    .filter((cue) => cue && Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.end > cue.start)
    .map((cue) => ({ ...cue, start: clamp(cue.start, 0, maxDuration), end: clamp(cue.end, 0, maxDuration) }))
    .filter((cue) => cue.end > cue.start);
  const overlays = project.overlays
    .filter((overlay) => overlay && Number.isFinite(overlay.start) && Number.isFinite(overlay.end) && overlay.end > overlay.start)
    .map((overlay) => ({ ...overlay, start: clamp(overlay.start, 0, maxDuration), end: clamp(overlay.end, 0, maxDuration) }))
    .filter((overlay) => overlay.end > overlay.start);
  return {
    ...project,
    title: project.title.trim().slice(0, 160) || "Untitled project",
    scenes,
    captions,
    overlays,
    schemaVersion: STUDIO_SCHEMA_VERSION,
    revision: Math.max(0, Math.trunc(project.revision ?? 0)),
  };
}

export function validateProject(project: Project): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  if (!project.id.trim()) issues.push({ code: "project.id", path: "id", message: "Project id is empty." });
  if (!project.title.trim()) issues.push({ code: "project.title", path: "title", message: "Project title is empty." });
  const ids = new Set<string>();
  project.scenes.forEach((scene, index) => {
    const path = `scenes.${index}`;
    if (!scene.id) issues.push({ code: "scene.id", path: `${path}.id`, message: "Scene id is empty." });
    if (ids.has(scene.id)) issues.push({ code: "scene.duplicate-id", path: `${path}.id`, message: `Duplicate scene id: ${scene.id}` });
    ids.add(scene.id);
    if (!Number.isFinite(scene.duration) || scene.duration < MIN_SCENE_SECONDS)
      issues.push({ code: "scene.duration", path: `${path}.duration`, message: "Scene duration is invalid." });
    if ((scene.kind === "still" || scene.kind === "video") && !scene.src && !scene.assetId)
      issues.push({ code: "scene.source", path: `${path}.src`, message: "Scene has no media source." });
    if (scene.kind === "video") {
      const { start, end } = sceneTrimRange(scene);
      if (end - start < MIN_SCENE_SECONDS)
        issues.push({ code: "scene.trim", path: `${path}.edit`, message: "Video trim range is too short." });
    }
  });
  const duration = projectDurationSeconds(project);
  project.captions.forEach((cue, index) => {
    if (cue.start < 0 || cue.end <= cue.start || cue.end > duration + 0.001)
      issues.push({ code: "caption.range", path: `captions.${index}`, message: "Caption timing is outside the project." });
  });
  project.overlays.forEach((overlay, index) => {
    if (overlay.start < 0 || overlay.end <= overlay.start || overlay.end > duration + 0.001)
      issues.push({ code: "overlay.range", path: `overlays.${index}`, message: "Overlay timing is outside the project." });
  });
  return issues;
}

function sceneIndex(project: Project, sceneId: string): number {
  const index = project.scenes.findIndex((scene) => scene.id === sceneId);
  if (index < 0) throw new Error(`Scene not found: ${sceneId}`);
  return index;
}

export function splitScene(project: Project, sceneId: string, at: number): Project {
  const index = sceneIndex(project, sceneId);
  const original = normalizeScene(project.scenes[index]);
  const duration = effectiveSceneDuration(original);
  if (duration < MIN_SCENE_SECONDS * 2) throw new Error("Scene is too short to split.");
  if (!Number.isFinite(at) || at < MIN_SCENE_SECONDS || at > duration - MIN_SCENE_SECONDS) {
    throw new Error("Split point is outside the editable scene range.");
  }
  const splitAt = at;

  let left: Scene;
  let right: Scene;
  if (original.kind === "video") {
    const rate = scenePlaybackRate(original);
    const range = sceneTrimRange(original);
    const reversed = Boolean(original.edit?.reverse);
    const sourceSplit = reversed
      ? range.end - splitAt * rate
      : range.start + splitAt * rate;
    left = normalizeScene({
      ...original,
      duration: splitAt,
      edit: reversed
        ? { ...original.edit, trimStart: sourceSplit, trimEnd: range.end }
        : { ...original.edit, trimStart: range.start, trimEnd: sourceSplit },
    });
    right = normalizeScene({
      ...original,
      id: nextId("scene"),
      label: `${original.label} B`,
      duration: duration - splitAt,
      edit: reversed
        ? { ...original.edit, trimStart: range.start, trimEnd: sourceSplit }
        : { ...original.edit, trimStart: sourceSplit, trimEnd: range.end },
    });
  } else {
    left = { ...original, duration: splitAt };
    right = { ...original, id: nextId("scene"), label: `${original.label} B`, duration: duration - splitAt };
  }
  const scenes = [...project.scenes];
  scenes.splice(index, 1, left, right);
  return bump(project, scenes);
}

export function trimScene(project: Project, sceneId: string, start: number, end: number): Project {
  const index = sceneIndex(project, sceneId);
  const scene = normalizeScene(project.scenes[index]);
  const duration = effectiveSceneDuration(scene);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > duration || end - start < MIN_SCENE_SECONDS) {
    throw new Error("Trim range is outside the editable scene range.");
  }
  const localStart = start;
  const localEnd = end;
  let next: Scene;
  if (scene.kind === "video") {
    const rate = scenePlaybackRate(scene);
    const range = sceneTrimRange(scene);
    const reversed = Boolean(scene.edit?.reverse);
    next = normalizeScene({
      ...scene,
      edit: {
        ...scene.edit,
        trimStart: reversed ? range.end - localEnd * rate : range.start + localStart * rate,
        trimEnd: reversed ? range.end - localStart * rate : range.start + localEnd * rate,
      },
    });
  } else {
    next = { ...scene, duration: localEnd - localStart };
  }
  const scenes = [...project.scenes];
  scenes[index] = next;
  return bump(project, scenes);
}

export function moveScene(project: Project, sceneId: string, toIndex: number): Project {
  const from = sceneIndex(project, sceneId);
  const scenes = [...project.scenes];
  const [scene] = scenes.splice(from, 1);
  const target = clamp(Math.trunc(toIndex), 0, scenes.length);
  scenes.splice(target, 0, scene);
  return bump(project, scenes);
}

export function duplicateScene(project: Project, sceneId: string): Project {
  const index = sceneIndex(project, sceneId);
  const original = project.scenes[index];
  const duplicate = { ...original, id: nextId("scene"), label: `${original.label} copy` };
  const scenes = [...project.scenes];
  scenes.splice(index + 1, 0, duplicate);
  return bump(project, scenes);
}

export function setSceneSpeed(project: Project, sceneId: string, rate: number): Project {
  if (!Number.isFinite(rate) || rate < MIN_PLAYBACK_RATE || rate > MAX_PLAYBACK_RATE) {
    throw new Error(`Playback rate must be between ${MIN_PLAYBACK_RATE}x and ${MAX_PLAYBACK_RATE}x.`);
  }
  const index = sceneIndex(project, sceneId);
  const scene = normalizeScene(project.scenes[index]);
  const next = normalizeScene({ ...scene, edit: { ...scene.edit, playbackRate: rate } });
  const scenes = [...project.scenes];
  scenes[index] = next;
  return bump(project, scenes);
}

export function setSceneReverse(project: Project, sceneId: string, enabled: boolean): Project {
  const index = sceneIndex(project, sceneId);
  const scene = project.scenes[index];
  const scenes = [...project.scenes];
  scenes[index] = { ...scene, edit: { ...scene.edit, reverse: enabled } };
  return bump(project, scenes);
}


export function setFreezeFrame(project: Project, sceneId: string, at: number | null): Project {
  const index = sceneIndex(project, sceneId);
  const scene = normalizeScene(project.scenes[index]);
  const sourceDuration = sceneSourceDuration(scene);
  const freezeAt = at == null ? null : clamp(at, 0, Math.max(0, sourceDuration - MIN_SCENE_SECONDS));
  const scenes = [...project.scenes];
  scenes[index] = { ...scene, edit: { ...scene.edit, freezeAt } };
  return bump(project, scenes);
}


export function applyProjectCommand(project: Project, command: ProjectCommand): Project {
  switch (command.type) {
    case "scene.split": return splitScene(project, command.sceneId, command.at);
    case "scene.trim": return trimScene(project, command.sceneId, command.start, command.end);
    case "scene.move": return moveScene(project, command.sceneId, command.toIndex);
    case "scene.duplicate": return duplicateScene(project, command.sceneId);
    case "scene.speed": return setSceneSpeed(project, command.sceneId, command.rate);
    case "scene.reverse": return setSceneReverse(project, command.sceneId, command.enabled);
    case "scene.freeze": return setFreezeFrame(project, command.sceneId, command.at);
  }
}
