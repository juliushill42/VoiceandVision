import { useEffect } from "react";
import { Clapperboard, Library, Mic, SlidersHorizontal, Sparkles, Volume2 } from "lucide-react";
import { Toaster } from "sonner";
import { FlowView } from "@/components/studio/flow-view";
import { VoiceView } from "@/components/studio/voice-view";
import { CutView } from "@/components/studio/cut-view";
import { LibraryView } from "@/components/studio/library-view";
import { IntelView } from "@/components/studio/intel-view";
import { MixView } from "@/components/studio/mix-view";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStudio } from "@/lib/studio/store";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/studio/types";

const NAV: { id: ViewId; label: string; icon: typeof Mic }[] = [
  { id: "flow", label: "Flow", icon: Mic },
  { id: "voice", label: "Voice", icon: Volume2 },
  { id: "cut", label: "Cut", icon: Clapperboard },
  { id: "mix", label: "Mix", icon: SlidersHorizontal },
  { id: "intel", label: "Intel", icon: Sparkles },
  { id: "library", label: "Library", icon: Library },
];

export function StudioApp() {
  const view = useStudio((s) => s.view);
  const setView = useStudio((s) => s.setView);
  const playing = useStudio((s) => s.playing);
  const togglePlay = useStudio((s) => s.togglePlay);
  const rehydrate = useStudio((s) => s.rehydrate);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    const audio = document.querySelector("[data-vv-voiceover]") as HTMLAudioElement | null;
    if (!audio) return;
    if (playing) {
      const state = useStudio.getState();
      try {
        audio.currentTime = state.playhead;
      } catch {
        /* not ready */
      }
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (event.key === " " && !typing) {
        event.preventDefault();
        togglePlay();
      }
      if (typing) return;
      if (event.key === "1") setView("flow");
      if (event.key === "2") setView("voice");
      if (event.key === "3") setView("cut");
      if (event.key === "4") setView("mix");
      if (event.key === "5") setView("intel");
      if (event.key === "6") setView("library");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setView, togglePlay]);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-dvh flex-col bg-bg text-fg">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Mark />
            <div className="min-w-0">
              <p className="font-display text-base font-medium leading-none tracking-tight">
                Voice & Vision
              </p>
              <p className="mt-1 hidden text-xs text-subtle sm:block">Zero-dollar studio</p>
            </div>
          </div>
          <p className="hidden text-xs text-subtle md:block">On-device. No upload.</p>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav aria-label="Studio" className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-border py-3 md:flex">
            {NAV.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => setView(item.id)} aria-current={view === item.id} className={cn("flex size-11 items-center justify-center rounded-lg transition-colors duration-150", view === item.id ? "bg-raised text-fg" : "text-muted hover:text-fg")}>
                    <item.icon className="size-4" />
                    <span className="sr-only">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0">
            {view === "flow" ? <FlowView /> : null}
            {view === "voice" ? <VoiceView /> : null}
            {view === "cut" ? <CutView /> : null}
            {view === "mix" ? <MixView /> : null}
            {view === "intel" ? <IntelView /> : null}
            {view === "library" ? <LibraryView /> : null}
          </main>
        </div>
        <nav aria-label="Studio mobile" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => setView(item.id)} className={cn("flex h-14 flex-col items-center justify-center gap-1 text-[10px]", view === item.id ? "text-fg" : "text-muted")}>
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <Toaster theme="dark" position="bottom-right" toastOptions={{ classNames: { toast: "bg-raised text-fg border-border" } }} />
      </div>
    </TooltipProvider>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-raised" />
      <path d="M9 22V10h2.2l4.8 8.4L20.8 10H23v12h-2.1v-7.6L16.6 22h-1.2l-4.3-7.6V22H9z" className="fill-fg" />
    </svg>
  );
}
