import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============= Current user context =============
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const isAdmin = roleSet.has("admin");
    let clientId: string | null = null;
    if (!isAdmin) {
      const { data: link } = await supabase.from("client_users").select("client_id").eq("user_id", userId).maybeSingle();
      clientId = link?.client_id ?? null;
    }
    return {
      userId,
      email: (claims as { email?: string }).email ?? null,
      isAdmin,
      isClient: roleSet.has("client"),
      clientId,
    };
  });

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin required");
}

// ============= Admin: clients =============
export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getClient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: client, error } = await supabase.from("clients").select("*").eq("id", data.id).single();
    if (error) throw error;
    const { data: kpiConfig } = await supabase.from("client_kpi_config").select("*").eq("client_id", data.id);
    return { client, kpiConfig: kpiConfig ?? [] };
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().min(1),
      piva: z.string().optional().nullable(),
      email: z.string().email(),
      tipo: z.enum(["pmi","startup_pre","startup_scale","holding","immobiliare"]),
      ateco: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("clients")
      .insert({ ...data, invited_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    // Send magic link via admin API
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
    } catch (e) {
      // Non-fatal: client row was created
      console.error("invite email failed", e);
    }
    return row;
  });

export const updateClientTipo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      tipo: z.enum(["pmi","startup_pre","startup_scale","holding","immobiliare"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("clients").update({ tipo: data.tipo }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============= KPI config =============
export const upsertKpiConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      client_id: z.string().uuid(),
      kpi_key: z.string(),
      visible: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("client_kpi_config")
      .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: "client_id,kpi_key" });
    if (error) throw error;
    return { ok: true };
  });

export const bulkSetKpiConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      client_id: z.string().uuid(),
      keys: z.array(z.string()),
      visible: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const rows = data.keys.map((k) => ({
      client_id: data.client_id,
      kpi_key: k,
      visible: data.visible,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await context.supabase.from("client_kpi_config").upsert(rows, { onConflict: "client_id,kpi_key" });
    if (error) throw error;
    return { ok: true };
  });

// ============= Files =============
export const listUploadedFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ client_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("uploaded_files")
      .select("*")
      .eq("client_id", data.client_id)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const recordUploadedFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      client_id: z.string().uuid(),
      file_name: z.string(),
      file_type: z.enum(["bilancio_verifica","mastrini","nota_integrativa"]),
      periodo: z.string().optional().nullable(),
      storage_path: z.string(),
      size_bytes: z.number().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("uploaded_files")
      .insert({ ...data, status: "pending", source: "manuale" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const avviaRevisione = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ client_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Mark pending files as done (stub — real parsing in Phase 2)
    const { error } = await context.supabase
      .from("uploaded_files")
      .update({ status: "done" })
      .eq("client_id", data.client_id)
      .eq("status", "pending");
    if (error) throw error;
    return { ok: true };
  });

// ============= Advisor notes =============
export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ client_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("advisor_notes")
      .select("*")
      .eq("client_id", data.client_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      client_id: z.string().uuid(),
      testo: z.string().min(1),
      ai_generated: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("advisor_notes")
      .insert({ ...data, ai_generated: data.ai_generated ?? false })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ============= Client-side data (auto RLS-scoped) =============
export const getMyClient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: link } = await context.supabase
      .from("client_users")
      .select("client_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!link) return null;
    const { data: client } = await context.supabase.from("clients").select("*").eq("id", link.client_id).single();
    return client;
  });

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ client_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [snapshotsRes, configRes, notesRes, filesRes, clientRes] = await Promise.all([
      supabase.from("kpi_snapshots").select("*").eq("client_id", data.client_id),
      supabase.from("client_kpi_config").select("*").eq("client_id", data.client_id),
      supabase.from("advisor_notes").select("*").eq("client_id", data.client_id).order("created_at", { ascending: false }).limit(5),
      supabase.from("uploaded_files").select("uploaded_at").eq("client_id", data.client_id).order("uploaded_at", { ascending: false }).limit(1),
      supabase.from("clients").select("*").eq("id", data.client_id).single(),
    ]);
    return {
      client: clientRes.data,
      snapshots: snapshotsRes.data ?? [],
      kpiConfig: configRes.data ?? [],
      notes: notesRes.data ?? [],
      lastUpload: filesRes.data?.[0]?.uploaded_at ?? null,
    };
  });

export const getTrialBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ client_id: z.string().uuid(), periodo: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("trial_balance").select("*").eq("client_id", data.client_id);
    if (data.periodo) q = q.eq("periodo", data.periodo);
    const { data: rows, error } = await q.order("codice_conto");
    if (error) throw error;
    return rows ?? [];
  });

