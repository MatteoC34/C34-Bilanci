import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileDown, Sparkles } from "lucide-react";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { getDashboardData } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { HealthScore } from "@/components/health-score";
import { AlertItem } from "@/components/alert-item";
import { PageCard } from "@/components/page-card";
import { KPI_BY_KEY, formatKpiValue } from "@/lib/kpi-library";

export const Route = createFileRoute("/dashboard/overview")({
  head: () => ({ meta: [{ title: "Overview — Consulting/34" }] }),
  component: Overview,
});

const accentForKey: Record<string, "gold" | "success" | "destructive" | "info"> = {
  ebitda: "gold",
  ebitda_margin: "gold",
  gross_margin: "success",
  burn_rate: "destructive",
  runway: "info",
  mrr_arr: "success",
  cac: "info",
  ltv: "success",
  ltv_cac: "gold",
  churn: "destructive",
  nrr: "success",
  dso: "info",
  pfn_ebitda: "gold",
  current_ratio: "info",
  dscr: "gold",
};

const quarterly = [
  { q: "Q1", curr: 2200, prev: 1900, costi: 1750 },
  { q: "Q2", curr: 2450, prev: 2050, costi: 1900 },
  { q: "Q3", curr: 2600, prev: 2200, costi: 2050 },
  { q: "Q4", curr: 2750, prev: 2350, costi: 2150 },
];
const costMix = [
  { name: "Personale", value: 38 },
  { name: "Materie prime", value: 28 },
  { name: "Servizi", value: 18 },
  { name: "Affitti", value: 9 },
  { name: "Altri", value: 7 },
];
const COLORS = ["var(--primary)", "var(--success)", "var(--info)", "var(--destructive)", "var(--muted-foreground)"];

function Overview() {
  useRequireAuth("client");
  const myClient = useMyClient();
  const get = useServerFn(getDashboardData);

  const dashQ = useQuery({
    queryKey: ["dashboard", myClient.data?.id],
    enabled: !!myClient.data?.id,
    queryFn: () => get({ data: { client_id: myClient.data!.id } }),
  });

  if (!myClient.data) {
    return (
      <ClientShell client={null} headerTitle="Overview">
        <PageCard>
          <p className="text-sm text-muted-foreground">
            Nessun cliente associato al tuo account. Contatta lo Studio.
          </p>
        </PageCard>
      </ClientShell>
    );
  }

  const client = myClient.data;
  const data = dashQ.data;
  const isStartup = client.tipo === "startup_pre" || client.tipo === "startup_scale";

  const visibleKeys = new Set((data?.kpiConfig ?? []).filter((c) => c.visible).map((c) => c.kpi_key));
  const snapshots = (data?.snapshots ?? []).filter((s) => visibleKeys.has(s.kpi_key));

  const healthSnap = snapshots.find((s) => s.kpi_key === "health_score");
  const healthScore = Number(healthSnap?.valore ?? 0);

  const otherSnaps = snapshots.filter((s) => s.kpi_key !== "health_score").slice(0, 8);

  return (
    <ClientShell
      client={client}
      headerTitle="Overview"
      headerSubtitle={`Periodo 2024 · Ultimo aggiornamento ${data?.lastUpload ? new Date(data.lastUpload).toLocaleDateString("it-IT") : "—"}`}
      headerActions={<Button size="sm" variant="outline"><FileDown className="h-4 w-4 mr-1" />Esporta PDF</Button>}
    >
      {healthSnap && (
        <HealthScore
          score={healthScore}
          dimensions={[
            { name: "Redditività", score: 72 },
            { name: "Liquidità", score: 58 },
            { name: "Solidità", score: 81 },
            { name: "Efficienza", score: 66 },
            { name: "Crescita", score: 70 },
          ]}
          badges={
            healthScore >= 70
              ? [{ text: "Salute buona", type: "success" }, { text: "Liquidità da monitorare", type: "warning" }]
              : [{ text: "Attenzione richiesta", type: "warning" }]
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {otherSnaps.map((s) => {
          const def = KPI_BY_KEY[s.kpi_key];
          if (!def) return null;
          const invertDelta = ["burn_rate", "churn", "dso", "cac", "pfn_ebitda"].includes(s.kpi_key);
          return (
            <KpiCard
              key={s.id}
              label={def.label}
              value={formatKpiValue(Number(s.valore ?? 0), def.format)}
              subtitle={def.description}
              delta={s.delta_pct !== null && s.delta_pct !== undefined ? Number(s.delta_pct) : null}
              invertDelta={invertDelta}
              accent={accentForKey[s.kpi_key] ?? "gold"}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <PageCard title="Ricavi vs anno precedente" subtitle="Trimestrale, in migliaia di €" className="lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-muted-foreground" />2023</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />2024</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-destructive" />Costi</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={quarterly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="q" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="prev" name="2023" fill="var(--muted-foreground)" radius={[4,4,0,0]} />
                <Bar dataKey="curr" name="2024" fill="var(--primary)" radius={[4,4,0,0]} />
                <Bar dataKey="costi" name="Costi" fill="var(--destructive)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PageCard>

        <PageCard title="Composizione costi" subtitle="% sul totale">
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={costMix} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} paddingAngle={2}>
                  {costMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </PageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PageCard title="Alert & anomalie">
          {isStartup && (
            <AlertItem
              type="info"
              title="Perdita in linea con fase di sviluppo"
              description="La perdita di periodo è coerente con la fase startup e con il piano di raccolta capitali."
            />
          )}
          <AlertItem type="warning" title="DSO sopra la soglia di benchmark" description="78 giorni vs media settore 62 giorni — monitorare incassi clienti top 5." />
          <AlertItem type="info" title="EBITDA in crescita" description="EBITDA margin migliorato di 0.8 pp rispetto al trimestre precedente." />
        </PageCard>

        <PageCard title={<span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> AI Insight</span>}>
          {data?.notes?.[0] ? (
            <div>
              <p className="text-sm whitespace-pre-wrap">{data.notes[0].testo}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["liquidità", "fiscale", "crescita"].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">#{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna nota dal consulente al momento.</p>
          )}
        </PageCard>
      </div>
    </ClientShell>
  );
}