import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, ExternalLink, Upload as UploadIcon, MessageSquare, Sparkles, FileText, Loader2, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { listClients, createClient, seedDemoData, parseVisura, updateClient, deleteClient } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const navigate = useNavigate();

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
          { l: "Clienti attivi", v: String(stats.clienti), border: "border-l-2 border-primary" },
          { l: "Fatturato aggregato", v: stats.fatturato, border: "border-l-2 border-success" },
          { l: "Alert critici", v: String(stats.alert), border: "border-l-2 border-destructive" },
          { l: "Bilanci YTD", v: String(stats.bilanci), border: "border-l-2 border-info" },
        ].map((s) => (
          <div key={s.l} className={`rounded-xl border border-border bg-card p-4 shadow-sm ${s.border}`}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className="tabular text-xl font-bold mt-2">{s.v}</div>
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
            <ImportVisuraDialog />
            <InviteDialog />
          </div>
        }
      >
        {clientsQ.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Caricamento…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nessun cliente. Clicca "Nuovo cliente" o "Carica dati demo" per iniziare.
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
                {filtered.map((c) => (
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
                      {c.invited_at ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Invitato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Solo anagrafica
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <EditClientDialog client={c} />
                        <DeleteClientDialog id={c.id} name={c.name} />
                        <Button
                          variant="ghost"
                          size="icon"
                          title="KPI"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: "/admin/clienti/$id", params: { id: c.id } });
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: "/admin/clienti/$id/upload", params: { id: c.id } });
                          }}
                        >
                          <UploadIcon className="h-3.5 w-3.5" />
                          Upload
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Note"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: "/admin/clienti/$id/note", params: { id: c.id } });
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
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
  const [sendInvite, setSendInvite] = useState(false);

  const m = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: form.name,
          piva: form.piva || null,
          email: form.email || null,
          ateco: form.ateco || null,
          tipo: form.tipo as never,
          send_invite: sendInvite,
        },
      }),
    onSuccess: () => {
      toast.success(sendInvite ? "Cliente creato e invito inviato" : "Cliente creato");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setForm({ name: "", piva: "", email: "", tipo: "pmi", ateco: "" });
      setSendInvite(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuovo cliente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuovo cliente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome cliente</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>P.IVA</Label><Input value={form.piva} onChange={(e) => setForm({ ...form, piva: e.target.value })} /></div>
          <div>
            <Label>Email <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
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
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <Checkbox
              checked={sendInvite}
              onCheckedChange={(v) => setSendInvite(v === true)}
              disabled={!form.email}
            />
            <span className="text-sm">Invia invito al cliente via email</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.name}>
            {m.isPending ? "Salvo…" : sendInvite ? "Crea e invia invito" : "Crea cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ClientRow = {
  id: string;
  name: string;
  piva: string | null;
  email: string | null;
  ateco: string | null;
  tipo: string;
  sibill_api_key?: string | null;
  drive_url?: string | null;
};

function EditClientDialog({ client }: { client: ClientRow }) {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const update = useServerFn(updateClient);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: client.name ?? "",
    piva: client.piva ?? "",
    email: client.email ?? "",
    ateco: client.ateco ?? "",
    tipo: client.tipo ?? "pmi",
    sibill_api_key: client.sibill_api_key ?? "",
    drive_url: client.drive_url ?? "",
  });

  const m = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: client.id,
          name: form.name,
          piva: form.piva || null,
          email: form.email || null,
          ateco: form.ateco || null,
          tipo: form.tipo as never,
          sibill_api_key: form.sibill_api_key || null,
          drive_url: form.drive_url || null,
        },
      }),
    onSuccess: () => {
      toast.success("Cliente aggiornato");
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", client.id, "name"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) setForm({
        name: client.name ?? "",
        piva: client.piva ?? "",
        email: client.email ?? "",
        ateco: client.ateco ?? "",
        tipo: client.tipo ?? "pmi",
        sibill_api_key: client.sibill_api_key ?? "",
        drive_url: client.drive_url ?? "",
      });
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Modifica"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Modifica cliente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>P.IVA</Label><Input value={form.piva} onChange={(e) => setForm({ ...form, piva: e.target.value })} /></div>
            <div><Label>ATECO</Label><Input value={form.ateco} onChange={(e) => setForm({ ...form, ateco: e.target.value })} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
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

          <div className="border-t border-border pt-3 mt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Integrazioni</div>
            <div className="space-y-3">
              <div>
                <Label>Sibill API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={form.sibill_api_key}
                    onChange={(e) => setForm({ ...form, sibill_api_key: e.target.value })}
                    placeholder="sk_..."
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showKey ? "Nascondi" : "Mostra"}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Chiave API del portale Sibill per questo cliente. Non condividerla.</p>
              </div>
              <div>
                <Label>Link cartella Google Drive</Label>
                <Input
                  type="url"
                  value={form.drive_url}
                  onChange={(e) => setForm({ ...form, drive_url: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                />
                <p className="text-[11px] text-muted-foreground mt-1">URL della cartella Drive condivisa con lo studio (es. https://drive.google.com/drive/folders/...)</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.name}>
            {m.isPending ? "Salvo…" : "Salva modifiche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClientDialog({ id, name }: { id: string; name: string }) {
  const del = useServerFn(deleteClient);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Cliente eliminato");
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          title="Elimina"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Elimina {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Questa azione eliminerà definitivamente il cliente e tutti i dati associati: bilanci, mastrini, KPI, note. Non è reversibile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={m.isPending}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); m.mutate(); }}
            disabled={m.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {m.isPending ? "Elimino…" : "Elimina definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ImportVisuraDialog() {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    piva: "",
    email: "",
    ateco: "",
    tipo: "pmi",
    codice_fiscale: "",
    indirizzo_sede: "",
    forma_giuridica: "",
  });
  const [extracted, setExtracted] = useState(false);
  const [sendInvite, setSendInvite] = useState(false);
  const parse = useServerFn(parseVisura);
  const create = useServerFn(createClient);
  const qc = useQueryClient();

  const parseM = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const base64 = btoa(binary);
      return parse({ data: { file_base64: base64, mime_type: file.type || "application/pdf" } });
    },
    onMutate: () => setErrorMsg(null),
    onSuccess: (d) => {
      setForm({
        name: d.name,
        piva: d.piva,
        email: d.email,
        ateco: d.ateco,
        tipo: d.tipo,
        codice_fiscale: d.codice_fiscale,
        indirizzo_sede: d.indirizzo_sede,
        forma_giuridica: d.forma_giuridica,
      });
      setExtracted(true);
      toast.success("Dati estratti dalla visura");
    },
    onError: (e: Error) => {
      setErrorMsg(e.message);
      toast.error("Estrazione fallita");
    },
  });

  const createM = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: form.name,
          piva: form.piva || null,
          email: form.email || null,
          ateco: form.ateco || null,
          tipo: form.tipo as never,
          send_invite: sendInvite,
        },
      }),
    onSuccess: () => {
      toast.success(sendInvite ? "Cliente creato e invito inviato" : "Cliente creato");
      qc.invalidateQueries({ queryKey: ["clients"] });
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function reset() {
    setForm({ name: "", piva: "", email: "", ateco: "", tipo: "pmi", codice_fiscale: "", indirizzo_sede: "", forma_giuridica: "" });
    setExtracted(false);
    setErrorMsg(null);
    setSendInvite(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4 mr-1" /> Importa da visura
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importa cliente da visura camerale</DialogTitle>
        </DialogHeader>

        {!extracted ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carica una visura camerale (PDF). L'IA estrarrà automaticamente i dati anagrafici del cliente.
            </p>
            <label
              className={
                "block rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors " +
                (parseM.isPending ? "opacity-60 cursor-wait" : "cursor-pointer hover:border-primary")
              }
            >
              {parseM.isPending ? (
                <>
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                  <div className="text-sm font-medium">Estrazione in corso…</div>
                  <div className="text-xs text-muted-foreground mt-1">Potrebbe richiedere qualche secondo</div>
                </>
              ) : (
                <>
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-sm font-medium">Trascina o clicca per selezionare la visura</div>
                  <div className="text-xs text-muted-foreground mt-1">PDF, max ~10 MB</div>
                </>
              )}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={parseM.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseM.mutate(f);
                  e.target.value = "";
                }}
              />
            </label>
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>Errore estrazione</AlertTitle>
                <AlertDescription className="break-words">{errorMsg}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Verifica i dati estratti, completa l'email per l'invito e crea il cliente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Ragione sociale</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>P.IVA</Label>
                <Input value={form.piva} onChange={(e) => setForm({ ...form, piva: e.target.value })} />
              </div>
              <div>
                <Label>Codice fiscale</Label>
                <Input value={form.codice_fiscale} onChange={(e) => setForm({ ...form, codice_fiscale: e.target.value })} />
              </div>
              <div>
                <Label>ATECO</Label>
                <Input value={form.ateco} onChange={(e) => setForm({ ...form, ateco: e.target.value })} />
              </div>
              <div>
                <Label>Forma giuridica</Label>
                <Input value={form.forma_giuridica} onChange={(e) => setForm({ ...form, forma_giuridica: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Sede legale</Label>
                <Input value={form.indirizzo_sede} onChange={(e) => setForm({ ...form, indirizzo_sede: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Email <span className="text-muted-foreground font-normal">(opzionale, per invito)</span></Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@esempio.it"
                />
              </div>
              <div className="col-span-2">
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
              <label className="col-span-2 flex items-center gap-2 pt-1 cursor-pointer">
                <Checkbox
                  checked={sendInvite}
                  onCheckedChange={(v) => setSendInvite(v === true)}
                  disabled={!form.email}
                />
                <span className="text-sm">Invia invito al cliente via email</span>
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {extracted && (
            <Button variant="ghost" onClick={reset}>Carica un'altra</Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          {extracted && (
            <Button
              onClick={() => createM.mutate()}
              disabled={createM.isPending || !form.name}
            >
              {createM.isPending ? "Creazione…" : sendInvite ? "Crea e invia invito" : "Crea cliente"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}