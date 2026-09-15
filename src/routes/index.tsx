import { createFileRoute } from "@tanstack/react-router";
import { StudioApp } from "@/components/studio/app-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StudioApp />;
}
