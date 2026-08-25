import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BellRing, Plus, History, User, Search, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type NavRole = "donor" | "receiver";

const CONFIG: Record<
  NavRole,
  {
    home: string;
    list: { to: string; label: string };
    center: { to: string; label: string };
    third: { to: string; label: string };
  }
> = {
  donor: {
    home: "/donor/dashboard",
    list: { to: "/donor/status", label: "Status" },
    center: { to: "/donor/donate", label: "Donate" },
    third: { to: "/donor/history", label: "History" },
  },
  receiver: {
    home: "/receiver/dashboard",
    list: { to: "/receiver/accepted", label: "Accepted" },
    center: { to: "/receiver/discover", label: "Discover" },
    third: { to: "/receiver/history", label: "History" },
  },
};

export function BottomNav({ role }: { role: NavRole }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cfg = CONFIG[role];

  const item = (to: string, label: string, Icon: typeof Home) => (
    <Link
      to={to}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors",
        pathname === to
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-end gap-1 px-3 pb-2 pt-1.5">
        {item(cfg.home, "Home", Home)}
        {item(cfg.list.to, cfg.list.label, role === "donor" ? BellRing : PackageCheck)}

        <div className="flex flex-1 flex-col items-center">
          <Link
            to={cfg.center.to}
            aria-label={cfg.center.label}
            className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float transition-transform hover:scale-105"
          >
            {role === "donor" ? <Plus className="size-6" /> : <Search className="size-6" />}
          </Link>
          <span className="mt-1 text-xs font-semibold text-foreground">{cfg.center.label}</span>
        </div>

        {item(cfg.third.to, cfg.third.label, History)}
        {item("/account", "Profile", User)}
      </div>
    </nav>
  );
}
