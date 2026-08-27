import React from "react";
import Icon from "../lib/icons.jsx";
import { fmtLong } from "../lib/i18n.js";

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

export function PostCard({ p, meId, t, lang, onDelete }) {
  const meta = VIS_META[p.visibility] || VIS_META.public;
  return (
    <article className="od-card" style={{ borderLeftColor: meta.color }}>
      <div className="od-card-top">
        <Avatar name={p.username} size={32} />
        <div>
          <div className="od-card-author">{p.user_id === meId ? t.you : p.username}</div>
          <div className="od-card-date">{fmtLong(p.date, lang)}</div>
        </div>
        <span className="od-card-vis" style={{ color: meta.color, background: `${meta.color}1A` }}>
          <Icon name={meta.icon} size={11} /> {t.vis[p.visibility].label}
        </span>
        {onDelete && p.user_id === meId && (
          <button className="od-del" onClick={() => onDelete(p)} title={t.delPostQ}>
            <Icon name="trash" size={15} />
          </button>
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
    </article>
  );
}
