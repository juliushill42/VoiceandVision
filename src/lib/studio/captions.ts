import { formatSrtTime, uid } from "@/lib/utils";
import type { CaptionCue, Scene } from "@/lib/studio/types";

const COMMANDS: Array<[RegExp, string]> = [
  [/\s+period\b/gi, "."],
  [/\s+full stop\b/gi, "."],
  [/\s+comma\b/gi, ","],
  [/\s+question mark\b/gi, "?"],
  [/\s+exclamation (?:mark|point)\b/gi, "!"],
  [/\s+new paragraph\b/gi, "\n\n"],
  [/\s+new line\b/gi, "\n"],
  [/\s+colon\b/gi, ":"],
  [/\s+semicolon\b/gi, ";"],
  [/\s+ellipsis\b/gi, "..."],
  [/\s+quote\b/gi, '"'],
  [/\s+apostrophe\b/gi, "'"],
];

export function applyVoiceCommands(chunk: string): {
  text: string;
  scratch: boolean;
} {
  let scratch = false;
  let text = chunk;
  if (/\bscratch that\b/i.test(text)) {
    scratch = true;
    text = text.replace(/\bscratch that\b/gi, " ");
  }
  for (const [pattern, replacement] of COMMANDS) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(/\s+([.,!?;:])/g, "$1");
  text = text.replace(/[ \t]+/g, " ");
  return { text: text.trim(), scratch };
}

export function scratchLastSentence(source: string): string {
  const trimmed = source.trimEnd();
  if (!trimmed) return "";
  const match = trimmed.match(/[.!?]\s+[^.!?]*$/);
  if (match && match.index !== undefined) {
    return trimmed.slice(0, match.index + 1).trimEnd();
  }
  const lastBreak = Math.max(trimmed.lastIndexOf("\n"), trimmed.lastIndexOf(". "));
  if (lastBreak > 0) return trimmed.slice(0, lastBreak + 1).trimEnd();
  return "";
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function scriptToCues(text: string, wordsPerSecond = 2.35): CaptionCue[] {
  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    if (words.length <= 8) {
      chunks.push(sentence);
      continue;
    }
    for (let i = 0; i < words.length; i += 6) {
      chunks.push(words.slice(i, i + 6).join(" "));
    }
  }

  let t = 0.12;
  return chunks.map((chunk) => {
    const words = chunk.split(/\s+/).filter(Boolean);
    const dur = Math.max(1.12, words.length / wordsPerSecond) + 0.1;
    const start = t;
    const end = t + dur;
    t = end + 0.06;
    const wordDur = words.length ? (end - start) / words.length : dur;
    return {
      id: uid("cue"),
      text: chunk,
      start,
      end,
      words: words.map((word, index) => ({
        text: word,
        start: start + index * wordDur,
        end: start + (index + 1) * wordDur,
      })),
    };
  });
}

export function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map((cue, index) => {
      return `${index + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`;
    })
    .join("\n");
}

export function fitScenesToDuration(scenes: Scene[], duration: number): Scene[] {
  if (!scenes.length) return scenes;
  const minEach = 1.6;
  const each = Math.max(minEach, duration / scenes.length);
  return scenes.map((scene) => ({ ...scene, duration: each }));
}

export function sceneAtTime(
  scenes: Scene[],
  time: number,
): { scene: Scene; index: number; local: number; start: number } | null {
  if (!scenes.length) return null;
  let cursor = 0;
  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const next = cursor + scene.duration;
    if (time < next || index === scenes.length - 1) {
      return { scene, index, local: Math.max(0, time - cursor), start: cursor };
    }
    cursor = next;
  }
  return null;
}
