import { useRef } from "react";
import { Download, Film, ImagePlus, RotateCcw, Subtitles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PreviewStage } from "@/components/studio/preview-stage";
import { Segmented } from "@/components/studio/segmented";
import { Timeline } from "@/components/studio/timeline";
import { useMedia } from "@/components/studio/use-media";
import { exportWebm } from "@/lib/studio/compositor";
import { muxVision } from "@/lib/engine/vision";
import { ASPECTS, CAPTION_STYLES, LOOKS } from "@/lib/studio/types";
import { useStudio } from "@/lib/studio/store";
import { downloadBlob, projectDuration } from "@/lib/utils";

export function CutView() {
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
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const duration = projectDuration(project.scenes);

  const exportCut = async () => {
    if (exporting) return;
    setPlaying(false);
    setExporting(true, 0);
    try {
      try {
        const mp4 = await muxVision({
          project,
          media,
          duration,
          onProgress: (ratio) => setExporting(true, ratio),
        });
        downloadBlob(mp4, "voice-and-vision.mp4");
        toast.success("Vision MP4 — picture + bounce");
      } catch (muxErr) {
        const blob = await exportWebm(
          project,
          media,
          duration,
          (ratio) => setExporting(true, ratio),
          audioRef.current,
        );
        downloadBlob(blob, "voice-and-vision.webm");
        toast.message(muxErr instanceof Error ? muxErr.message + " — WebM only" : "WebM only");
      }
    } catch (error) {
      toast.message(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false, 0);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      {project.voiceoverUrl ? (
        <audio ref={audioRef} data-vv-voiceover src={project.voiceoverUrl} preload="auto" className="hidden" />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <PreviewStage media={media} onToggle={togglePlay} />
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-subtle">Frame</p>
            <Segmented value={project.aspect} options={ASPECTS} onChange={setAspect} ariaLabel="Aspect" />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-subtle">Look</p>
            <Segmented value={project.look} options={LOOKS} onChange={setLook} ariaLabel="Look" />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-subtle">Captions</p>
            <Segmented value={project.captionStyle} options={CAPTION_STYLES} onChange={setCaptionStyle} ariaLabel="Caption style" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 lg:flex lg:flex-col">
            <Button size="sm" onClick={cutFromScript} disabled={!project.script.trim()}>
              <Subtitles /> Recut captions
            </Button>
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> Import media
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void exportCut()} disabled={exporting}>
              <Film /> {exporting ? `Export ${Math.round(exportProgress * 100)}%` : "Export video"}
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadSrt} disabled={!project.captions.length}>
              <Download /> Captions SRT
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSample} className="col-span-2 lg:col-span-1">
              <RotateCcw /> Restore sample
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = event.target.files;
                if (files?.length) void importFiles(Array.from(files));
                event.currentTarget.value = "";
              }}
            />
          </div>
          <ul className="hidden flex-col gap-1 pt-2 lg:flex">
            {project.scenes.map((scene) => (
              <li key={scene.id} className="flex items-center justify-between gap-2 rounded-md bg-raised px-2 py-1.5">
                <span className="truncate text-xs text-fg">{scene.label}</span>
                <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted hover:text-fg" aria-label={`Remove ${scene.label}`} onClick={() => removeScene(scene.id)}>
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <Timeline
        project={project}
        playhead={playhead}
        onSeek={(time) => {
          setPlaying(false);
          setPlayhead(time);
          const audio = audioRef.current;
          if (audio) {
            try { audio.currentTime = time; } catch { /* seek */ }
          }
        }}
      />
    </div>
  );
}
