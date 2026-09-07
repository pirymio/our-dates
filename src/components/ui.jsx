import React, { useState } from "react";
import Icon from "../lib/icons.jsx";
import { fmtLong, fmtHM } from "../lib/i18n.js";

export const VIS_META = {
  private: { icon: "lock", color: "#6B7280" },
  friends: { icon: "users", color: "#D97E22" },
  public: { icon: "globe", color: "#12808A" },
};

const AVATAR_COLORS = ["#12808A", "#D97E22", "#B8503C", "#5B62C4", "#3E8E5A", "#8A5CC9"];

export function Avatar({ name = "?", size = 46 }) {
  const idx = (name.charCodeAt(0) + name.length) % AVATAR_COLORS.length;
  return (
    <div className="od-avatar" style={{ background: AVATAR_COLORS[idx], width: size, height: size, fontSize: size * 0.4 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return <button className={`od-switch ${on ? "on" : ""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} />;
}

export function Row({ icon, label, sub, right, onClick, danger }) {
  return (
    <div className={`od-set-row ${onClick ? "od-press" : ""}`} onClick={onClick}>
      {icon && <Icon name={icon} size={18} className="od-row-ic" style={danger ? { color: "#C43F2E" } : null} />}
      <span style={danger ? { color: "#C43F2E" } : null}>
        {label}
        {sub && <em className="od-set-sub">{sub}</em>}
      </span>
      {right !== undefined ? right : onClick ? <Icon name="chevRight" size={16} className="od-chev" /> : null}
    </div>
  );
}

export function PostCard({
  p,
  meId,
  t,
  lang,
  onDelete,
  onEdit,
  reactions = [],
  comments = [],
  onToggleLike,
  onAddComment,
  onDeleteComment,
  names = {},
}) {
  const meta = VIS_META[p.visibility] || VIS_META.public;
  const isMine = p.user_id === meId;
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const likeCount = reactions.filter((r) => r.post_id === p.id).length;
  const likedByMe = reactions.some((r) => r.post_id === p.id && r.user_id === meId);
  const postComments = comments.filter((c) => c.post_id === p.id).sort((a, b) => a.created_at.localeCompare(b.created_at));

  const handleLike = () => {
    if (onToggleLike) onToggleLike(p.id, likedByMe);
  };

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text || !onAddComment) return;
    setBusy(true);
    const ok = await onAddComment(p.id, text);
    setBusy(false);
    if (ok) setDraft("");
  };

  return (
    <article className="od-card" style={{ borderLeftColor: meta.color }}>
      <div className="od-card-top">
        <Avatar name={p.username} size={32} />
        <div>
          <div className="od-card-author">{isMine ? t.you : p.username}</div>
          <div className="od-card-date">{fmtLong(p.date, lang)}</div>
        </div>
        <span className="od-card-vis" style={{ color: meta.color, background: `${meta.color}1A` }}>
          <Icon name={meta.icon} size={11} /> {t.vis[p.visibility].label}
        </span>
        {isMine && (
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {onEdit && (
              <button className="od-del" onClick={() => onEdit(p)} title={t.edit}>
                <Icon name="edit" size={15} />
              </button>
            )}
            {onDelete && (
              <button className="od-del" onClick={() => onDelete(p)} title={t.delPostQ}>
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="od-display">{p.title}</h3>
      {p.comment && <p>{p.comment}</p>}

      {p.media_url && (
        <div className="od-media">
          {p.media_type === "photo" && <img src={p.media_url} alt={p.title} loading="lazy" />}
          {p.media_type === "video" && <video src={p.media_url} controls preload="metadata" />}
          {p.media_type === "link" && (
            <a href={p.media_url} target="_blank" rel="noreferrer">{p.media_url}</a>
          )}
        </div>
      )}

      {/* Reazioni + Commenti */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--od-border, #e5e7eb)", alignItems: "center" }}>
        <button
          onClick={handleLike}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
            color: likedByMe ? "#e11d48" : "inherit",
            fontSize: 14,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 18 }}>{likedByMe ? "❤️" : "🤍"}</span>
          <span>{likeCount > 0 ? t.likes(likeCount) : t.like}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
            fontSize: 14,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span>{postComments.length > 0 ? t.comments(postComments.length) : t.comment}</span>
        </button>
      </div>

      {/* Sezione commenti */}
      {showComments && (
        <div style={{ marginTop: 12 }}>
          {postComments.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>{t.noComments}</div>
          )}
          {postComments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
              <Avatar name={names[c.user_id] || "?"} size={28} />
              <div style={{ flex: 1, background: "var(--od-card, #f3f4f6)", borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {c.user_id === meId ? t.you : names[c.user_id] || "…"}
                  <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6, fontSize: 12 }}>
                    {fmtHM(c.created_at, lang)}
                  </span>
                </div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{c.content}</div>
              </div>
              {c.user_id === meId && onDeleteComment && (
                <button
                  className="od-del"
                  onClick={() => onDeleteComment(c)}
                  title={t.delCommentQ}
                  style={{ marginTop: 4 }}
                >
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="od-input"
              style={{ flex: 1, padding: "8px 10px", fontSize: 14 }}
              placeholder={t.writeComment}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && handleAdd()}
              disabled={busy}
            />
            <button
              className="od-btn od-btn-primary"
              style={{ padding: "8px 14px" }}
              onClick={handleAdd}
              disabled={busy || !draft.trim()}
            >
              →
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
