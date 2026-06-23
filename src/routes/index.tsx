import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Consulting/34 — Portale Clienti" },
      { name: "description", content: "Portale clienti dello Studio STP Consulting/34: dashboard finanziaria, KPI, fiscale." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const me = useServerFn(getMe);
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const meQ = useQuery({
    queryKey: ["me"],
    enabled: !!session.data,
    queryFn: () => me(),
  });

  useEffect(() => {
    if (meQ.data && (meQ.data.isAdmin || meQ.data.isClient)) {
      navigate({ to: meQ.data.isAdmin ? "/admin/clienti" : "/dashboard/overview" });
    }
  }, [meQ.data, navigate]);

  async function claimAdmin() {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) return toast.error(error.message);
    if (data === true) {
      toast.success("Sei ora amministratore");
      window.location.reload();
    } else {
      toast.error("Un amministratore esiste già. Chiedi un invito allo Studio.");
    }
  }

  const signedInWithoutRole = !!meQ.data && !meQ.data.isAdmin && !meQ.data.isClient;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center justify-between px-6">
        <div>
          <div className="text-sm font-bold tracking-wider text-primary">CONSULTING/34</div>
          <div className="text-[10px] text-muted-foreground">Studio STP · Portale Clienti</div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Il tuo studio commercialista, sempre con te.</h1>
          <p className="text-muted-foreground">
            Dashboard finanziaria, KPI in tempo reale, pianificazione fiscale e note dal consulente — tutto in un unico portale.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link to="/auth" className="inline-flex h-10 px-5 items-center justify-center rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              Accedi al portale
            </Link>
            {signedInWithoutRole && (
              <div className="text-xs text-muted-foreground">
                Hai effettuato l'accesso ma non hai ancora un ruolo.
                <Button variant="link" size="sm" onClick={claimAdmin}>Attiva come amministratore (primo accesso)</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
