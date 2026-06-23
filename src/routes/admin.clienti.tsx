import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, ExternalLink, Upload as UploadIcon, MessageSquare, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { listClients, createClient, seedDemoData } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/admin/clienti")({
  head: () => ({ meta: [{ title: "Clienti — Admin · Consulting/34" }] }),
  component: ClientiPage,
});

const tipoLabel: Record<string, string> = {
  pmi: "PMI Tradizionale",
  startup_pre: "Startup Pre-Revenue",
  startup_scale: "Startup in Scaling",
  holding: "Holding / Gruppo",
  immobiliare: "Società Immobiliare",
};

function ClientiPage() {
  const me = useRequireAuth("admin");
  const list = useServerFn(listClients);
  const seed = useServerFn(seedDemoData);
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const clientsQ = useQuery({
    queryKey: ["clients"],
    enabled: !!me.data?.isAdmin,
    queryFn: () => list(),
  });

  const seedM = useMutation({
    mutationFn: () => seed(),
    onSuccess: () => {
      toast.success("Dati demo caricati");
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const all = clientsQ.data ?? [];
  const filtered = all.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.piva ?? "").includes(q));
  const active = filtered.filter((c) => !c.invited_at || all.length < 2);
  const stats = {
    clienti: all.length,
    fatturato: "€ —",
    alert: 0,
    bilanci: 0,
  };

  return (
    <AdminShell
      headerTitle="Clienti"
      headerSubtitle="Portafoglio dello Studio"
      headerActions={
        <Button variant="outline" size="sm" onClick={() => seedM.mutate()} disabled={seedM.isPending}>
          <Sparkles className="h-4 w-4 mr-1" /> {seedM.isPending ? "Carico…" : "Carica dati demo"}
        </Button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Clienti attivi", v: String(stats.clienti) },
          { l: "Fatturato aggregato", v: stats.fatturato },
          { l: "Alert critici", v: String(stats.alert) },
          { l: "Bilanci YTD", v: String(stats.bilanci) },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className="tabular text-2xl font-bold mt-2">{s.v}</div>
          </div>
        ))}
      </div>

      <PageCard
        title="Portafoglio clienti"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca cliente o P.IVA…"
                className="pl-8 h-8 w-64"
              />
            </div>
            <InviteDialog />
          </div>
        }
      >
        {clientsQ.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Caricamento…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nessun cliente. Clicca "Invita Nuovo Cliente" o "Carica dati demo" per iniziare.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-3 font-semibold">Cliente</th>
                  <th className="py-2 px-3 font-semibold">ATECO</th>
                  <th className="py-2 px-3 font-semibold">Tipologia</th>
                  <th className="py-2 px-3 font-semibold">Stato</th>
                  <th className="py-2 px-3 font-semibold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {active.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 px-3">
                      <div className="font-medium">{c.name}</div>
                      {c.piva && <div className="text-[10px] text-muted-foreground">P.IVA {c.piva}</div>}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{c.ateco ?? "—"}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                        {tipoLabel[c.tipo] ?? c.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Attivo
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to="/admin/clienti/$id" params={{ id: c.id }} title="KPI">
                          <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                        </Link>
                        <Link to="/admin/clienti/$id/upload" params={{ id: c.id }} title="Upload">
                          <Button variant="ghost" size="icon"><UploadIcon className="h-4 w-4" /></Button>
                        </Link>
                        <Link to="/admin/clienti/$id/note" params={{ id: c.id }} title="Note">
                          <Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </AdminShell>
  );
}

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const create = useServerFn(createClient);
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", piva: "", email: "", tipo: "pmi", ateco: "" });

  const m = useMutation({
    mutationFn: () => create({ data: { ...form, tipo: form.tipo as never } }),
    onSuccess: () => {
      toast.success("Cliente creato e invito inviato");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setForm({ name: "", piva: "", email: "", tipo: "pmi", ateco: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Invita Nuovo Cliente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuovo cliente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome cliente</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>P.IVA</Label><Input value={form.piva} onChange={(e) => setForm({ ...form, piva: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>ATECO</Label><Input value={form.ateco} onChange={(e) => setForm({ ...form, ateco: e.target.value })} /></div>
          <div>
            <Label>Tipologia</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pmi">PMI Tradizionale</SelectItem>
                <SelectItem value="startup_pre">Startup Pre-Revenue</SelectItem>
                <SelectItem value="startup_scale">Startup in Scaling</SelectItem>
                <SelectItem value="holding">Holding / Gruppo</SelectItem>
                <SelectItem value="immobiliare">Società Immobiliare</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.name || !form.email}>
            {m.isPending ? "Invio…" : "Crea e invia invito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}