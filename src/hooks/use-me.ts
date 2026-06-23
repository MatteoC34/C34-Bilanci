import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getMe } from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";

export function useMe() {
  const me = useServerFn(getMe);
  const sessionQ = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  return useQuery({
    queryKey: ["me"],
    enabled: !!sessionQ.data,
    queryFn: () => me(),
  });
}

export function useRequireAuth(requiredRole?: "admin" | "client") {
  const navigate = useNavigate();
  const meQ = useMe();
  useEffect(() => {
    if (meQ.isLoading) return;
    if (meQ.error || !meQ.data) {
      navigate({ to: "/auth" });
      return;
    }
    if (requiredRole === "admin" && !meQ.data.isAdmin) navigate({ to: "/dashboard/overview" });
    if (requiredRole === "client" && meQ.data.isAdmin) navigate({ to: "/admin/clienti" });
  }, [meQ.isLoading, meQ.error, meQ.data, requiredRole, navigate]);
  return meQ;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/auth";
}