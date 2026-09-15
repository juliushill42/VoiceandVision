import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Project, Scene } from "./types.ts";
import {
  applyProjectCommand,
  effectiveSceneDuration,
  normalizeProject,
  projectDurationSeconds,
  sceneTrimRange,
  sourceTimeForScene,
  splitScene,
  trimScene,
  validateProject,
} from "./project-engine.ts";

const kb = { fromScale: 1, toScale: 1, fromX: 0, fromY: 0, toX: 0, toY: 0 };

function video(): Scene {
  return {
    id: "v1",
    kind: "video",
    src: "blob:video",
    label: "clip",
    duration: 10,
    kenBurns: kb,
    edit: { sourceDuration: 10, trimStart: 0, trimEnd: 10, playbackRate: 1 },
  };
}

function project(scene: Scene = video()): Project {
  return {
    id: "p1",
    title: "Project",
    aspect: "16:9",
    script: "",
    scenes: [scene],
    captions: [],
    overlays: [],
    captionStyle: "clean",
    look: "native",
    voiceoverUrl: null,
    voiceoverName: null,
    updatedAt: 0,
  };
}

describe("project engine", () => {
  it("computes trimmed duration at playback speed", () => {
    const scene = video();
    scene.edit = { sourceDuration: 10, trimStart: 2, trimEnd: 8, playbackRate: 2 };
    assert.equal(effectiveSceneDuration(scene), 3);
    assert.deepEqual(sceneTrimRange(scene), { start: 2, end: 8 });
  });

  it("maps output time to trimmed, sped, reversed, and frozen source time", () => {
    const scene = video();
    scene.edit = { sourceDuration: 10, trimStart: 2, trimEnd: 8, playbackRate: 2 };
    assert.equal(sourceTimeForScene(scene, 1), 4);
    scene.edit.reverse = true;
    assert.equal(sourceTimeForScene(scene, 1), 6);
    scene.edit.reverse = false;
    scene.edit.freezeAt = 5;
    assert.equal(sourceTimeForScene(scene, 2), 5);
  });

  it("splits video without losing source coverage", () => {
    const next = splitScene(project(), "v1", 4);
    assert.equal(next.scenes.length, 2);
    assert.equal(effectiveSceneDuration(next.scenes[0]), 4);
    assert.equal(effectiveSceneDuration(next.scenes[1]), 6);
    assert.equal(sceneTrimRange(next.scenes[0]).end, 4);
    assert.equal(sceneTrimRange(next.scenes[1]).start, 4);
  });

  it("trims video in output time while preserving source-time math", () => {
    const source = video();
    source.edit = { sourceDuration: 10, trimStart: 0, trimEnd: 10, playbackRate: 2 };
    const next = trimScene(project(source), "v1", 1, 4);
    assert.deepEqual(sceneTrimRange(next.scenes[0]), { start: 2, end: 8 });
    assert.equal(effectiveSceneDuration(next.scenes[0]), 3);
  });

  it("splits reversed video in reverse source order", () => {
    const source = video();
    source.edit = { sourceDuration: 10, trimStart: 0, trimEnd: 10, playbackRate: 1, reverse: true };
    const next = splitScene(project(source), "v1", 4);
    assert.deepEqual(sceneTrimRange(next.scenes[0]), { start: 6, end: 10 });
    assert.deepEqual(sceneTrimRange(next.scenes[1]), { start: 0, end: 6 });
    assert.equal(sourceTimeForScene(next.scenes[0], 0), 10);
    assert.equal(sourceTimeForScene(next.scenes[1], 0), 6);
  });

  it("trims reversed video using output-time boundaries", () => {
    const source = video();
    source.edit = { sourceDuration: 10, trimStart: 0, trimEnd: 10, playbackRate: 2, reverse: true };
    const next = trimScene(project(source), "v1", 1, 4);
    assert.deepEqual(sceneTrimRange(next.scenes[0]), { start: 2, end: 8 });
    assert.equal(sourceTimeForScene(next.scenes[0], 0), 8);
    assert.equal(sourceTimeForScene(next.scenes[0], 3), 2);
  });

  it("rejects invalid edit commands instead of silently clamping them", () => {
    assert.throws(() => splitScene(project(), "v1", -4), /Split point/);
    assert.throws(() => trimScene(project(), "v1", 8, 2), /Trim range/);
    assert.throws(() => applyProjectCommand(project(), { type: "scene.speed", sceneId: "v1", rate: 99 }), /Playback rate/);
  });

  it("applies speed, reverse, and freeze commands", () => {
    let next = project();
    next = applyProjectCommand(next, { type: "scene.speed", sceneId: "v1", rate: 2 });
    next = applyProjectCommand(next, { type: "scene.reverse", sceneId: "v1", enabled: true });
    next = applyProjectCommand(next, { type: "scene.freeze", sceneId: "v1", at: 5 });
    assert.equal(next.scenes[0].edit?.playbackRate, 2);
    assert.equal(next.scenes[0].edit?.reverse, true);
    assert.equal(next.scenes[0].edit?.freezeAt, 5);
  });

  it("normalizes duplicate ids and clips timed content", () => {
    const p = project();
    p.scenes = [video(), { ...video() }];
    p.captions = [{ id: "c", text: "x", start: 0, end: 99, words: [] }];
    p.overlays = [{ id: "o", text: "x", start: 0, end: 99, placement: "center" }];
    const normalized = normalizeProject(p);
    assert.notEqual(normalized.scenes[0].id, normalized.scenes[1].id);
    const duration = projectDurationSeconds(normalized);
    assert.equal(normalized.captions[0].end, duration);
    assert.equal(normalized.overlays[0].end, duration);
  });

  it("detects missing source and invalid timed ranges", () => {
    const p = project({ ...video(), src: "", assetId: undefined });
    p.captions = [{ id: "c", text: "x", start: -1, end: 20, words: [] }];
    const codes = validateProject(p).map((x) => x.code);
    assert.ok(codes.includes("scene.source"));
    assert.ok(codes.includes("caption.range"));
  });
});
