import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { startDictation } from "./speech.ts";

class FakeRecognition {
  static last: FakeRecognition | null = null;
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((event: never) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() { FakeRecognition.last = this; }
  start() {}
  stop() { queueMicrotask(() => this.onend?.()); }
  abort() { queueMicrotask(() => this.onend?.()); }
}

function installWindow() {
  const previous = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    SpeechRecognition: FakeRecognition,
    webkitSpeechRecognition: undefined,
    setTimeout,
    clearTimeout,
  };
  return () => {
    if (previous === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = previous;
    FakeRecognition.last = null;
  };
}

describe("dictation lifecycle", () => {
  it("fires onEnd once when stop and recognition end race", async () => {
    const restore = installWindow();
    try {
      let ended = 0;
      const handle = startDictation("en-US", {
        onFinal() {},
        onInterim() {},
        onError() {},
        onEnd() { ended += 1; },
      });
      assert.ok(handle);
      handle.stop();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(ended, 1);
    } finally {
      restore();
    }
  });

  it("stops permanently after a permission error", async () => {
    const restore = installWindow();
    try {
      const errors: string[] = [];
      let ended = 0;
      startDictation("en-US", {
        onFinal() {},
        onInterim() {},
        onError(message) { errors.push(message); },
        onEnd() { ended += 1; },
      });
      const rec = FakeRecognition.last;
      assert.ok(rec);
      rec.onerror?.({ error: "not-allowed" });
      rec.onend?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(errors.length, 1);
      assert.equal(ended, 1);
    } finally {
      restore();
    }
  });
});
