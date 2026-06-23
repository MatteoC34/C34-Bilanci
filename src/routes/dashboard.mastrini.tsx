import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ClientShell } from "@/components/client-shell";
import { useMyClient } from "@/hooks/use-my-client";
import { useRequireAuth } from "@/hooks/use-me";
import { getLedger } from "@/lib/portal.functions";
import { Input } from "@/components/ui/input";
import { PageCard } from "@/components/page-card";

export const Route = createFileRoute("/dashboard/mastrini")({
  head: () => ({ meta: [{ title: "Mastrini — Consulting/34" }] }),
  component: Page,
});

const fmt = (n: number) => new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2 }).format(n);

function Page() {
  useRequireAuth("client");
  const myClient = useMyClient();
  const get = useServerFn(getLedger);
  const [codice, setCodice] = useState("");
  const q = useQuery({
    queryKey: ["ledger", myClient.data?.id, codice],
    enabled: !!myClient.data?.id,
    queryFn: () => get({ data: { client_id: myClient.data!.id, codice_conto: codice || undefined } }),
  });
  const rows = q.data ?? [];

  return (
    <ClientShell client={myClient.data} headerTitle="Mastrini & Conti">
      <PageCard
        title="Movimenti di conto"
        actions={<Input placeholder="Filtra per codice conto…" value={codice} onChange={(e) => setCodice(e.target.value)} className="h-8 w-56" />}
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nessun movimento. Carica i mastrini per popolare la vista.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Data</th><th className="py-2 px-2">N.Reg</th><th className="py-2 px-2">Descrizione</th>
                <th className="py-2 px-2">N.Doc</th><th className="py-2 px-2 text-right">Dare</th>
                <th className="py-2 px-2 text-right">Avere</th><th className="py-2 px-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 odd:bg-muted/20">
                  <td className="py-1.5 px-2 tabular">{r.data_registrazione}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{r.n_registrazione}</td>
                  <td className="py-1.5 px-2">{r.descrizione}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{r.n_documento}</td>
                  <td className="py-1.5 px-2 text-right tabular">{fmt(Number(r.dare ?? 0))}</td>
                  <td className="py-1.5 px-2 text-right tabular">{fmt(Number(r.avere ?? 0))}</td>
                  <td className="py-1.5 px-2 text-right tabular font-semibold">{fmt(Number(r.saldo_progressivo ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </ClientShell>
  );
}