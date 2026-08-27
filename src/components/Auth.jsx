import React, { useState } from "react";
import Icon from "../lib/icons.jsx";
import { supabase } from "../lib/supabase.js";
import { ageOf, toKey } from "../lib/i18n.js";

export default function AuthScreen({ t }) {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [birth, setBirth] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(localStorage.getItem("od_remember") !== "0");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const saveRemember = (v) => {
    setRemember(v);
    localStorage.setItem("od_remember", v ? "1" : "0");
  };

  const switchMode = (m) => { setMode(m); setErr(""); setInfo(""); };

  const submit = async () => {
    setErr(""); setInfo("");
    const mail = email.trim().toLowerCase();

    if (mode === "forgot") {
      if (!mail) { setErr(t.fillErr); return; }
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: window.location.origin });
      setBusy(false);
      if (error) setErr(t.genericErr);
      else setInfo(t.resetSent);
      return;
    }

    if (!mail || !pw || (mode === "register" && (!name.trim() || !birth))) { setErr(t.fillErr); return; }
    if (pw.length < 6) { setErr(t.pwShort); return; }

    setBusy(true);
    localStorage.setItem("od_remember", remember ? "1" : "0");

    if (mode === "register") {
      if (ageOf(birth) < 14) { setBusy(false); setErr(t.ageErr); return; }
      const username = name.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 20);
      // il nome utente deve essere libero
      const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (taken) { setBusy(false); setErr(t.userExists); return; }

      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password: pw,
        options: { data: { username, birthdate: birth } },
      });
      setBusy(false);
      if (error) {
        setErr(/already/i.test(error.message) ? t.emailExists : error.message);
      } else if (!data.session) {
        setInfo(t.checkEmail); // richiesta conferma email
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password: pw });
      setBusy(false);
      if (error) setErr(/credentials/i.test(error.message) ? t.wrongCreds : error.message);
    }
  };

  return (
    <div className="od-auth">
      <div className="od-auth-card">
        <div className="od-logo-row">
          <div className="od-logo-mark"><Icon name="calendar" size={22} /></div>
          <div className="od-display" style={{ fontWeight: 800, fontSize: 22 }}>Our Dates</div>
        </div>
        <div className="od-tagline">{t.tagline}</div>

        {mode !== "forgot" && (
          <div className="od-tabs">
            <button className={`od-tab ${mode === "login" ? "on" : ""}`} onClick={() => switchMode("login")}>{t.login}</button>
            <button className={`od-tab ${mode === "register" ? "on" : ""}`} onClick={() => switchMode("register")}>{t.register}</button>
          </div>
        )}

        {err && <div className="od-err">{err}</div>}
        {info && <div className="od-info">{info}</div>}

        <div className="od-field">
          <label className="od-label">{t.email}</label>
          <input className="od-input" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.com" />
        </div>

        {mode === "register" && (
          <div className="od-field">
            <label className="od-label">{t.username}</label>
            <input className="od-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. asda" />
          </div>
        )}

        {mode !== "forgot" && (
          <div className="od-field">
            <label className="od-label">{t.password}</label>
            <div className="od-pw-wrap">
              <input className="od-input" type={showPw ? "text" : "password"} value={pw}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && submit()} />
              <button className="od-eye" onClick={() => setShowPw(!showPw)}
                title={showPw ? t.hidePw : t.showPw} aria-label={showPw ? t.hidePw : t.showPw}>
                <Icon name={showPw ? "eyeOff" : "eye"} size={19} />
              </button>
            </div>
          </div>
        )}

        {mode === "register" && (
          <div className="od-field">
            <label className="od-label">{t.birth} (14+)</label>
            <input className="od-input" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} max={toKey(Date.now())} />
          </div>
        )}

        {mode !== "forgot" && (
          <label className="od-check">
            <input type="checkbox" checked={remember} onChange={(e) => saveRemember(e.target.checked)} />
            {t.remember}
          </label>
        )}

        <button className="od-btn od-btn-primary" onClick={submit} disabled={busy}>
          {busy ? "…" : mode === "login" ? t.enter : mode === "register" ? t.create : t.forgot}
        </button>

        {mode === "login" && (
          <button className="od-btn od-btn-ghost" onClick={() => switchMode("forgot")}>{t.forgot}</button>
        )}
        {mode === "forgot" && (
          <button className="od-btn od-btn-ghost" onClick={() => switchMode("login")}>← {t.login}</button>
        )}
      </div>
    </div>
  );
}

export function NewPasswordScreen({ t, onDone }) {
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 6) { setErr(t.pwShort); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setErr(t.genericErr);
    else onDone();
  };

  return (
    <div className="od-auth">
      <div className="od-auth-card">
        <div className="od-logo-row">
          <div className="od-logo-mark"><Icon name="key" size={22} /></div>
          <div className="od-display" style={{ fontWeight: 800, fontSize: 20 }}>{t.newPw}</div>
        </div>
        {err && <div className="od-err">{err}</div>}
        <div className="od-field">
          <label className="od-label">{t.newPw}</label>
          <div className="od-pw-wrap">
            <input className="od-input" type={showPw ? "text" : "password"} value={pw}
              onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
            <button className="od-eye" onClick={() => setShowPw(!showPw)}>
              <Icon name={showPw ? "eyeOff" : "eye"} size={19} />
            </button>
          </div>
        </div>
        <button className="od-btn od-btn-primary" onClick={submit} disabled={busy}>{t.updatePw}</button>
      </div>
    </div>
  );
}
