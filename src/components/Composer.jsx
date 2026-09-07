import React, { useState } from "react";
import Icon from "../lib/icons.jsx";
import { VIS_META } from "./ui.jsx";
import { toKey } from "../lib/i18n.js";

export default function Composer({ onClose, onSave, t, defaultVisibility, post }) {
  const isEdit = !!post;
  const [date, setDate] = useState(post?.date || toKey(Date.now()));
  const [title, setTitle] = useState(post?.title || "");
  const [comment, setComment] = useState(post?.comment || "");
  const [visibility, setVisibility] = useState(post?.visibility || defaultVisibility || "public");
  const [mediaType, setMediaType] = useState(post?.media_type || "none");
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState(post?.media_type === "link" ? (post.media_url || "") : "");
  const [keepMedia, setKeepMedia] = useState(!!post?.media_url);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!date || !title.trim()) { setErr(t.dateReq); return; }
    setBusy(true);
    setErr("");
    let mediaPayload = null;
    if (mediaType === "link" && linkUrl.trim()) {
      mediaPayload = { type: "link", url: linkUrl.trim() };
    } else if (mediaType !== "none" && file) {
      mediaPayload = { type: mediaType, file };
    } else if (isEdit && keepMedia && post.media_url) {
      mediaPayload = { type: post.media_type, url: post.media_url, keep: true };
    } else {
      mediaPayload = { type: null };
    }
    const ok = await onSave(
      { date, title: title.trim(), comment: comment.trim(), visibility },
      mediaPayload,
      post?.id
    );
    setBusy(false);
    if (!ok) setErr(t.genericErr);
  };

  return (
    <div className="od-overlay" onClick={busy ? undefined : onClose}>
      <div className="od-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-grab" />
        <h2 className="od-display">{isEdit ? t.editDate : t.newDate}</h2>
        <div className="od-modal-sub">{isEdit ? t.editDateSub : t.newDateSub}</div>
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
              <button key={v} className={mediaType === v ? "on" : ""} onClick={() => { setMediaType(v); setFile(null); setKeepMedia(false); }}>
                {ic && <Icon name={ic} size={14} />}{l}
              </button>
            ))}
          </div>
          {isEdit && keepMedia && post.media_url && mediaType === post.media_type && (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
              Media attuale mantenuto. Scegli un’altra opzione per cambiarlo o toglierlo.
            </div>
          )}
          {mediaType === "photo" && (
            <input style={{ marginTop: 10 }} type="file" accept="image/*" onChange={(e) => { setFile(e.target.files?.[0] || null); setKeepMedia(false); }} />
          )}
          {mediaType === "video" && (
            <input style={{ marginTop: 10 }} type="file" accept="video/*" onChange={(e) => { setFile(e.target.files?.[0] || null); setKeepMedia(false); }} />
          )}
          {mediaType === "link" && (
            <input className="od-input" style={{ marginTop: 10 }} placeholder="https://..." value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setKeepMedia(false); }} />
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
          <button className="od-btn od-btn-primary" onClick={save} disabled={busy}>
            {busy ? (isEdit ? t.saving : t.publishing) : (isEdit ? t.save : t.publish)}
          </button>
        </div>
      </div>
    </div>
  );
}
