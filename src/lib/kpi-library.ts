export type KpiTag = "PMI" | "Startup" | "VC" | "Silicon Valley" | "Critico" | "Nuovo" | "Holding" | "Immobiliare";

export interface KpiDef {
  key: string;
  label: string;
  description: string;
  tags: KpiTag[];
  format?: "currency" | "percent" | "ratio" | "months" | "days" | "number" | "score";
  defaultForTipo?: Array<"pmi" | "startup_pre" | "startup_scale" | "holding" | "immobiliare">;
}

export interface KpiSection {
  id: string;
  title: string;
  kpis: KpiDef[];
}

export const KPI_LIBRARY: KpiSection[] = [
  {
    id: "salute",
    title: "Salute Finanziaria",
    kpis: [
      { key: "health_score", label: "Punteggio Salute", description: "Indice aggregato 0-100 comprensibile a chiunque", tags: ["Critico", "Nuovo"], format: "score", defaultForTipo: ["pmi","startup_pre","startup_scale","holding","immobiliare"] },
      { key: "altman_z", label: "Altman Z-Score", description: "Predice rischio fallimento con 2 anni di anticipo", tags: ["PMI","Critico","Nuovo"], format: "ratio", defaultForTipo: ["pmi","holding"] },
      { key: "trend_margini_6m", label: "Trend Margini 6 mesi", description: "Rileva compressione prima che diventi visibile", tags: ["PMI","Startup","Nuovo"], format: "percent" },
      { key: "runway_alert", label: "Runway Alert", description: "Notifica automatica quando runway scende sotto 9/6/3 mesi", tags: ["Startup","Critico"], format: "months", defaultForTipo: ["startup_pre","startup_scale"] },
      { key: "early_warning_dso", label: "Early Warning DSO", description: "Alert se giorni credito aumentano oltre 15% per 2 mesi", tags: ["PMI","Critico"], format: "percent", defaultForTipo: ["pmi"] },
    ],
  },
  {
    id: "redditivita",
    title: "Redditività",
    kpis: [
      { key: "ebitda", label: "EBITDA", description: "Margine operativo lordo", tags: ["PMI","Critico"], format: "currency", defaultForTipo: ["pmi","holding"] },
      { key: "ebitda_margin", label: "EBITDA Margin %", description: "EBITDA su ricavi", tags: ["PMI","Startup","Critico"], format: "percent", defaultForTipo: ["pmi","startup_scale","holding"] },
      { key: "gross_margin", label: "Gross Margin %", description: "Ricavi meno costo del venduto", tags: ["PMI","VC","Critico"], format: "percent", defaultForTipo: ["pmi","startup_scale"] },
      { key: "roe", label: "ROE", description: "Rendimento del capitale per i soci", tags: ["PMI","Holding"], format: "percent", defaultForTipo: ["pmi","holding"] },
      { key: "roi", label: "ROI / ROCE", description: "Efficienza del capitale investito", tags: ["PMI","Holding"], format: "percent", defaultForTipo: ["pmi","holding"] },
      { key: "ros", label: "ROS", description: "Redditività delle vendite", tags: ["PMI"], format: "percent", defaultForTipo: ["pmi"] },
      { key: "rule_of_40", label: "Rule of 40", description: "Crescita% + EBITDA margin% ≥40 = azienda sana", tags: ["VC","Silicon Valley"], format: "number", defaultForTipo: ["startup_scale"] },
      { key: "rev_per_employee", label: "Revenue per Employee", description: "Produttività del team", tags: ["VC","Startup"], format: "currency" },
    ],
  },
  {
    id: "liquidita",
    title: "Liquidità & Cash Flow",
    kpis: [
      { key: "current_ratio", label: "Current Ratio", description: "Attivo corrente su passivo corrente", tags: ["PMI","Critico"], format: "ratio", defaultForTipo: ["pmi","holding","immobiliare"] },
      { key: "quick_ratio", label: "Quick Ratio (liquidità)", description: "Senza magazzino", tags: ["PMI"], format: "ratio", defaultForTipo: ["pmi"] },
      { key: "cash_forecast_90", label: "Cash Flow Forecast 90gg", description: "Stima cassa a 90 giorni da storico", tags: ["PMI","Startup","Nuovo"], format: "currency", defaultForTipo: ["pmi","startup_scale"] },
      { key: "dso", label: "DSO", description: "Giorni medi incasso crediti", tags: ["PMI","Critico"], format: "days", defaultForTipo: ["pmi"] },
      { key: "dpo", label: "DPO", description: "Giorni medi pagamento fornitori", tags: ["PMI"], format: "days", defaultForTipo: ["pmi"] },
      { key: "ccc", label: "Cash Conversion Cycle", description: "DSO + DIO - DPO", tags: ["PMI","VC","Silicon Valley"], format: "days" },
    ],
  },
  {
    id: "solidita",
    title: "Solidità Patrimoniale",
    kpis: [
      { key: "pfn_ebitda", label: "PFN / EBITDA", description: "Leva finanziaria netta", tags: ["PMI","Critico"], format: "ratio", defaultForTipo: ["pmi","holding"] },
      { key: "dscr", label: "DSCR", description: "Capacità rimborso debiti", tags: ["PMI","Critico"], format: "ratio", defaultForTipo: ["pmi","holding"] },
      { key: "equity_ratio", label: "Equity Ratio", description: "Autonomia finanziaria", tags: ["PMI","Holding"], format: "percent", defaultForTipo: ["pmi","holding","immobiliare"] },
      { key: "ev_ebitda", label: "Valutazione EV/EBITDA", description: "Stima valore aziendale", tags: ["PMI","Holding","Nuovo"], format: "ratio" },
      { key: "debt_equity", label: "Debt/Equity", description: "Rapporto debito patrimonio", tags: ["PMI"], format: "ratio", defaultForTipo: ["pmi","holding","immobiliare"] },
    ],
  },
  {
    id: "fiscale",
    title: "Fiscale & Tax",
    kpis: [
      { key: "ires_stimata", label: "IRES stimata", description: "Imposta sul reddito società", tags: ["PMI","Critico"], format: "currency", defaultForTipo: ["pmi","holding"] },
      { key: "irap_stimata", label: "IRAP stimata", description: "Imposta regionale attività produttive", tags: ["PMI"], format: "currency", defaultForTipo: ["pmi","holding"] },
      { key: "carico_fiscale", label: "Carico fiscale effettivo", description: "IRES+IRAP / utile lordo", tags: ["PMI"], format: "percent", defaultForTipo: ["pmi"] },
      { key: "perdite_riportabili", label: "Perdite fiscali riportabili", description: "Art. 84 TUIR, scudo fiscale futuro", tags: ["Startup","Critico"], format: "currency", defaultForTipo: ["startup_pre","startup_scale"] },
    ],
  },
  {
    id: "startup",
    title: "Startup & Venture Capital — Silicon Valley Metrics",
    kpis: [
      { key: "burn_rate", label: "Burn Rate Netto", description: "Cash consumata al mese", tags: ["Startup","VC","Critico"], format: "currency", defaultForTipo: ["startup_pre","startup_scale"] },
      { key: "runway", label: "Runway (mesi)", description: "Mesi di vita rimanenti con cash attuale", tags: ["Startup","VC","Critico"], format: "months", defaultForTipo: ["startup_pre","startup_scale"] },
      { key: "mrr_arr", label: "MRR / ARR", description: "Monthly/Annual Recurring Revenue", tags: ["Startup","VC","Critico"], format: "currency", defaultForTipo: ["startup_scale"] },
      { key: "cac", label: "CAC", description: "Costo acquisizione cliente", tags: ["Startup","VC","Silicon Valley"], format: "currency", defaultForTipo: ["startup_scale"] },
      { key: "ltv", label: "LTV", description: "Lifetime value cliente", tags: ["Startup","VC"], format: "currency", defaultForTipo: ["startup_scale"] },
      { key: "ltv_cac", label: "LTV / CAC ratio", description: "Target ≥3x", tags: ["Startup","VC","Critico","Silicon Valley"], format: "ratio", defaultForTipo: ["startup_scale"] },
      { key: "churn", label: "Churn Rate", description: "% clienti/ricavi persi al mese", tags: ["Startup","VC","Critico"], format: "percent", defaultForTipo: ["startup_scale"] },
      { key: "nrr", label: "NRR", description: "Net Revenue Retention, >100% = crescita senza nuovi clienti", tags: ["VC","Silicon Valley","Critico"], format: "percent", defaultForTipo: ["startup_scale"] },
      { key: "burn_multiple", label: "Burn Multiple", description: "Cash bruciata per € ARR generato (David Sacks)", tags: ["VC","Silicon Valley"], format: "ratio" },
      { key: "magic_number", label: "Magic Number", description: "Efficienza team sales", tags: ["VC","Silicon Valley"], format: "ratio" },
      { key: "cac_payback", label: "CAC Payback Period", description: "Mesi per recuperare costo acquisizione", tags: ["Startup","VC","Silicon Valley"], format: "months" },
      { key: "arr_growth", label: "ARR Growth Rate", description: "Crescita ARR YoY, T2D3 benchmark", tags: ["VC","Silicon Valley"], format: "percent", defaultForTipo: ["startup_scale"] },
      { key: "bessemer_quick", label: "Quick Ratio Bessemer", description: "(New+Expansion MRR)/(Churned+Contracted)", tags: ["VC","Silicon Valley"], format: "ratio" },
      { key: "arpu", label: "ARPU", description: "Average revenue per account", tags: ["Startup","VC"], format: "currency" },
      { key: "capital_efficiency", label: "Capital Efficiency", description: "ARR generato per € raccolto", tags: ["VC","Silicon Valley"], format: "ratio" },
    ],
  },
  {
    id: "banca",
    title: "Banca & Dossier",
    kpis: [
      { key: "dscr_fidi", label: "DSCR per fidi", description: "Capacity rimborso per richieste bancarie", tags: ["PMI","Nuovo"], format: "ratio", defaultForTipo: ["pmi"] },
      { key: "dossier_pdf", label: "Dossier bancario PDF", description: "Genera automaticamente indici per banca", tags: ["PMI","Nuovo"], format: "number" },
      { key: "indici_banca", label: "Indici patrimoniali banca", description: "Equity ratio, PFN, trend 3 anni", tags: ["PMI"], format: "number" },
    ],
  },
  {
    id: "valutazione",
    title: "Valutazione Aziendale",
    kpis: [
      { key: "ev_ebitda_multiplo", label: "EV/EBITDA multiplo", description: "Stima enterprise value", tags: ["PMI","Holding","Nuovo"], format: "ratio" },
      { key: "arr_multiple", label: "ARR Multiple (startup)", description: "Valutazione SaaS = ARR × multiplo settore", tags: ["Startup","VC","Nuovo"], format: "currency", defaultForTipo: ["startup_scale"] },
      { key: "patrimonio_rettificato", label: "Patrimonio netto rettificato", description: "Valore contabile rettificato", tags: ["PMI","Holding"], format: "currency", defaultForTipo: ["holding","immobiliare"] },
    ],
  },
];

export const ALL_KPIS: KpiDef[] = KPI_LIBRARY.flatMap((s) => s.kpis);
export const KPI_BY_KEY: Record<string, KpiDef> = Object.fromEntries(ALL_KPIS.map((k) => [k.key, k]));

export function defaultKpisForTipo(tipo: string): string[] {
  return ALL_KPIS.filter((k) => k.defaultForTipo?.includes(tipo as never)).map((k) => k.key);
}

export function formatKpiValue(value: number | null | undefined, fmt?: KpiDef["format"]): string {
  if (value === null || value === undefined) return "—";
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "ratio":
      return `${value.toFixed(2)}x`;
    case "months":
      return `${value.toFixed(1)} mesi`;
    case "days":
      return `${Math.round(value)} gg`;
    case "score":
      return Math.round(value).toString();
    default:
      return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(value);
  }
}