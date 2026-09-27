import { ENGINE_URL, engineHealth, shareBlob } from "./client";
import { readEngineSession } from "./session";

export type SaveKind = "wav" | "mp3" | "mp4";

export async function saveArtifact(kind: SaveKind, artifactId?: string) {
  const health = await engineHealth();
  if ((health as { offline?: boolean }).offline) {
    throw new Error("Engine offline. Run engine/bootstrap.sh");
  }
  const id = artifactId || readEngineSession()?.lastArtifactId;
  if (!id) {
    throw new Error("Nothing bounced yet. Render mix first.");
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `voice-and-vision-${stamp}.${kind}`;
  const res = await fetch(`${ENGINE_URL}/api/artifacts/${id}?format=${kind}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Save ${kind} failed`);
  }
  const blob = await res.blob();
  const how = await shareBlob(blob, filename, "Voice & Vision");
  return { how, filename, bytes: blob.size };
}
