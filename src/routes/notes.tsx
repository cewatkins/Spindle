import { createFileRoute } from "@tanstack/react-router";
import { RichDoc } from "@/components/spindle/rich-doc";
import { Shell } from "@/components/spindle/shell";
import port from "../../docs/vst-port.md?raw";
import why from "../../docs/why-33.md?raw";
import kernel from "../dsp/vinylSpeed.ts?raw";

export const Route = createFileRoute("/notes")({
  component: Notes,
});

function downloadText(filename: string, text: string, type = "text/markdown") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Notes() {
  return (
    <Shell>
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="#why" className="inline-flex h-11 items-center rounded-full border border-border px-4 text-sm text-fg">
          The speeds
        </a>
        <a href="#port" className="inline-flex h-11 items-center rounded-full border border-border px-4 text-sm text-fg">
          VST port
        </a>
        <button
          type="button"
          className="h-11 rounded-full bg-label px-4 text-sm font-medium text-ink"
          onClick={() => downloadText("spindle-vinylSpeed.ts", kernel, "text/typescript")}
        >
          Download plugin
        </button>
        <button
          type="button"
          className="h-11 rounded-full border border-border px-4 text-sm text-fg"
          onClick={() => downloadText("spindle-notes.md", `${why.trim()}\n\n${port.trim()}\n`)}
        >
          Download notes
        </button>
      </div>
      <section id="why">
        <RichDoc source={why} />
      </section>
      <hr className="my-10 border-border" />
      <section id="port">
        <RichDoc source={port} />
      </section>
    </Shell>
  );
}
