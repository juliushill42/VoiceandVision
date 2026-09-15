import { useRef } from "react";
import { sceneAtTime } from "@/lib/studio/captions";
import type { Project } from "@/lib/studio/types";
import { cn, formatClock, projectDuration } from "@/lib/utils";

export function Timeline({
  project,
  playhead,
  onSeek,
}: {
  project: Project;
  playhead: number;
  onSeek: (time: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const duration = Math.max(0.01, projectDuration(project.scenes));
  const ratio = Math.min(1, playhead / duration);
  const hit = sceneAtTime(project.scenes, playhead);

  const seekFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(x * duration);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">Timeline</p>
        <p className="font-mono text-xs tabular-nums text-subtle">
          {hit ? hit.scene.label : "—"} · {formatClock(duration)}
        </p>
      </div>
      <div
        ref={trackRef}
        className="relative h-16 cursor-pointer overflow-hidden rounded-md bg-raised"
        onPointerDown={(event) => {
          (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
          seekFromEvent(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromEvent(event.clientX);
        }}
        role="slider"
        aria-label="Playhead"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={playhead}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") onSeek(Math.max(0, playhead - 0.5));
          if (event.key === "ArrowRight") onSeek(Math.min(duration, playhead + 0.5));
        }}
      >
        <div className="absolute inset-0 flex">
          {project.scenes.map((scene, index) => (
            <div
              key={scene.id}
              className={cn(
                "relative h-full overflow-hidden border-r border-bg last:border-r-0",
                hit?.scene.id === scene.id ? "bg-raised" : "bg-bg",
              )}
              style={{ width: `${(scene.duration / duration) * 100}%` }}
            >
              {scene.kind !== "solid" ? (
                <img
                  src={scene.src}
                  alt=""
                  className="h-full w-full object-cover opacity-70"
                  draggable={false}
                />
              ) : null}
              <span className="absolute bottom-1 left-1.5 font-mono text-xs text-fg/90">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-bg/50">
          {project.captions.map((cue) => (
            <span
              key={cue.id}
              className="absolute top-0 h-full bg-accent/70"
              style={{
                left: `${(cue.start / duration) * 100}%`,
                width: `${((cue.end - cue.start) / duration) * 100}%`,
              }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute top-0 z-10 h-full w-px bg-fg"
          style={{ left: `${ratio * 100}%` }}
        >
          <span className="absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-fg" />
        </div>
      </div>
    </div>
  );
}
