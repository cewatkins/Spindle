import type { ReactNode } from "react";

type Block =
  | { kind: "h"; level: number; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "code"; text: string };

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: "h", level: heading[1]?.length ?? 1, text: heading[2] ?? "" });
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("- ")) {
        items.push((lines[i] ?? "").slice(2));
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    const buf = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i] ?? "";
      if (
        next.trim() === "" ||
        next.startsWith("#") ||
        next.startsWith("```") ||
        next.startsWith("- ")
      ) {
        break;
      }
      buf.push(next);
      i += 1;
    }
    blocks.push({ kind: "p", text: buf.join(" ") });
  }
  return blocks;
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-medium text-fg">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code key={key} className="font-mono text-sm text-fg">
          {token.slice(1, -1)}
        </code>,
      );
    }
    key += 1;
    cursor = match.index + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function RichDoc({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <article className="max-w-prose">
      {blocks.map((block, index) => {
        if (block.kind === "h") {
          if (block.level === 1) {
            return (
              <h1 key={index} className="font-display text-3xl leading-tight tracking-tight text-fg">
                {inline(block.text)}
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={index} className="mt-8 font-display text-xl leading-snug tracking-tight text-fg">
                {inline(block.text)}
              </h2>
            );
          }
          return (
            <h3 key={index} className="mt-6 text-lg font-medium text-fg">
              {inline(block.text)}
            </h3>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={index} className="mt-3 list-disc space-y-1 pl-5 text-muted">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "code") {
          return (
            <pre
              key={index}
              className="mt-4 overflow-x-auto rounded-md border border-border bg-bg-elevated p-4 font-mono text-sm leading-relaxed text-fg"
            >
              {block.text}
            </pre>
          );
        }
        return (
          <p key={index} className="mt-3 text-base leading-relaxed text-muted">
            {inline(block.text)}
          </p>
        );
      })}
    </article>
  );
}
