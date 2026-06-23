import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { getTrialBalance } from "@/lib/portal.functions";
import { PageCard } from "@/components/page-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/conto-economico")({
  head: () => ({ meta: [{ title: "Conto Economico — Consulting/34" }] }),
  component: CE,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function CE() {
  useRequireAuth("client");
  const myClient = useMyClient();
  const get = useServerFn(getTrialBalance);

  const tbQ = useQuery({
    queryKey: ["tb", myClient.data?.id, "2024"],
    enabled: !!myClient.data?.id,
    queryFn: () => get({ data: { client_id: myClient.data!.id, periodo: "2024" } }),
  });

  const rows = tbQ.data ?? [];
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    const k = r.sezione ?? "Altro";
    (acc[k] ??= []).push(r);
    return acc;
  }, {});

  return (
    <ClientShell client={myClient.data} headerTitle="Conto Economico" headerSubtitle="Schema OIC — 2024">
      <PageCard>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nessun bilancio caricato per il periodo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-3">Codice</th>
                <th className="py-2 px-3">Descrizione</th>
                <th className="py-2 px-3 text-right">Importo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([sezione, items]) => {
                const total = items.reduce((s, i) => s + Number(i.saldo ?? 0), 0);
                return (
                  <Fragment key={sezione}>
                    <tr className="bg-muted/40">
                      <td colSpan={3} className="py-2 px-3 font-semibold text-xs uppercase tracking-wider">{sezione}</td>
                    </tr>
                    {items.map((r) => (
                      <tr key={r.id} className="border-b border-border/60">
                        <td className="py-2 px-3 text-muted-foreground tabular text-xs">{r.codice_conto}</td>
                        <td className="py-2 px-3">{r.descrizione}</td>
                        <td className={cn("py-2 px-3 text-right tabular", Number(r.saldo) < 0 ? "text-destructive" : "text-foreground")}>
                          {fmt(Number(r.saldo))}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-border bg-card">
                      <td colSpan={2} className="py-2 px-3 text-right text-xs font-semibold">Totale {sezione}</td>
                      <td className={cn("py-2 px-3 text-right tabular font-semibold", total < 0 ? "text-destructive" : "")}>
                        {fmt(total)}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </PageCard>
    </ClientShell>
  );
}