import { Clapperboard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio/store";

export function LibraryView() {
  const sessions = useStudio((s) => s.sessions);
  const loadSession = useStudio((s) => s.loadSession);
  const deleteSession = useStudio((s) => s.deleteSession);
  const cutFromScript = useStudio((s) => s.cutFromScript);
  const setView = useStudio((s) => s.setView);
  const resetSample = useStudio((s) => s.resetSample);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Library</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg md:text-4xl">
          Stays on this device.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Saved transcripts live in this browser. No account. No cloud.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <p className="text-sm text-muted">No saved sessions yet. Dictate in Flow, then save.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setView("flow")}>Open Flow</Button>
            <Button variant="secondary" onClick={resetSample}>
              <Clapperboard /> Play sample cut
            </Button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{session.title}</p>
                <p className="mt-1 text-xs text-subtle">
                  {session.wordCount} words · {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    loadSession(session.id);
                  }}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    loadSession(session.id);
                    cutFromScript();
                  }}
                >
                  Send to cut
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete session"
                  onClick={() => deleteSession(session.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
