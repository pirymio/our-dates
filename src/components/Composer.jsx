import React, { useState } from "react";
import Icon from "../lib/icons.jsx";
import { VIS_META } from "./ui.jsx";
import { toKey } from "../lib/i18n.js";

export default function Composer({ onClose, onSave, t, defaultVisibility }) {
  const [date, setDate] = useState(toKey(Date.now()));
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState(defaultVisibility || "public");
  const [mediaType, setMediaType] = useState("none");
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!date || !title.trim()) { setErr(t.dateReq); return; }
    setBusy(true);
    setErr("");
    const ok = await onSave(
      { date, title: title.trim(), comment: comment.trim(), visibility },
      mediaType === "link" ? { type: "link", url: linkUrl.trim() } : mediaType !== "none" && file ? { type: mediaType, file } : null
    );
    setBusy(false);
    if (!ok) setErr(t.genericErr);
  };

  return (
    <div className="od-overlay" onClick={busy ? undefined : onClose}>
      <div className="od-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-grab" />
        <h2 className="od-display">{t.newDate}</h2>
        <div className="od-modal-sub">{t.newDateSub}</div>
        {err && <div className="od-err">{err}</div>}
        <div className="od-field">
          <label className="od-label">{t.dateLbl}</label>
          <input className="od-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="od-field">
          <label className="od-label">{t.titleLbl}</label>
          <input className="od-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePh} />
        </div>
        <div className="od-field">
          <label className="od-label">{t.whyLbl}</label>
          <textarea className="od-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.whyPh} />
        </div>
        <div className="od-field">
          <label className="od-label">{t.addSmth}</label>
          <div className="od-seg">
            {[["none", t.none, null], ["photo", t.photo, "camera"], ["video", t.video, "video"], ["link", t.link, "link"]].map(([v, l, ic]) => (
              <button key={v} className={mediaType === v ? "on" : ""} onClick={() => { setMediaType(v); setFile(null); }}>
                {ic && <Icon name={ic} size={14} />}{l}
              </button>
            ))}
          </div>
          {mediaType === "photo" && (
            <input style={{ marginTop: 10 }} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          )}
          {mediaType === "video" && (
            <input style={{ marginTop: 10 }} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          )}
          {mediaType === "link" && (
            <input className="od-input" style={{ marginTop: 10 }} placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          )}
        </div>
        <div className="od-field">
          <label className="od-label">{t.whoSee}</label>
          <div className="od-seg">
            {Object.keys(VIS_META).map((v) => (
              <button key={v} className={visibility === v ? "on" : ""} onClick={() => setVisibility(v)}>
                <Icon name={VIS_META[v].icon} size={14} /> {t.vis[v].label}
              </button>
            ))}
          </div>
          <div className="od-vis-hint">{t.vis[visibility].hint}</div>
        </div>
        <div className="od-modal-actions">
          <button className="od-btn od-btn-cancel" onClick={onClose} disabled={busy}>{t.cancel}</button>
          <button className="od-btn od-btn-primary" onClick={save} disabled={busy}>{busy ? t.publishing : t.publish}</button>
        </div>
      </div>
    </div>
  );
}
