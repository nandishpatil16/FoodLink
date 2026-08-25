import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { HandHeart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { fetchAccount } from "@/hooks/useAccount";
import { devEnsureLogin } from "@/lib/dev-auth.functions";


export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — FoodLink" },
      { name: "description", content: "Sign in to your FoodLink donor or receiver account." },
      { property: "og:title", content: "Login — FoodLink" },
      { property: "og:description", content: "Sign in to FoodLink to donate or collect food." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function routeAfterLogin() {
    const account = await fetchAccount();
    await router.invalidate();
    if (!account?.organization) {
      navigate({ to: "/auth/register" });
      return;
    }
    navigate({
      to: account.role === "receiver" ? "/receiver/discover" : "/donor/donate",
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Temporary: any password is accepted while the app is in demo mode.
        await devEnsureLogin({ data: { email, password } });
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      }
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back");
      await routeAfterLogin();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }


  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    await routeAfterLogin();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-card">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FoodLink</span>
        </Link>

        <h1 className="mt-6 text-2xl font-extrabold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your registered donor or receiver account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />} Sign in
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={onGoogle}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-surface"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/auth/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
