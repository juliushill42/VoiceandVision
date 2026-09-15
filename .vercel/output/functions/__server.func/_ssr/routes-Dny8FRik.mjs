import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { r as Slot, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Captions, a as Square, c as Pause, d as ImagePlus, f as Film, g as Circle, h as Clapperboard, i as Trash2, l as Mic, m as Copy, n as Type, o as RotateCcw, p as Download, s as Play, t as Volume2, u as Library } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dny8FRik.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid(prefix = "id") {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function formatClock(seconds) {
	const safe = Math.max(0, seconds);
	const m = Math.floor(safe / 60);
	const s = Math.floor(safe % 60);
	const t = Math.floor(safe % 1 * 10);
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${t}`;
}
function formatSrtTime(seconds) {
	const safe = Math.max(0, seconds);
	const h = Math.floor(safe / 3600);
	const m = Math.floor(safe % 3600 / 60);
	const s = Math.floor(safe % 60);
	const ms = Math.floor(safe % 1 * 1e3);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}
function projectDuration(scenes) {
	return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:bg-accent/90",
			secondary: "bg-raised text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-raised/80",
			ghost: "text-muted hover:text-fg hover:bg-raised",
			record: "bg-record text-fg hover:bg-record/90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		ref,
		className: cn("flex min-h-32 w-full rounded-lg bg-raised px-4 py-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
});
Textarea.displayName = "Textarea";
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-raised text-muted",
		live: "bg-record/15 text-record",
		solid: "bg-accent text-accent-fg"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function getSpeechRecognitionCtor() {
	if (typeof window === "undefined") return null;
	return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}
function speechSupported() {
	return getSpeechRecognitionCtor() !== null;
}
function ttsSupported() {
	return typeof window !== "undefined" && "speechSynthesis" in window;
}
function startDictation(lang, handlers) {
	const Ctor = getSpeechRecognitionCtor();
	if (!Ctor) {
		handlers.onError("Live dictation needs a Chromium or Safari browser.");
		return null;
	}
	let stopped = false;
	let rec = null;
	const attach = () => {
		if (stopped) return;
		rec = new Ctor();
		rec.continuous = true;
		rec.interimResults = true;
		rec.lang = lang;
		rec.onresult = (event) => {
			let interim = "";
			let finals = "";
			for (let i = event.resultIndex; i < event.results.length; i += 1) {
				const piece = event.results[i][0]?.transcript ?? "";
				if (event.results[i].isFinal) finals += piece;
				else interim += piece;
			}
			if (finals) handlers.onFinal(finals);
			handlers.onInterim(interim);
		};
		rec.onerror = (event) => {
			if (event.error === "no-speech" || event.error === "aborted") return;
			if (event.error === "not-allowed") {
				handlers.onError("Microphone permission was blocked.");
				stopped = true;
				return;
			}
			handlers.onError(`Dictation stopped (${event.error}).`);
		};
		rec.onend = () => {
			if (stopped) {
				handlers.onEnd();
				return;
			}
			window.setTimeout(() => {
				if (stopped) return;
				try {
					attach();
				} catch {
					handlers.onEnd();
				}
			}, 120);
		};
		try {
			rec.start();
		} catch {
			handlers.onError("Could not start the microphone.");
			stopped = true;
			handlers.onEnd();
		}
	};
	attach();
	return { stop: () => {
		stopped = true;
		try {
			rec?.stop();
		} catch {}
		handlers.onEnd();
	} };
}
function listVoices() {
	if (!ttsSupported()) return [];
	return window.speechSynthesis.getVoices();
}
function speakText(opts) {
	if (!ttsSupported()) return () => {};
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(opts.text);
	const voices = window.speechSynthesis.getVoices();
	const voice = voices.find((item) => item.voiceURI === opts.voiceURI) ?? voices[0];
	if (voice) utterance.voice = voice;
	utterance.rate = opts.rate;
	utterance.pitch = opts.pitch;
	utterance.onend = () => opts.onend?.();
	window.speechSynthesis.speak(utterance);
	return () => {
		window.speechSynthesis.cancel();
		opts.onend?.();
	};
}
async function recordMicrophone() {
	if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
	const recorder = new MediaRecorder(stream, { mimeType: mime });
	const chunks = [];
	recorder.ondataavailable = (event) => {
		if (event.data.size) chunks.push(event.data);
	};
	recorder.start();
	return {
		stream,
		stop: () => new Promise((resolve) => {
			recorder.onstop = () => {
				stream.getTracks().forEach((track) => track.stop());
				resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
			};
			if (recorder.state !== "inactive") recorder.stop();
			else {
				stream.getTracks().forEach((track) => track.stop());
				resolve(new Blob(chunks, { type: "audio/webm" }));
			}
		})
	};
}
var COMMANDS = [
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
	[/\s+quote\b/gi, "\""],
	[/\s+apostrophe\b/gi, "'"]
];
function applyVoiceCommands(chunk) {
	let scratch = false;
	let text = chunk;
	if (/\bscratch that\b/i.test(text)) {
		scratch = true;
		text = text.replace(/\bscratch that\b/gi, " ");
	}
	for (const [pattern, replacement] of COMMANDS) text = text.replace(pattern, replacement);
	text = text.replace(/\s+([.,!?;:])/g, "$1");
	text = text.replace(/[ \t]+/g, " ");
	return {
		text: text.trim(),
		scratch
	};
}
function scratchLastSentence(source) {
	const trimmed = source.trimEnd();
	if (!trimmed) return "";
	const match = trimmed.match(/[.!?]\s+[^.!?]*$/);
	if (match && match.index !== void 0) return trimmed.slice(0, match.index + 1).trimEnd();
	const lastBreak = Math.max(trimmed.lastIndexOf("\n"), trimmed.lastIndexOf(". "));
	if (lastBreak > 0) return trimmed.slice(0, lastBreak + 1).trimEnd();
	return "";
}
function wordCount(text) {
	return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function scriptToCues(text, wordsPerSecond = 2.35) {
	const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
	if (!cleaned) return [];
	const sentences = cleaned.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
	const chunks = [];
	for (const sentence of sentences) {
		const words = sentence.split(/\s+/);
		if (words.length <= 8) {
			chunks.push(sentence);
			continue;
		}
		for (let i = 0; i < words.length; i += 6) chunks.push(words.slice(i, i + 6).join(" "));
	}
	let t = .12;
	return chunks.map((chunk) => {
		const words = chunk.split(/\s+/).filter(Boolean);
		const dur = Math.max(1.12, words.length / wordsPerSecond) + .1;
		const start = t;
		const end = t + dur;
		t = end + .06;
		const wordDur = words.length ? (end - start) / words.length : dur;
		return {
			id: uid("cue"),
			text: chunk,
			start,
			end,
			words: words.map((word, index) => ({
				text: word,
				start: start + index * wordDur,
				end: start + (index + 1) * wordDur
			}))
		};
	});
}
function cuesToSrt(cues) {
	return cues.map((cue, index) => {
		return `${index + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`;
	}).join("\n");
}
function fitScenesToDuration(scenes, duration) {
	if (!scenes.length) return scenes;
	const each = Math.max(1.6, duration / scenes.length);
	return scenes.map((scene) => ({
		...scene,
		duration: each
	}));
}
function sceneAtTime(scenes, time) {
	if (!scenes.length) return null;
	let cursor = 0;
	for (let index = 0; index < scenes.length; index += 1) {
		const scene = scenes[index];
		const next = cursor + scene.duration;
		if (time < next || index === scenes.length - 1) return {
			scene,
			index,
			local: Math.max(0, time - cursor),
			start: cursor
		};
		cursor = next;
	}
	return null;
}
var STILLS = [
	{
		id: "scene-control-room",
		src: "/stills/control-room.jpg",
		label: "Control room",
		duration: 3.4,
		kb: {
			fromScale: 1.08,
			toScale: 1.18,
			fromX: -.18,
			fromY: .04,
			toX: .12,
			toY: -.06
		}
	},
	{
		id: "scene-microphone",
		src: "/stills/microphone.jpg",
		label: "Microphone",
		duration: 5.4,
		kb: {
			fromScale: 1.12,
			toScale: 1.22,
			fromX: .1,
			fromY: .08,
			toX: -.16,
			toY: -.04
		}
	},
	{
		id: "scene-rooftop",
		src: "/stills/rooftop.jpg",
		label: "Rooftop",
		duration: 4.4,
		kb: {
			fromScale: 1.05,
			toScale: 1.16,
			fromX: -.2,
			fromY: 0,
			toX: .22,
			toY: .08
		}
	},
	{
		id: "scene-cutting-table",
		src: "/stills/cutting-table.jpg",
		label: "Cutting table",
		duration: 5.4,
		kb: {
			fromScale: 1.1,
			toScale: 1.2,
			fromX: .14,
			fromY: -.1,
			toX: -.1,
			toY: .12
		}
	},
	{
		id: "scene-stage",
		src: "/stills/stage.jpg",
		label: "Stage",
		duration: 4.6,
		kb: {
			fromScale: 1.06,
			toScale: 1.2,
			fromX: 0,
			fromY: .1,
			toX: 0,
			toY: -.16
		}
	}
];
var SAMPLE_SCRIPT = `You don't need a studio. You don't need a subscription. Speak, and the picture follows. Voice and Vision is the zero-dollar cut. Your microphone is the boom. Your browser is the bay. Record the thought. Burn the caption. Ship the frame.`;
function stillScene(entry) {
	return {
		id: entry.id,
		kind: "still",
		src: entry.src,
		label: entry.label,
		duration: entry.duration,
		kenBurns: entry.kb
	};
}
function sampleStills() {
	return STILLS.map(stillScene);
}
function createSampleProject() {
	return {
		id: "project-sample",
		title: "The zero-dollar studio",
		aspect: "9:16",
		script: SAMPLE_SCRIPT,
		scenes: sampleStills(),
		look: "tungsten",
		captionStyle: "karaoke",
		voiceoverUrl: null,
		voiceoverName: null,
		updatedAt: 0,
		overlays: [{
			id: "ov-title",
			text: "Voice & Vision",
			start: 0,
			end: 2.4,
			placement: "title"
		}, {
			id: "ov-lower",
			text: "On-device. No upload.",
			start: 20.2,
			end: 23.2,
			placement: "lower"
		}],
		captions: [
			cue("c1", .35, 3.15, "You don't need a studio."),
			cue("c2", 3.4, 6.2, "You don't need a subscription."),
			cue("c3", 6.35, 8.7, "Speak, and the picture follows."),
			cue("c4", 8.9, 12.6, "Voice and Vision is the zero-dollar cut."),
			cue("c5", 12.85, 15.4, "Your microphone is the boom."),
			cue("c6", 15.55, 18.15, "Your browser is the bay."),
			cue("c7", 18.35, 19.85, "Record the thought."),
			cue("c8", 20, 21.4, "Burn the caption."),
			cue("c9", 21.55, 23.2, "Ship the frame.")
		]
	};
}
function cue(id, start, end, text) {
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
			end: start + (index + 1) * wordDur
		}))
	};
}
var STORAGE_KEY = "vv-studio-v1";
function loadPersisted() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function persistSlice(state) {
	if (typeof window === "undefined") return;
	const payload = {
		sessions: state.sessions,
		script: state.project.script,
		captionStyle: state.project.captionStyle,
		look: state.project.look,
		aspect: state.project.aspect
	};
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {}
}
function kenForIndex(index) {
	const presets = [
		{
			fromScale: 1.08,
			toScale: 1.18,
			fromX: -.16,
			fromY: .04,
			toX: .14,
			toY: -.06
		},
		{
			fromScale: 1.12,
			toScale: 1.2,
			fromX: .12,
			fromY: .08,
			toX: -.14,
			toY: -.04
		},
		{
			fromScale: 1.05,
			toScale: 1.16,
			fromX: -.2,
			fromY: 0,
			toX: .18,
			toY: .08
		}
	];
	return presets[index % presets.length];
}
var useStudio = create((set, get) => ({
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
				aspect: persisted.aspect ?? state.project.aspect
			}
		}));
	},
	setView: (view) => set({ view }),
	setScript: (script) => {
		set((state) => ({ project: {
			...state.project,
			script,
			updatedAt: Date.now()
		} }));
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
			return {
				project: {
					...state.project,
					script,
					updatedAt: Date.now()
				},
				interim: ""
			};
		});
		persistSlice(get());
	},
	setInterim: (interim) => set({ interim }),
	setListening: (listening) => set({
		listening,
		interim: listening ? get().interim : ""
	}),
	setSpeaking: (speaking) => set({ speaking }),
	setRecording: (recording) => set({ recording }),
	setPlaying: (playing) => set({ playing }),
	setPlayhead: (playhead) => set({ playhead: Math.max(0, playhead) }),
	togglePlay: () => {
		const state = get();
		const duration = projectDuration(state.project.scenes);
		if (!state.playing && state.playhead >= duration - .05) {
			set({
				playing: true,
				playhead: 0
			});
			return;
		}
		set({ playing: !state.playing });
	},
	setAspect: (aspect) => {
		set((state) => ({ project: {
			...state.project,
			aspect
		} }));
		persistSlice(get());
	},
	setLook: (look) => {
		set((state) => ({ project: {
			...state.project,
			look
		} }));
		persistSlice(get());
	},
	setCaptionStyle: (captionStyle) => {
		set((state) => ({ project: {
			...state.project,
			captionStyle
		} }));
		persistSlice(get());
	},
	setLang: (lang) => set({ lang }),
	saveSession: () => {
		const { project } = get();
		const text = project.script.trim();
		if (!text) return;
		const session = {
			id: uid("session"),
			title: text.split(/\s+/).slice(0, 8).join(" ") + (wordCount(text) > 8 ? "…" : ""),
			text,
			createdAt: Date.now(),
			durationMs: 0,
			wordCount: wordCount(text)
		};
		set((state) => ({ sessions: [session, ...state.sessions].slice(0, 40) }));
		persistSlice(get());
	},
	loadSession: (id) => {
		const session = get().sessions.find((item) => item.id === id);
		if (!session) return;
		set((state) => ({
			view: "flow",
			project: {
				...state.project,
				script: session.text,
				updatedAt: Date.now()
			}
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
		const duration = last ? last.end + .4 : 8;
		const scenes = fitScenesToDuration(project.scenes.length ? project.scenes : sampleStills(), duration);
		set({
			view: "cut",
			playing: false,
			playhead: 0,
			project: {
				...project,
				captions,
				scenes,
				overlays: project.overlays,
				updatedAt: Date.now()
			}
		});
	},
	importFiles: async (files) => {
		const images = [];
		let voiceoverUrl = get().project.voiceoverUrl;
		let voiceoverName = get().project.voiceoverName;
		for (const file of files) {
			const url = URL.createObjectURL(file);
			if (file.type.startsWith("audio/")) {
				voiceoverUrl = url;
				voiceoverName = file.name;
				continue;
			}
			if (file.type.startsWith("video/")) {
				const duration = await new Promise((resolve) => {
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
					kenBurns: kenForIndex(images.length)
				});
				continue;
			}
			if (file.type.startsWith("image/")) images.push({
				id: uid("scene"),
				kind: "still",
				src: url,
				label: file.name,
				duration: 3.6,
				kenBurns: kenForIndex(images.length)
			});
		}
		set((state) => ({
			view: "cut",
			project: {
				...state.project,
				scenes: images.length ? [...state.project.scenes, ...images] : state.project.scenes,
				voiceoverUrl,
				voiceoverName,
				updatedAt: Date.now()
			}
		}));
	},
	setVoiceover: (voiceoverUrl, voiceoverName) => {
		set((state) => ({ project: {
			...state.project,
			voiceoverUrl,
			voiceoverName
		} }));
	},
	removeScene: (id) => {
		set((state) => {
			const next = state.project.scenes.filter((scene) => scene.id !== id);
			return { project: {
				...state.project,
				scenes: next.length ? next : sampleStills()
			} };
		});
	},
	resetSample: () => {
		set({
			project: createSampleProject(),
			playhead: 0,
			playing: false,
			view: "cut"
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
	setExporting: (exporting, progress = 0) => set({
		exporting,
		exportProgress: progress
	})
}));
function FlowView() {
	const script = useStudio((s) => s.project.script);
	const interim = useStudio((s) => s.interim);
	const listening = useStudio((s) => s.listening);
	const lang = useStudio((s) => s.lang);
	const setScript = useStudio((s) => s.setScript);
	const appendFinal = useStudio((s) => s.appendFinal);
	const setInterim = useStudio((s) => s.setInterim);
	const setListening = useStudio((s) => s.setListening);
	const cutFromScript = useStudio((s) => s.cutFromScript);
	const saveSession = useStudio((s) => s.saveSession);
	const downloadTranscript = useStudio((s) => s.downloadTranscript);
	const stopRef = (0, import_react.useRef)(null);
	const [supported, setSupported] = (0, import_react.useState)(false);
	const words = wordCount(script);
	(0, import_react.useEffect)(() => {
		setSupported(speechSupported());
		return () => {
			stopRef.current?.();
		};
	}, []);
	const toggleListen = () => {
		if (listening) {
			stopRef.current?.();
			stopRef.current = null;
			setListening(false);
			return;
		}
		if (!supported) {
			toast.message("Type instead — live dictation is not available in this browser.");
			return;
		}
		const handle = startDictation(lang, {
			onFinal: (text) => appendFinal(text),
			onInterim: (text) => setInterim(text),
			onError: (message) => {
				toast.message(message);
				setListening(false);
			},
			onEnd: () => setListening(false)
		});
		if (!handle) return;
		stopRef.current = handle.stop;
		setListening(true);
	};
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(script);
			toast.success("Transcript copied");
		} catch {
			toast.message("Could not copy.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full w-full max-w-5xl flex-col gap-6 p-4 md:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-widest text-subtle",
					children: "Flow"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-medium tracking-tight text-fg md:text-4xl",
					children: "Talk. Don't type."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl text-sm leading-relaxed text-muted text-pretty",
					children: "On-device dictation. Say “period”, “new paragraph”, or “scratch that”. Then send the words into the cut."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-h-0 flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center gap-5 rounded-xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: toggleListen,
						"aria-pressed": listening,
						"aria-label": listening ? "Stop dictation" : "Start dictation",
						className: cn("relative flex size-28 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.96]", listening ? "bg-record text-fg" : "bg-raised text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"),
						children: [listening ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-7 fill-current" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-8" }), listening ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 animate-ping rounded-full bg-record/30" }) : null]
					}),
					listening ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "live",
						children: "Listening"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "Ready" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-xs text-subtle",
						children: supported ? "Uses the speech engine already in your browser. Nothing is uploaded." : "Type the script if live dictation is unavailable. The cut still works."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex w-full flex-col gap-1.5 text-xs text-muted",
						children: ["Language", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: lang,
							onChange: (event) => useStudio.getState().setLang(event.target.value),
							className: "h-10 rounded-md bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "en-US",
									children: "English (US)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "en-GB",
									children: "English (UK)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "es-ES",
									children: "Spanish"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "fr-FR",
									children: "French"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "de-DE",
									children: "German"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "pt-BR",
									children: "Portuguese"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ja-JP",
									children: "Japanese"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "zh-CN",
									children: "Chinese"
								})
							]
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-col gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [words, " words"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: copy,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), " Copy"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: downloadTranscript,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), " Text"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									size: "sm",
									onClick: saveSession,
									children: "Save"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									onClick: cutFromScript,
									disabled: !script.trim(),
									children: "Send to cut"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: script,
						onChange: (event) => setScript(event.target.value),
						placeholder: "Start speaking, or write here.",
						className: "min-h-64 flex-1 resize-none bg-bg font-display text-lg leading-relaxed md:min-h-80 md:text-xl"
					}),
					interim ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm italic text-subtle",
						children: interim
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-subtle",
						children: "Voice commands: period, comma, question mark, new paragraph, scratch that."
					})
				]
			})]
		})]
	});
}
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1 w-full grow overflow-hidden rounded-full bg-raised",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-accent" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg shadow-sm transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" })]
}));
Slider.displayName = Slider$1.displayName;
function VoiceView() {
	const script = useStudio((s) => s.project.script);
	const speaking = useStudio((s) => s.speaking);
	const recording = useStudio((s) => s.recording);
	const voiceoverName = useStudio((s) => s.project.voiceoverName);
	const setSpeaking = useStudio((s) => s.setSpeaking);
	const setRecording = useStudio((s) => s.setRecording);
	const setVoiceover = useStudio((s) => s.setVoiceover);
	const setView = useStudio((s) => s.setView);
	const [voices, setVoices] = (0, import_react.useState)([]);
	const [voiceURI, setVoiceURI] = (0, import_react.useState)("");
	const [rate, setRate] = (0, import_react.useState)(1);
	const [pitch, setPitch] = (0, import_react.useState)(1);
	const stopSpeak = (0, import_react.useRef)(null);
	const recorder = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!ttsSupported()) return;
		const load = () => setVoices(listVoices());
		load();
		window.speechSynthesis.onvoiceschanged = load;
		return () => {
			window.speechSynthesis.onvoiceschanged = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (voices.length && !voiceURI) setVoiceURI(voices[0].voiceURI);
	}, [voices, voiceURI]);
	const play = () => {
		if (!script.trim()) {
			toast.message("Write or dictate a script first.");
			return;
		}
		if (speaking) {
			stopSpeak.current?.();
			stopSpeak.current = null;
			setSpeaking(false);
			return;
		}
		setSpeaking(true);
		stopSpeak.current = speakText({
			text: script,
			voiceURI,
			rate,
			pitch,
			onend: () => setSpeaking(false)
		});
	};
	const toggleRecord = async () => {
		if (recording && recorder.current) {
			const blob = await recorder.current.stop();
			recorder.current = null;
			setRecording(false);
			const url = URL.createObjectURL(blob);
			setVoiceover(url, "Recorded voiceover");
			toast.success("Voiceover attached to the cut");
			return;
		}
		try {
			const handle = await recordMicrophone();
			if (!handle) {
				toast.message("Microphone is not available.");
				return;
			}
			recorder.current = handle;
			setRecording(true);
		} catch {
			toast.message("Microphone permission was blocked.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full w-full max-w-3xl flex-col gap-6 p-4 md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.18em] text-subtle",
						children: "Voice"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl font-medium tracking-tight text-fg md:text-4xl",
						children: "Read it back. Or record it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-xl text-sm leading-relaxed text-muted text-pretty",
						children: "Preview with the system voice, then record your own take. The file never leaves this device."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 font-display text-xl leading-relaxed text-fg text-pretty md:text-2xl",
					children: script.trim() || "Dictate or write a script in Flow first."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "live",
						children: "Recording"
					}) : null, voiceoverName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: voiceoverName }) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1.5 text-xs text-muted",
						children: ["System voice", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: voiceURI,
							onChange: (event) => setVoiceURI(event.target.value),
							className: "h-11 rounded-md bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
							disabled: !voices.length,
							children: voices.length ? voices.map((voice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: voice.voiceURI,
								children: [
									voice.name,
									" (",
									voice.lang,
									")"
								]
							}, voice.voiceURI)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "No system voices"
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-2 text-xs text-muted",
							children: [
								"Rate ",
								rate.toFixed(2),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									min: .6,
									max: 1.4,
									step: .05,
									value: [rate],
									onValueChange: (v) => setRate(v[0] ?? 1)
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-2 text-xs text-muted",
							children: [
								"Pitch ",
								pitch.toFixed(2),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									min: .7,
									max: 1.4,
									step: .05,
									value: [pitch],
									onValueChange: (v) => setPitch(v[0] ?? 1)
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: play,
								disabled: !ttsSupported(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {}), speaking ? "Stop" : "Speak script"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: recording ? "record" : "secondary",
								onClick: () => void toggleRecord(),
								children: [recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "fill-current" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "size-3.5 fill-current" }), recording ? "Stop record" : "Record voiceover"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								onClick: () => setView("cut"),
								children: "Open cut"
							})
						]
					})
				]
			})
		]
	});
}
var ASPECT_SIZE = {
	"9:16": {
		w: 720,
		h: 1280
	},
	"16:9": {
		w: 1280,
		h: 720
	},
	"1:1": {
		w: 1080,
		h: 1080
	}
};
var LOOKS = [
	{
		id: "native",
		label: "Native"
	},
	{
		id: "tungsten",
		label: "Tungsten"
	},
	{
		id: "silver",
		label: "Silver"
	},
	{
		id: "night",
		label: "Night"
	},
	{
		id: "paper",
		label: "Paper"
	}
];
var CAPTION_STYLES = [
	{
		id: "clean",
		label: "Clean"
	},
	{
		id: "box",
		label: "Box"
	},
	{
		id: "editorial",
		label: "Editorial"
	},
	{
		id: "karaoke",
		label: "Karaoke"
	}
];
var ASPECTS = [
	{
		id: "9:16",
		label: "9:16"
	},
	{
		id: "16:9",
		label: "16:9"
	},
	{
		id: "1:1",
		label: "1:1"
	}
];
var LOOK_FILTER = {
	native: "none",
	tungsten: "sepia(0.22) saturate(1.12) contrast(1.06) brightness(1.03)",
	silver: "grayscale(0.42) contrast(1.16) brightness(0.98) saturate(0.4)",
	night: "contrast(1.22) brightness(0.82) saturate(0.72)",
	paper: "contrast(0.92) brightness(1.1) saturate(0.55)"
};
var grainCanvas = null;
function getGrain(size = 256) {
	if (grainCanvas) return grainCanvas;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	const img = ctx.createImageData(size, size);
	for (let i = 0; i < img.data.length; i += 4) {
		const v = 90 + Math.random() * 80;
		img.data[i] = v;
		img.data[i + 1] = v;
		img.data[i + 2] = v;
		img.data[i + 3] = 38;
	}
	ctx.putImageData(img, 0, 0);
	grainCanvas = canvas;
	return canvas;
}
function coverDraw(ctx, source, iw, ih, cw, ch, t, kb) {
	const u = Math.min(1, Math.max(0, t));
	const scale = kb.fromScale + (kb.toScale - kb.fromScale) * u;
	const panX = kb.fromX + (kb.toX - kb.fromX) * u;
	const panY = kb.fromY + (kb.toY - kb.fromY) * u;
	const imgAspect = iw / Math.max(1, ih);
	const canvasAspect = cw / ch;
	let dw;
	let dh;
	if (imgAspect > canvasAspect) {
		dh = ch * scale;
		dw = dh * imgAspect;
	} else {
		dw = cw * scale;
		dh = dw / imgAspect;
	}
	const extraX = Math.max(0, dw - cw);
	const extraY = Math.max(0, dh - ch);
	const x = (cw - dw) / 2 + panX * extraX * .5;
	const y = (ch - dh) / 2 + panY * extraY * .5;
	ctx.drawImage(source, x, y, dw, dh);
}
function wrapLines(ctx, text, maxWidth) {
	const words = text.split(/\s+/);
	const lines = [];
	let current = "";
	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (ctx.measureText(next).width > maxWidth && current) {
			lines.push(current);
			current = word;
		} else current = next;
	}
	if (current) lines.push(current);
	return lines;
}
function drawRoundedRect(ctx, x, y, w, h, r) {
	const radius = Math.min(r, h / 2, w / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}
function drawCaptions(ctx, project, time, w, h) {
	const cue = project.captions.find((item) => time >= item.start && time < item.end);
	if (!cue) return;
	const style = project.captionStyle;
	const maxWidth = w * .86;
	const baseSize = style === "editorial" ? Math.round(w * .062) : Math.round(w * .048);
	const fontFamily = style === "editorial" ? "Newsreader, Georgia, serif" : "Outfit, system-ui, sans-serif";
	ctx.textBaseline = "alphabetic";
	ctx.font = `${style === "editorial" ? 500 : 600} ${baseSize}px ${fontFamily}`;
	const lines = wrapLines(ctx, cue.text, maxWidth);
	const lineHeight = baseSize * 1.28;
	const blockH = lines.length * lineHeight;
	const y = h - (style === "editorial" ? h * .16 : h * .12) - blockH + lineHeight * .8;
	const x = style === "editorial" ? w * .08 : w / 2;
	ctx.textAlign = style === "editorial" ? "left" : "center";
	if (style === "box") {
		const widths = lines.map((line) => ctx.measureText(line).width);
		const boxW = Math.max(...widths, 0) + 36;
		const boxH = blockH + 28;
		const boxX = (w - boxW) / 2;
		const boxY = y - lineHeight * .85;
		ctx.fillStyle = "rgba(10,10,11,0.78)";
		drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 14);
		ctx.fill();
	}
	lines.forEach((line, lineIndex) => {
		const drawY = y + lineIndex * lineHeight;
		if (style === "karaoke") {
			const lineWords = line.split(/\s+/);
			const lineWidth = ctx.measureText(line).width;
			let cursor = w / 2 - lineWidth / 2;
			ctx.textAlign = "left";
			lineWords.forEach((word, wi) => {
				const globalIndex = lines.slice(0, lineIndex).reduce((n, l) => n + l.split(/\s+/).length, 0) + wi;
				const meta = cue.words[globalIndex];
				const active = meta ? time >= meta.start && time < meta.end : false;
				const spoken = meta ? time >= meta.end : false;
				ctx.fillStyle = active ? "#f4f4f5" : spoken ? "rgba(244,244,245,0.92)" : "rgba(244,244,245,0.42)";
				ctx.shadowColor = "rgba(0,0,0,0.85)";
				ctx.shadowBlur = 10;
				ctx.fillText(word, cursor, drawY);
				cursor += ctx.measureText(`${word} `).width;
			});
			ctx.shadowBlur = 0;
			ctx.textAlign = "center";
			return;
		}
		ctx.shadowColor = "rgba(0,0,0,0.8)";
		ctx.shadowBlur = style === "box" ? 0 : 12;
		ctx.fillStyle = "#f4f4f5";
		ctx.fillText(line, x, drawY);
		ctx.shadowBlur = 0;
	});
}
function drawOverlays(ctx, overlays, time, w, h) {
	for (const overlay of overlays) {
		if (time < overlay.start || time >= overlay.end) continue;
		const fadeIn = Math.min(1, (time - overlay.start) / .35);
		const fadeOut = Math.min(1, (overlay.end - time) / .35);
		const alpha = Math.min(fadeIn, fadeOut);
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.fillStyle = "#f4f4f5";
		ctx.textAlign = "center";
		if (overlay.placement === "title") {
			ctx.font = `500 ${Math.round(w * .09)}px Newsreader, Georgia, serif`;
			ctx.textBaseline = "middle";
			ctx.shadowColor = "rgba(0,0,0,0.65)";
			ctx.shadowBlur = 18;
			ctx.fillText(overlay.text, w / 2, h * .46);
		} else if (overlay.placement === "center") {
			ctx.font = `500 ${Math.round(w * .055)}px Outfit, system-ui, sans-serif`;
			ctx.textBaseline = "middle";
			ctx.fillText(overlay.text, w / 2, h * .5);
		} else {
			ctx.font = `500 ${Math.round(w * .032)}px Outfit, system-ui, sans-serif`;
			ctx.textBaseline = "alphabetic";
			ctx.fillStyle = "rgba(244,244,245,0.78)";
			ctx.fillText(overlay.text.toUpperCase(), w / 2, h * .9);
		}
		ctx.restore();
	}
}
function drawVignette(ctx, w, h) {
	const g = ctx.createRadialGradient(w / 2, h / 2, w * .18, w / 2, h / 2, w * .78);
	g.addColorStop(0, "rgba(0,0,0,0)");
	g.addColorStop(1, "rgba(0,0,0,0.42)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
}
function syncVideoMedia(project, time, media) {
	const hit = sceneAtTime(project.scenes, time);
	media.forEach((el, id) => {
		if (!(el instanceof HTMLVideoElement)) return;
		if (!hit || hit.scene.id !== id) return;
		if (Math.abs(el.currentTime - hit.local) > .18) try {
			el.currentTime = hit.local;
		} catch {}
	});
}
function renderFrame(ctx, project, time, media) {
	const { w, h } = ASPECT_SIZE[project.aspect];
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "#0a0a0b";
	ctx.fillRect(0, 0, w, h);
	const hit = sceneAtTime(project.scenes, time);
	ctx.filter = LOOK_FILTER[project.look];
	if (hit) {
		const el = media.get(hit.scene.id);
		const u = hit.scene.duration > 0 ? hit.local / hit.scene.duration : 0;
		if (el && el instanceof HTMLVideoElement && el.readyState >= 2) coverDraw(ctx, el, el.videoWidth || w, el.videoHeight || h, w, h, u, hit.scene.kenBurns);
		else if (el && el instanceof HTMLImageElement && el.complete && el.naturalWidth) coverDraw(ctx, el, el.naturalWidth, el.naturalHeight, w, h, u, hit.scene.kenBurns);
		else {
			ctx.filter = "none";
			ctx.fillStyle = "#121214";
			ctx.fillRect(0, 0, w, h);
		}
	}
	ctx.filter = "none";
	drawVignette(ctx, w, h);
	const grain = getGrain();
	ctx.save();
	ctx.globalAlpha = .18;
	ctx.globalCompositeOperation = "overlay";
	const ox = -(time * 37 % 24);
	const oy = -(time * 19 % 24);
	ctx.drawImage(grain, ox, oy, w + 48, h + 48);
	ctx.restore();
	drawOverlays(ctx, project.overlays, time, w, h);
	drawCaptions(ctx, project, time, w, h);
}
async function exportWebm(project, media, duration, onProgress, audio) {
	const { w, h } = ASPECT_SIZE[project.aspect];
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas is unavailable in this browser.");
	const canvasStream = canvas.captureStream(30);
	let stream = canvasStream;
	let audioCtx = null;
	if (audio && audio.src) {
		audioCtx = new AudioContext();
		const dest = audioCtx.createMediaStreamDestination();
		const source = audioCtx.createMediaElementSource(audio);
		source.connect(dest);
		source.connect(audioCtx.destination);
		const tracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
		stream = new MediaStream(tracks);
		audio.currentTime = 0;
		await audio.play().catch(() => void 0);
	}
	const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
	const chunks = [];
	const recorder = new MediaRecorder(stream, {
		mimeType: mime,
		videoBitsPerSecond: 6e6
	});
	recorder.ondataavailable = (event) => {
		if (event.data.size) chunks.push(event.data);
	};
	const finished = new Promise((resolve, reject) => {
		recorder.onerror = () => reject(/* @__PURE__ */ new Error("Export failed while recording."));
		recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
	});
	recorder.start(250);
	const started = performance.now();
	await new Promise((resolve) => {
		const tick = () => {
			const elapsed = (performance.now() - started) / 1e3;
			const t = Math.min(duration, elapsed);
			syncVideoMedia(project, t, media);
			renderFrame(ctx, project, t, media);
			onProgress(duration > 0 ? t / duration : 1);
			if (t >= duration) {
				resolve();
				return;
			}
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
	if (recorder.state !== "inactive") recorder.stop();
	const blob = await finished;
	audio?.pause();
	await audioCtx?.close().catch(() => void 0);
	canvasStream.getTracks().forEach((track) => track.stop());
	return blob;
}
function PreviewStage({ media, onToggle }) {
	const canvasRef = (0, import_react.useRef)(null);
	const mediaRef = (0, import_react.useRef)(media);
	mediaRef.current = media;
	const project = useStudio((s) => s.project);
	const playhead = useStudio((s) => s.playhead);
	const playing = useStudio((s) => s.playing);
	const size = ASPECT_SIZE[project.aspect];
	const duration = projectDuration(project.scenes);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvas.width = size.w;
		canvas.height = size.h;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let raf = 0;
		let last = performance.now();
		const tick = (now) => {
			const dt = Math.min(.08, (now - last) / 1e3);
			last = now;
			const state = useStudio.getState();
			const dur = projectDuration(state.project.scenes);
			let time = state.playhead;
			if (state.playing) {
				const audio = document.querySelector("[data-vv-voiceover]");
				if (audio && state.project.voiceoverUrl && !audio.paused) time = audio.currentTime;
				else time += dt;
				if (time >= dur) {
					time = dur;
					state.setPlaying(false);
				}
				if (time !== state.playhead) state.setPlayhead(time);
			}
			renderFrame(ctx, state.project, time, mediaRef.current);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [size.w, size.h]);
	(0, import_react.useEffect)(() => {
		const hit = sceneAtTime(project.scenes, playhead);
		media.forEach((el, id) => {
			if (!(el instanceof HTMLVideoElement)) return;
			if (!hit || hit.scene.id !== id) {
				if (!el.paused) el.pause();
				return;
			}
			if (Math.abs(el.currentTime - hit.local) > .3) try {
				el.currentTime = hit.local;
			} catch {}
			if (playing && el.paused) el.play().catch(() => void 0);
			if (!playing && !el.paused) el.pause();
		});
	}, [
		playhead,
		playing,
		media,
		project.scenes
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-col gap-3 lg:flex-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex h-72 items-center justify-center overflow-hidden rounded-xl bg-bg shadow-[0_0_0_1px_rgba(255,255,255,0.06)] lg:h-auto lg:min-h-96 lg:flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "h-full w-auto max-w-full bg-bg object-contain",
				style: { aspectRatio: `${size.w} / ${size.h}` },
				"aria-label": "Picture preview"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onToggle,
				className: "absolute inset-0 flex items-center justify-center bg-transparent",
				"aria-label": playing ? "Pause" : "Play",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("flex size-14 items-center justify-center rounded-full bg-fg/90 text-accent-fg transition-opacity duration-150", playing ? "opacity-0 hover:opacity-100" : "opacity-100"),
					children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5 translate-x-px" })
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				onClick: onToggle,
				"aria-label": playing ? "Pause" : "Play",
				children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "translate-x-px" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono text-xs tabular-nums text-muted",
				children: [
					formatClock(playhead),
					" / ",
					formatClock(duration)
				]
			})]
		})]
	});
}
function Segmented({ value, options, onChange, ariaLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "tablist",
		"aria-label": ariaLabel,
		className: "flex flex-wrap gap-1 rounded-lg bg-raised p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
		children: options.map((option) => {
			const active = option.id === value;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "tab",
				"aria-selected": active,
				onClick: () => onChange(option.id),
				className: cn("h-8 min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors duration-150", active ? "bg-bg text-fg" : "text-muted hover:text-fg"),
				children: option.label
			}, option.id);
		})
	});
}
function Timeline({ project, playhead, onSeek }) {
	const trackRef = (0, import_react.useRef)(null);
	const duration = Math.max(.01, projectDuration(project.scenes));
	const ratio = Math.min(1, playhead / duration);
	const hit = sceneAtTime(project.scenes, playhead);
	const seekFromEvent = (clientX) => {
		const el = trackRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		onSeek(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * duration);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2 rounded-xl bg-surface p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium text-muted",
				children: "Timeline"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-xs tabular-nums text-subtle",
				children: [
					hit ? hit.scene.label : "—",
					" · ",
					formatClock(duration)
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: trackRef,
			className: "relative h-16 cursor-pointer overflow-hidden rounded-md bg-raised",
			onPointerDown: (event) => {
				event.currentTarget.setPointerCapture(event.pointerId);
				seekFromEvent(event.clientX);
			},
			onPointerMove: (event) => {
				if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromEvent(event.clientX);
			},
			role: "slider",
			"aria-label": "Playhead",
			"aria-valuemin": 0,
			"aria-valuemax": duration,
			"aria-valuenow": playhead,
			tabIndex: 0,
			onKeyDown: (event) => {
				if (event.key === "ArrowLeft") onSeek(Math.max(0, playhead - .5));
				if (event.key === "ArrowRight") onSeek(Math.min(duration, playhead + .5));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex",
					children: project.scenes.map((scene, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("relative h-full overflow-hidden border-r border-bg last:border-r-0", hit?.scene.id === scene.id ? "bg-raised" : "bg-bg"),
						style: { width: `${scene.duration / duration * 100}%` },
						children: [scene.kind !== "solid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: scene.src,
							alt: "",
							className: "h-full w-full object-cover opacity-70",
							draggable: false
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute bottom-1 left-1.5 font-mono text-xs text-fg/90",
							children: index + 1
						})]
					}, scene.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-bg/50",
					children: project.captions.map((cue) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-0 h-full bg-accent/70",
						style: {
							left: `${cue.start / duration * 100}%`,
							width: `${(cue.end - cue.start) / duration * 100}%`
						}
					}, cue.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute top-0 z-10 h-full w-px bg-fg",
					style: { left: `${ratio * 100}%` },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-fg" })
				})
			]
		})]
	});
}
function useMedia(scenes) {
	const [map, setMap] = (0, import_react.useState)(() => /* @__PURE__ */ new Map());
	const key = scenes.map((scene) => `${scene.id}:${scene.src}`).join("|");
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const loaders = scenes.map(async (scene) => {
			if (scene.kind === "video") {
				const video = document.createElement("video");
				video.src = scene.src;
				video.crossOrigin = "anonymous";
				video.muted = true;
				video.playsInline = true;
				video.preload = "auto";
				await new Promise((resolve) => {
					video.onloadeddata = () => resolve();
					video.onerror = () => resolve();
				});
				return [scene.id, video];
			}
			const image = new Image();
			image.crossOrigin = "anonymous";
			image.src = scene.src;
			try {
				await image.decode();
			} catch {
				await new Promise((resolve) => {
					image.onload = () => resolve();
					image.onerror = () => resolve();
				});
			}
			return [scene.id, image];
		});
		Promise.all(loaders).then((entries) => {
			if (cancelled) return;
			setMap(new Map(entries));
		});
		return () => {
			cancelled = true;
		};
	}, [key, scenes]);
	return map;
}
function CutView() {
	const project = useStudio((s) => s.project);
	const playhead = useStudio((s) => s.playhead);
	const exporting = useStudio((s) => s.exporting);
	const exportProgress = useStudio((s) => s.exportProgress);
	const togglePlay = useStudio((s) => s.togglePlay);
	const setPlayhead = useStudio((s) => s.setPlayhead);
	const setPlaying = useStudio((s) => s.setPlaying);
	const setAspect = useStudio((s) => s.setAspect);
	const setLook = useStudio((s) => s.setLook);
	const setCaptionStyle = useStudio((s) => s.setCaptionStyle);
	const importFiles = useStudio((s) => s.importFiles);
	const removeScene = useStudio((s) => s.removeScene);
	const resetSample = useStudio((s) => s.resetSample);
	const cutFromScript = useStudio((s) => s.cutFromScript);
	const downloadSrt = useStudio((s) => s.downloadSrt);
	const setExporting = useStudio((s) => s.setExporting);
	const media = useMedia(project.scenes);
	const fileRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const duration = projectDuration(project.scenes);
	const exportCut = async () => {
		if (exporting) return;
		setPlaying(false);
		setExporting(true, 0);
		try {
			downloadBlob(await exportWebm(project, media, duration, (ratio) => setExporting(true, ratio), audioRef.current), "voice-and-vision.webm");
			toast.success("Export ready");
		} catch (error) {
			toast.message(error instanceof Error ? error.message : "Export failed.");
		} finally {
			setExporting(false, 0);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col gap-3 p-3 md:p-4",
		children: [
			project.voiceoverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				"data-vv-voiceover": true,
				src: project.voiceoverUrl,
				preload: "auto",
				className: "hidden"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_280px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewStage, {
					media,
					onToggle: togglePlay
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-medium uppercase tracking-widest text-subtle",
							children: "Frame"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: project.aspect,
							options: ASPECTS,
							onChange: setAspect,
							ariaLabel: "Aspect"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-medium uppercase tracking-widest text-subtle",
							children: "Look"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: project.look,
							options: LOOKS,
							onChange: setLook,
							ariaLabel: "Look"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-medium uppercase tracking-widest text-subtle",
							children: "Captions"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: project.captionStyle,
							options: CAPTION_STYLES,
							onChange: setCaptionStyle,
							ariaLabel: "Caption style"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2 pt-1 lg:flex lg:flex-col",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									onClick: cutFromScript,
									disabled: !project.script.trim(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Captions, {}), " Recut captions"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => fileRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {}), " Import media"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => void exportCut(),
									disabled: exporting,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, {}),
										" ",
										exporting ? `Export ${Math.round(exportProgress * 100)}%` : "Export WebM"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: downloadSrt,
									disabled: !project.captions.length,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), " Captions SRT"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: resetSample,
									className: "col-span-2 lg:col-span-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), " Restore sample"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileRef,
									type: "file",
									accept: "image/*,video/*,audio/*",
									multiple: true,
									className: "hidden",
									onChange: (event) => {
										const files = event.target.files;
										if (files?.length) importFiles(Array.from(files));
										event.currentTarget.value = "";
									}
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "hidden flex-col gap-1 pt-2 lg:flex",
							children: project.scenes.map((scene) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-2 rounded-md bg-raised px-2 py-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate text-xs text-fg",
									children: scene.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex size-8 items-center justify-center rounded-md text-muted hover:text-fg",
									"aria-label": `Remove ${scene.label}`,
									onClick: () => removeScene(scene.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
								})]
							}, scene.id))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timeline, {
				project,
				playhead,
				onSeek: (time) => {
					setPlaying(false);
					setPlayhead(time);
					const audio = audioRef.current;
					if (audio) try {
						audio.currentTime = time;
					} catch {}
				}
			})
		]
	});
}
function LibraryView() {
	const sessions = useStudio((s) => s.sessions);
	const loadSession = useStudio((s) => s.loadSession);
	const deleteSession = useStudio((s) => s.deleteSession);
	const cutFromScript = useStudio((s) => s.cutFromScript);
	const setView = useStudio((s) => s.setView);
	const resetSample = useStudio((s) => s.resetSample);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full w-full max-w-3xl flex-col gap-6 p-4 md:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-subtle",
					children: "Library"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-medium tracking-tight text-fg md:text-4xl",
					children: "Stays on this device."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl text-sm leading-relaxed text-muted text-pretty",
					children: "Saved transcripts live in this browser. No account. No cloud."
				})
			]
		}), sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-start gap-4 rounded-xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No saved sessions yet. Dictate in Flow, then save."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => setView("flow"),
					children: "Open Flow"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					onClick: resetSample,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, {}), " Play sample cut"]
				})]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex flex-col gap-2",
			children: sessions.map((session) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium text-fg",
						children: session.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-subtle",
						children: [
							session.wordCount,
							" words · ",
							new Date(session.createdAt).toLocaleString()
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => {
								loadSession(session.id);
							},
							children: "Open"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => {
								loadSession(session.id);
								cutFromScript();
							},
							children: "Send to cut"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "icon-sm",
							variant: "ghost",
							"aria-label": "Delete session",
							onClick: () => deleteSession(session.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
						})
					]
				})]
			}, session.id))
		})]
	});
}
var TooltipProvider = Provider;
var Tooltip = Root3;
var TooltipTrigger = Trigger;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 8, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md bg-raised px-2.5 py-1.5 text-xs text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]", className),
	...props
}) }));
TooltipContent.displayName = Content2.displayName;
var NAV = [
	{
		id: "flow",
		label: "Flow",
		icon: Mic
	},
	{
		id: "voice",
		label: "Voice",
		icon: Volume2
	},
	{
		id: "cut",
		label: "Cut",
		icon: Clapperboard
	},
	{
		id: "library",
		label: "Library",
		icon: Library
	}
];
function StudioApp() {
	const view = useStudio((s) => s.view);
	const setView = useStudio((s) => s.setView);
	const playing = useStudio((s) => s.playing);
	const togglePlay = useStudio((s) => s.togglePlay);
	const rehydrate = useStudio((s) => s.rehydrate);
	(0, import_react.useEffect)(() => {
		rehydrate();
	}, [rehydrate]);
	(0, import_react.useEffect)(() => {
		const audio = document.querySelector("[data-vv-voiceover]");
		if (!audio) return;
		if (playing) {
			const state = useStudio.getState();
			try {
				audio.currentTime = state.playhead;
			} catch {}
			audio.play().catch(() => void 0);
		} else audio.pause();
	}, [playing]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			const typing = target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable);
			if (event.key === " " && !typing) {
				event.preventDefault();
				togglePlay();
			}
			if (typing) return;
			if (event.key === "1") setView("flow");
			if (event.key === "2") setView("voice");
			if (event.key === "3") setView("cut");
			if (event.key === "4") setView("library");
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [setView, togglePlay]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-dvh flex-col bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-base font-medium leading-none tracking-tight",
								children: "Voice & Vision"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 hidden text-xs text-subtle sm:block",
								children: "Zero-dollar studio"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-xs text-subtle md:block",
						children: "On-device. No upload."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Studio",
						className: "hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-border py-3 md:flex",
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setView(item.id),
								"aria-current": view === item.id,
								className: cn("flex size-11 items-center justify-center rounded-lg transition-colors duration-150", view === item.id ? "bg-raised text-fg" : "text-muted hover:text-fg"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: item.label
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, {
							side: "right",
							children: item.label
						})] }, item.id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0",
						children: [
							view === "flow" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowView, {}) : null,
							view === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceView, {}) : null,
							view === "cut" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CutView, {}) : null,
							view === "library" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LibraryView, {}) : null
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Studio mobile",
					className: "fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden",
					children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setView(item.id),
						className: cn("flex h-14 flex-col items-center justify-center gap-1 text-xs", view === item.id ? "text-fg" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-4" }), item.label]
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "bottom-right",
					toastOptions: { classNames: { toast: "bg-raised text-fg border-border" } }
				})
			]
		})
	});
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: "size-8 shrink-0",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			width: "32",
			height: "32",
			rx: "8",
			className: "fill-raised"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M9 22V10h2.2l4.8 8.4L20.8 10H23v12h-2.1v-7.6L16.6 22h-1.2l-4.3-7.6V22H9z",
			className: "fill-fg"
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioApp, {});
}
//#endregion
export { Home as component };
