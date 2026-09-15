type SpeechRecCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  }
}

export function getSpeechRecognitionCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface DictationHandlers {
  onFinal: (transcript: string) => void;
  onInterim: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

export function startDictation(lang: string, handlers: DictationHandlers): { stop: () => void } | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    handlers.onError("Live dictation needs a Chromium or Safari browser.");
    return null;
  }

  let stopped = false;
  let rec: SpeechRecognitionLike | null = null;

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

  return {
    stop: () => {
      stopped = true;
      try {
        rec?.stop();
      } catch {
        /* already stopped */
      }
      handlers.onEnd();
    },
  };
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function speakText(opts: {
  text: string;
  voiceURI?: string;
  rate: number;
  pitch: number;
  onend?: () => void;
}): () => void {
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

export async function recordMicrophone(): Promise<{
  stop: () => Promise<Blob>;
  stream: MediaStream;
} | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.start();
  return {
    stream,
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        };
        if (recorder.state !== "inactive") recorder.stop();
        else {
          stream.getTracks().forEach((track) => track.stop());
          resolve(new Blob(chunks, { type: "audio/webm" }));
        }
      }),
  };
}
