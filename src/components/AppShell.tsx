import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, HandHeart } from "lucide-react";
import { BottomNav } from "./BottomNav";


export function AppShell({
  role,
  children,
  search,
}: {
  role: "donor" | "receiver";
  children: ReactNode;
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
}) {
  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link
            to={role === "donor" ? "/donor/dashboard" : "/receiver/dashboard"}
            className="flex items-center gap-2"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <HandHeart className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">FoodLink</span>
          </Link>

          {search ? (
            <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  placeholder={search.placeholder}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <BottomNav role={role} />
    </div>
  );

}
