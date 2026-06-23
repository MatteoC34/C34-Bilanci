import { createFileRoute } from "@tanstack/react-router";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/dashboard/fiscale")({
  head: () => ({ meta: [{ title: "Fiscale & Tax — Consulting/34" }] }),
  component: Page,
});

function Page() {
  useRequireAuth("client");
  const myClient = useMyClient();
  return (
    <ClientShell client={myClient.data} headerTitle="Fiscale & Tax" headerSubtitle="Pianificazione e simulazioni">
      <PageCard title="Carico fiscale">
        <p className="text-sm text-muted-foreground">Modulo in arrivo nella prossima release.</p>
        <p className="mt-2 text-xs italic text-muted-foreground">Stima indicativa — verificare con il consulente.</p>
      </PageCard>
    </ClientShell>
  );
}

*** Add File: src/routes/dashboard.simulatore.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/dashboard/simulatore")({
  head: () => ({ meta: [{ title: "Simulatore — Consulting/34" }] }),
  component: Page,
});

function Page() {
  useRequireAuth("client");
  const myClient = useMyClient();
  return (
    <ClientShell client={myClient.data} headerTitle="Simulatore scenari">
      <PageCard><p className="text-sm text-muted-foreground">Simulatore di scenari finanziari — in arrivo.</p></PageCard>
    </ClientShell>
  );
}