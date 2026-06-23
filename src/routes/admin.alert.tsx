import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/alert")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Alert Portafoglio">
      <PageCard><p className="text-sm text-muted-foreground">Alert critici per cliente — in arrivo.</p></PageCard>
    </AdminShell>
  );
}