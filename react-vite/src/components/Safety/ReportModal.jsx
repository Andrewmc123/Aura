import { useState } from "react";
import { useModal } from "../../context/Modal";
import { reportContent, blockUser } from "../../utils/safety";
import "./Safety.css";

const REASONS = [
  ["spam", "Spam or scam"],
  ["harassment", "Bullying or harassment"],
  ["hate", "Hate speech"],
  ["nudity", "Nudity or sexual content"],
  ["violence", "Violence or threats"],
  ["self_harm", "Self-harm"],
  ["minor_safety", "Child safety"],
  ["illegal", "Illegal activity"],
  ["impersonation", "Pretending to be someone else"],
  ["other", "Something else"],
];

const LABELS = {
  post: "post", comment: "comment", message: "message",
  user: "account", story: "story", product: "listing",
};

/**
 * Report a post / comment / message / account. When `owner` is given the
 * confirmation screen also offers to block that person.
 */
export default function ReportModal({ targetType, targetId, owner, onBlocked }) {
  const { closeModal } = useModal();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!reason || busy) return;
    setBusy(true);
    setError("");
    const ok = await reportContent(targetType, targetId, reason, details.trim());
    setBusy(false);
    if (ok) setDone(true);
    else setError("We couldn't send that report. Please try again.");
  };

  const doBlock = async () => {
    if (!owner || busy) return;
    setBusy(true);
    const ok = await blockUser(owner.id);
    setBusy(false);
    if (ok) {
      setBlocked(true);
      onBlocked?.(owner);
    }
  };

  if (done) {
    return (
      <div className="safety-modal">
        <h2>Thanks for letting us know</h2>
        <p className="safety-sub">
          We review reports within 24 hours and remove anything that breaks the
          Community Guidelines.
        </p>
        {owner && !blocked && (
          <button className="btn btn-ghost safety-wide" onClick={doBlock} disabled={busy}>
            Block @{owner.username} too
          </button>
        )}
        {blocked && <p className="safety-note">@{owner.username} is blocked. You won&apos;t see each other anymore.</p>}
        <button className="btn btn-primary safety-wide" onClick={closeModal}>Done</button>
      </div>
    );
  }

  return (
    <form className="safety-modal" onSubmit={submit}>
      <h2>Report this {LABELS[targetType] || "content"}</h2>
      <p className="safety-sub">What&apos;s wrong with it? Your report is private.</p>
      <div className="safety-reasons">
        {REASONS.map(([key, label]) => (
          <label key={key} className={`safety-reason ${reason === key ? "on" : ""}`}>
            <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
            {label}
          </label>
        ))}
      </div>
      <textarea
        className="input safety-details"
        placeholder="Add details (optional)"
        maxLength={500}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {error && <p className="auth-error">{error}</p>}
      <div className="safety-actions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!reason || busy}>
          {busy ? "Sending…" : "Send report"}
        </button>
      </div>
    </form>
  );
}
