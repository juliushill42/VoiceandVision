import type { KenBurns, Project, Scene } from "@/lib/studio/types";

const STILLS: Array<{ id: string; src: string; label: string; kb: KenBurns; duration: number }> = [
  {
    id: "scene-control-room",
    src: "/stills/control-room.jpg",
    label: "Control room",
    duration: 3.4,
    kb: { fromScale: 1.08, toScale: 1.18, fromX: -0.18, fromY: 0.04, toX: 0.12, toY: -0.06 },
  },
  {
    id: "scene-microphone",
    src: "/stills/microphone.jpg",
    label: "Microphone",
    duration: 5.4,
    kb: { fromScale: 1.12, toScale: 1.22, fromX: 0.1, fromY: 0.08, toX: -0.16, toY: -0.04 },
  },
  {
    id: "scene-rooftop",
    src: "/stills/rooftop.jpg",
    label: "Rooftop",
    duration: 4.4,
    kb: { fromScale: 1.05, toScale: 1.16, fromX: -0.2, fromY: 0, toX: 0.22, toY: 0.08 },
  },
  {
    id: "scene-cutting-table",
    src: "/stills/cutting-table.jpg",
    label: "Cutting table",
    duration: 5.4,
    kb: { fromScale: 1.1, toScale: 1.2, fromX: 0.14, fromY: -0.1, toX: -0.1, toY: 0.12 },
  },
  {
    id: "scene-stage",
    src: "/stills/stage.jpg",
    label: "Stage",
    duration: 4.6,
    kb: { fromScale: 1.06, toScale: 1.2, fromX: 0, fromY: 0.1, toX: 0, toY: -0.16 },
  },
];

export const SAMPLE_SCRIPT = `You don't need a studio. You don't need a subscription. Speak, and the picture follows. Voice and Vision is the zero-dollar cut. Your microphone is the boom. Your browser is the bay. Record the thought. Burn the caption. Ship the frame.`;

function stillScene(entry: (typeof STILLS)[number]): Scene {
  return {
    id: entry.id,
    kind: "still",
    src: entry.src,
    label: entry.label,
    duration: entry.duration,
    kenBurns: entry.kb,
  };
}

export function sampleStills(): Scene[] {
  return STILLS.map(stillScene);
}

export function createSampleProject(): Project {
  const scenes = sampleStills();
  return {
    id: "project-sample",
    title: "The zero-dollar studio",
    aspect: "9:16",
    script: SAMPLE_SCRIPT,
    scenes,
    look: "tungsten",
    captionStyle: "karaoke",
    voiceoverUrl: null,
    voiceoverName: null,
    updatedAt: 0,
    overlays: [
      {
        id: "ov-title",
        text: "Voice & Vision",
        start: 0,
        end: 2.4,
        placement: "title",
      },
      {
        id: "ov-lower",
        text: "On-device. No upload.",
        start: 20.2,
        end: 23.2,
        placement: "lower",
      },
    ],
    captions: [
      cue("c1", 0.35, 3.15, "You don't need a studio."),
      cue("c2", 3.4, 6.2, "You don't need a subscription."),
      cue("c3", 6.35, 8.7, "Speak, and the picture follows."),
      cue("c4", 8.9, 12.6, "Voice and Vision is the zero-dollar cut."),
      cue("c5", 12.85, 15.4, "Your microphone is the boom."),
      cue("c6", 15.55, 18.15, "Your browser is the bay."),
      cue("c7", 18.35, 19.85, "Record the thought."),
      cue("c8", 20.0, 21.4, "Burn the caption."),
      cue("c9", 21.55, 23.2, "Ship the frame."),
    ],
  };
}

function cue(id: string, start: number, end: number, text: string) {
  const words = text.split(/\s+/);
  const wordDur = (end - start) / words.length;
  return {
    id,
    text,
    start,
    end,
    words: words.map((word, index) => ({
      text: word,
      start: start + index * wordDur,
      end: start + (index + 1) * wordDur,
    })),
  };
}