export const getLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ client_id: z.string().uuid(), codice_conto: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("ledger_entries").select("*").eq("client_id", data.client_id);
    if (data.codice_conto) q = q.eq("codice_conto", data.codice_conto);
    const { data: rows, error } = await q.order("data_registrazione", { ascending: false }).limit(500);
    if (error) throw error;
    return rows ?? [];
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Create demo clients if missing
    type Tipo = "pmi" | "startup_pre" | "startup_scale" | "holding" | "immobiliare";
    const demos: Array<{ name: string; piva: string; email: string; tipo: Tipo; ateco: string }> = [
      { name: "ACME Manifattura SRL", piva: "01234567890", email: "demo-pmi@consulting34.it", tipo: "pmi" as const, ateco: "25.99.30" },
      { name: "Volta AI SRL", piva: "09876543210", email: "demo-startup@consulting34.it", tipo: "startup_scale" as const, ateco: "62.01.00" },
    ];
    for (const d of demos) {
      const { data: existing } = await supabaseAdmin.from("clients").select("id").eq("email", d.email).maybeSingle();
      const clientId = existing?.id ?? (await supabaseAdmin.from("clients").insert(d).select("id").single()).data?.id;
      if (!clientId) continue;
      // Default visible KPIs by tipo
      const { defaultKpisForTipo, ALL_KPIS } = await import("@/lib/kpi-library");
      const visibleKeys = defaultKpisForTipo(d.tipo);
      const configRows = ALL_KPIS.map((k) => ({
        client_id: clientId,
        kpi_key: k.key,
        visible: visibleKeys.includes(k.key),
        updated_at: new Date().toISOString(),
      }));
      await supabaseAdmin.from("client_kpi_config").upsert(configRows, { onConflict: "client_id,kpi_key" });
      // KPI snapshots — sample values
      const periodo = "2024";
      const samples: Record<string, { v: number; d?: number }> = d.tipo === "pmi"
        ? {
            health_score: { v: 74, d: 4 },
            ebitda: { v: 1_240_000, d: 8.2 },
            ebitda_margin: { v: 12.4, d: 0.8 },
            gross_margin: { v: 38.5, d: -1.2 },
            current_ratio: { v: 1.6, d: 0.1 },
            dso: { v: 78, d: -3 },
            pfn_ebitda: { v: 2.1, d: -0.4 },
            dscr: { v: 1.45, d: 0.1 },
            equity_ratio: { v: 34.2, d: 2.1 },
            roe: { v: 9.8, d: 1.4 },
            ires_stimata: { v: 215_000, d: 5 },
            irap_stimata: { v: 62_000, d: 3 },
          }
        : {
            health_score: { v: 62, d: -3 },
            burn_rate: { v: 145_000, d: 5 },
            runway: { v: 11, d: -2 },
            mrr_arr: { v: 2_400_000, d: 28 },
            cac: { v: 1_200, d: -8 },
            ltv: { v: 9_800, d: 12 },
            ltv_cac: { v: 8.1, d: 0.6 },
            churn: { v: 2.4, d: -0.3 },
            nrr: { v: 118, d: 4 },
            arr_growth: { v: 142, d: 18 },
            gross_margin: { v: 78, d: 2 },
            perdite_riportabili: { v: 1_350_000, d: 0 },
          };
      const snapshotRows = Object.entries(samples).map(([kpi_key, { v, d: dv }]) => ({
        client_id: clientId,
        periodo,
        kpi_key,
        valore: v,
        delta_pct: dv ?? null,
        calcolato_at: new Date().toISOString(),
      }));
      await supabaseAdmin.from("kpi_snapshots").upsert(snapshotRows, { onConflict: "client_id,periodo,kpi_key" });
      // Trial balance sample
      const tbRows = [
        { sezione: "A) Valore produzione", codice_conto: "70.05", descrizione: "Ricavi delle vendite", saldo: 10_000_000 },
        { sezione: "B) Costi produzione", codice_conto: "60.10", descrizione: "Acquisti materie prime", saldo: -4_500_000 },
        { sezione: "B) Costi produzione", codice_conto: "60.20", descrizione: "Servizi", saldo: -2_100_000 },
        { sezione: "B) Costi produzione", codice_conto: "60.40", descrizione: "Personale", saldo: -1_800_000 },
        { sezione: "C) Gestione finanziaria", codice_conto: "75.10", descrizione: "Oneri finanziari", saldo: -180_000 },
      ].map((r) => ({ ...r, client_id: clientId, periodo, dare: r.saldo < 0 ? -r.saldo : 0, avere: r.saldo > 0 ? r.saldo : 0 }));
      await supabaseAdmin.from("trial_balance").delete().eq("client_id", clientId).eq("periodo", periodo);
      await supabaseAdmin.from("trial_balance").insert(tbRows);
      // Sample note
      const { data: existingNotes } = await supabaseAdmin.from("advisor_notes").select("id").eq("client_id", clientId).limit(1);
      if (!existingNotes?.length) {
        await supabaseAdmin.from("advisor_notes").insert({
          client_id: clientId,
          testo: d.tipo === "pmi"
            ? "L'EBITDA margin si è mantenuto sopra il 12%, in linea con la media di settore. Suggeriamo di monitorare il DSO che resta sopra 75 giorni."
            : "Runway a 11 mesi: pianificare la prossima raccolta entro Q1. ARR growth del 142% in linea con benchmark T2D3.",
          ai_generated: false,
        });
      }
    }
    return { ok: true };
  });