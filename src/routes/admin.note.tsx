import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/note")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Note & Commenti">
      <PageCard><p className="text-sm text-muted-foreground">Vai sul singolo cliente dalla <Link to="/admin/clienti" className="text-primary underline">lista clienti</Link> per gestire le note.</p></PageCard>
    </AdminShell>
  );
}