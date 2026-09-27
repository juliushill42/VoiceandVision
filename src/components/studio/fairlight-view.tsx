import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio/store";
import { createEngineProject, engineHealth, processVocal, renderMaster, renderMix, uploadEngineMedia } from "@/lib/engine/client";
import { saveArtifact } from "@/lib/engine/save";
import { ensureEngineProject, writeEngineSession } from "@/lib/engine/session";
import { defaultStrips, type TitanStrip } from "@/lib/engine/titan-tracks";

export function FairlightView() {
  const voiceoverUrl = useStudio((s) => s.project.voiceoverUrl);
  const title = useStudio((s) => s.project.title);
  const [strips, setStrips] = useState<TitanStrip[]>(defaultStrips);
  const [masterDb, setMasterDb] = useState(0);
  const [busy, setBusy] = useState(false);
  const soloing = useMemo(() => strips.some((s) => s.solo), [strips]);
  const patch = (slot: number, next: Partial<TitanStrip>) => {
    setStrips((rows) => rows.map((r) => (r.slot === slot ? { ...r, ...next } : r)));
  };
  const bounce = async () => {
    setBusy(true);
    try {
      const h = await engineHealth();
      if ((h as { offline?: boolean }).offline) { toast.error("Engine offline"); return; }
      if (!voiceoverUrl) { toast.message("Record on Voice first."); return; }
      const session = await ensureEngineProject(createEngineProject, title || "Voice & Vision");
      const blob = await fetch(voiceoverUrl).then((r) => r.blob());
      const armed = strips.find((s) => s.arm) || strips[4];
      const media = await uploadEngineMedia(session.projectId, blob, "audio", armed.id, `${armed.id}.webm`);
      await processVocal(session.projectId, media.id, { hp_hz: armed.hpHz, gate_db: armed.gateDb });
      const tracks = strips.filter((s) => !s.mute && (!soloing || s.solo)).map((s) => ({
        media_id: media.id, gain_db: s.gainDb + masterDb, pan: s.pan, mute: s.mute, solo: s.solo, offset_ms: 0, part: s.id, slot: s.slot,
      }));
      const mix = await renderMix(session.projectId, tracks.length ? tracks : [{ media_id: media.id, gain_db: masterDb, pan: 0, mute: false, solo: false, offset_ms: 0 }]);
      const master = await renderMaster(session.projectId, mix.id, { target_rms_dbfs: -16, ceiling_dbfs: -1 });
      writeEngineSession({ projectId: session.projectId, mediaId: media.id, lastArtifactId: master.id });
      toast.success("Fairlight bounce. Save a file.");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const save = async (kind: "wav" | "mp3" | "mp4") => {
    setBusy(true);
    try { const out = await saveArtifact(kind); toast.success(out.filename); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-display text-lg">Fairlight</h2>
          <p className="text-xs text-subtle">Titan 16-track. CarEoke HP/gate. Deliver is a file.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={bounce}>Bounce</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => save("wav")}>WAV</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => save("mp3")}>MP3</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => save("mp4")}>MP4</Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max">
          {strips.map((s) => (
            <div key={s.slot} className="flex w-20 shrink-0 flex-col border-r border-border px-1.5 py-2">
              <p className="truncate text-[10px] font-medium">{s.label}</p>
              <p className="text-[9px] text-subtle">TD {s.slot}</p>
              <label className="mt-2 text-[9px] text-subtle">HP {s.hpHz}</label>
              <input type="range" min={20} max={200} value={s.hpHz} onChange={(e) => patch(s.slot, { hpHz: Number(e.target.value) })} />
              <label className="text-[9px] text-subtle">Gate {s.gateDb}</label>
              <input type="range" min={-80} max={-10} value={s.gateDb} onChange={(e) => patch(s.slot, { gateDb: Number(e.target.value) })} />
              <label className="text-[9px] text-subtle">Pan {s.pan.toFixed(2)}</label>
              <input type="range" min={-1} max={1} step={0.01} value={s.pan} onChange={(e) => patch(s.slot, { pan: Number(e.target.value) })} />
              <input className="mt-2 h-36 w-full" type="range" min={-48} max={12} step={0.1} value={s.gainDb} onChange={(e) => patch(s.slot, { gainDb: Number(e.target.value) })} style={{ writingMode: "vertical-lr", direction: "rtl" }} />
              <p className="text-center text-[10px] tabular-nums">{s.gainDb.toFixed(1)}</p>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <button type="button" className={`h-7 text-[9px] ${s.mute ? "bg-raised" : "text-muted"}`} onClick={() => patch(s.slot, { mute: !s.mute })}>M</button>
                <button type="button" className={`h-7 text-[9px] ${s.solo ? "bg-raised" : "text-muted"}`} onClick={() => patch(s.slot, { solo: !s.solo })}>S</button>
                <button type="button" className={`col-span-2 h-7 text-[9px] ${s.arm ? "bg-raised" : "text-muted"}`} onClick={() => setStrips((rows) => rows.map((r) => ({ ...r, arm: r.slot === s.slot })))}>ARM</button>
              </div>
            </div>
          ))}
          <div className="flex w-24 shrink-0 flex-col border-l border-border px-2 py-2">
            <p className="text-[10px] font-medium">Master</p>
            <input className="mt-8 h-40 w-full" type="range" min={-24} max={12} step={0.1} value={masterDb} onChange={(e) => setMasterDb(Number(e.target.value))} style={{ writingMode: "vertical-lr", direction: "rtl" }} />
            <p className="text-center text-[10px] tabular-nums">{masterDb.toFixed(1)} dB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
