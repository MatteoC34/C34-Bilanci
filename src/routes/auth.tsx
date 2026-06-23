import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Accedi — Consulting/34" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Link di accesso inviato. Controlla la tua email.");
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  }

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
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold">Accedi al portale</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "magic" ? "Riceverai un link di accesso via email." : "Accedi con la tua password."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={mode === "magic" ? handleMagic : handlePassword}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            {mode === "password" && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Attendere…" : mode === "magic" ? "Invia link di accesso" : "Accedi"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "magic" ? "password" : "magic")}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "magic" ? "Accedi con password" : "Accedi con link via email"}
          </button>
        </div>
      </main>
    </div>
  );
}