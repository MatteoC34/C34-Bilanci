import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { listUploadedFiles } from "@/lib/portal.functions";
import { PageCard } from "@/components/page-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/bilanci")({
  head: () => ({ meta: [{ title: "Bilanci caricati — Consulting/34" }] }),
  component: Page,
});

const statusStyle: Record<string, string> = {
  pending: "bg-warning/20 text-warning-foreground",
  processing: "bg-info/15 text-info",
  done: "bg-success/15 text-success",
  error: "bg-destructive/15 text-destructive",
};

function Page() {
  useRequireAuth("client");
  const myClient = useMyClient();
  const list = useServerFn(listUploadedFiles);
  const q = useQuery({
    queryKey: ["files", myClient.data?.id],
    enabled: !!myClient.data?.id,
    queryFn: () => list({ data: { client_id: myClient.data!.id } }),
  });
  const rows = q.data ?? [];
  return (
    <ClientShell client={myClient.data} headerTitle="Bilanci caricati" headerSubtitle="Documenti messi a disposizione dallo Studio">
      <PageCard>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nessun bilancio caricato.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-3">Nome file</th><th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Periodo</th><th className="py-2 px-3">Caricato</th><th className="py-2 px-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-b border-border/60">
                  <td className="py-2 px-3 font-medium">{f.file_name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{f.file_type}</td>
                  <td className="py-2 px-3 text-muted-foreground">{f.periodo ?? "—"}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{new Date(f.uploaded_at).toLocaleString("it-IT")}</td>
                  <td className="py-2 px-3">
                    <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase", statusStyle[f.status])}>
                      {f.status === "done" ? "Analizzato" : f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </ClientShell>
  );
}