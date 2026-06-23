import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/inviti")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Inviti Pendenti">
      <PageCard><p className="text-sm text-muted-foreground">Tutti gli inviti inviati sono attivi nella lista clienti. Sezione dedicata in arrivo.</p></PageCard>
    </AdminShell>
  );
}