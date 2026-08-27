import React from "react";
import Icon from "../lib/icons.jsx";
import { Row, Toggle, VIS_META } from "./ui.jsx";
import { LANG_NAMES } from "../lib/i18n.js";

export default function SettingsScreen({
  t, settings, upd, detected, dark,
  remember, setRemember,
  onLogout, onDeleteAccount, showToast,
}) {
  const soon = () => showToast(t.comingSoon);

  return (
    <div className="od-scroll" style={{ padding: "6px 0 24px" }}>

      <div className="od-sec-label">{t.sAccount}</div>
      <div className="od-set-card">
        <Row icon="user" label={t.sEditProfile} onClick={soon} />
        <Row icon="key" label={t.sChangePw} onClick={soon} />
        <Row icon="mail" label={t.sEmail} onClick={soon} />
      </div>

      <div className="od-sec-label">{t.sNotif}</div>
      <div className="od-set-card">
        <Row icon="message" label={t.sNotifMsg} right={<Toggle on={settings.notif.messages} onChange={(v) => upd("notif.messages", v)} />} />
        <Row icon="calendar" label={t.sNotifFriend} right={<Toggle on={settings.notif.friendDates} onChange={(v) => upd("notif.friendDates", v)} />} />
        <Row icon="star" label={t.sNotifPop} right={<Toggle on={settings.notif.popular} onChange={(v) => upd("notif.popular", v)} />} />
        <Row icon="bell" label={t.sNotifAnniv} right={<Toggle on={settings.notif.anniversaries} onChange={(v) => upd("notif.anniversaries", v)} />} />
      </div>

      <div className="od-sec-label">{t.sPrivacy}</div>
      <div className="od-set-card">
        <Row icon="eye" label={t.sDefVis} right={
          <div className="od-mini-seg">
            {Object.keys(VIS_META).map((v) => (
              <button key={v} className={settings.privacy.defaultVisibility === v ? "on" : ""} onClick={() => upd("privacy.defaultVisibility", v)}>
                <Icon name={VIS_META[v].icon} size={13} />
              </button>
            ))}
          </div>
        } />
        <Row icon="message" label={t.sWhoMsg} right={
          <div className="od-mini-seg">
            <button className={settings.privacy.whoCanMessage === "all" ? "on" : ""} onClick={() => upd("privacy.whoCanMessage", "all")}>{t.sAll}</button>
            <button className={settings.privacy.whoCanMessage === "friends" ? "on" : ""} onClick={() => upd("privacy.whoCanMessage", "friends")}>{t.sFriendsOnly}</button>
          </div>
        } />
        <Row icon="search" label={t.sDiscover} right={<Toggle on={settings.privacy.discoverable} onChange={(v) => upd("privacy.discoverable", v)} />} />
        <Row icon="shield" label={t.sBlocked} onClick={soon} />
        <Row icon="lock" label={t.sTwoFA} onClick={soon} />
      </div>

      <div className="od-sec-label">{t.sAppearance}</div>
      <div className="od-set-card">
        <Row icon={dark ? "moon" : "sun"} label={t.sTheme} right={
          <div className="od-mini-seg">
            <button className={settings.appearance.theme === "light" ? "on" : ""} onClick={() => upd("appearance.theme", "light")}>{t.thLight}</button>
            <button className={settings.appearance.theme === "dark" ? "on" : ""} onClick={() => upd("appearance.theme", "dark")}>{t.thDark}</button>
            <button className={settings.appearance.theme === "auto" ? "on" : ""} onClick={() => upd("appearance.theme", "auto")}>{t.thAuto}</button>
          </div>
        } />
        <Row icon="type" label={t.sTextSize} right={
          <div className="od-mini-seg">
            {["s", "m", "l"].map((v) => (
              <button key={v} className={settings.appearance.textSize === v ? "on" : ""} onClick={() => upd("appearance.textSize", v)}>{t["ts" + v.toUpperCase()]}</button>
            ))}
          </div>
        } />
      </div>

      <div className="od-sec-label">{t.sLang}</div>
      <div className="od-set-card">
        <Row icon="globe" label={t.sAuto} sub={t.detected(LANG_NAMES[detected])} onClick={() => upd("langMode", "auto")}
          right={<div className={`od-radio ${settings.langMode === "auto" ? "on" : ""}`} />} />
        {Object.keys(LANG_NAMES).map((l) => (
          <Row key={l} label={LANG_NAMES[l]} onClick={() => upd("langMode", l)}
            right={<div className={`od-radio ${settings.langMode === l ? "on" : ""}`} />} />
        ))}
      </div>

      <div className="od-sec-label">{t.sDataSec}</div>
      <div className="od-set-card">
        <Row icon="download" label={t.sDownload} onClick={soon} />
        <Row icon="trash" label={t.sCache} onClick={async () => {
          if (window.caches) for (const k of await window.caches.keys()) await window.caches.delete(k);
          showToast(t.cacheCleared);
        }} />
      </div>

      <div className="od-sec-label">{t.sSupport}</div>
      <div className="od-set-card">
        <Row icon="help" label={t.sHelp} onClick={soon} />
        <Row icon="alert" label={t.sReport} onClick={soon} />
      </div>

      <div className="od-sec-label">{t.sLegal}</div>
      <div className="od-set-card">
        <Row icon="file" label={t.sTerms} onClick={soon} />
        <Row icon="shield" label={t.sPolicy} onClick={soon} />
        <Row icon="info" label={t.sAbout} sub={`${t.version} 1.0`} right={null} />
      </div>

      <div className="od-sec-label">{t.sSession}</div>
      <div className="od-set-card">
        <Row icon="lock" label={t.sStay} sub={t.sStayHint} right={<Toggle on={remember} onChange={setRemember} />} />
        <Row icon="logout" label={t.logout} onClick={onLogout} />
        <Row icon="trash" label={t.sDelete} danger onClick={onDeleteAccount} />
      </div>
    </div>
  );
}
