import { create } from "zustand";
import {
  applyVoiceCommands,
  cuesToSrt,
  fitScenesToDuration,
  scratchLastSentence,
  scriptToCues,
  wordCount,
} from "@/lib/studio/captions";
import { validateMediaBatch, probeMediaFile } from "@/lib/studio/media-guard";
import { decodeFlowSessions, decodeProjectSnapshot } from "@/lib/studio/project-codec";
import {
  materializeMediaUrl,
  persistMediaFile,
  pruneMediaAssets,
} from "@/lib/studio/media-vault";
import {
  applyProjectCommand,
  normalizeProject,
  type ProjectCommand,
} from "@/lib/studio/project-engine";
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

const STORAGE_KEY = "vv-studio-v2";
const LEGACY_STORAGE_KEY = "vv-studio-v1";
const HISTORY_LIMIT = 80;

interface Persisted {
  version: 2;
  sessions: FlowSession[];
  project: Project;
  lang: string;
}

interface LegacyPersisted {
  sessions?: FlowSession[];
  script?: string;
  captionStyle?: CaptionStyleId;
  look?: LookId;
  aspect?: AspectId;
}

function serializableProject(project: Project): Project {
  return {
    ...project,
    voiceoverUrl:
      project.voiceoverAssetId || project.voiceoverUrl?.startsWith("blob:")
        ? null
        : project.voiceoverUrl,
    scenes: project.scenes.map((scene) => ({
      ...scene,
      src: scene.assetId || scene.src.startsWith("blob:") ? "" : scene.src,
    })),
  };
}

function readPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      if (parsed?.version === 2 && parsed.project) {
        const fallback = createSampleProject();
        return {
          version: 2,
          sessions: decodeFlowSessions(parsed.sessions),
          project: decodeProjectSnapshot(parsed.project, fallback),
          lang: typeof parsed.lang === "string" ? parsed.lang.slice(0, 32) : "en-US",
        };
      }
    }
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw) as LegacyPersisted;
    const sample = createSampleProject();
    return {
      version: 2,
      sessions: decodeFlowSessions(legacy.sessions),
      lang: "en-US",
      project: {
        ...sample,
        script: legacy.script ?? sample.script,
        captionStyle: legacy.captionStyle ?? sample.captionStyle,
        look: legacy.look ?? sample.look,
        aspect: legacy.aspect ?? sample.aspect,
      },
    };
  } catch {
    return null;
  }
}

async function materializeProject(project: Project): Promise<Project> {
  const scenes: Scene[] = [];
  for (const scene of project.scenes) {
    if (!scene.assetId) {
      if (scene.src) scenes.push(scene);
      continue;
    }
    try {
      const src = await materializeMediaUrl(scene.assetId);
      if (src) scenes.push({ ...scene, src });
    } catch {
      // Keep the project usable even if durable browser storage was cleared.
    }
  }

  let voiceoverUrl = project.voiceoverUrl;
  if (project.voiceoverAssetId) {
    try {
      voiceoverUrl = await materializeMediaUrl(project.voiceoverAssetId);
    } catch {
      voiceoverUrl = null;
    }
  }

  const materialized = normalizeProject({
    ...project,
    scenes: scenes.length ? scenes : sampleStills(),
    voiceoverUrl,
  });
  const keepIds = [
    ...materialized.scenes.map((scene) => scene.assetId).filter((id): id is string => Boolean(id)),
    ...(materialized.voiceoverAssetId ? [materialized.voiceoverAssetId] : []),
  ];
  void pruneMediaAssets(keepIds).catch(() => undefined);
  return materialized;
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
  undoStack: Project[];
  redoStack: Project[];
  lastImportErrors: string[];
  rehydrate: () => Promise<void>;
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
  applyEdit: (command: ProjectCommand) => void;
  undo: () => void;
  redo: () => void;
  downloadTranscript: () => void;
  downloadSrt: () => void;
  setExporting: (value: boolean, progress?: number) => void;
}

