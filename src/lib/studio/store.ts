import { create } from "zustand";
import {
  applyVoiceCommands,
  cuesToSrt,
  fitScenesToDuration,
  scratchLastSentence,
  scriptToCues,
  wordCount,
} from "@/lib/studio/captions";
import { createSampleProject, sampleStills } from "@/lib/studio/sample";
import type {
  AspectId,
  CaptionStyleId,
  FlowSession,
  LookId,
  Project,
  Scene,
  ViewId,
} from "@/lib/studio/types";
import { downloadBlob, projectDuration, uid } from "@/lib/utils";

const STORAGE_KEY = "vv-studio-v1";

interface Persisted {
  sessions: FlowSession[];
  script?: string;
  captionStyle?: CaptionStyleId;
  look?: LookId;
  aspect?: AspectId;
}

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

export interface StudioState {
  view: ViewId;
  project: Project;
  sessions: FlowSession[];
  interim: string;
  listening: boolean;
  speaking: boolean;
  recording: boolean;
  playing: boolean;
  playhead: number;
  exporting: boolean;
  exportProgress: number;
  lang: string;
  rehydrate: () => void;
  setView: (view: ViewId) => void;
  setScript: (script: string) => void;
  appendFinal: (chunk: string) => void;
  setInterim: (text: string) => void;
  setListening: (value: boolean) => void;
  setSpeaking: (value: boolean) => void;
  setRecording: (value: boolean) => void;
  setPlaying: (value: boolean) => void;
  setPlayhead: (time: number) => void;
  togglePlay: () => void;
  setAspect: (aspect: AspectId) => void;
  setLook: (look: LookId) => void;
  setCaptionStyle: (style: CaptionStyleId) => void;
  setLang: (lang: string) => void;
  saveSession: () => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  cutFromScript: () => void;
  importFiles: (files: File[]) => Promise<void>;
  setVoiceover: (url: string | null, name: string | null) => void;
  removeScene: (id: string) => void;
  resetSample: () => void;
  downloadTranscript: () => void;
  downloadSrt: () => void;
  setExporting: (value: boolean, progress?: number) => void;
}

