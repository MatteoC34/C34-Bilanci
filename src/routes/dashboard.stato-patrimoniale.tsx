import { createFileRoute } from "@tanstack/react-router";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/dashboard/stato-patrimoniale")({
  head: () => ({ meta: [{ title: "Stato Patrimoniale — Consulting/34" }] }),
  component: SP,
});

function SP() {
  useRequireAuth("client");
  const myClient = useMyClient();
  return (
    <ClientShell client={myClient.data} headerTitle="Stato Patrimoniale" headerSubtitle="Schema OIC — 2024">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard title="Attivo">
          <p className="text-sm text-muted-foreground">Caricare un bilancio di verifica per popolare lo Stato Patrimoniale.</p>
        </PageCard>
        <PageCard title="Passivo">
          <p className="text-sm text-muted-foreground">Caricare un bilancio di verifica per popolare lo Stato Patrimoniale.</p>
        </PageCard>
      </div>
    </ClientShell>
  );
}