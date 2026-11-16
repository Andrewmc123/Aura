// Review queue for reported content. Only accounts whose email is listed in
// the server's ADMIN_EMAILS setting can open it.
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Safety.css";

const isVideo = (url) => /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url || "");

export default function AdminReports() {
  const user = useSelector((s) => s.session.user);
  const [status, setStatus] = useState("open");
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setReports(null);
    fetch(`/api/moderation/reports?status=${status}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setReports(d.reports || []))
      .catch(() => { setReports([]); setError("Couldn't load reports."); });
  }, [status]);

  useEffect(() => { if (user?.is_admin) load(); }, [load, user]);

  if (!user?.is_admin) return <Navigate to="/" replace />;

  const act = async (report, action) => {
    const warn = {
      remove: "Remove this content for everyone?",
      ban: `Permanently delete @${report.reported_user}'s whole account? This can't be undone.`,
    }[action];
    if (warn && !window.confirm(warn)) return;
    const res = await fetch(`/api/moderation/reports/${report.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    });
    if (res.ok) load();
    else setError("That action didn't go through.");
  };

  return (
    <div className="admin-reports">
      <h1>Reports</h1>
      <p className="safety-sub">Review within 24 hours. Remove content that breaks the guidelines and remove repeat or serious offenders.</p>
      <div className="safety-actions" style={{ justifyContent: "flex-start", marginBottom: 14 }}>
        {["open", "removed", "dismissed"].map((s) => (
          <button key={s} className={`btn ${status === s ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {error && <p className="auth-error">{error}</p>}
      {reports === null && <p className="safety-sub">Loading…</p>}
      {reports && reports.length === 0 && <p className="safety-sub">Nothing here. 🎉</p>}
      {(reports || []).map((r) => (
        <div className="admin-report" key={r.id}>
          <div className="admin-report-head">
            <span className="admin-chip">{r.target_type}</span>
            <span className="admin-chip">{r.reason.replace("_", " ")}</span>
            <span>
              by @{r.reporter || "deleted"} · about{" "}
              {r.reported_user
                ? <Link to={`/users/${r.reported_user_id}`}>@{r.reported_user}</Link>
                : "a deleted account"}
              {" · "}{new Date(r.created_at + "Z").toLocaleString()}
            </span>
          </div>
          {r.details && <p className="admin-report-text">&ldquo;{r.details}&rdquo;</p>}
          {r.preview?.gone
            ? <p className="safety-note">The reported content no longer exists.</p>
            : (
              <>
                {r.preview?.text && <p className="admin-report-text">{r.preview.text}</p>}
                {r.preview?.media && (isVideo(r.preview.media)
                  ? <video className="admin-report-media" src={r.preview.media} controls playsInline />
                  : <img className="admin-report-media" src={r.preview.media} alt="" />)}
              </>
            )}
          {r.status === "open" && (
            <div className="admin-report-actions">
              <button className="btn btn-ghost" onClick={() => act(r, "dismiss")}>Dismiss</button>
              {r.target_type !== "user" && !r.preview?.gone && (
                <button className="btn btn-primary" onClick={() => act(r, "remove")}>Remove content</button>
              )}
              {r.reported_user && (
                <button className="btn safety-danger" onClick={() => act(r, "ban")}>Delete account</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
