import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { renderFrame, type MediaEl } from "@/lib/studio/compositor";
import { sceneAtTime } from "@/lib/studio/captions";
import { ASPECT_SIZE } from "@/lib/studio/types";
import { useStudio } from "@/lib/studio/store";
import { cn, formatClock, projectDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PreviewStage({
  media,
  onToggle,
}: {
  media: Map<string, MediaEl>;
  onToggle: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef(media);
  mediaRef.current = media;
  const project = useStudio((s) => s.project);
  const playhead = useStudio((s) => s.playhead);
  const playing = useStudio((s) => s.playing);
  const size = ASPECT_SIZE[project.aspect];
  const duration = projectDuration(project.scenes);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      const state = useStudio.getState();
      const dur = projectDuration(state.project.scenes);
      let time = state.playhead;
      if (state.playing) {
        const audio = document.querySelector("[data-vv-voiceover]") as HTMLAudioElement | null;
        if (audio && state.project.voiceoverUrl && !audio.paused) {
          time = audio.currentTime;
        } else {
          time += dt;
        }
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

  useEffect(() => {
    const hit = sceneAtTime(project.scenes, playhead);
    media.forEach((el, id) => {
      if (!(el instanceof HTMLVideoElement)) return;
      if (!hit || hit.scene.id !== id) {
        if (!el.paused) el.pause();
        return;
      }
      if (Math.abs(el.currentTime - hit.local) > 0.3) {
        try {
          el.currentTime = hit.local;
        } catch {
          /* seek not ready */
        }
      }
      if (playing && el.paused) void el.play().catch(() => undefined);
      if (!playing && !el.paused) el.pause();
    });
  }, [playhead, playing, media, project.scenes]);

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:flex-1">
      <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-xl bg-bg shadow-[0_0_0_1px_rgba(255,255,255,0.06)] lg:h-auto lg:min-h-96 lg:flex-1">
        <canvas
          ref={canvasRef}
          className="h-full w-auto max-w-full bg-bg object-contain"
          style={{ aspectRatio: `${size.w} / ${size.h}` }}
          aria-label="Picture preview"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-0 flex items-center justify-center bg-transparent"
          aria-label={playing ? "Pause" : "Play"}
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-full bg-fg/90 text-accent-fg transition-opacity duration-150",
              playing ? "opacity-0 hover:opacity-100" : "opacity-100",
            )}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
          </span>
        </button>
      </div>
      <div className="flex items-center justify-between px-1">
        <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause /> : <Play className="translate-x-px" />}
        </Button>
        <span className="font-mono text-xs tabular-nums text-muted">
          {formatClock(playhead)} / {formatClock(duration)}
        </span>
      </div>
    </div>
  );
}
