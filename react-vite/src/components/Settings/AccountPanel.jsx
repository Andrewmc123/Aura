import { useState } from 'react';
import { Link } from 'react-router-dom';

function formatMemberSince(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AccountPanel({ user, onLogout, onEditProfile, onDeleteAccount }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onLogout?.();
    } finally {
      setBusy(false);
    }
  };

  const openDelete = () => {
    setConfirming(true);
    setConfirmText('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (deleting || confirmText.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    const error = await onDeleteAccount?.();
    if (error) {
      setDeleteError(error.server || 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
    // on success the parent signs us out and leaves this page
  };

  return (
    <section className="settings-section">
      <div className="settings-section-title">Account</div>

      <div className="settings-row settings-link" role="button" tabIndex={0} onClick={onEditProfile}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditProfile?.(); } }}>
        <div className="settings-row-main">
          <div className="settings-row-label">Edit profile</div>
          <div className="settings-row-sub">Photo, username &amp; bio</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Email</div>
          <div className="settings-row-sub">{user.email || '—'}</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Username</div>
          <div className="settings-row-sub">@{user.username}</div>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-main">
          <div className="settings-row-label">Member since</div>
          <div className="settings-row-sub">{formatMemberSince(user.created_at)}</div>
        </div>
      </div>

      {user.is_admin && (
        <Link className="settings-row settings-link" to="/admin/reports">
          <div className="settings-row-main">
            <div className="settings-row-label">Review reports</div>
            <div className="settings-row-sub">Moderation queue</div>
          </div>
        </Link>
      )}

      {!confirming ? (
        <div className="settings-row settings-link" role="button" tabIndex={0} onClick={openDelete}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDelete(); } }}>
          <div className="settings-row-main">
            <div className="settings-row-label">Delete account</div>
            <div className="settings-row-sub">Permanently remove your account</div>
          </div>
        </div>
      ) : (
        <div className="settings-row" style={{ display: 'block' }}>
          <div className="settings-row-label">Delete your account?</div>
          <div className="settings-row-sub" style={{ margin: '6px 0 10px' }}>
            This permanently deletes your profile, videos, stories, comments, messages,
            followers and Bolts. It can&apos;t be undone. Type <strong>DELETE</strong> to confirm.
          </div>
          <input
            className="input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            autoCapitalize="characters"
            autoComplete="off"
          />
          {deleteError && <p className="auth-error">{deleteError}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" className="settings-btn" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </button>
            <button
              type="button"
              className="settings-btn danger"
              onClick={handleDelete}
              disabled={deleting || confirmText.trim().toUpperCase() !== 'DELETE'}
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      )}

      <div className="settings-row-control">
        <button type="button" className="settings-btn danger" onClick={handleLogout} disabled={busy}>
          {busy ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </section>
  );
}
