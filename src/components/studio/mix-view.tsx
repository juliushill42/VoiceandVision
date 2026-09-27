import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio/store";
import {
  createEngineProject,
  engineHealth,
  processVocal,
  renderMaster,
  renderMix,
  uploadEngineMedia,
} from "@/lib/engine/client";
import { saveArtifact } from "@/lib/engine/save";
import { ensureEngineProject, writeEngineSession } from "@/lib/engine/session";

export function MixView() {
  const voiceoverUrl = useStudio((s) => s.project.voiceoverUrl);
  const title = useStudio((s) => s.project.title);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("Save writes WAV, MP3, or MP4 from the last bounce.");

  const runChain = async () => {
    setBusy(true);
    try {
      const h = await engineHealth();
      if ((h as { offline?: boolean }).offline) {
        toast.error("Start engine/bootstrap.sh first");
        return;
      }
      if (!voiceoverUrl) {
        toast.message("Record a take on Voice first.");
        return;
      }
      const session = await ensureEngineProject(createEngineProject, title || "Voice & Vision");
      const blob = await fetch(voiceoverUrl).then((r) => r.blob());
      const media = await uploadEngineMedia(session.projectId, blob, "audio", "main", "take.webm");
      const vocal = await processVocal(session.projectId, media.id, {});
      const mix = await renderMix(session.projectId, [
        { media_id: media.id, gain_db: 0, pan: 0, mute: false, solo: false, offset_ms: 0 },
      ]);
      const master = await renderMaster(session.projectId, mix.id, { target_rms_dbfs: -16, ceiling_dbfs: -1 });
      writeEngineSession({ projectId: session.projectId, mediaId: media.id, lastArtifactId: master.id });
      setLog(JSON.stringify({ project: session.projectId, vocal: vocal.id, mix: mix.id, master: master.id }, null, 2));
      toast.success("Bounced. Save WAV / MP3 / MP4.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const save = async (kind: "wav" | "mp3" | "mp4") => {
    setBusy(true);
    try {
      const out = await saveArtifact(kind);
      toast.success(`${out.filename} (${out.bytes} bytes)`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <h2 className="font-display text-lg">Mix / Master / Save</h2>
      <p className="text-sm text-subtle">One session project. Bounce on the engine. Save is a file: WAV, MP3, or MP4.</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={runChain}>Bounce vocal + mix + master</Button>
        <Button disabled={busy} variant="outline" onClick={() => save("wav")}>Save WAV</Button>
        <Button disabled={busy} variant="outline" onClick={() => save("mp3")}>Save MP3</Button>
        <Button disabled={busy} variant="outline" onClick={() => save("mp4")}>Save MP4</Button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-border p-3 text-xs">{log}</pre>
    </div>
  );
}
