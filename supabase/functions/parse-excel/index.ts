// Edge Function: parse-excel
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOLERANCE = 1.0;

function parseNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const clean = val.replace(/\./g, "").replace(",", ".").trim();
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
  }
  if (typeof val === "string") {
    const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  }
  return null;
}

function parseMastrini(rows: unknown[][], clientId: string, fileId: string) {
  const records: Record<string, unknown>[] = [];
  let totalDare = 0, totalAvere = 0;
  for (const row of rows) {
    if (!row || row.length < 17) continue;
    const codiceConto = row[2] != null ? String(row[2]).trim() : null;
    if (!codiceConto) continue;
    const dare = parseNumber(row[14]);
    const avere = parseNumber(row[15]);
    totalDare += dare; totalAvere += avere;
    records.push({
      client_id: clientId, file_id: fileId,
      codice_conto: codiceConto,
      descrizione_conto: row[3] != null ? String(row[3]).trim() : null,
      sottoconto_id: row[4] != null ? String(row[4]).trim() : null,
      sottoconto_desc: row[5] != null ? String(row[5]).trim() : null,
      data_registrazione: parseDate(row[10]),
      n_registrazione: row[11] != null ? String(row[11]).trim() : null,
      descrizione: row[12] != null ? String(row[12]).trim() : null,
      n_documento: row[13] != null ? String(row[13]).trim() : null,
      dare, avere, saldo_progressivo: parseNumber(row[16]),
    });
  }
  return { records, totalDare, totalAvere };
}

function extractHalf(row: unknown[], start: number) {
  if (row.length <= start + 5) return null;
  const codice = row[start] != null ? String(row[start]).trim() : null;
  const descrizione = row[start+2] != null ? String(row[start+2]).trim() : null;
  if (!codice && !descrizione) return null;
  return { codice, descrizione, dare: parseNumber(row[start+3]), avere: parseNumber(row[start+4]), saldo: parseNumber(row[start+5]) };
}

function parseBilancio(rows: unknown[][], clientId: string, fileId: string, periodo: string) {
  const records: Record<string, unknown>[] = [];
  let totalDare = 0, totalAvere = 0;
  for (const row of rows) {
    if (!row || !row.some(c => c != null)) continue;
    for (const entry of [extractHalf(row,2), extractHalf(row,8)]) {
      if (!entry) continue;
      totalDare += entry.dare; totalAvere += entry.avere;
      records.push({ client_id: clientId, file_id: fileId, periodo, codice_conto: entry.codice, descrizione: entry.descrizione, dare: entry.dare, avere: entry.avere, saldo: entry.saldo });
    }
  }
  return { records, totalDare, totalAvere };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }});
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let body: { file_id: string; client_id: string; tipo: string; periodo?: string };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Body JSON non valido" }), { status: 400 }); }
  const { file_id, client_id, tipo, periodo = "" } = body;
  if (!file_id || !client_id || !tipo) return new Response(JSON.stringify({ error: "Parametri mancanti" }), { status: 400 });
  const { data: fileRecord, error: fileErr } = await supabase.from("uploaded_files").select("storage_path, file_name").eq("id", file_id).single();
  if (fileErr || !fileRecord) return new Response(JSON.stringify({ error: "File non trovato in DB" }), { status: 404 });
  await supabase.from("uploaded_files").update({ status: "processing" }).eq("id", file_id);
  try {
    const { data: fileData, error: downloadErr } = await supabase.storage.from("bilanci").download(fileRecord.storage_path);
    if (downloadErr || !fileData) throw new Error(`Errore download: ${downloadErr?.message}`);
    const buffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    let records: Record<string, unknown>[] = [], totalDare = 0, totalAvere = 0, tableName = "";
    if (tipo === "mastrini") { const r = parseMastrini(rawRows, client_id, file_id); records = r.records; totalDare = r.totalDare; totalAvere = r.totalAvere; tableName = "ledger_entries"; }
    else if (tipo === "bilancio") { const r = parseBilancio(rawRows, client_id, file_id, periodo); records = r.records; totalDare = r.totalDare; totalAvere = r.totalAvere; tableName = "trial_balance"; }
    else throw new Error(`Tipo non supportato: ${tipo}`);
    const differenza = Math.abs(totalDare - totalAvere);
    if (differenza > TOLERANCE) throw new Error(`Validazione fallita: differenza €${differenza.toFixed(2)}`);
    if (records.length === 0) throw new Error("Nessun dato estratto. Verificare il formato del file.");
    await supabase.from(tableName).delete().eq("file_id", file_id);
    const BATCH = 400;
    for (let i = 0; i < records.length; i += BATCH) {
      const { error: insertErr } = await supabase.from(tableName).insert(records.slice(i, i+BATCH));
      if (insertErr) throw new Error(`Errore inserimento: ${insertErr.message}`);
    }
    await supabase.from("uploaded_files").update({ status: "done", righe_elaborate: records.length, totale_dare: Math.round(totalDare*100)/100, totale_avere: Math.round(totalAvere*100)/100 }).eq("id", file_id);
    return new Response(JSON.stringify({ ok: true, righe: records.length, totale_dare: Math.round(totalDare*100)/100, totale_avere: Math.round(totalAvere*100)/100, differenza: Math.round(differenza*100)/100 }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("uploaded_files").update({ status: "error", errore: message }).eq("id", file_id);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 422, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }});
  }
});