import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/dashboard")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Dashboard Globale">
      <PageCard><p className="text-sm text-muted-foreground">Vista aggregata di tutti i clienti — in arrivo.</p></PageCard>
    </AdminShell>
  );
}