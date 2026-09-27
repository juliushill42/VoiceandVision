const KEY = "vv.engine.session";

export type EngineSession = {
  projectId: string;
  mediaId?: string;
  lastArtifactId?: string;
};

export function readEngineSession(): EngineSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EngineSession;
    if (!parsed.projectId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeEngineSession(next: EngineSession) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export async function ensureEngineProject(
  create: (name: string, creator: string) => Promise<{ id: string }>,
  name: string,
) {
  const existing = readEngineSession();
  if (existing?.projectId) return existing;
  const proj = await create(name || "Voice & Vision", "creator");
  const session = { projectId: proj.id };
  writeEngineSession(session);
  return session;
}
