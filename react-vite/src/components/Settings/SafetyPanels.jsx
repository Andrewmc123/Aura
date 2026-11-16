// Settings sections for safety: the blocked-accounts list and the links to
// the legal + support pages.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlocked, unblockUser } from '../../utils/safety';
import '../Safety/Safety.css';

export function BlockedPanel() {
  const [blocked, setBlocked] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchBlocked().then((list) => alive && setBlocked(list));
    return () => { alive = false; };
  }, []);

  const unblock = async (id) => {
    if (await unblockUser(id)) setBlocked((prev) => (prev || []).filter((u) => u.id !== id));
  };

  return (
    <section className="settings-section">
      <div className="settings-section-title">Blocked accounts</div>
      <div className="settings-row" style={{ display: 'block' }}>
        {blocked === null && <div className="settings-row-sub">Loading…</div>}
        {blocked && blocked.length === 0 && (
          <div className="settings-row-sub">
            You haven&apos;t blocked anyone. To block someone, open their profile and tap the ⋯ menu.
          </div>
        )}
        {(blocked || []).map((u) => (
          <div className="blocked-row" key={u.id}>
            <img src={u.profile_img || `https://i.pravatar.cc/70?u=${u.id}`} alt="" />
            <span>@{u.username}</span>
            <button type="button" className="settings-btn" onClick={() => unblock(u.id)}>Unblock</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutPanel() {
  const links = [
    ['/terms', 'Terms & Community Guidelines', 'The rules everyone agrees to'],
    ['/privacy', 'Privacy Policy', 'What we collect and how it is used'],
    ['/support', 'Help & Support', 'Get help, report a problem'],
  ];
  return (
    <section className="settings-section">
      <div className="settings-section-title">About</div>
      {links.map(([to, label, sub]) => (
        <Link key={to} className="settings-row settings-link" to={to}>
          <div className="settings-row-main">
            <div className="settings-row-label">{label}</div>
            <div className="settings-row-sub">{sub}</div>
          </div>
        </Link>
      ))}
    </section>
  );
}
