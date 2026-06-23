import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { ArrowLeft, Upload as UploadIcon, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useRequireAuth } from "@/hooks/use-me";
import { getClient, updateClientTipo, upsertKpiConfig, bulkSetKpiConfig } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageCard } from "@/components/page-card";
import { TagChip } from "@/components/tag-chip";
import { KPI_LIBRARY, defaultKpisForTipo } from "@/lib/kpi-library";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/clienti/$id")({
  head: () => ({ meta: [{ title: "Dettaglio cliente — Consulting/34" }] }),
  component: ClienteDetail,
});

const tipoOptions = [
  { v: "pmi", icon: "📦", label: "PMI Tradizionale", desc: "Azienda consolidata, ricavi e margini reali" },
  { v: "startup_pre", icon: "🌱", label: "Startup Pre-Revenue", desc: "Seed stage, perdita strutturale normale" },
  { v: "startup_scale", icon: "🚀", label: "Startup in Scaling", desc: "MRR positivo, focus su qualità crescita" },
  { v: "holding", icon: "🏛", label: "Holding / Gruppo", desc: "Consolidato, partecipazioni, intercompany" },
  { v: "immobiliare", icon: "🏗", label: "Società Immobiliare", desc: "Patrimonio immobiliare, canoni, rivalutazioni" },
];

function ClienteDetail() {
  useRequireAuth("admin");
  const { id } = Route.useParams();
  const get = useServerFn(getClient);
  const upTipo = useServerFn(updateClientTipo);
  const upKpi = useServerFn(upsertKpiConfig);
  const bulkKpi = useServerFn(bulkSetKpiConfig);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["client", id], queryFn: () => get({ data: { id } }) });

  const visibleMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    q.data?.kpiConfig.forEach((c) => (m[c.kpi_key] = c.visible));
    return m;
  }, [q.data]);

  const toggleM = useMutation({
    mutationFn: (vars: { kpi_key: string; visible: boolean }) =>
      upKpi({ data: { client_id: id, ...vars } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", id] }),
  });

  const tipoM = useMutation({
    mutationFn: (tipo: string) => upTipo({ data: { id, tipo: tipo as never } }),
    onSuccess: () => {
      toast.success("Tipologia aggiornata");
      qc.invalidateQueries({ queryKey: ["client", id] });
    },
  });

  const applySetM = useMutation({
    mutationFn: async () => {
      if (!q.data?.client) return;
      const recommended = defaultKpisForTipo(q.data.client.tipo);
      const allKeys = KPI_LIBRARY.flatMap((s) => s.kpis.map((k) => k.key));
      const toEnable = recommended;
      const toDisable = allKeys.filter((k) => !recommended.includes(k));
      await bulkKpi({ data: { client_id: id, keys: toEnable, visible: true } });
      await bulkKpi({ data: { client_id: id, keys: toDisable, visible: false } });
    },
    onSuccess: () => {
      toast.success("Set KPI consigliato applicato");
      qc.invalidateQueries({ queryKey: ["client", id] });
    },
  });

  if (q.isLoading || !q.data) {
    return <AdminShell headerTitle="Dettaglio cliente"><p className="text-sm text-muted-foreground">Caricamento…</p></AdminShell>;
  }

  const client = q.data.client;

  return (
    <AdminShell
      headerTitle={client.name}
      headerSubtitle={`P.IVA ${client.piva ?? "—"} · ATECO ${client.ateco ?? "—"}`}
      headerActions={
        <>
          <Link to="/admin/clienti"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Indietro</Button></Link>
          <Link to="/admin/clienti/$id/upload" params={{ id }}><Button variant="outline" size="sm"><UploadIcon className="h-4 w-4 mr-1" />Upload</Button></Link>
          <Link to="/admin/clienti/$id/note" params={{ id }}><Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-1" />Note</Button></Link>
        </>
      }
    >
      <PageCard title="Tipologia cliente" subtitle="Determina il set KPI consigliato">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={client.tipo} onValueChange={(v) => tipoM.mutate(v)}>
            <SelectTrigger className="h-auto py-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tipoOptions.map((o) => (
                <SelectItem key={o.v} value={o.v}>
                  <span className="mr-2">{o.icon}</span>{o.label} — <span className="text-muted-foreground">{o.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold">Set KPI consigliato disponibile</div>
              <div className="text-muted-foreground">Applica i KPI standard per "{tipoOptions.find((o) => o.v === client.tipo)?.label}".</div>
            </div>
            <Button size="sm" onClick={() => applySetM.mutate()} disabled={applySetM.isPending}>
              {applySetM.isPending ? "Applico…" : "Applica set consigliato"}
            </Button>
          </div>
        </div>
      </PageCard>

      <div className="mt-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold">Libreria KPI — configura cosa vede il cliente</h2>
          <p className="text-xs text-muted-foreground mt-0.5">I KPI disattivati non saranno mai visibili al cliente.</p>
        </div>
        {KPI_LIBRARY.map((section) => {
          const allOn = section.kpis.every((k) => visibleMap[k.key]);
          return (
            <PageCard
              key={section.id}
              title={section.title}
              actions={
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() =>
                    bulkKpi({ data: { client_id: id, keys: section.kpis.map((k) => k.key), visible: !allOn } }).then(() =>
                      qc.invalidateQueries({ queryKey: ["client", id] }),
                    )
                  }
                >
                  {allOn ? "Disattiva tutte" : "Attiva tutte"}
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {section.kpis.map((k) => {
                  const on = visibleMap[k.key] ?? false;
                  return (
                    <div
                      key={k.key}
                      className={cn(
                        "rounded-lg border border-border p-3 transition-opacity",
                        on ? "opacity-100" : "opacity-40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-tight">{k.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{k.description}</div>
                        </div>
                        <Switch
                          checked={on}
                          onCheckedChange={(v) => toggleM.mutate({ kpi_key: k.key, visible: v })}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {k.tags.map((t) => (<TagChip key={t} tag={t} />))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageCard>
          );
        })}
      </div>
    </AdminShell>
  );
}