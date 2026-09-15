import { useEffect, useRef, useState } from "react";
import { Copy, Download, Mic, Square, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { speechSupported, startDictation } from "@/lib/studio/speech";
import { useStudio } from "@/lib/studio/store";
import { wordCount } from "@/lib/studio/captions";
import { cn } from "@/lib/utils";

export function FlowView() {
  const script = useStudio((s) => s.project.script);
  const interim = useStudio((s) => s.interim);
  const listening = useStudio((s) => s.listening);
  const lang = useStudio((s) => s.lang);
  const setScript = useStudio((s) => s.setScript);
  const appendFinal = useStudio((s) => s.appendFinal);
  const setInterim = useStudio((s) => s.setInterim);
  const setListening = useStudio((s) => s.setListening);
  const cutFromScript = useStudio((s) => s.cutFromScript);
  const saveSession = useStudio((s) => s.saveSession);
  const downloadTranscript = useStudio((s) => s.downloadTranscript);
  const stopRef = useRef<(() => void) | null>(null);
  const [supported, setSupported] = useState(false);
  const words = wordCount(script);

  useEffect(() => {
    setSupported(speechSupported());
    return () => {
      stopRef.current?.();
    };
  }, []);

  const toggleListen = () => {
    if (listening) {
      stopRef.current?.();
      stopRef.current = null;
      setListening(false);
      return;
    }
    if (!supported) {
      toast.message("Type instead — live dictation is not available in this browser.");
      return;
    }
    const handle = startDictation(lang, {
      onFinal: (text) => appendFinal(text),
      onInterim: (text) => setInterim(text),
      onError: (message) => {
        toast.message(message);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    if (!handle) return;
    stopRef.current = handle.stop;
    setListening(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Transcript copied");
    } catch {
      toast.message("Could not copy.");
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-subtle">Flow</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg md:text-4xl">
          Talk. Don't type.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted text-pretty">
          On-device dictation. Say “period”, “new paragraph”, or “scratch that”. Then send the
          words into the cut.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-5 rounded-xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={toggleListen}
            aria-pressed={listening}
            aria-label={listening ? "Stop dictation" : "Start dictation"}
            className={cn(
              "relative flex size-28 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.96]",
              listening ? "bg-record text-fg" : "bg-raised text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
            )}
          >
            {listening ? <Square className="size-7 fill-current" /> : <Mic className="size-8" />}
            {listening ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-record/30" />
            ) : null}
          </button>
          {listening ? <Badge variant="live">Listening</Badge> : <Badge>Ready</Badge>}
          <p className="text-center text-xs text-subtle">
            {supported
              ? "Uses the speech engine already in your browser. Nothing is uploaded."
              : "Type the script if live dictation is unavailable. The cut still works."}
          </p>
          <label className="flex w-full flex-col gap-1.5 text-xs text-muted">
            Language
            <select
              value={lang}
              onChange={(event) => useStudio.getState().setLang(event.target.value)}
              className="h-10 rounded-md bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="pt-BR">Portuguese</option>
              <option value="ja-JP">Japanese</option>
              <option value="zh-CN">Chinese</option>
            </select>
          </label>
        </div>

        <div className="flex min-h-0 flex-col gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Type className="size-3.5" />
              <span className="tabular-nums">{words} words</span>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={copy}>
                <Copy /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadTranscript}>
                <Download /> Text
              </Button>
              <Button variant="secondary" size="sm" onClick={saveSession}>
                Save
              </Button>
              <Button size="sm" onClick={cutFromScript} disabled={!script.trim()}>
                Send to cut
              </Button>
            </div>
          </div>
          <Textarea
            value={script}
            onChange={(event) => setScript(event.target.value)}
            placeholder="Start speaking, or write here."
            className="min-h-64 flex-1 resize-none bg-bg font-display text-lg leading-relaxed md:min-h-80 md:text-xl"
          />
          {interim ? (
            <p className="text-sm italic text-subtle">{interim}</p>
          ) : (
            <p className="text-xs text-subtle">
              Voice commands: period, comma, question mark, new paragraph, scratch that.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
