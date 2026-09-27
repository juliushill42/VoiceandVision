export const ENGINE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_VV_ENGINE_URL) ||
  "http://127.0.0.1:8765";

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${ENGINE_URL}${path}`, init);
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  if (!res.ok) throw new Error(body?.error || text || res.statusText);
  return body;
}

export async function engineHealth() {
  try { return await req("/api/health"); }
  catch { return { ok: false, offline: true }; }
}

export async function createEngineProject(name: string, creator: string) {
  return req("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, creator_name: creator }),
  });
}

export async function uploadEngineMedia(projectId: string, file: Blob, kind: string, part: string, filename: string) {
  const qs = new URLSearchParams({ project_id: projectId, kind, part, name: filename });
  return req(`/api/media?${qs}`, { method: "POST", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
}

export async function analyzeMedia(projectId: string, mediaId: string) {
  return req("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, media_id: mediaId }),
  });
}

export async function processVocal(projectId: string, mediaId: string, params: Record<string, unknown> = {}) {
  const settings = {
    highpass_hz: params.highpass_hz ?? params.hp_hz ?? params.hpHz ?? 85,
    gate_db: params.gate_db ?? params.gateDb ?? -38,
    compressor_threshold_db: params.compressor_threshold_db ?? -18,
    compressor_ratio: params.compressor_ratio ?? 3,
    makeup_db: params.makeup_db ?? 2,
    ceiling_db: params.ceiling_db ?? -1,
    ...params,
  };
  return req("/api/process/vocal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, media_id: mediaId, settings }),
  });
}

export async function renderMix(projectId: string, tracks: unknown[]) {
  return req("/api/mix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, tracks }),
  });
}

export async function renderMaster(projectId: string, artifactId: string, params: Record<string, unknown> = {}) {
  return req("/api/master", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, artifact_id: artifactId, ...params }),
  });
}

export async function analyzeSync(projectId: string, audioMediaId: string, videoMediaId: string) {
  return req("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, audio_media_id: audioMediaId, video_media_id: videoMediaId }),
  });
}

export async function inspectSession(projectId: string, audioMediaIds: string[]) {
  return req("/api/intelligence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, audio_media_ids: audioMediaIds }),
  });
}

export async function decideSuggestion(input: {
  project_id: string; suggestion_id: string; decision: "accept" | "reject";
  kind?: string; params?: Record<string, unknown>; note?: string; execute?: boolean;
}) {
  return req("/api/override", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function shareBlob(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return "native-share";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  return "download";
}
