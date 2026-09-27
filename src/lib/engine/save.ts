/** Voice & Vision save — files only. No stores. No social APIs.
 *  Pieces: Creator Engine bounce + browser download/share sheet.
 *  Phone piece (Car-e-oke file_picker) writes the same bytes on device.
 */

import { ENGINE_URL, engineHealth, shareBlob } from "./client";

export type SaveKind = "wav" | "mp3" | "mp4";

export type SaveRequest = {
  projectId: string;
  artifactId?: string;
  kind: SaveKind;
  filename?: string;
};

function defaultName(kind: SaveKind) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `voice-and-vision-${stamp}.${kind}`;
}

export async function saveArtifact(req: SaveRequest): Promise<{ how: string; filename: string }> {
  const health = await engineHealth();
  if ((health as { offline?: boolean }).offline) {
    throw new Error("Engine offline. Start engine/bootstrap.sh — Titan/CarEoke bounce lives there.");
  }
  if (!req.artifactId) {
    throw new Error("Nothing to save yet. Mix or Accept first so there is a bounced file.");
  }
  const filename = req.filename || defaultName(req.kind);
  const url = `${ENGINE_URL}/api/artifacts/${req.artifactId}?download=1&format=${req.kind}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Save failed (${res.status}). Engine must expose artifact bytes as ${req.kind}.`);
  }
  const blob = await res.blob();
  const how = await shareBlob(blob, filename, "Voice & Vision");
  return { how, filename };
}
