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
  shareBlob,
  uploadEngineMedia,
} from "@/lib/engine/client";

export function MixView() {
  const voiceoverUrl = useStudio((s) => s.project.voiceoverUrl);
  const title = useStudio((s) => s.project.title);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("Engine mix uses 48 kHz PCM16. Not LUFS. Not a full DAW.");

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
      const proj = await createEngineProject(title || "Voice & Vision", "creator");
      const blob = await fetch(voiceoverUrl).then((r) => r.blob());
      const media = await uploadEngineMedia(proj.id, blob, "audio", "main", "take.webm");
      const vocal = await processVocal(proj.id, media.id, {});
      const mix = await renderMix(proj.id, [
        { media_id: media.id, gain_db: 0, pan: 0, mute: false, solo: false, offset_ms: 0 },
      ]);
      const master = await renderMaster(proj.id, mix.id, { target_rms_dbfs: -16, ceiling_dbfs: -1 });
      setLog(JSON.stringify({ project: proj.id, vocal: vocal.id, mix: mix.id, master: master.id }, null, 2));
      toast.success("Vocal → mix → master rendered on engine");
      (window as unknown as { __vvEngineProject?: unknown }).__vvEngineProject = {
        projectId: proj.id,
        mediaId: media.id,
      };
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!voiceoverUrl) return;
    const blob = await fetch(voiceoverUrl).then((r) => r.blob());
    const how = await shareBlob(blob, "voice-and-vision-take.webm", "Voice & Vision");
    toast.message(how === "native-share" ? "Opened system share sheet" : "Downloaded — no social publisher wired");
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <h2 className="font-display text-lg">Mix / Master</h2>
      <p className="text-sm text-subtle">
        Sends the current Voice take to the Creator Engine. Mixing is gain/pan/mute/solo/offset.
        Mastering is RMS target + peak ceiling. Accept on Intel now runs the same path.
      </p>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={runChain}>
          Render vocal + mix + master
        </Button>
        <Button variant="outline" onClick={share}>
          Share take
        </Button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-border p-3 text-xs">{log}</pre>
    </div>
  );
}
