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

  // media
  const [mediaType, setMediaType] = useState(post?.media_type || "none");
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState(post?.media_type === "link" ? (post.media_url || "") : "");
  const [keepExisting, setKeepExisting] = useState(!!post?.media_url);

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const hasExistingMedia = isEdit && post?.media_url && keepExisting;

  const chooseNone = () => {
    setMediaType("none");
    setFile(null);
    setLinkUrl("");
    setKeepExisting(false);
  };

  const choosePhoto = () => {
    setMediaType("photo");
    setFile(null);
    setLinkUrl("");
    setKeepExisting(false);
  };

  const chooseVideo = () => {
    setMediaType("video");
    setFile(null);
    setLinkUrl("");
    setKeepExisting(false);
  };

  const chooseLink = () => {
    setMediaType("link");
    setFile(null);
    setKeepExisting(false);
  };

  const keepCurrent = () => {
    setKeepExisting(true);
    setMediaType(post.media_type || "none");
    setFile(null);
    setLinkUrl(post.media_type === "link" ? (post.media_url || "") : "");
  };

  const save = async () => {
    if (!date || !title.trim()) {
      setErr(t.dateReq);
      return;
    }
    setBusy(true);
    setErr("");

    let mediaPayload = null;

    if (hasExistingMedia) {
      // mantieni quello esistente
      mediaPayload = { keep: true, type: post.media_type, url: post.media_url };
    } else if (mediaType === "link" && linkUrl.trim()) {
      mediaPayload = { type: "link", url: linkUrl.trim() };
    } else if ((mediaType === "photo" || mediaType === "video") && file) {
      mediaPayload = { type: mediaType, file };
    } else {
      // nessun media (o rimosso)
      mediaPayload = { type: null };
    }

    const ok = await onSave(
      { date, title: title.trim(), comment: comment.trim(), visibility },
      mediaPayload,
      post?.id || null
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

        {/* ---------- MEDIA ---------- */}
        <div className="od-field">
          <label className="od-label">{t.addSmth}</label>

          {/* Anteprima media esistente */}
          {hasExistingMedia && (
            <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "var(--od-card, #f3f4f6)" }}>
              <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.7 }}>{t.currentMedia}</div>
              {post.media_type === "photo" && (
                <img src={post.media_url} alt="" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8 }} />
              )}
              {post.media_type === "video" && (
                <video src={post.media_url} controls style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8 }} />
              )}
              {post.media_type === "link" && (
                <a href={post.media_url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
                  {post.media_url}
                </a>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" className="od-btn od-btn-cancel" style={{ flex: 1, padding: "8px 0" }} onClick={keepCurrent}>
                  {t.keepMedia}
                </button>
                <button type="button" className="od-btn od-btn-danger" style={{ flex: 1, padding: "8px 0" }} onClick={chooseNone}>
                  {t.removeMedia}
                </button>
              </div>
            </div>
          )}

          {/* Selettore tipo media */}
          {!hasExistingMedia && (
            <>
              <div className="od-seg">
                <button className={mediaType === "none" ? "on" : ""} onClick={chooseNone}>{t.none}</button>
                <button className={mediaType === "photo" ? "on" : ""} onClick={choosePhoto}>
                  <Icon name="camera" size={14} /> {t.photo}
                </button>
                <button className={mediaType === "video" ? "on" : ""} onClick={chooseVideo}>
                  <Icon name="video" size={14} /> {t.video}
                </button>
                <button className={mediaType === "link" ? "on" : ""} onClick={chooseLink}>
                  <Icon name="link" size={14} /> {t.link}
                </button>
              </div>

              {mediaType === "photo" && (
                <input
                  style={{ marginTop: 10 }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              )}
              {mediaType === "video" && (
                <input
                  style={{ marginTop: 10 }}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              )}
              {mediaType === "link" && (
                <input
                  className="od-input"
                  style={{ marginTop: 10 }}
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              )}
            </>
          )}
        </div>

        {/* ---------- VISIBILITÀ ---------- */}
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
          <button className="od-btn od-btn-cancel" onClick={onClose} disabled={busy}>
            {t.cancel}
          </button>
          <button className="od-btn od-btn-primary" onClick={save} disabled={busy}>
            {busy ? (isEdit ? t.saving : t.publishing) : isEdit ? t.save : t.publish}
          </button>
        </div>
      </div>
    </div>
  );
}
