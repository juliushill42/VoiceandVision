import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyMedia, validateMediaBatch } from "./media-guard.ts";

describe("media guard", () => {
  it("classifies by MIME and falls back to extension", () => {
    assert.equal(classifyMedia({ name: "a.bin", type: "video/mp4", size: 1 }), "video");
    assert.equal(classifyMedia({ name: "voice.m4a", type: "", size: 1 }), "audio");
    assert.equal(classifyMedia({ name: "still.webp", type: "application/octet-stream", size: 1 }), "image");
    assert.equal(classifyMedia({ name: "payload.exe", type: "application/octet-stream", size: 1 }), null);
  });

  it("rejects empty, unsupported, over-limit, and batch-overflow files", () => {
    const limits = {
      maxFiles: 3,
      maxBatchBytes: 100,
      maxImageBytes: 50,
      maxAudioBytes: 60,
      maxVideoBytes: 80,
    };
    const result = validateMediaBatch([
      { name: "empty.png", type: "image/png", size: 0 },
      { name: "bad.exe", type: "application/octet-stream", size: 10 },
      { name: "huge.mp4", type: "video/mp4", size: 81 },
      { name: "extra.jpg", type: "image/jpeg", size: 20 },
    ], limits);
    const codes = result.rejected.map((x) => x.code);
    assert.ok(codes.includes("too-many-files"));
    assert.ok(codes.includes("empty-file"));
    assert.ok(codes.includes("unsupported-type"));
    assert.ok(codes.includes("file-too-large"));
  });

  it("enforces cumulative batch bytes", () => {
    const limits = {
      maxFiles: 10,
      maxBatchBytes: 100,
      maxImageBytes: 100,
      maxAudioBytes: 100,
      maxVideoBytes: 100,
    };
    const result = validateMediaBatch([
      { name: "a.png", type: "image/png", size: 60 },
      { name: "b.png", type: "image/png", size: 50 },
    ], limits);
    assert.equal(result.accepted.length, 1);
    assert.equal(result.rejected[0].code, "batch-too-large");
  });
});
