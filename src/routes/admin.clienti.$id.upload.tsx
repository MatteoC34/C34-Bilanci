import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Cloud, FileSpreadsheet, FileText, Loader2, Play, Upload as UploadIcon, AlertCircle, ExternalLink, KeyRound } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { listUploadedFiles, recordUploadedFile, getClient } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageCard } from "@/components/page-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/clienti/$id/upload")({
  head: () => ({ meta: [{ title: "Upload Bilanci — Consulting/34" }] }),
  component: UploadPage,
});

const statusStyle: Record<string, string> = {
  pending: "bg-warning/20 text-warning-foreground",
  processing: "bg-info/15 text-info",
  done: "bg-success/15 text-success",
  error: "bg-destructive/15 text-destructive",
};
const statusLabel: Record<string, string> = {
  pending: "NUOVO",
  processing: "IN ELABORAZIONE",
  done: "ANALIZZATO",
  error: "ERRORE",
};

function UploadPage() {
  useRequireAuth("admin");
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const listFiles = useServerFn(listUploadedFiles);
  const recordFile = useServerFn(recordUploadedFile);
  const getC = useServerFn(getClient);

  const clientQ = useQuery({ queryKey: ["client", id, "name"], queryFn: () => getC({ data: { id } }) });
  const client = clientQ.data?.client as
    | { name: string; drive_url?: string | null; sibill_api_key?: string | null }
    | undefined;
  const driveUrl = client?.drive_url ?? null;
  const hasSibill = !!client?.sibill_api_key;
  const filesQ = useQuery({ queryKey: ["files", id], queryFn: () => listFiles({ data: { client_id: id } }) });

  const [fileType, setFileType] = useState<"bilancio_verifica" | "mastrini" | "nota_integrativa">("bilancio_verifica");
  const [periodo, setPeriodo] = useState("2024");
  const [uploading, setUploading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bilanci").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    await recordFile({
      data: {
        client_id: id,
        file_name: file.name,
        file_type: fileType,
        periodo,
        storage_path: path,
        size_bytes: file.size,
      },
    });
    toast.success("File caricato");
    qc.invalidateQueries({ queryKey: ["files", id] });
    setUploading(false);
  }

  const avviaM = useMutation({
    mutationFn: async () => {
      if (!selectedFileId) throw new Error("Nessun file selezionato");
      const tipo = fileType === "mastrini" ? "mastrini" : "bilancio";
      const { data, error } = await supabase.functions.invoke("parse-excel", {
        body: { file_id: selectedFileId, client_id: id, tipo, periodo },
      });
      if (error) throw error;
      return data as { rows_processed?: number } | null;
    },
    onMutate: () => setErrorMsg(null),
    onSuccess: (data) => {
      const n = data?.rows_processed ?? 0;
      toast.success(`Revisione completata — ${n} righe elaborate`);
      qc.invalidateQueries({ queryKey: ["files", id] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Errore durante l'elaborazione";
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const files = filesQ.data ?? [];
  const hasPending = files.some((f) => f.status === "pending");
  const canStart = !!selectedFileId && !avviaM.isPending;

  return (
    <AdminShell
      headerTitle={clientQ.data?.client.name ?? "Cliente"}
      headerSubtitle="Upload bilanci e mastrini"
      headerActions={
        <Link to="/admin/clienti/$id" params={{ id }}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Indietro</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard title="Google Drive" subtitle="Cartella condivisa con lo studio">
          {driveUrl ? (
            <div className="rounded-md bg-success/10 border border-success/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Cartella Drive collegata — clicca per aprire</span>
              </div>
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
              >
                {driveUrl} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <div className="mt-3">
                <Link to="/admin/clienti" title="Cambia link">
                  <Button variant="outline" size="sm">Cambia link</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-muted/40 p-4 text-center">
              <Cloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-2">Nessuna cartella collegata.</p>
              <Link to="/admin/clienti">
                <Button variant="outline" size="sm">Imposta link dalla scheda cliente</Button>
              </Link>
            </div>
          )}
          <div className="mt-3 rounded-md border border-border p-3 flex items-start gap-2">
            <KeyRound className={cn("h-4 w-4 mt-0.5", hasSibill ? "text-success" : "text-muted-foreground")} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sibill</span>
                {hasSibill ? (
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-success/15 text-success">COLLEGATO</span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">NON CONFIGURATO</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {hasSibill
                  ? "API Key configurata · i dati bancari saranno disponibili nella prossima release"
                  : "Imposta l'API Key dalla scheda cliente"}
              </p>
            </div>
          </div>
        </PageCard>

        <PageCard title="Upload manuale" subtitle="Excel (.xlsx/.xls/.csv) o PDF — verranno analizzati dopo «Avvia Revisione»">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo file</Label>
                <select
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as never)}
                >
                  <option value="bilancio_verifica">Bilancio di verifica</option>
                  <option value="mastrini">Mastrini</option>
                  <option value="nota_integrativa">Nota integrativa</option>
                </select>
              </div>
              <div>
                <Label>Periodo</Label>
                <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <label className="block rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-medium">Trascina o clicca per selezionare</div>
              <div className="text-xs text-muted-foreground mt-1">{uploading ? "Caricamento…" : ".xlsx, .xls, .csv, .pdf"}</div>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.pdf"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          </div>
        </PageCard>
      </div>

      <PageCard title="File rilevati — in attesa di revisione" className="mt-6">
        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore elaborazione</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}
        {filesQ.isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Caricamento…</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nessun file caricato.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-3"></th>
                <th className="py-2 px-3"></th>
                <th className="py-2 px-3">Nome</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Periodo</th>
                <th className="py-2 px-3">Caricato</th>
                <th className="py-2 px-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const isExcel = /\.(xlsx|xls|csv)$/i.test(f.file_name);
                return (
                  <tr key={f.id} className="border-b border-border/60">
                    <td className="py-2 px-3">
                      <input
                        type="radio"
                        name="selectedFile"
                        checked={selectedFileId === f.id}
                        onChange={() => setSelectedFileId(f.id)}
                        aria-label={`Seleziona ${f.file_name}`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      {isExcel ? <FileSpreadsheet className="h-4 w-4 text-success" /> : <FileText className="h-4 w-4 text-destructive" />}
                    </td>
                    <td className="py-2 px-3 font-medium">{f.file_name}</td>
                    <td className="py-2 px-3 text-muted-foreground">{f.file_type}</td>
                    <td className="py-2 px-3 text-muted-foreground">{f.periodo ?? "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{new Date(f.uploaded_at).toLocaleString("it-IT")}</td>
                    <td className="py-2 px-3">
                      <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-semibold", statusStyle[f.status])}>
                        {statusLabel[f.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {hasPending && (
          <div className="mt-6 flex justify-center">
            <Button size="lg" onClick={() => avviaM.mutate()} disabled={!canStart}>
              {avviaM.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Elaborazione…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Avvia Revisione
                </>
              )}
            </Button>
          </div>
        )}
      </PageCard>
    </AdminShell>
  );
}