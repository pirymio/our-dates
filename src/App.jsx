import React, { useState, useRef, useMemo, useEffect } from "react";
import { supabase } from "./lib/supabase.js";
import Icon from "./lib/icons.jsx";
import {
  STRINGS, LANG_NAMES, detectLang, parseKey, fmtLong, fmtHM, humanSpan, DAY,
} from "./lib/i18n.js";
import { Avatar, PostCard } from "./components/ui.jsx";
import AuthScreen, { NewPasswordScreen } from "./components/Auth.jsx";
import VerticalTimeline from "./components/Timeline.jsx";
import Composer from "./components/Composer.jsx";
import SettingsScreen from "./components/Settings.jsx";

const DEFAULT_SETTINGS = {
  langMode: "auto",
  notif: { messages: true, friendDates: true, popular: false, anniversaries: true },
  privacy: { defaultVisibility: "public", whoCanMessage: "friends", discoverable: true },
  appearance: { theme: "auto", textSize: "m" },
};

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("od_settings") || "{}");
    return {
      ...DEFAULT_SETTINGS, ...s,
      notif: { ...DEFAULT_SETTINGS.notif, ...(s.notif || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(s.privacy || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(s.appearance || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const detected = useMemo(detectLang, []);
  const [settings, setSettings] = useState(loadSettings);
  useEffect(() => localStorage.setItem("od_settings", JSON.stringify(settings)), [settings]);

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recovery, setRecovery] = useState(
    () => typeof window !== "undefined" && window.location.hash.includes("type=recovery")
  );
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [friendIds, setFriendIds] = useState(new Set());
  const [msgs, setMsgs] = useState([]);
  const [names, setNames] = useState({});
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [tab, setTab] = useState("home");
  const [range, setRange] = useState(() => ({ start: Date.now() - 6 * 365 * DAY, end: Date.now() + 365 * DAY }));
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [composer, setComposer] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // {id, username}
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [remember, setRememberState] = useState(() => localStorage.getItem("od_remember") !== "0");

  const msgsRef = useRef(null);
  const activeChatRef = useRef(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const [sysDark, setSysDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setSysDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", h) : mq.removeListener(h));
  }, []);

  const lang = settings.langMode === "auto" ? detected : settings.langMode;
  const t = STRINGS[lang];
  const dark = settings.appearance.theme === "dark" || (settings.appearance.theme === "auto" && sysDark);
  const readingSize = { s: "13px", m: "14px", l: "15.5px" }[settings.appearance.textSize];

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const setRemember = (v) => { setRememberState(v); localStorage.setItem("od_remember", v ? "1" : "0"); };

  /* ---------- Sessione ---------- */
  useEffect(() => {
    if (!supabase) { setBooting(false); return; }
    const rem = localStorage.getItem("od_remember") !== "0";
    supabase.auth.getSession().then(async ({ data }) => {
      // "Resta connesso" disattivato → la sessione muore alla chiusura del browser
      if (data.session && !rem && !sessionStorage.getItem("od_alive")) {
        await supabase.auth.signOut();
      } else {
        setSession(data.session);
      }
      sessionStorage.setItem("od_alive", "1");
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ---------- Profilo ---------- */
  useEffect(() => {
    if (!supabase) return;
    if (!session?.user) { setProfile(null); return; }
    let alive = true;
    (async () => {
      let { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (!data) {
        const uname = (session.user.user_metadata?.username || session.user.email.split("@")[0])
          .toLowerCase().replace(/\s+/g, "_").slice(0, 20);
        const ins = await supabase
          .from("profiles")
          .insert({ id: session.user.id, username: uname, birthdate: session.user.user_metadata?.birthdate || null })
          .select().maybeSingle();
        data = ins.data;
      }
      if (alive) setProfile(data);
    })();
    return () => { alive = false; };
  }, [session?.user?.id]);

    /* ---------- Caricamento dati ---------- */
  useEffect(() => {
    if (!supabase || !profile) return;
    let alive = true;
    (async () => {
      const uid = profile.id;
      const [pRes, fRes, mRes, rRes, cRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id,user_id,date,title,comment,visibility,media_type,media_url,created_at, author:profiles!posts_user_id_fkey(username)")
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("friends")
          .select("friend_id, friend:profiles!friends_friend_id_fkey(username)")
          .eq("user_id", uid),
        supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
          .order("created_at", { ascending: true })
          .limit(2000),
        supabase.from("reactions").select("post_id,user_id"),
        supabase.from("comments").select("id,post_id,user_id,content,created_at").order("created_at", { ascending: true }),
      ]);
      if (!alive) return;

      const ps = (pRes.data || []).map((p) => ({ ...p, username: p.author?.username || "?" }));
      setPosts(ps);

      const fl = (fRes.data || []).map((f) => ({ id: f.friend_id, username: f.friend?.username || "?" }));
      setFriendsList(fl);
      setFriendIds(new Set(fl.map((f) => f.id)));

      const ms = mRes.data || [];
      setMsgs(ms);

      setReactions(rRes.data || []);
      setComments(cRes.data || []);

      const nameMap = { [uid]: profile.username };
      fl.forEach((f) => (nameMap[f.id] = f.username));
      ps.forEach((p) => (nameMap[p.user_id] = p.username));
      (cRes.data || []).forEach((c) => {
        if (!nameMap[c.user_id]) nameMap[c.user_id] = "?";
      });
      const missing = [...new Set([
        ...ms.flatMap((m) => [m.sender_id, m.recipient_id]),
        ...(cRes.data || []).map((c) => c.user_id),
      ])].filter((i) => !nameMap[i] || nameMap[i] === "?");
      if (missing.length) {
        const { data: profs } = await supabase.from("profiles").select("id,username").in("id", missing);
        (profs || []).forEach((p) => (nameMap[p.id] = p.username));
      }
      if (alive) setNames(nameMap);
    })();
    return () => { alive = false; };
  }, [profile?.id]);  

  /* ---------- Chat in tempo reale ---------- */
  useEffect(() => {
    if (!supabase || !profile) return;
    const ch = supabase
      .channel("od-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${profile.id}` },
        async (payload) => {
          const m = payload.new;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (!names[m.sender_id]) {
            const { data } = await supabase.from("profiles").select("id,username").eq("id", m.sender_id).maybeSingle();
            if (data) setNames((n) => ({ ...n, [data.id]: data.username }));
          }
          if (activeChatRef.current?.id === m.sender_id) markRead(m.sender_id);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  /* ---------- Ricerca persone ---------- */
  useEffect(() => {
    if (!supabase || !profile) return;
    const q = query.trim();
    if (q.length < 2) { setPeople([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles").select("id,username")
        .ilike("username", `%${q}%`).neq("id", profile.id).limit(8);
      setPeople(data || []);
    }, 350);
    return () => clearTimeout(h);
  }, [query, profile?.id]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, activeChat]);

  /* ---------- Dati derivati ---------- */
  const groups = useMemo(() => {
    const g = {};
    for (const p of posts) {
      if (!g[p.date]) g[p.date] = { posts: [], users: new Set() };
      g[p.date].posts.push(p);
      g[p.date].users.add(p.user_id);
    }
    for (const k in g) g[k].count = g[k].users.size;
    return g;
  }, [posts]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.comment || "").toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.date.includes(q)
    );
  }, [posts, query]);

  const convos = useMemo(() => {
    const map = {};
    if (!profile) return map;
    for (const m of msgs) {
      const partner = m.sender_id === profile.id ? m.recipient_id : m.sender_id;
      if (!map[partner]) map[partner] = { id: partner, msgs: [], unread: 0 };
      map[partner].msgs.push(m);
      if (m.recipient_id === profile.id && !m.read) map[partner].unread++;
    }
    return map;
  }, [msgs, profile?.id]);

  const chatEntries = useMemo(() => {
    const ids = new Set([...Object.keys(convos), ...friendsList.map((f) => f.id)]);
    return [...ids]
      .map((id) => ({
        id,
        username: names[id] || friendsList.find((f) => f.id === id)?.username || "…",
        conv: convos[id],
      }))
      .sort((a, b) => {
        const ta = a.conv?.msgs[a.conv.msgs.length - 1]?.created_at || "";
        const tb = b.conv?.msgs[b.conv.msgs.length - 1]?.created_at || "";
        return tb.localeCompare(ta);
      });
  }, [convos, friendsList, names]);

  const totalUnread = useMemo(
    () => Object.values(convos).reduce((a, c) => a + c.unread, 0),
    [convos]
  );

  const myPosts = useMemo(
    () => posts.filter((p) => p.user_id === profile?.id),
    [posts, profile?.id]
  );

  /* ---------- Azioni ---------- */
  const markRead = async (partnerId) => {
    setMsgs((prev) =>
      prev.map((m) => (m.sender_id === partnerId && m.recipient_id === profile.id && !m.read ? { ...m, read: true } : m))
    );
    await supabase.from("messages").update({ read: true })
      .eq("sender_id", partnerId).eq("recipient_id", profile.id).eq("read", false);
  };

  const openChat = (person) => {
    setActiveChat(person);
    setTab("chat");
    markRead(person.id);
  };

  const sendMsg = async () => {
    const text = draft.trim();
    if (!text || !activeChat) return;
    setDraft("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: profile.id, recipient_id: activeChat.id, content: text })
      .select().single();
    if (error) { showToast(t.genericErr); setDraft(text); return; }
    setMsgs((m) => [...m, data]);
  };

    const publishPost = async (data, media, editId = null) => {
    try {
      let media_type = null, media_url = null;
      if (media?.keep) {
        media_type = media.type;
        media_url = media.url;
      } else if (media?.type === "link" && media.url) {
        media_type = "link";
        media_url = media.url;
      } else if (media?.file) {
        const ext = (media.file.name.split(".").pop() || "bin").toLowerCase();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, media.file);
        if (upErr) throw upErr;
        media_type = media.type;
        media_url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      } else if (media?.type === null) {
        media_type = null;
        media_url = null;
      }

      if (editId) {
        const { data: row, error } = await supabase
          .from("posts")
          .update({ ...data, media_type, media_url })
          .eq("id", editId)
          .select("id,user_id,date,title,comment,visibility,media_type,media_url,created_at")
          .single();
        if (error) throw error;
        setPosts((ps) => ps.map((p) => (p.id === editId ? { ...row, username: profile.username } : p)));
        setEditingPost(null);
        setComposer(false);
        showToast(t.edited);
        return true;
      } else {
        const { data: row, error } = await supabase
          .from("posts")
          .insert({ user_id: profile.id, ...data, media_type, media_url })
          .select("id,user_id,date,title,comment,visibility,media_type,media_url,created_at")
          .single();
        if (error) throw error;
        setPosts((p) => [{ ...row, username: profile.username }, ...p]);
        setComposer(false);
        const tt = parseKey(row.date);
        const span = range.end - range.start;
        setRange({ start: tt - span / 2, end: tt + span / 2 });
        setSelected(row.date);
        setTab("home");
        showToast(t.published);
        return true;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const startEdit = (p) => {
    setEditingPost(p);
    setComposer(true);
  };
    const toggleLike = async (postId, currentlyLiked) => {
    if (currentlyLiked) {
      setReactions((prev) => prev.filter((r) => !(r.post_id === postId && r.user_id === profile.id)));
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", profile.id);
    } else {
      setReactions((prev) => [...prev, { post_id: postId, user_id: profile.id }]);
      await supabase.from("reactions").insert({ post_id: postId, user_id: profile.id });
    }
  };

  const addComment = async (postId, content) => {
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: profile.id, content })
      .select("id,post_id,user_id,content,created_at")
      .single();
    if (error) {
      showToast(t.genericErr);
      return false;
    }
    setComments((prev) => [...prev, data]);
    setNames((n) => ({ ...n, [profile.id]: profile.username }));
    showToast(t.commentAdded);
    return true;
  };

  const deleteComment = async (c) => {
    if (!window.confirm(t.delCommentQ)) return;
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (!error) {
      setComments((prev) => prev.filter((x) => x.id !== c.id));
    }
  };
  const toggleLike = async (postId, currentlyLiked) => {
    if (currentlyLiked) {
      setReactions((prev) => prev.filter((r) => !(r.post_id === postId && r.user_id === profile.id)));
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", profile.id);
    } else {
      setReactions((prev) => [...prev, { post_id: postId, user_id: profile.id }]);
      await supabase.from("reactions").insert({ post_id: postId, user_id: profile.id });
    }
  };

  const addComment = async (postId, content) => {
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: profile.id, content })
      .select("id,post_id,user_id,content,created_at")
      .single();
    if (error) {
      showToast(t.genericErr);
      return false;
    }
    setComments((prev) => [...prev, data]);
    setNames((n) => ({ ...n, [profile.id]: profile.username }));
    showToast(t.commentAdded);
    return true;
  };

  const deleteComment = async (c) => {
    if (!window.confirm(t.delCommentQ)) return;
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (!error) {
      setComments((prev) => prev.filter((x) => x.id !== c.id));
    }
  };
    const deletePost = async (p) => {
    if (!window.confirm(t.delPostQ)) return;
    try {
      // se c'è un file foto/video, prova a cancellarlo dallo storage
      if (p.media_url && (p.media_type === "photo" || p.media_type === "video")) {
        try {
          const path = p.media_url.split("/media/")[1];
          if (path) await supabase.storage.from("media").remove([path]);
        } catch (e) {
          console.warn("Impossibile eliminare il file media:", e);
        }
      }
      const { error } = await supabase.from("posts").delete().eq("id", p.id);
      if (!error) {
        setPosts((ps) => ps.filter((x) => x.id !== p.id));
        showToast(t.postDeleted);
      }
    } catch (e) {
      console.error(e);
      showToast(t.genericErr);
    }
  };

  const addFriend = async (p) => {
    const { error } = await supabase.from("friends").insert({ user_id: profile.id, friend_id: p.id });
    if (!error) {
      setFriendIds((s) => new Set([...s, p.id]));
      setFriendsList((l) => (l.some((f) => f.id === p.id) ? l : [...l, p]));
      setNames((n) => ({ ...n, [p.id]: p.username }));
    }
  };

  const removeFriend = async (p) => {
    await supabase.from("friends").delete().eq("user_id", profile.id).eq("friend_id", p.id);
    setFriendIds((s) => { const c = new Set(s); c.delete(p.id); return c; });
    setFriendsList((l) => l.filter((f) => f.id !== p.id));
  };

  const resetLocal = () => {
    setProfile(null); setPosts([]); setFriendsList([]); setFriendIds(new Set());
    setMsgs([]); setNames({}); setActiveChat(null); setTab("home"); setSelected(null); setQuery("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    resetLocal();
  };

  const doDeleteAccount = async () => {
    setConfirmDel(false);
    const { error } = await supabase.rpc("delete_own_account");
    if (error) { showToast(t.genericErr); return; }
    await supabase.auth.signOut();
    resetLocal();
    showToast(t.accountDeleted);
  };

  const upd = (path, value) => {
    setSettings((s) => {
      const copy = JSON.parse(JSON.stringify(s));
      const keys = path.split(".");
      let o = copy;
      while (keys.length > 1) o = o[keys.shift()];
      o[keys[0]] = value;
      return copy;
    });
  };

  /* ---------- Render ---------- */
  const rootClass = `od-root ${dark ? "od-dark" : ""}`;
  const rootStyle = { "--reading": readingSize };

  if (!supabase) {
    return (
      <div className={rootClass} style={rootStyle}>
        <div className="od-shell">
          <div className="od-splash">
            <Icon name="alert" size={34} />
            <b className="od-display" style={{ fontSize: 17 }}>{t.configTitle}</b>
            {t.configBody}
          </div>
        </div>
      </div>
    );
  }

  if (booting) {
    return (
      <div className={rootClass} style={rootStyle}>
        <div className="od-shell">
          <div className="od-splash"><div className="od-spin" />{t.loading}</div>
        </div>
      </div>
    );
  }

  if (session && recovery) {
    return (
      <div className={rootClass} style={rootStyle}>
        <div className="od-shell">
          <NewPasswordScreen t={t} onDone={() => {
            window.history.replaceState(null, "", window.location.pathname);
            setRecovery(false);
            showToast(t.pwUpdated);
          }} />
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div className={rootClass} style={rootStyle}>
        <div className="od-shell">
          {!session ? <AuthScreen t={t} /> : <div className="od-splash"><div className="od-spin" />{t.loading}</div>}
        </div>
      </div>
    );
  }

  const inChat = tab === "chat" && activeChat;
  const inSettings = tab === "settings";
  const sheet = selected && groups[selected];
  const sheetPrimary = sheet ? groups[selected].posts.filter((p) => p.user_id === profile.id || friendIds.has(p.user_id)) : [];
  const sheetCommunity = sheet ? groups[selected].posts.filter((p) => p.user_id !== profile.id && !friendIds.has(p.user_id)) : [];

  return (
    <div className={rootClass} style={rootStyle}>
      <div className="od-shell">

        {/* ---------- Intestazione ---------- */}
        {inChat ? (
          <div className="od-header">
            <button className="od-back" onClick={() => setActiveChat(null)}><Icon name="chevLeft" size={22} /></button>
            <Avatar name={activeChat.username} size={34} />
            <span className="od-h-title od-display">{activeChat.username}</span>
          </div>
        ) : inSettings ? (
          <div className="od-header">
            <button className="od-back" onClick={() => setTab("profile")}><Icon name="chevLeft" size={22} /></button>
            <span className="od-h-title od-display">{t.settings}</span>
          </div>
        ) : (
          <div className="od-header">
            <div className="od-brand od-display">Our <em>Dates</em></div>
            {tab === "home" && <span className="od-span-chip">{humanSpan(range.end - range.start, t)}</span>}
            {tab === "profile" && (
              <button className="od-gear" onClick={() => setTab("settings")} aria-label={t.settings}><Icon name="sliders" size={17} /></button>
            )}
            {tab !== "home" && tab !== "profile" && (
              <span className="od-span-chip">{tab === "search" ? t.searchTab : t.chatTab}</span>
            )}
          </div>
        )}

        {/* ---------- Corpo ---------- */}
        <div className="od-body">

          {tab === "home" && (
            <VerticalTimeline
              range={range} setRange={setRange} groups={groups}
              selected={selected} onSelect={setSelected} t={t} lang={lang}
              empty={posts.length === 0}
            />
          )}

          {tab === "search" && (
            <>
              <div className="od-search-bar">
                <Icon name="search" size={16} />
                <input autoFocus placeholder={t.searchPh} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {!query && friendsList.length > 0 && (
                <>
                  <div className="od-sec-label">{t.friends}</div>
                  <div className="od-friends">
                    {friendsList.map((f) => (
                      <button key={f.id} className="od-friend" onClick={() => openChat(f)}>
                        <Avatar name={f.username} /><span>{f.username}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {!query && friendsList.length === 0 && <div className="od-empty">{t.noFriendsYet}</div>}
              <div className="od-scroll">
                {query && people.length > 0 && (
                  <>
                    <div className="od-sec-label" style={{ padding: "0 2px 8px" }}>{t.peopleSec}</div>
                    {people.map((p) => (
                      <div key={p.id} className="od-person" style={{ margin: "0 0 8px" }}>
                        <Avatar name={p.username} size={36} />
                        <b>{p.username}</b>
                        {friendIds.has(p.id) ? (
                          <button className="od-mini-btn ok" onClick={() => removeFriend(p)}>
                            <Icon name="check" size={13} />{t.friendYes}
                          </button>
                        ) : (
                          <button className="od-mini-btn" onClick={() => addFriend(p)}>
                            <Icon name="plus" size={13} />{t.addFriend}
                          </button>
                        )}
                        <button className="od-mini-btn" onClick={() => openChat(p)} aria-label={t.chatTab}>
                          <Icon name="message" size={14} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {query && searchResults.length === 0 && people.length === 0 && (
                  <div className="od-empty">{t.noResults(query)}<br />{t.tryOther}</div>
                )}
                {query && searchResults.length > 0 && (
                  <div className="od-sec-label" style={{ padding: "4px 2px 8px" }}>{t.timeline}</div>
                )}
               {searchResults.map((p) => (
  <PostCard
    key={p.id}
    p={p}
    meId={profile.id}
    t={t}
    lang={lang}
    onDelete={deletePost}
    onEdit={startEdit}
    reactions={reactions}
    comments={comments}
    onToggleLike={toggleLike}
    onAddComment={addComment}
    onDeleteComment={deleteComment}
    names={names}
  />
))}
              </div>
            </>
          )}

          {tab === "chat" && !activeChat && (
            <div className="od-scroll" style={{ padding: 0 }}>
              {chatEntries.length === 0 && <div className="od-empty">{t.noFriendsYet}</div>}
              {chatEntries.map((e) => {
                const last = e.conv?.msgs[e.conv.msgs.length - 1];
                return (
                  <button key={e.id} className="od-chat-row" onClick={() => openChat({ id: e.id, username: e.username })}>
                    <Avatar name={e.username} size={44} />
                    <div>
                      <div className="od-chat-name">{e.username}</div>
                      <div className="od-chat-last">
                        {last ? (last.sender_id === profile.id ? `${t.you}: ` : "") + last.content : t.startConv}
                      </div>
                    </div>
                    <div className="od-chat-meta">
                      {last && <span className="od-chat-time">{fmtHM(last.created_at, lang)}</span>}
                      {(e.conv?.unread || 0) > 0 && <span className="od-dot">{e.conv.unread}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {inChat && (
            <>
              <div className="od-msgs" ref={msgsRef}>
                {!(convos[activeChat.id]?.msgs.length) && <div className="od-empty">{t.noMsgs(activeChat.username)}</div>}
                {(convos[activeChat.id]?.msgs || []).map((m) => (
                  <div key={m.id} className={`od-bubble ${m.sender_id === profile.id ? "mine" : "theirs"}`}>
                    {m.content}<small>{fmtHM(m.created_at, lang)}</small>
                  </div>
                ))}
              </div>
              <div className="od-chat-input">
                <input placeholder={t.writeMsg} value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()} />
                <button className="od-send" onClick={sendMsg} aria-label="→"><Icon name="send" size={17} /></button>
              </div>
            </>
          )}

          {tab === "profile" && (
            <div className="od-scroll" style={{ padding: 0 }}>
              <div className="od-profile-head">
                <Avatar name={profile.username} size={72} />
                <div className="od-h-title od-display">{profile.username}</div>
                <div className="od-stats">
                  <div className="od-stat"><b>{myPosts.length}</b><span>{t.dates}</span></div>
                  <div className="od-stat"><b>{friendsList.length}</b><span>{t.friendsN}</span></div>
                  <div className="od-stat"><b>{myPosts.filter((p) => p.visibility === "public").length}</b><span>{t.publicN}</span></div>
                </div>
              </div>
              <div style={{ padding: "12px 14px 24px" }}>
                <div className="od-sec-label" style={{ padding: "0 2px 8px" }}>{t.myDates}</div>
                {myPosts.length === 0 && <div className="od-empty">{t.noDates}</div>}
              {myPosts.map((p) => (
  <PostCard
    key={p.id}
    p={p}
    meId={profile.id}
    t={t}
    lang={lang}
    onDelete={deletePost}
    onEdit={startEdit}
    reactions={reactions}
    comments={comments}
    onToggleLike={toggleLike}
    onAddComment={addComment}
    onDeleteComment={deleteComment}
    names={names}
  />
))}
                <button className="od-btn od-logout" onClick={logout}>{t.logout}</button>
              </div>
            </div>
          )}

          {inSettings && (
            <SettingsScreen
              t={t} settings={settings} upd={upd} detected={detected} dark={dark}
              remember={remember} setRemember={setRemember}
              onLogout={logout} onDeleteAccount={() => setConfirmDel(true)} showToast={showToast}
            />
          )}
        </div>

        {/* ---------- Navigazione ---------- */}
        {!inChat && !inSettings && (
          <nav className="od-nav">
            <button className={`od-nav-item ${tab === "home" ? "on" : ""}`} onClick={() => setTab("home")}>
              <Icon name="clock" size={21} />{t.timeline}
            </button>
            <button className={`od-nav-item ${tab === "search" ? "on" : ""}`} onClick={() => setTab("search")}>
              <Icon name="search" size={21} />{t.searchTab}
            </button>
            <button className="od-nav-add" onClick={() => setComposer(true)} aria-label="+"><Icon name="plus" size={26} /></button>
            <button className={`od-nav-item ${tab === "chat" ? "on" : ""}`} onClick={() => { setTab("chat"); setActiveChat(null); }}>
              <Icon name="message" size={21} />{t.chatTab}
              {totalUnread > 0 && <span className="od-badge">{totalUnread}</span>}
            </button>
            <button className={`od-nav-item ${tab === "profile" ? "on" : ""}`} onClick={() => setTab("profile")}>
              <Icon name="user" size={21} />{t.profileTab}
            </button>
          </nav>
        )}

        {/* ---------- Dettaglio data: tutti i post ---------- */}
        {sheet && tab === "home" && (
          <div className="od-overlay" onClick={() => setSelected(null)}>
            <div className="od-modal" onClick={(e) => e.stopPropagation()}>
              <div className="od-grab" />
              <div className="od-sheet-head">
                <h2 className="od-display">{fmtLong(selected, lang)}</h2>
                <button className="od-close" onClick={() => setSelected(null)}><Icon name="x" size={15} /></button>
              </div>
              <div className="od-count-badge" style={{ marginBottom: 12 }}>
                <Icon name="star" size={13} filled /> {t.chose(groups[selected].count)}
              </div>
            {sheetPrimary.map((p) => (
  <PostCard
    key={p.id}
    p={p}
    meId={profile.id}
    t={t}
    lang={lang}
    onDelete={deletePost}
    onEdit={startEdit}
    reactions={reactions}
    comments={comments}
    onToggleLike={toggleLike}
    onAddComment={addComment}
    onDeleteComment={deleteComment}
    names={names}
  />
))}
              {sheetCommunity.length > 0 && (
                <>
                  {sheetPrimary.length > 0 && (
                    <div className="od-sec-label" style={{ padding: "4px 2px 8px" }}>{t.community}</div>
                  )}
                {sheetCommunity.map((p) => (
  <PostCard
    key={p.id}
    p={p}
    meId={profile.id}
    t={t}
    lang={lang}
    onDelete={deletePost}
    onEdit={startEdit}
    reactions={reactions}
    comments={comments}
    onToggleLike={toggleLike}
    onAddComment={addComment}
    onDeleteComment={deleteComment}
    names={names}
  />
))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ---------- Conferma eliminazione account ---------- */}
        {confirmDel && (
          <div className="od-overlay center" onClick={() => setConfirmDel(false)}>
            <div className="od-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="od-display">{t.delTitle}</h2>
              <div className="od-modal-sub" style={{ marginBottom: 6 }}>{t.delBody}</div>
              <div className="od-modal-actions">
                <button className="od-btn od-btn-cancel" onClick={() => setConfirmDel(false)}>{t.cancel}</button>
                <button className="od-btn od-btn-danger" onClick={doDeleteAccount}>{t.delBtn}</button>
              </div>
            </div>
          </div>
        )}

        {composer && (
  <Composer
    onClose={() => { setComposer(false); setEditingPost(null); }}
    onSave={publishPost}
    t={t}
    defaultVisibility={settings.privacy.defaultVisibility}
    post={editingPost}
  />
)}
        {toast && <div className="od-toast">{toast}</div>}
      </div>
    </div>
  );
}