function persistSlice(state: StudioState) {
  if (typeof window === "undefined") return;
  const payload: Persisted = {
    sessions: state.sessions,
    script: state.project.script,
    captionStyle: state.project.captionStyle,
    look: state.project.look,
    aspect: state.project.aspect,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

function kenForIndex(index: number): Scene["kenBurns"] {
  const presets = [
    { fromScale: 1.08, toScale: 1.18, fromX: -0.16, fromY: 0.04, toX: 0.14, toY: -0.06 },
    { fromScale: 1.12, toScale: 1.2, fromX: 0.12, fromY: 0.08, toX: -0.14, toY: -0.04 },
    { fromScale: 1.05, toScale: 1.16, fromX: -0.2, fromY: 0, toX: 0.18, toY: 0.08 },
  ];
  return presets[index % presets.length];
}

export const useStudio = create<StudioState>((set, get) => ({
  view: "cut",
  project: createSampleProject(),
  sessions: [],
  interim: "",
  listening: false,
  speaking: false,
  recording: false,
  playing: false,
  playhead: 0,
  exporting: false,
  exportProgress: 0,
  lang: "en-US",

  rehydrate: () => {
    const persisted = loadPersisted();
    if (!persisted) return;
    set((state) => ({
      sessions: persisted.sessions ?? [],
      project: {
        ...state.project,
        script: persisted.script ?? state.project.script,
        captionStyle: persisted.captionStyle ?? state.project.captionStyle,
        look: persisted.look ?? state.project.look,
        aspect: persisted.aspect ?? state.project.aspect,
      },
    }));
  },
  setView: (view) => set({ view }),
  setScript: (script) => {
    set((state) => ({ project: { ...state.project, script, updatedAt: Date.now() } }));
    persistSlice(get());
  },
  appendFinal: (chunk) => {
    const { text, scratch } = applyVoiceCommands(chunk);
    set((state) => {
      let script = state.project.script;
      if (scratch) script = scratchLastSentence(script);
      if (text) {
        const needsSpace = script && !/\s$/.test(script) && !/^[.,!?;:]/.test(text);
        script = `${script}${needsSpace ? " " : ""}${text}`;
      }
      return { project: { ...state.project, script, updatedAt: Date.now() }, interim: "" };
    });
    persistSlice(get());
  },
  setInterim: (interim) => set({ interim }),
  setListening: (listening) => set({ listening, interim: listening ? get().interim : "" }),
  setSpeaking: (speaking) => set({ speaking }),
  setRecording: (recording) => set({ recording }),
  setPlaying: (playing) => set({ playing }),
  setPlayhead: (playhead) => set({ playhead: Math.max(0, playhead) }),
  togglePlay: () => {
    const state = get();
    const duration = projectDuration(state.project.scenes);
    if (!state.playing && state.playhead >= duration - 0.05) {
      set({ playing: true, playhead: 0 });
      return;
    }
    set({ playing: !state.playing });
  },
  setAspect: (aspect) => {
    set((state) => ({ project: { ...state.project, aspect } }));
    persistSlice(get());
  },
  setLook: (look) => {
    set((state) => ({ project: { ...state.project, look } }));
    persistSlice(get());
  },
  setCaptionStyle: (captionStyle) => {
    set((state) => ({ project: { ...state.project, captionStyle } }));
    persistSlice(get());
  },
  setLang: (lang) => set({ lang }),
  saveSession: () => {
    const { project } = get();
    const text = project.script.trim();
    if (!text) return;
    const session: FlowSession = {
      id: uid("session"),
      title: text.split(/\s+/).slice(0, 8).join(" ") + (wordCount(text) > 8 ? "…" : ""),
      text,
      createdAt: Date.now(),
      durationMs: 0,
      wordCount: wordCount(text),
    };
    set((state) => ({ sessions: [session, ...state.sessions].slice(0, 40) }));
    persistSlice(get());
  },
  loadSession: (id) => {
    const session = get().sessions.find((item) => item.id === id);
    if (!session) return;
    set((state) => ({
      view: "flow",
      project: { ...state.project, script: session.text, updatedAt: Date.now() },
    }));
  },
  deleteSession: (id) => {
    set((state) => ({ sessions: state.sessions.filter((item) => item.id !== id) }));
    persistSlice(get());
  },
  cutFromScript: () => {
    const { project } = get();
    const captions = scriptToCues(project.script);
    const last = captions[captions.length - 1];
    const duration = last ? last.end + 0.4 : 8;
    const baseScenes = project.scenes.length ? project.scenes : sampleStills();
    const scenes = fitScenesToDuration(baseScenes, duration);
    set({
      view: "cut",
      playing: false,
      playhead: 0,
      project: {
        ...project,
        captions,
        scenes,
        overlays: project.overlays,
        updatedAt: Date.now(),
      },
    });
  },
  importFiles: async (files) => {
    const images: Scene[] = [];
    let voiceoverUrl: string | null = get().project.voiceoverUrl;
    let voiceoverName: string | null = get().project.voiceoverName;

    for (const file of files) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("audio/")) {
        voiceoverUrl = url;
        voiceoverName = file.name;
        continue;
      }
      if (file.type.startsWith("video/")) {
        const duration = await new Promise<number>((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = url;
          video.onloadedmetadata = () => resolve(Number.isFinite(video.duration) ? video.duration : 4);
          video.onerror = () => resolve(4);
        });
        images.push({
          id: uid("scene"),
          kind: "video",
          src: url,
          label: file.name,
          duration: Math.min(20, Math.max(1.6, duration)),
          kenBurns: kenForIndex(images.length),
        });
        continue;
      }
      if (file.type.startsWith("image/")) {
        images.push({
          id: uid("scene"),
          kind: "still",
          src: url,
          label: file.name,
          duration: 3.6,
          kenBurns: kenForIndex(images.length),
        });
      }
    }

    set((state) => ({
      view: "cut",
      project: {
        ...state.project,
        scenes: images.length ? [...state.project.scenes, ...images] : state.project.scenes,
        voiceoverUrl,
        voiceoverName,
        updatedAt: Date.now(),
      },
    }));
  },
  setVoiceover: (voiceoverUrl, voiceoverName) => {
    set((state) => ({ project: { ...state.project, voiceoverUrl, voiceoverName } }));
  },
  removeScene: (id) => {
    set((state) => {
      const next = state.project.scenes.filter((scene) => scene.id !== id);
      return { project: { ...state.project, scenes: next.length ? next : sampleStills() } };
    });
  },
  resetSample: () => {
    set({
      project: createSampleProject(),
      playhead: 0,
      playing: false,
      view: "cut",
    });
    persistSlice(get());
  },
  downloadTranscript: () => {
    const text = get().project.script.trim();
    if (!text) return;
    downloadBlob(new Blob([text], { type: "text/plain" }), "voice-and-vision.txt");
  },
  downloadSrt: () => {
    const srt = cuesToSrt(get().project.captions);
    if (!srt.trim()) return;
    downloadBlob(new Blob([srt], { type: "text/plain" }), "voice-and-vision.srt");
  },
  setExporting: (exporting, progress = 0) => set({ exporting, exportProgress: progress }),
}));
