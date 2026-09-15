import { useEffect, useState } from "react";
import type { MediaEl } from "@/lib/studio/compositor";
import type { Scene } from "@/lib/studio/types";

export function useMedia(scenes: Scene[]): Map<string, MediaEl> {
  const [map, setMap] = useState<Map<string, MediaEl>>(() => new Map());
  const key = scenes.map((scene) => `${scene.id}:${scene.src}`).join("|");

  useEffect(() => {
    let cancelled = false;
    const loaders = scenes.map(async (scene): Promise<[string, MediaEl]> => {
      if (scene.kind === "video") {
        const video = document.createElement("video");
        video.src = scene.src;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => resolve();
        });
        return [scene.id, video];
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = scene.src;
      try {
        await image.decode();
      } catch {
        await new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      }
      return [scene.id, image];
    });

    void Promise.all(loaders).then((entries) => {
      if (cancelled) return;
      setMap(new Map<string, MediaEl>(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [key, scenes]);

  return map;
}
