export type MediaKind = "image" | "video" | "audio";

export interface MediaCandidate {
  name: string;
  type: string;
  size: number;
}

export interface MediaLimits {
  maxFiles: number;
  maxBatchBytes: number;
  maxImageBytes: number;
  maxAudioBytes: number;
  maxVideoBytes: number;
}

export interface MediaValidationError {
  name: string;
  code: "unsupported-type" | "file-too-large" | "batch-too-large" | "too-many-files" | "empty-file";
  message: string;
}

export interface MediaValidationResult {
  accepted: Array<{ file: MediaCandidate; kind: MediaKind }>;
  rejected: MediaValidationError[];
}

export const DEFAULT_MEDIA_LIMITS: MediaLimits = {
  maxFiles: 200,
  maxBatchBytes: 1024 * 1024 * 1024,
  maxImageBytes: 50 * 1024 * 1024,
  maxAudioBytes: 250 * 1024 * 1024,
  maxVideoBytes: 768 * 1024 * 1024,
};

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "webm"]);
const VIDEO_EXT = new Set(["mp4", "m4v", "mov", "webm", "ogv", "ogg"]);

function extension(name: string): string {
  const clean = name.trim().toLowerCase();
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1) : "";
}

export function classifyMedia(candidate: MediaCandidate): MediaKind | null {
  const type = candidate.type.trim().toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";

  const ext = extension(candidate.name);
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  return null;
}

function maxBytesFor(kind: MediaKind, limits: MediaLimits): number {
  if (kind === "image") return limits.maxImageBytes;
  if (kind === "audio") return limits.maxAudioBytes;
  return limits.maxVideoBytes;
}

function formatMiB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function validateMediaBatch(
  files: MediaCandidate[],
  limits: MediaLimits = DEFAULT_MEDIA_LIMITS,
): MediaValidationResult {
  const accepted: MediaValidationResult["accepted"] = [];
  const rejected: MediaValidationError[] = [];

  if (files.length > limits.maxFiles) {
    rejected.push({
      name: "batch",
      code: "too-many-files",
      message: `Import is limited to ${limits.maxFiles} files at a time.`,
    });
  }

  const batch = files.slice(0, limits.maxFiles);
  let acceptedBytes = 0;
  for (const file of batch) {
    if (!Number.isFinite(file.size) || file.size <= 0) {
      rejected.push({ name: file.name, code: "empty-file", message: `${file.name} is empty.` });
      continue;
    }
    const kind = classifyMedia(file);
    if (!kind) {
      rejected.push({
        name: file.name,
        code: "unsupported-type",
        message: `${file.name} is not a supported image, video, or audio file.`,
      });
      continue;
    }
    const max = maxBytesFor(kind, limits);
    if (file.size > max) {
      rejected.push({
        name: file.name,
        code: "file-too-large",
        message: `${file.name} exceeds the ${formatMiB(max)} ${kind} limit.`,
      });
      continue;
    }
    if (acceptedBytes + file.size > limits.maxBatchBytes) {
      rejected.push({
        name: file.name,
        code: "batch-too-large",
        message: `This import would exceed the ${formatMiB(limits.maxBatchBytes)} batch limit.`,
      });
      continue;
    }
    acceptedBytes += file.size;
    accepted.push({ file, kind });
  }

  return { accepted, rejected };
}

export interface MediaProbe {
  duration: number | null;
  width: number | null;
  height: number | null;
}

function waitForMetadata(el: HTMLMediaElement, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Media metadata timed out."));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timeout);
      el.onloadedmetadata = null;
      el.onerror = null;
    };
    el.onloadedmetadata = () => {
      cleanup();
      resolve();
    };
    el.onerror = () => {
      cleanup();
      reject(new Error("Media metadata could not be read."));
    };
  });
}

export async function probeMediaFile(file: File, kind: MediaKind, timeoutMs = 12_000): Promise<MediaProbe> {
  const url = URL.createObjectURL(file);
  try {
    if (kind === "image") {
      const image = new Image();
      image.decoding = "async";
      const loaded = new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("Image metadata timed out.")), timeoutMs);
        image.onload = () => {
          window.clearTimeout(timeout);
          resolve();
        };
        image.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error("Image could not be decoded."));
        };
      });
      image.src = url;
      await loaded;
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("Image dimensions are invalid.");
      if (image.naturalWidth > 16_384 || image.naturalHeight > 16_384 || image.naturalWidth * image.naturalHeight > 64_000_000) {
        throw new Error("Image dimensions exceed the safe decode limit.");
      }
      return { duration: null, width: image.naturalWidth, height: image.naturalHeight };
    }

    const media = document.createElement(kind === "video" ? "video" : "audio");
    media.preload = "metadata";
    media.src = url;
    await waitForMetadata(media, timeoutMs);
    const duration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : null;
    if (duration == null) throw new Error("Media duration is invalid.");
    if (duration > 6 * 60 * 60) throw new Error("Media duration exceeds the 6-hour safety limit.");
    if (kind === "video") {
      const video = media as HTMLVideoElement;
      if (!video.videoWidth || !video.videoHeight) throw new Error("Video dimensions are invalid.");
      if (video.videoWidth > 8_192 || video.videoHeight > 8_192 || video.videoWidth * video.videoHeight > 40_000_000) {
        throw new Error("Video dimensions exceed the safe decode limit.");
      }
      return { duration, width: video.videoWidth, height: video.videoHeight };
    }
    return { duration, width: null, height: null };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function preferredVideoRecorderMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? null;
}

export function preferredAudioRecorderMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? null;
}
