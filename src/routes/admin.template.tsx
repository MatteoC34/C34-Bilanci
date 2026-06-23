import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/template")({ component: Page });
function Page() {
  useRequireAuth("admin");
  return (
    <AdminShell headerTitle="Template AI">
      <PageCard><p className="text-sm text-muted-foreground">Gestione prompt e template AI — in arrivo.</p></PageCard>
    </AdminShell>
  );
}