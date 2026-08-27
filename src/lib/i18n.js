export const DAY = 86400000;
export const MIN_SPAN = 7 * DAY;
export const MAX_SPAN = 80 * 365 * DAY;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const LOCALES = { it: "it-IT", en: "en-US", es: "es-ES" };
export const LANG_NAMES = { it: "Italiano", en: "English", es: "Español" };

export const detectLang = () => {
  const l = (typeof navigator !== "undefined" ? navigator.language || "it" : "it").slice(0, 2).toLowerCase();
  return LANG_NAMES[l] ? l : "en";
};

export const toKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const parseKey = (k) => {
  const [y, m, g] = k.split("-").map(Number);
  return new Date(y, m - 1, g).getTime();
};
export const fmtLong = (k, lang) =>
  new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "long", year: "numeric" }).format(new Date(parseKey(k)));
export const fmtShort = (t, lang) =>
  new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", year: "2-digit" }).format(new Date(t));
export const fmtHM = (iso, lang) =>
  new Intl.DateTimeFormat(LOCALES[lang], { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const ageOf = (birth) => {
  const b = new Date(birth);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
  return a;
};

export const humanSpan = (ms, t) => {
  const d = ms / DAY;
  if (d >= 365 * 1.8) return t.spanY(Math.round(d / 365));
  if (d >= 330) return t.spanY1;
  if (d >= 55) return t.spanM(Math.round(d / 30));
  return t.spanD(Math.round(d));
};

export const STRINGS = {
  it: {
    tagline: "Le date che contano, condivise con chi conta.",
    login: "Accedi", register: "Registrati",
    email: "Email", username: "Nome utente", password: "Password",
    showPw: "Mostra password", hidePw: "Nascondi password",
    birth: "Data di nascita", ageErr: "Devi avere almeno 14 anni per usare Our Dates.",
    fillErr: "Compila tutti i campi.", userExists: "Questo nome utente è già in uso.",
    emailExists: "Questa email è già registrata. Prova ad accedere.",
    wrongCreds: "Email o password non corretti.",
    pwShort: "La password deve avere almeno 6 caratteri.",
    enter: "Entra", create: "Crea account",
    remember: "Resta connesso su questo dispositivo",
    forgot: "Password dimenticata?",
    resetSent: "Ti abbiamo inviato un'email per reimpostare la password.",
    checkEmail: "Quasi fatto! Controlla la tua email e conferma l'account, poi accedi.",
    newPw: "Nuova password", updatePw: "Aggiorna password", pwUpdated: "Password aggiornata ✓",
    timeline: "Timeline", searchTab: "Cerca", chatTab: "Chat", profileTab: "Profilo",
    searchPh: "Cerca parole, date, persone...",
    peopleSec: "Persone", friends: "Amici",
    addFriend: "Aggiungi", friendYes: "Amico",
    noFriendsYet: "Cerca i tuoi amici nella scheda Cerca e aggiungili!",
    noResults: (q) => `Nessun risultato per “${q}”.`, tryOther: "Prova con un'altra parola o una data.",
    startConv: "Inizia una conversazione",
    noMsgs: (n) => `Nessun messaggio ancora. Scrivi qualcosa a ${n}!`,
    writeMsg: "Scrivi un messaggio...", you: "Tu",
    myDates: "Le tue date", dates: "date", publicN: "pubbliche", friendsN: "amici",
    noDates: "Non hai ancora aggiunto date. Tocca + per iniziare!",
    emptyTimeline: "La timeline è vuota. Tocca + e aggiungi la prima data!",
    logout: "Esci dall'account",
    chose: (n) => (n === 1 ? "1 persona ha scelto questa data" : `${n} persone hanno scelto questa data`),
    people: (n) => (n === 1 ? "1 persona" : `${n} persone`),
    community: "Dalla community",
    newDate: "Nuova data", newDateSub: "Racconta un giorno che per te significa qualcosa.",
    dateReq: "Data e titolo sono obbligatori.", dateLbl: "Data *", titleLbl: "Titolo *", titlePh: "es. Il giorno della laurea",
    whyLbl: "Perché hai scelto questa data?", whyPh: "Racconta la storia dietro questa data...",
    addSmth: "Aggiungi qualcosa", none: "Niente", photo: "Foto", video: "Video", link: "Link",
    whoSee: "Chi può vederla?", publish: "Pubblica", publishing: "Pubblicazione…", cancel: "Annulla",
    published: "La tua data è stata pubblicata ✓",
    delPostQ: "Eliminare questo post?", postDeleted: "Post eliminato",
    vis: {
      private: { label: "Privato", hint: "Solo tu puoi vederla" },
      friends: { label: "Amici", hint: "Visibile ai tuoi amici" },
      public: { label: "Pubblico", hint: "Visibile a tutti" },
    },
    hint: "Trascina su/giù · pizzica o rotella per lo zoom · tocca una data",
    today: "Oggi", todayMark: "OGGI",
    spanY: (n) => `~ ${n} anni`, spanY1: "~ 1 anno", spanM: (n) => `~ ${n} mesi`, spanD: (n) => `~ ${n} giorni`,
    settings: "Impostazioni",
    sAccount: "Account", sEditProfile: "Modifica profilo", sChangePw: "Cambia password", sEmail: "Indirizzo email",
    sNotif: "Notifiche", sNotifMsg: "Nuovi messaggi", sNotifFriend: "Nuove date degli amici",
    sNotifPop: "Date popolari nella community", sNotifAnniv: "Anniversari delle tue date",
    sPrivacy: "Privacy e sicurezza", sDefVis: "Visibilità predefinita dei nuovi post", sWhoMsg: "Chi può scriverti in chat",
    sAll: "Tutti", sFriendsOnly: "Solo amici", sDiscover: "Mostra il mio profilo nelle ricerche",
    sBlocked: "Utenti bloccati", sTwoFA: "Verifica in due passaggi",
    sAppearance: "Aspetto", sTheme: "Tema", thLight: "Chiaro", thDark: "Scuro", thAuto: "Auto",
    sTextSize: "Dimensione del testo", tsS: "S", tsM: "M", tsL: "L",
    sLang: "Lingua", sAuto: "Automatica (dispositivo)", detected: (l) => `rilevata: ${l}`,
    sDataSec: "Dati", sDownload: "Scarica i tuoi dati", sCache: "Svuota la cache", cacheCleared: "Cache svuotata ✓",
    sSupport: "Assistenza", sHelp: "Centro assistenza", sReport: "Segnala un problema",
    sLegal: "Informazioni legali", sTerms: "Termini di servizio", sPolicy: "Informativa sulla privacy",
    sAbout: "Informazioni sull'app", version: "Versione",
    sSession: "Accesso", sStay: "Resta connesso", sStayHint: "L'app non chiederà l'accesso a ogni apertura.",
    comingSoon: "Disponibile in un prossimo aggiornamento 🔧",
    sDelete: "Elimina account", delTitle: "Eliminare l'account?",
    delBody: "Tutte le tue date, le foto e le chat verranno cancellate per sempre. L'azione è definitiva.",
    delBtn: "Elimina", accountDeleted: "Account eliminato",
    loading: "Caricamento…", genericErr: "Qualcosa è andato storto. Riprova.",
    configTitle: "Configurazione mancante",
    configBody: "Aggiungi le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY su Vercel (o in .env.local) e riavvia. Trovi i passaggi nel README del progetto.",
  },
  en: {
    tagline: "The dates that matter, shared with those who matter.",
    login: "Sign in", register: "Sign up",
    email: "Email", username: "Username", password: "Password",
    showPw: "Show password", hidePw: "Hide password",
    birth: "Date of birth", ageErr: "You must be at least 14 years old to use Our Dates.",
    fillErr: "Please fill in all fields.", userExists: "This username is already taken.",
    emailExists: "This email is already registered. Try signing in.",
    wrongCreds: "Wrong email or password.",
    pwShort: "Password must be at least 6 characters.",
    enter: "Sign in", create: "Create account",
    remember: "Keep me signed in on this device",
    forgot: "Forgot password?",
    resetSent: "We sent you an email to reset your password.",
    checkEmail: "Almost done! Check your email and confirm your account, then sign in.",
    newPw: "New password", updatePw: "Update password", pwUpdated: "Password updated ✓",
    timeline: "Timeline", searchTab: "Search", chatTab: "Chats", profileTab: "Profile",
    searchPh: "Search words, dates, people...",
    peopleSec: "People", friends: "Friends",
    addFriend: "Add", friendYes: "Friend",
    noFriendsYet: "Find your friends in the Search tab and add them!",
    noResults: (q) => `No results for “${q}”.`, tryOther: "Try another word or a date.",
    startConv: "Start a conversation",
    noMsgs: (n) => `No messages yet. Say something to ${n}!`,
    writeMsg: "Write a message...", you: "You",
    myDates: "Your dates", dates: "dates", publicN: "public", friendsN: "friends",
    noDates: "You haven't added any dates yet. Tap + to start!",
    emptyTimeline: "The timeline is empty. Tap + and add the first date!",
    logout: "Sign out",
    chose: (n) => (n === 1 ? "1 person picked this date" : `${n} people picked this date`),
    people: (n) => (n === 1 ? "1 person" : `${n} people`),
    community: "From the community",
    newDate: "New date", newDateSub: "Tell about a day that means something to you.",
    dateReq: "Date and title are required.", dateLbl: "Date *", titleLbl: "Title *", titlePh: "e.g. Graduation day",
    whyLbl: "Why did you pick this date?", whyPh: "Tell the story behind this date...",
    addSmth: "Add something", none: "Nothing", photo: "Photo", video: "Video", link: "Link",
    whoSee: "Who can see it?", publish: "Publish", publishing: "Publishing…", cancel: "Cancel",
    published: "Your date has been published ✓",
    delPostQ: "Delete this post?", postDeleted: "Post deleted",
    vis: {
      private: { label: "Private", hint: "Only you can see it" },
      friends: { label: "Friends", hint: "Visible to your friends" },
      public: { label: "Public", hint: "Visible to everyone" },
    },
    hint: "Drag up/down · pinch or scroll to zoom · tap a date",
    today: "Today", todayMark: "TODAY",
    spanY: (n) => `~ ${n} years`, spanY1: "~ 1 year", spanM: (n) => `~ ${n} months`, spanD: (n) => `~ ${n} days`,
    settings: "Settings",
    sAccount: "Account", sEditProfile: "Edit profile", sChangePw: "Change password", sEmail: "Email address",
    sNotif: "Notifications", sNotifMsg: "New messages", sNotifFriend: "Friends' new dates",
    sNotifPop: "Popular dates in the community", sNotifAnniv: "Anniversaries of your dates",
    sPrivacy: "Privacy & security", sDefVis: "Default visibility of new posts", sWhoMsg: "Who can message you",
    sAll: "Everyone", sFriendsOnly: "Friends only", sDiscover: "Show my profile in search",
    sBlocked: "Blocked users", sTwoFA: "Two-step verification",
    sAppearance: "Appearance", sTheme: "Theme", thLight: "Light", thDark: "Dark", thAuto: "Auto",
    sTextSize: "Text size", tsS: "S", tsM: "M", tsL: "L",
    sLang: "Language", sAuto: "Automatic (device)", detected: (l) => `detected: ${l}`,
    sDataSec: "Data", sDownload: "Download your data", sCache: "Clear cache", cacheCleared: "Cache cleared ✓",
    sSupport: "Support", sHelp: "Help center", sReport: "Report a problem",
    sLegal: "Legal", sTerms: "Terms of service", sPolicy: "Privacy policy",
    sAbout: "About the app", version: "Version",
    sSession: "Session", sStay: "Keep me signed in", sStayHint: "The app won't ask you to sign in every time.",
    comingSoon: "Coming in a future update 🔧",
    sDelete: "Delete account", delTitle: "Delete your account?",
    delBody: "All your dates, photos and chats will be permanently erased. This cannot be undone.",
    delBtn: "Delete", accountDeleted: "Account deleted",
    loading: "Loading…", genericErr: "Something went wrong. Please try again.",
    configTitle: "Missing configuration",
    configBody: "Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables on Vercel (or in .env.local) and redeploy. See the project README.",
  },
  es: {
    tagline: "Las fechas que importan, compartidas con quien importa.",
    login: "Entrar", register: "Registrarse",
    email: "Correo", username: "Nombre de usuario", password: "Contraseña",
    showPw: "Mostrar contraseña", hidePw: "Ocultar contraseña",
    birth: "Fecha de nacimiento", ageErr: "Debes tener al menos 14 años para usar Our Dates.",
    fillErr: "Completa todos los campos.", userExists: "Este nombre de usuario ya está en uso.",
    emailExists: "Este correo ya está registrado. Prueba a entrar.",
    wrongCreds: "Correo o contraseña incorrectos.",
    pwShort: "La contraseña debe tener al menos 6 caracteres.",
    enter: "Entrar", create: "Crear cuenta",
    remember: "Mantener la sesión en este dispositivo",
    forgot: "¿Olvidaste la contraseña?",
    resetSent: "Te hemos enviado un correo para restablecer la contraseña.",
    checkEmail: "¡Casi listo! Revisa tu correo y confirma tu cuenta, luego entra.",
    newPw: "Nueva contraseña", updatePw: "Actualizar contraseña", pwUpdated: "Contraseña actualizada ✓",
    timeline: "Línea de tiempo", searchTab: "Buscar", chatTab: "Chats", profileTab: "Perfil",
    searchPh: "Busca palabras, fechas, personas...",
    peopleSec: "Personas", friends: "Amigos",
    addFriend: "Añadir", friendYes: "Amigo",
    noFriendsYet: "¡Busca a tus amigos en la pestaña Buscar y añádelos!",
    noResults: (q) => `Sin resultados para “${q}”.`, tryOther: "Prueba otra palabra u otra fecha.",
    startConv: "Empieza una conversación",
    noMsgs: (n) => `Aún no hay mensajes. ¡Escríbele algo a ${n}!`,
    writeMsg: "Escribe un mensaje...", you: "Tú",
    myDates: "Tus fechas", dates: "fechas", publicN: "públicas", friendsN: "amigos",
    noDates: "Aún no has añadido fechas. ¡Toca + para empezar!",
    emptyTimeline: "La línea de tiempo está vacía. ¡Toca + y añade la primera fecha!",
    logout: "Cerrar sesión",
    chose: (n) => (n === 1 ? "1 persona eligió esta fecha" : `${n} personas eligieron esta fecha`),
    people: (n) => (n === 1 ? "1 persona" : `${n} personas`),
    community: "De la comunidad",
    newDate: "Nueva fecha", newDateSub: "Cuenta un día que significa algo para ti.",
    dateReq: "La fecha y el título son obligatorios.", dateLbl: "Fecha *", titleLbl: "Título *", titlePh: "p. ej. El día de mi graduación",
    whyLbl: "¿Por qué elegiste esta fecha?", whyPh: "Cuenta la historia detrás de esta fecha...",
    addSmth: "Añade algo", none: "Nada", photo: "Foto", video: "Vídeo", link: "Enlace",
    whoSee: "¿Quién puede verla?", publish: "Publicar", publishing: "Publicando…", cancel: "Cancelar",
    published: "Tu fecha ha sido publicada ✓",
    delPostQ: "¿Eliminar esta publicación?", postDeleted: "Publicación eliminada",
    vis: {
      private: { label: "Privado", hint: "Solo tú puedes verla" },
      friends: { label: "Amigos", hint: "Visible para tus amigos" },
      public: { label: "Público", hint: "Visible para todos" },
    },
    hint: "Arrastra arriba/abajo · pellizca o rueda para el zoom · toca una fecha",
    today: "Hoy", todayMark: "HOY",
    spanY: (n) => `~ ${n} años`, spanY1: "~ 1 año", spanM: (n) => `~ ${n} meses`, spanD: (n) => `~ ${n} días`,
    settings: "Ajustes",
    sAccount: "Cuenta", sEditProfile: "Editar perfil", sChangePw: "Cambiar contraseña", sEmail: "Correo electrónico",
    sNotif: "Notificaciones", sNotifMsg: "Nuevos mensajes", sNotifFriend: "Nuevas fechas de amigos",
    sNotifPop: "Fechas populares en la comunidad", sNotifAnniv: "Aniversarios de tus fechas",
    sPrivacy: "Privacidad y seguridad", sDefVis: "Visibilidad predeterminada", sWhoMsg: "Quién puede escribirte",
    sAll: "Todos", sFriendsOnly: "Solo amigos", sDiscover: "Mostrar mi perfil en las búsquedas",
    sBlocked: "Usuarios bloqueados", sTwoFA: "Verificación en dos pasos",
    sAppearance: "Apariencia", sTheme: "Tema", thLight: "Claro", thDark: "Oscuro", thAuto: "Auto",
    sTextSize: "Tamaño del texto", tsS: "S", tsM: "M", tsL: "L",
    sLang: "Idioma", sAuto: "Automático (dispositivo)", detected: (l) => `detectado: ${l}`,
    sDataSec: "Datos", sDownload: "Descargar tus datos", sCache: "Vaciar la caché", cacheCleared: "Caché vaciada ✓",
    sSupport: "Ayuda", sHelp: "Centro de ayuda", sReport: "Informar de un problema",
    sLegal: "Información legal", sTerms: "Términos del servicio", sPolicy: "Política de privacidad",
    sAbout: "Acerca de la app", version: "Versión",
    sSession: "Sesión", sStay: "Mantener la sesión", sStayHint: "La app no pedirá acceso cada vez que la abras.",
    comingSoon: "Disponible en una próxima actualización 🔧",
    sDelete: "Eliminar cuenta", delTitle: "¿Eliminar tu cuenta?",
    delBody: "Todas tus fechas, fotos y chats se borrarán para siempre. Esta acción es definitiva.",
    delBtn: "Eliminar", accountDeleted: "Cuenta eliminada",
    loading: "Cargando…", genericErr: "Algo salió mal. Inténtalo de nuevo.",
    configTitle: "Falta configuración",
    configBody: "Añade las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel (o en .env.local). Consulta el README del proyecto.",
  },
};
