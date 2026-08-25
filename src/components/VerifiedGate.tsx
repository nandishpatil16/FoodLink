import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAccount } from "@/hooks/useAccount";

/**
 * Renders children only for a verified organisation of the given role.
 * Unverified accounts go to the verification status page.
 */
export function VerifiedGate({
  role,
  children,
}: {
  role: "donor" | "receiver";
  children: () => ReactNode;
}) {
  const { data, isLoading } = useAccount();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.organization) return <Navigate to="/auth/register" replace />;
  if (data.organization.role !== role)
    return (
      <Navigate to={data.organization.role === "donor" ? "/donor/dashboard" : "/receiver/discover"} replace />
    );

  return <>{children()}</>;
}
