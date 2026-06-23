## Consulting/34 — Portale Clienti

A multi-tenant financial dashboard for an Italian accounting studio with Admin and Client roles, KPI configuration, file uploads, advisor notes, and AI-assisted insights.

Given the scope (10+ pages, 50+ KPIs, AI chat, Drive OAuth, PDF export, Excel parsing), I'll build this in phases. **Phase 1** delivers a solid, demoable foundation; later phases add the heavier integrations.

---

### Phase 1 — Foundation (this build)

**Backend (Lovable Cloud)**
- Enable Lovable Cloud (Postgres + Auth + Storage)
- Schema: `clients`, `client_kpi_config`, `uploaded_files`, `trial_balance`, `ledger_entries`, `kpi_snapshots`, `advisor_notes`, `drive_connections`
- `user_roles` table + `has_role()` security-definer function (admin / client)
- `client_users` link table (maps auth user → client_id)
- RLS: admins see all; clients see only their `client_id` rows
- Magic-link email auth + `/auth` page

**Design system**
- Italian UI, dark + light mode toggle (persisted)
- Tokens in `src/styles.css` matching your palette (bg/surface/gold/green/red/blue for both themes)
- Sidebar shell, KPI card, Health Score gauge, Alert item, Period selector components
- Recharts + Lucide icons

**Admin pages**
- `/admin/clienti` — list, stats row, invite modal (sends magic link)
- `/admin/clienti/$id` — info + tipologia + full KPI library config (all ~50 KPIs from your spec, grouped, with toggles + tags + "Applica set consigliato")
- `/admin/clienti/$id/upload` — manual file upload to Storage, file list, "Avvia Revisione" stub (marks status done, no real parsing yet)
- `/admin/clienti/$id/note` — notes CRUD (AI generation stubbed for Phase 2)

**Client pages**
- `/dashboard/overview` — Health Score, KPI grid (only `visible=true`), revenue/cost chart, cost donut, alerts, AI insight card (static text)
- `/dashboard/conto-economico` — P&L from `trial_balance`
- `/dashboard/stato-patrimoniale` — balance sheet
- `/dashboard/mastrini` — ledger viewer with filters
- `/dashboard/bilanci` — uploaded files list (read-only)
- `/dashboard/note` — read-only notes
- Startup tipologia: losses rendered as blue info, not red

**Seed data** — one demo PMI client + one demo startup client with sample trial_balance + KPI snapshots so the dashboard isn't empty.

---

### Phase 2 — AI & integrations (separate prompt)
- Excel/CSV parser for trial balance + mastrini → auto-populate tables + recompute KPIs
- Claude-powered AI note generation
- Tax AI chat (`/dashboard/fiscale`) with Italian-norm system prompt
- Tax simulator with sliders (`/dashboard/simulatore`)
- PDF export

### Phase 3 — Heavy integrations
- Google Drive OAuth + folder monitoring
- Scenario simulator full UX
- Email invite delivery polish, audit log

---

### Technical notes
- TanStack Start + Supabase (Lovable Cloud), TanStack Query for data
- All server reads via `createServerFn` with `requireSupabaseAuth`; admin-only mutations check `has_role(auth.uid(), 'admin')`
- KPI calc lives in a server function over `trial_balance`; client dashboard always filters by `visible=true` from `client_kpi_config`
- Tax estimates always carry "Stima indicativa — verificare con il consulente"

Confirm and I'll start with Phase 1.
