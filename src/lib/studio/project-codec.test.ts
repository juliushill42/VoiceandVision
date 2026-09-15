import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decodeFlowSessions, decodeProjectSnapshot } from "./project-codec.ts";
import type { Project } from "./types.ts";

const fallback: Project = {
  id: "fallback",
  title: "Fallback",
  aspect: "16:9",
  script: "safe",
  scenes: [{
    id: "s1",
    kind: "still",
    src: "/safe.jpg",
    label: "safe",
    duration: 3,
    kenBurns: { fromScale: 1, toScale: 1, fromX: 0, fromY: 0, toX: 0, toY: 0 },
  }],
  captions: [],
  overlays: [],
  captionStyle: "clean",
  look: "native",
  voiceoverUrl: null,
  voiceoverName: null,
  updatedAt: 0,
};

describe("project snapshot codec", () => {
  it("falls back for non-object data", () => {
    const decoded = decodeProjectSnapshot("corrupt", fallback);
    assert.equal(decoded.id, "fallback");
    assert.equal(decoded.scenes.length, 1);
  });

  it("drops malformed scenes and clips timed content", () => {
    const decoded = decodeProjectSnapshot({
      ...fallback,
      aspect: "bad",
      scenes: [null, { ...fallback.scenes[0], id: "good", duration: 2 }],
      captions: [{ id: "c", text: "x", start: 0, end: 99, words: [] }],
    }, fallback);
    assert.equal(decoded.aspect, "16:9");
    assert.equal(decoded.scenes.length, 1);
    assert.equal(decoded.scenes[0].id, "good");
    assert.equal(decoded.captions[0].end, 2);
  });

  it("caps oversized arrays before normalization", () => {
    const many = Array.from({ length: 1_100 }, (_, i) => ({ ...fallback.scenes[0], id: `s${i}` }));
    const decoded = decodeProjectSnapshot({ ...fallback, scenes: many }, fallback);
    assert.equal(decoded.scenes.length, 1_000);
  });
  it("sanitizes saved transcript sessions", () => {
    const sessions = decodeFlowSessions([
      null,
      { id: "x", title: "hello", text: "one two", createdAt: 1, durationMs: -4, wordCount: 999 },
      { id: "empty", text: "   " },
    ]);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].durationMs, 0);
    assert.equal(sessions[0].wordCount, 999);
  });

});
