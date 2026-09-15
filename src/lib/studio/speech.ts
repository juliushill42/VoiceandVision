import { preferredAudioRecorderMime } from "./media-guard.ts";

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
  let restartAttempt = 0;
  let restartTimer: number | null = null;
  let ended = false;

  const finish = () => {
    if (ended) return;
    ended = true;
    if (restartTimer !== null) {
      window.clearTimeout(restartTimer);
      restartTimer = null;
    }
    handlers.onEnd();
  };

  const attach = () => {
    if (stopped) return;
    rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event) => {
      restartAttempt = 0;
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
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        handlers.onError("Microphone permission was blocked.");
        stopped = true;
        return;
      }
      if (event.error === "audio-capture") {
        handlers.onError("No working microphone was found.");
        stopped = true;
        return;
      }
      handlers.onError(`Dictation stopped (${event.error}).`);
    };
    rec.onend = () => {
      if (stopped) {
        finish();
        return;
      }
      const delay = Math.min(2_000, 120 * 2 ** Math.min(4, restartAttempt));
      restartAttempt += 1;
      restartTimer = window.setTimeout(() => {
        restartTimer = null;
        if (stopped) return;
        try {
          attach();
        } catch {
          stopped = true;
          finish();
        }
      }, delay);
    };
    try {
      rec.start();
    } catch {
      handlers.onError("Could not start the microphone.");
      stopped = true;
      finish();
    }
  };

  attach();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (restartTimer !== null) {
        window.clearTimeout(restartTimer);
        restartTimer = null;
      }
      try {
        rec?.stop();
      } catch {
        try {
          rec?.abort();
        } catch {
          // Recognition already ended.
        }
      }
      finish();
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
  utterance.rate = Math.min(4, Math.max(0.1, opts.rate));
  utterance.pitch = Math.min(2, Math.max(0, opts.pitch));
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    opts.onend?.();
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
  return () => {
    window.speechSynthesis.cancel();
    finish();
  };
}

export interface MicrophoneRecording {
  stop: () => Promise<Blob>;
  stream: MediaStream;
}

export async function recordMicrophone(): Promise<MicrophoneRecording | null> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    return null;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: { ideal: 1 },
    },
  });

  const mime = preferredAudioRecorderMime();
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  let stopped = false;
  let fatalError: Error | null = null;

  const cleanup = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.onerror = (event) => {
    const detail = "error" in event && event.error instanceof Error ? event.error.message : "MediaRecorder error";
    fatalError = new Error(detail);
  };

  try {
    recorder.start(250);
  } catch (error) {
    cleanup();
    throw error;
  }

  return {
    stream,
    stop: () => {
      if (stopped) {
        return Promise.reject(new Error("Recording has already been stopped."));
      }
      stopped = true;
      return new Promise((resolve, reject) => {
        recorder.onstop = () => {
          cleanup();
          if (fatalError) {
            reject(fatalError);
            return;
          }
          const blob = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
          if (!blob.size) {
            reject(new Error("The microphone recording is empty."));
            return;
          }
          resolve(blob);
        };
        if (recorder.state !== "inactive") {
          try {
            recorder.requestData();
          } catch {
            // Some browsers do not allow requestData during teardown.
          }
          recorder.stop();
        } else {
          cleanup();
          if (fatalError) reject(fatalError);
          else reject(new Error("Recording stopped before audio was captured."));
        }
      });
    },
  };
}
