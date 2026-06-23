# Fix elenco clienti e aggiunta senza invito

## Problemi rilevati

1. **Ventive non appare** in `/admin/clienti`. Causa: filtro in `src/routes/admin.clienti.tsx`:
   ```ts
   const active = filtered.filter((c) => !c.invited_at || all.length < 2);
   ```
   Questa riga nasconde tutti i clienti con `invited_at` valorizzato non appena ce ne sono ≥ 2. Il contatore "Clienti attivi" usa invece `all.length` (= 3), da cui la discrepanza 3 vs 2 visibili.

2. **Non è possibile aggiungere un cliente senza inviare l'invito**. Sia `InviteDialog` sia `ImportVisuraDialog` richiedono email obbligatoria, e `createClient` lato server esige `email` valido e invia sempre la magic link.

## Cosa cambio

### 1. Mostrare tutti i clienti
- In `src/routes/admin.clienti.tsx` rimuovo il filtro su `invited_at` e renderizzo direttamente `filtered`.
- Allineo lo stato visualizzato: "Attivo" se l'utente collegato esiste (cliente ha completato l'accesso), "Invitato" se `invited_at` presente ma non ancora collegato, "Solo anagrafica" se nessun invito.
  - Per ora distinguo Invitato vs Solo anagrafica via `invited_at` (info utente collegato richiederebbe join lato server; lo lascio per dopo).

### 2. Aggiunta cliente senza invito
- **Server** `createClient` in `src/lib/portal.functions.ts`:
  - `email` diventa opzionale (`z.string().email().optional().nullable()`).
  - Nuovo flag `send_invite: boolean` (default `false`).
  - `invited_at` viene valorizzato solo se `send_invite === true && email`.
  - `inviteUserByEmail` chiamato solo nello stesso caso.
- **UI** in entrambi i dialog (`InviteDialog`, `ImportVisuraDialog`):
  - Email non obbligatoria (resta consigliata).
  - Checkbox "Invia invito al cliente via email" (default OFF) — l'etichetta del bottone diventa "Crea cliente" oppure "Crea e invia invito" in base al flag.
  - Rinomino il bottone principale della toolbar da "Invita Nuovo Cliente" a **"Nuovo cliente"** (il portale è interno; l'invito è opzionale).
  - Il dialog "Importa da visura" applica la stessa logica.

### 3. KPI header
- "Clienti attivi" continua a contare tutto il portafoglio (corretto rispetto al nuovo modello: include sia anagrafiche interne che clienti invitati).

## File toccati
- `src/lib/portal.functions.ts` — `createClient` validator + handler.
- `src/routes/admin.clienti.tsx` — filtro lista, label/stato, entrambi i dialog, checkbox invito.

## Fuori scope
- Migrazione DB (nessuna nuova colonna necessaria: `invited_at` resta nullable).
- Pagina "Inviti Pendenti": continuerà a funzionare basandosi su `invited_at`.