function persistSlice(state: StudioState) {
  if (typeof window === "undefined") return;
  const payload: Persisted = {
    version: 2,
    sessions: state.sessions,
    project: serializableProject(state.project),
    lang: state.lang,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Media blobs live in IndexedDB; if localStorage is unavailable the live project still works.
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

function pushHistory(state: StudioState, nextProject: Project): Partial<StudioState> {
  return {
    project: nextProject,
    undoStack: [...state.undoStack, state.project].slice(-HISTORY_LIMIT),
    redoStack: [],
  };
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
  undoStack: [],
  redoStack: [],
  lastImportErrors: [],

  rehydrate: async () => {
    const persisted = readPersisted();
    if (!persisted) return;
    const project = await materializeProject(persisted.project);
    set({
      sessions: persisted.sessions ?? [],
      project,
      lang: persisted.lang || "en-US",
      undoStack: [],
      redoStack: [],
    });
  },
  setView: (view) => set({ view }),
  setScript: (script) => {
    set((state) => pushHistory(state, { ...state.project, script, updatedAt: Date.now() }));
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
      return { ...pushHistory(state, { ...state.project, script, updatedAt: Date.now() }), interim: "" };
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
    set((state) => pushHistory(state, { ...state.project, aspect, updatedAt: Date.now() }));
    persistSlice(get());
  },
  setLook: (look) => {
    set((state) => pushHistory(state, { ...state.project, look, updatedAt: Date.now() }));
    persistSlice(get());
  },
  setCaptionStyle: (captionStyle) => {
    set((state) => pushHistory(state, { ...state.project, captionStyle, updatedAt: Date.now() }));
    persistSlice(get());
  },
  setLang: (lang) => {
    set({ lang });
    persistSlice(get());
  },
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
      ...pushHistory(state, { ...state.project, script: session.text, updatedAt: Date.now() }),
    }));
    persistSlice(get());
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
    const next = normalizeProject({
      ...project,
      captions,
      scenes,
      overlays: project.overlays,
      updatedAt: Date.now(),
    });
    set((state) => ({ view: "cut", playing: false, playhead: 0, ...pushHistory(state, next) }));
    persistSlice(get());
  },
  importFiles: async (files) => {
    const validation = validateMediaBatch(files);
    const accepted = new Map(validation.accepted.map((entry) => [entry.file, entry.kind]));
    const scenes: Scene[] = [];
    const errors = validation.rejected.map((item) => item.message);
    let voiceoverUrl: string | null = get().project.voiceoverUrl;
    let voiceoverName: string | null = get().project.voiceoverName;
    let voiceoverAssetId: string | null | undefined = get().project.voiceoverAssetId;

    for (const file of files) {
      const kind = accepted.get(file);
      if (!kind) continue;
      let probe;
      try {
        probe = await probeMediaFile(file, kind);
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "could not read media"}`);
        continue;
      }

      let assetId: string | undefined;
      try {
        assetId = (await persistMediaFile(file)).id;
      } catch {
        errors.push(`${file.name}: durable browser storage unavailable; this item will last for this session only.`);
      }
      const url = URL.createObjectURL(file);

      if (kind === "audio") {
        voiceoverUrl = url;
        voiceoverName = file.name;
        voiceoverAssetId = assetId ?? null;
        continue;
      }

      const duration = kind === "video"
        ? Math.min(20 * 60, Math.max(0.1, probe.duration as number))
        : 3.6;
      scenes.push({
        id: uid("scene"),
        kind: kind === "video" ? "video" : "still",
        src: url,
        label: file.name,
        duration,
        assetId,
        mime: file.type || undefined,
        sizeBytes: file.size,
        edit: kind === "video"
          ? {
              sourceDuration: probe.duration as number,
              trimStart: 0,
              trimEnd: probe.duration as number,
              playbackRate: 1,
              reverse: false,
              muted: false,
              freezeAt: null,
            }
          : undefined,
        kenBurns: kenForIndex(get().project.scenes.length + scenes.length),
      });
    }

    set((state) => {
      const next = normalizeProject({
        ...state.project,
        scenes: scenes.length ? [...state.project.scenes, ...scenes] : state.project.scenes,
        voiceoverUrl,
        voiceoverName,
        voiceoverAssetId,
        updatedAt: Date.now(),
      });
      return { view: "cut", lastImportErrors: errors, ...pushHistory(state, next) };
    });
    persistSlice(get());
  },
  setVoiceover: (voiceoverUrl, voiceoverName) => {
    set((state) => pushHistory(state, {
      ...state.project,
      voiceoverUrl,
      voiceoverName,
      voiceoverAssetId: null,
      updatedAt: Date.now(),
    }));
    persistSlice(get());
    if (!voiceoverUrl?.startsWith("blob:")) return;
    void fetch(voiceoverUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Could not read recorded voiceover.");
        return response.blob();
      })
      .then(async (blob) => {
        if (!blob.size) throw new Error("Recorded voiceover is empty.");
        const file = new File([blob], voiceoverName || "voiceover.webm", {
          type: blob.type || "audio/webm",
          lastModified: Date.now(),
        });
        const asset = await persistMediaFile(file);
        const state = get();
        if (state.project.voiceoverUrl !== voiceoverUrl) return;
        set({ project: { ...state.project, voiceoverAssetId: asset.id, updatedAt: Date.now() } });
        persistSlice(get());
      })
      .catch((error) => {
        set((state) => ({
          lastImportErrors: [
            ...state.lastImportErrors,
            error instanceof Error ? error.message : "Could not persist recorded voiceover.",
          ].slice(-20),
        }));
      });
  },
  removeScene: (id) => {
    const removed = get().project.scenes.find((scene) => scene.id === id);
    set((state) => {
      const nextScenes = state.project.scenes.filter((scene) => scene.id !== id);
      const next = { ...state.project, scenes: nextScenes.length ? nextScenes : sampleStills(), updatedAt: Date.now() };
      return pushHistory(state, normalizeProject(next));
    });
    void removed;
    persistSlice(get());
  },
  resetSample: () => {
    set((state) => ({
      ...pushHistory(state, createSampleProject()),
      playhead: 0,
      playing: false,
      view: "cut",
      lastImportErrors: [],
    }));
    persistSlice(get());
  },
  applyEdit: (command) => {
    set((state) => pushHistory(state, normalizeProject(applyProjectCommand(state.project, command))));
    persistSlice(get());
  },
  undo: () => {
    const state = get();
    const previous = state.undoStack[state.undoStack.length - 1];
    if (!previous) return;
    set({
      project: previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [state.project, ...state.redoStack].slice(0, HISTORY_LIMIT),
      playing: false,
      playhead: 0,
    });
    persistSlice(get());
  },
  redo: () => {
    const state = get();
    const next = state.redoStack[0];
    if (!next) return;
    set({
      project: next,
      undoStack: [...state.undoStack, state.project].slice(-HISTORY_LIMIT),
      redoStack: state.redoStack.slice(1),
      playing: false,
      playhead: 0,
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
