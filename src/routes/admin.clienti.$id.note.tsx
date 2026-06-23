import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { listNotes, createNote, getClient } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageCard } from "@/components/page-card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clienti/$id/note")({
  head: () => ({ meta: [{ title: "Note & Commenti — Consulting/34" }] }),
  component: NotePage,
});

function NotePage() {
  useRequireAuth("admin");
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const listN = useServerFn(listNotes);
  const createN = useServerFn(createNote);
  const getC = useServerFn(getClient);

  const clientQ = useQuery({ queryKey: ["client", id, "name"], queryFn: () => getC({ data: { id } }) });
  const notesQ = useQuery({ queryKey: ["notes", id], queryFn: () => listN({ data: { client_id: id } }) });
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  const createM = useMutation({
    mutationFn: (testo: string) => createN({ data: { client_id: id, testo } }),
    onSuccess: () => {
      toast.success("Nota salvata");
      qc.invalidateQueries({ queryKey: ["notes", id] });
      setDraft("");
      setOpen(false);
    },
  });

  return (
    <AdminShell
      headerTitle={clientQ.data?.client.name ?? "Cliente"}
      headerSubtitle="Note & commenti per il cliente"
      headerActions={
        <Link to="/admin/clienti/$id" params={{ id }}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Indietro</Button>
        </Link>
      }
    >
      <PageCard
        title="Note dello Studio"
        actions={
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Plus className="h-4 w-4 mr-1" /> Nuova Nota
          </Button>
        }
      >
        {open && (
          <div className="mb-6 rounded-md border border-border p-3 bg-muted/30">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Scrivi una nota per il cliente…" rows={4} />
            <div className="mt-3 flex justify-between items-center gap-2">
              <Button variant="ghost" size="sm" disabled title="Disponibile in Fase 2">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Genera con AI
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annulla</Button>
                <Button size="sm" disabled={!draft.trim() || createM.isPending} onClick={() => createM.mutate(draft)}>
                  {createM.isPending ? "Salvo…" : "Salva nota"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {notesQ.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nessuna nota.</p>
        ) : (
          <div className="space-y-3">
            {notesQ.data?.map((n) => (
              <div key={n.id} className="rounded-md border border-border p-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{n.autore}</span>
                  <span>{new Date(n.created_at).toLocaleString("it-IT")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{n.testo}</p>
                {n.ai_generated && (
                  <span className="mt-2 inline-flex text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                    ✦ AI
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </AdminShell>
  );
}