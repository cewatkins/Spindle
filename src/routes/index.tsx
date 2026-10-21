import { createFileRoute } from "@tanstack/react-router";
import { Bench } from "@/components/spindle/bench";
import { Shell } from "@/components/spindle/shell";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Shell>
      <Bench />
    </Shell>
  );
}
