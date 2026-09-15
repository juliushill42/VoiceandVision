import { useEffect, useRef, useState } from "react";
import { Circle, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { listVoices, recordMicrophone, speakText, ttsSupported } from "@/lib/studio/speech";
import { useStudio } from "@/lib/studio/store";

export function VoiceView() {
  const script = useStudio((s) => s.project.script);
  const speaking = useStudio((s) => s.speaking);
  const recording = useStudio((s) => s.recording);
  const voiceoverName = useStudio((s) => s.project.voiceoverName);
  const setSpeaking = useStudio((s) => s.setSpeaking);
  const setRecording = useStudio((s) => s.setRecording);
  const setVoiceover = useStudio((s) => s.setVoiceover);
  const setView = useStudio((s) => s.setView);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const stopSpeak = useRef<(() => void) | null>(null);
  const recorder = useRef<Awaited<ReturnType<typeof recordMicrophone>>>(null);

  useEffect(() => {
    if (!ttsSupported()) return;
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (voices.length && !voiceURI) setVoiceURI(voices[0].voiceURI);
  }, [voices, voiceURI]);

  const play = () => {
    if (!script.trim()) {
      toast.message("Write or dictate a script first.");
      return;
    }
    if (speaking) {
      stopSpeak.current?.();
      stopSpeak.current = null;
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    stopSpeak.current = speakText({
      text: script,
      voiceURI,
      rate,
      pitch,
      onend: () => setSpeaking(false),
    });
  };

  const toggleRecord = async () => {
    if (recording && recorder.current) {
      const blob = await recorder.current.stop();
      recorder.current = null;
      setRecording(false);
      const url = URL.createObjectURL(blob);
      setVoiceover(url, "Recorded voiceover");
      toast.success("Voiceover attached to the cut");
      return;
    }
    try {
      const handle = await recordMicrophone();
      if (!handle) {
        toast.message("Microphone is not available.");
        return;
      }
      recorder.current = handle;
      setRecording(true);
    } catch {
      toast.message("Microphone permission was blocked.");
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Voice</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg md:text-4xl">
          Read it back. Or record it.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Preview with the system voice, then record your own take. The file never leaves this
          device.
        </p>
      </header>

      <div className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <p className="mb-4 font-display text-xl leading-relaxed text-fg text-pretty md:text-2xl">
          {script.trim() || "Dictate or write a script in Flow first."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {recording ? <Badge variant="live">Recording</Badge> : null}
          {voiceoverName ? <Badge>{voiceoverName}</Badge> : null}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          System voice
          <select
            value={voiceURI}
            onChange={(event) => setVoiceURI(event.target.value)}
            className="h-11 rounded-md bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            disabled={!voices.length}
          >
            {voices.length ? (
              voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            ) : (
              <option value="">No system voices</option>
            )}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-muted">
            Rate {rate.toFixed(2)}
            <Slider
              min={0.6}
              max={1.4}
              step={0.05}
              value={[rate]}
              onValueChange={(v) => setRate(v[0] ?? 1)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Pitch {pitch.toFixed(2)}
            <Slider
              min={0.7}
              max={1.4}
              step={0.05}
              value={[pitch]}
              onValueChange={(v) => setPitch(v[0] ?? 1)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={play} disabled={!ttsSupported()}>
            <Volume2 />
            {speaking ? "Stop" : "Speak script"}
          </Button>
          <Button variant={recording ? "record" : "secondary"} onClick={() => void toggleRecord()}>
            {recording ? <Square className="fill-current" /> : <Circle className="size-3.5 fill-current" />}
            {recording ? "Stop record" : "Record voiceover"}
          </Button>
          <Button variant="ghost" onClick={() => setView("cut")}>
            Open cut
          </Button>
        </div>
      </div>
    </div>
  );
}
