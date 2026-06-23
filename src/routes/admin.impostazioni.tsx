import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/impostazioni")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Impostazioni">
      <PageCard><p className="text-sm text-muted-foreground">Impostazioni dello Studio — in arrivo.</p></PageCard>
    </AdminShell>
  );
}