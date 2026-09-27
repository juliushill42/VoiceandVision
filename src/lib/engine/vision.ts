import { ASPECT_SIZE } from "@/lib/studio/types";
import type { Project } from "@/lib/studio/types";
import { exportWebm } from "@/lib/studio/compositor";
import { ENGINE_URL, engineHealth, renderVideo, uploadEngineMedia } from "./client";
import { readEngineSession, writeEngineSession } from "./session";

export async function muxVision(opts: {
  project: Project;
  media: Map<string, HTMLImageElement | HTMLVideoElement>;
  duration: number;
  onProgress?: (n: number) => void;
}) {
  const health = await engineHealth();
  if ((health as { offline?: boolean }).offline) {
    throw new Error("Engine offline — vision mux needs /api/video/render");
  }
  const session = readEngineSession();
  if (!session?.projectId || !session.lastArtifactId) {
    throw new Error("Bounce audio first so vision has a master to lay under the picture.");
  }
  const webm = await exportWebm(
    opts.project,
    opts.media,
    opts.duration,
    opts.onProgress || (() => undefined),
  );
  const size = ASPECT_SIZE[opts.project.aspect];
  const uploaded = await uploadEngineMedia(session.projectId, webm, "video", "picture", "cut.webm");
  const video = await renderVideo({
    project_id: session.projectId,
    video_media_id: uploaded.id,
    audio_artifact_id: session.lastArtifactId,
    width: size.w,
    height: size.h,
  });
  writeEngineSession({ ...session, lastArtifactId: video.id });
  const res = await fetch(`${ENGINE_URL}/api/artifacts/${video.id}?format=mp4`);
  if (!res.ok) throw new Error("Vision MP4 failed");
  return res.blob();
}
