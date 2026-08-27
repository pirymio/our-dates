# Our Dates 📅

Le date che contano, condivise con chi conta.

App social (PWA) per Android, iPhone e computer: ogni utente racconta le proprie date importanti su una timeline verticale zoomabile, decide chi può vederle (privato / amici / pubblico) e chatta in privato con gli altri utenti.

**Tecnologie:** React + Vite (interfaccia) · Supabase (account, database, foto/video, chat in tempo reale) · Vercel (pubblicazione online). Tutto con piani gratuiti.

---

## Guida al lancio (nessuna competenza richiesta)

### Passo 1 — Crea i tre account gratuiti
1. **GitHub** → https://github.com/signup
2. **Supabase** → https://supabase.com → "Start your project" → accedi con GitHub
3. **Vercel** → https://vercel.com/signup → "Continue with GitHub"

### Passo 2 — Configura Supabase (il "cervello" dell'app)
1. Su Supabase: **New project** → nome `our-dates`, scegli una password del database (conservala), regione **Europe (Frankfurt)** → **Create**.
2. Quando il progetto è pronto, apri **SQL Editor** (icona `>_` nel menu a sinistra) → **New query**.
3. Apri il file `supabase/schema.sql` di questo progetto, **copia tutto il contenuto**, incollalo nell'editor e premi **Run**. Deve comparire "Success".
4. Vai su **Project Settings → API** e tieni a portata di mano due valori:
   - **Project URL** (es. `https://abcd1234.supabase.co`)
   - **anon public** key (una lunga stringa che inizia con `eyJ...`)
5. (Consigliato per iniziare) **Authentication → Sign In / Up → Email** → disattiva "Confirm email". Così i primi utenti entrano subito senza dover confermare l'email. Riattivalo quando l'app sarà pubblica.
6. **Authentication → URL Configuration** → in "Site URL" metti l'indirizzo che avrà l'app (lo saprai al Passo 4, es. `https://our-dates.vercel.app`). Serve per i link di recupero password.

### Passo 3 — Carica il codice su GitHub
1. Su GitHub: pulsante **+** in alto a destra → **New repository** → nome `our-dates` → **Public** → **Create repository**.
2. Nella pagina del nuovo repository, clicca **"uploading an existing file"**.
3. Trascina nella finestra **tutto il contenuto** di questa cartella (i file `package.json`, `index.html`, ecc. e le cartelle `src`, `public`, `supabase`). *Non* caricare la cartella `node_modules` se presente.
4. In basso premi **Commit changes**.

> Nota: se il trascinamento delle cartelle non funziona dal tuo browser, caricale una alla volta ("Add file → Upload files" dentro ogni cartella creata con "Create new file" digitando ad es. `src/App.jsx`). Oppure chiedi a Claude di guidarti.

### Passo 4 — Pubblica con Vercel
1. Su Vercel: **Add New… → Project** → alla voce `our-dates` premi **Import**.
2. Vercel riconosce Vite da solo. Prima di premere Deploy, apri **Environment Variables** e aggiungi:
   - `VITE_SUPABASE_URL` = il **Project URL** del Passo 2
   - `VITE_SUPABASE_ANON_KEY` = la chiave **anon public** del Passo 2
3. Premi **Deploy**. Dopo ~1 minuto avrai l'app online, es. `https://our-dates.vercel.app` 🎉
4. Torna su Supabase → Authentication → URL Configuration e inserisci questo indirizzo come **Site URL**.

Da questo momento, ogni modifica ai file su GitHub viene pubblicata da Vercel **automaticamente**: tutti gli utenti ricevono la nuova versione senza fare nulla.

### Passo 5 — Installa l'app sui dispositivi
L'app è una PWA: si installa dal browser, senza store.

- **Android** — apri il link in **Chrome** → menu **⋮** → **"Aggiungi a schermata Home"** (o "Installa app") → **Installa**. Icona sulla home, apertura a schermo intero.
- **iPhone / iPad** — apri il link in **Safari** → pulsante **Condividi** (quadrato con freccia) → **"Aggiungi alla schermata Home"** → **Aggiungi**.
- **Windows / Mac** — apri il link in **Chrome** o **Edge** → clicca l'**icona di installazione** a destra nella barra dell'indirizzo (monitor con freccia) → **Installa**. L'app si apre in una finestra propria, come un programma.

---

## Sviluppo locale (facoltativo)
Se vuoi provare l'app sul tuo PC prima di pubblicarla:
```bash
npm install
# crea un file .env.local con:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
npm run dev
```

## Struttura del progetto
```
our-dates/
├── index.html              Pagina base + manifest PWA
├── public/                 Icone, manifest, service worker
├── src/
│   ├── App.jsx             Logica principale (sessione, dati, schede)
│   ├── main.jsx            Avvio dell'app
│   ├── styles.css          Stili (tema chiaro/scuro)
│   ├── lib/                Supabase, traduzioni (IT/EN/ES), icone
│   └── components/         Accesso, Timeline, Nuova data, Chat, Impostazioni
└── supabase/schema.sql     Database: tabelle, sicurezza, chat realtime
```

## Sicurezza e privacy
- La visibilità dei post (privato / amici / pubblico) è applicata **dal database** (Row Level Security), non solo dall'interfaccia: nessuno può leggere ciò che non gli spetta, nemmeno interrogando il server direttamente.
- Le password non transitano mai in chiaro: le gestisce Supabase Auth.
- Età minima di registrazione: 14 anni (in linea con la normativa italiana sul consenso digitale dei minori).

## Problemi comuni
- **Schermata "Configurazione mancante"** → mancano le due variabili su Vercel (Passo 4.2). Aggiungile e fai "Redeploy".
- **"Errore" alla registrazione** → verifica di aver eseguito `schema.sql` su Supabase (Passo 2.3).
- **L'email di conferma non arriva** → controlla lo spam, oppure disattiva "Confirm email" (Passo 2.5).
- **La chat non si aggiorna in tempo reale** → assicurati che `schema.sql` sia stato eseguito tutto, inclusa la parte "Chat in tempo reale".
