import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="font-display text-xl tracking-tight text-fg">
            Spindle
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="rounded-full px-3 py-2 text-muted"
              activeProps={{ className: "rounded-full bg-bg-subtle px-3 py-2 text-fg" }}
            >
              Bench
            </Link>
            <Link
              to="/notes"
              className="rounded-full px-3 py-2 text-muted"
              activeProps={{ className: "rounded-full bg-bg-subtle px-3 py-2 text-fg" }}
            >
              Notes
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
