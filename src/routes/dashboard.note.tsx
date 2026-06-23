import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { listNotes } from "@/lib/portal.functions";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/dashboard/note")({
  head: () => ({ meta: [{ title: "Note del consulente — Consulting/34" }] }),
  component: Page,
});

function Page() {
  useRequireAuth("client");
  const myClient = useMyClient();
  const list = useServerFn(listNotes);
  const q = useQuery({
    queryKey: ["notes", myClient.data?.id],
    enabled: !!myClient.data?.id,
    queryFn: () => list({ data: { client_id: myClient.data!.id } }),
  });
  return (
    <ClientShell client={myClient.data} headerTitle="Note dal consulente">
      {(q.data ?? []).length === 0 ? (
        <PageCard><p className="text-sm text-muted-foreground">Nessuna nota dallo Studio al momento.</p></PageCard>
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((n) => (
            <PageCard key={n.id}>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span className="font-semibold">{n.autore}</span>
                <span>{new Date(n.created_at).toLocaleString("it-IT")}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.testo}</p>
              {n.ai_generated && <span className="mt-2 inline-flex text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">✦ AI</span>}
            </PageCard>
          ))}
        </div>
      )}
    </ClientShell>
  );
}