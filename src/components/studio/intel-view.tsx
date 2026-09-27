import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  analyzeMedia,
  analyzeSync,
  createEngineProject,
  decideSuggestion,
  engineHealth,
  inspectSession,
  processVocal,
  renderMix,
  uploadEngineMedia,
} from "@/lib/engine/client";
import { useStudio } from "@/lib/studio/store";

type Suggestion = {
  id: string;
  kind: string;
  title: string;
  reason: string;
  action: string;
  params: Record<string, unknown>;
};

export function IntelView() {
  const voiceoverUrl = useStudio((s) => s.project.voiceoverUrl);
  const title = useStudio((s) => s.project.title);
  const [on, setOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState("not checked");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lastExec, setLastExec] = useState("");

  const run = async () => {
    if (!on) {
      toast.message("Creator Intelligence is off.");
      return;
    }
    setBusy(true);
    try {
      const h = await engineHealth();
      if ((h as { offline?: boolean }).offline) {
        setHealth("engine offline — start engine/bootstrap.sh");
        toast.error("Engine is not running on 127.0.0.1:8765");
        return;
      }
      setHealth("engine online");
      if (!voiceoverUrl) {
        toast.message("Record or import audio on Voice first.");
        return;
      }
      const proj = await createEngineProject(title || "Voice & Vision", "creator");
      const blob = await fetch(voiceoverUrl).then((r) => r.blob());
      const media = await uploadEngineMedia(proj.id, blob, "audio", "main", "voiceover.webm");
      await analyzeMedia(proj.id, media.id);
      const intel = await inspectSession(proj.id, [media.id]);
      setSuggestions(intel.suggestions || []);
      toast.success(`${(intel.suggestions || []).length} suggestions`);
      (window as unknown as { __vvEngineProject?: unknown }).__vvEngineProject = {
        projectId: proj.id,
        mediaId: media.id,
        media,
      };
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDecide = async (s: Suggestion, decision: "accept" | "reject") => {
    const ctx = (window as unknown as { __vvEngineProject?: { projectId: string; mediaId: string } }).__vvEngineProject;
    if (!ctx?.projectId) {
      toast.message("Inspect a session first.");
      return;
    }
    setBusy(true);
    try {
      const recorded = await decideSuggestion({
        project_id: ctx.projectId,
        suggestion_id: s.id,
        decision,
        kind: s.kind,
        params: s.params,
        execute: decision === "accept",
        note: "studio-ui",
      });
      if (decision === "accept") {
        const executed = await executeLocally(s, ctx);
        setLastExec(executed || recorded?.executed_action || s.action);
        toast.success(`Accepted and executed: ${s.action}`);
      } else {
        toast.message("Rejected — recorded only");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">Creator Intelligence</h2>
          <p className="text-sm text-subtle">
            Deterministic rules on measured audio. Not an LLM. Accept now runs the action.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{health}</Badge>
          <Button variant={on ? "default" : "outline"} onClick={() => setOn(!on)}>
            {on ? "Intel ON" : "Intel OFF"}
          </Button>
          <Button disabled={busy} onClick={run}>
            Inspect session
          </Button>
        </div>
      </div>
      {lastExec ? <p className="text-xs text-subtle">Last executed: {lastExec}</p> : null}
      <ul className="space-y-3">
        {suggestions.map((s) => (
          <li key={s.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{s.title}</p>
              <Badge variant="outline">{s.kind}</Badge>
            </div>
            <p className="mt-1 text-sm text-subtle">{s.reason}</p>
            <p className="mt-1 text-xs">Action: {s.action}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => onDecide(s, "accept")}>
                Accept + run
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide(s, "reject")}>
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function executeLocally(s: Suggestion, ctx: { projectId: string; mediaId: string }) {
  if (s.action === "process_vocal") {
    await processVocal(ctx.projectId, String(s.params.media_id || ctx.mediaId), s.params);
    return "process_vocal";
  }
  if (s.action === "render_mix" || s.action === "gain") {
    await renderMix(ctx.projectId, [
      {
        media_id: ctx.mediaId,
        gain_db: s.params.gain_db ?? 0,
        pan: 0,
        mute: false,
        solo: false,
        offset_ms: 0,
      },
    ]);
    return "render_mix";
  }
  if (s.action === "sync_analyze") {
    const vid = s.params.video_media_id;
    if (!vid) return "sync_analyze skipped — no video id";
    await analyzeSync(ctx.projectId, ctx.mediaId, String(vid));
    return "sync_analyze";
  }
  if (s.action === "human_review") return "human_review — no automatic edit";
  return s.action;
}
