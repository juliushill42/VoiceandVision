import { sceneAtTime } from "@/lib/studio/captions";
import type { CaptionStyleId, LookId, Overlay, Project } from "@/lib/studio/types";
import { ASPECT_SIZE } from "@/lib/studio/types";

export type MediaEl = HTMLImageElement | HTMLVideoElement;

const LOOK_FILTER: Record<LookId, string> = {
  native: "none",
  tungsten: "sepia(0.22) saturate(1.12) contrast(1.06) brightness(1.03)",
  silver: "grayscale(0.42) contrast(1.16) brightness(0.98) saturate(0.4)",
  night: "contrast(1.22) brightness(0.82) saturate(0.72)",
  paper: "contrast(0.92) brightness(1.1) saturate(0.55)",
};

let grainCanvas: HTMLCanvasElement | null = null;

function getGrain(size = 256): HTMLCanvasElement {
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

function coverDraw(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  t: number,
  kb: Project["scenes"][number]["kenBurns"],
) {
  const u = Math.min(1, Math.max(0, t));
  const scale = kb.fromScale + (kb.toScale - kb.fromScale) * u;
  const panX = kb.fromX + (kb.toX - kb.fromX) * u;
  const panY = kb.fromY + (kb.toY - kb.fromY) * u;
  const imgAspect = iw / Math.max(1, ih);
  const canvasAspect = cw / ch;
  let dw: number;
  let dh: number;
  if (imgAspect > canvasAspect) {
    dh = ch * scale;
    dw = dh * imgAspect;
  } else {
    dw = cw * scale;
    dh = dw / imgAspect;
  }
  const extraX = Math.max(0, dw - cw);
  const extraY = Math.max(0, dh - ch);
  const x = (cw - dw) / 2 + panX * extraX * 0.5;
  const y = (ch - dh) / 2 + panY * extraY * 0.5;
  ctx.drawImage(source, x, y, dw, dh);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCaptions(
  ctx: CanvasRenderingContext2D,
  project: Project,
  time: number,
  w: number,
  h: number,
) {
  const cue = project.captions.find((item) => time >= item.start && time < item.end);
  if (!cue) return;
  const style: CaptionStyleId = project.captionStyle;
  const maxWidth = w * 0.86;
  const baseSize = style === "editorial" ? Math.round(w * 0.062) : Math.round(w * 0.048);
  const fontFamily = style === "editorial" ? "Newsreader, Georgia, serif" : "Outfit, system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${style === "editorial" ? 500 : 600} ${baseSize}px ${fontFamily}`;

  const lines = wrapLines(ctx, cue.text, maxWidth);
  const lineHeight = baseSize * 1.28;
  const blockH = lines.length * lineHeight;
  const bottom = style === "editorial" ? h * 0.16 : h * 0.12;
  const y = h - bottom - blockH + lineHeight * 0.8;
  const x = style === "editorial" ? w * 0.08 : w / 2;
  ctx.textAlign = style === "editorial" ? "left" : "center";

  if (style === "box") {
    const paddingX = 18;
    const paddingY = 14;
    const widths = lines.map((line) => ctx.measureText(line).width);
    const boxW = Math.max(...widths, 0) + paddingX * 2;
    const boxH = blockH + paddingY * 2;
    const boxX = (w - boxW) / 2;
    const boxY = y - lineHeight * 0.85;
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
        const globalIndex =
          lines.slice(0, lineIndex).reduce((n, l) => n + l.split(/\s+/).length, 0) + wi;
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

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: Overlay[],
  time: number,
  w: number,
  h: number,
) {
  for (const overlay of overlays) {
    if (time < overlay.start || time >= overlay.end) continue;
    const fadeIn = Math.min(1, (time - overlay.start) / 0.35);
    const fadeOut = Math.min(1, (overlay.end - time) / 0.35);
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#f4f4f5";
    ctx.textAlign = "center";
    if (overlay.placement === "title") {
      ctx.font = `500 ${Math.round(w * 0.09)}px Newsreader, Georgia, serif`;
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 18;
      ctx.fillText(overlay.text, w / 2, h * 0.46);
    } else if (overlay.placement === "center") {
      ctx.font = `500 ${Math.round(w * 0.055)}px Outfit, system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(overlay.text, w / 2, h * 0.5);
    } else {
      ctx.font = `500 ${Math.round(w * 0.032)}px Outfit, system-ui, sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(244,244,245,0.78)";
      ctx.fillText(overlay.text.toUpperCase(), w / 2, h * 0.9);
    }
    ctx.restore();
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function syncVideoMedia(
  project: Project,
  time: number,
  media: Map<string, MediaEl>,
) {
  const hit = sceneAtTime(project.scenes, time);
  media.forEach((el, id) => {
    if (!(el instanceof HTMLVideoElement)) return;
    if (!hit || hit.scene.id !== id) return;
    if (Math.abs(el.currentTime - hit.local) > 0.18) {
      try {
        el.currentTime = hit.local;
      } catch {
        /* seek */
      }
    }
  });
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  project: Project,
  time: number,
  media: Map<string, MediaEl>,
) {
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
    if (el && el instanceof HTMLVideoElement && el.readyState >= 2) {
      coverDraw(ctx, el, el.videoWidth || w, el.videoHeight || h, w, h, u, hit.scene.kenBurns);
    } else if (el && el instanceof HTMLImageElement && el.complete && el.naturalWidth) {
      coverDraw(ctx, el, el.naturalWidth, el.naturalHeight, w, h, u, hit.scene.kenBurns);
    } else {
      ctx.filter = "none";
      ctx.fillStyle = "#121214";
      ctx.fillRect(0, 0, w, h);
    }
  }
  ctx.filter = "none";

  drawVignette(ctx, w, h);

  const grain = getGrain();
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.globalCompositeOperation = "overlay";
  const ox = -((time * 37) % 24);
  const oy = -((time * 19) % 24);
  ctx.drawImage(grain, ox, oy, w + 48, h + 48);
  ctx.restore();

  drawOverlays(ctx, project.overlays, time, w, h);
  drawCaptions(ctx, project, time, w, h);
}

export async function exportWebm(
  project: Project,
  media: Map<string, MediaEl>,
  duration: number,
  onProgress: (ratio: number) => void,
  audio?: HTMLAudioElement | null,
): Promise<Blob> {
  const { w, h } = ASPECT_SIZE[project.aspect];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  const canvasStream = canvas.captureStream(30);
  let stream: MediaStream = canvasStream;
  let audioCtx: AudioContext | null = null;

  if (audio && audio.src) {
    audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(dest);
    source.connect(audioCtx.destination);
    const tracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    stream = new MediaStream(tracks);
    audio.currentTime = 0;
    await audio.play().catch(() => undefined);
  }

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : "video/webm";

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Export failed while recording."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  recorder.start(250);
  const started = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - started) / 1000;
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
  await audioCtx?.close().catch(() => undefined);
  canvasStream.getTracks().forEach((track) => track.stop());
  return blob;
}
