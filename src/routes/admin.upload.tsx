import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/upload")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Upload Bilanci" headerSubtitle="Vista aggregata">
      <PageCard title="Carica un bilancio">
        <p className="text-sm text-muted-foreground">Per caricare bilanci seleziona prima un cliente dalla <Link to="/admin/clienti" className="text-primary underline">lista clienti</Link>.</p>
      </PageCard>
    </AdminShell>
  );
}