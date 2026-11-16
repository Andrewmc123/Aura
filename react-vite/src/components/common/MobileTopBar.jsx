import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiMenu, FiBell, FiChevronLeft, FiUsers, FiShoppingBag, FiRadio, FiSettings, FiShield } from "react-icons/fi";
import "./MobileTopBar.css";

// Screen title for each route.
function titleFor(path, userId) {
  if (path === "/" || path === "/following") return "Discover";
  if (path.startsWith("/explore") || path.startsWith("/search") || path.startsWith("/tag/")) return "Search";
  if (path.startsWith("/users/")) return path === `/users/${userId}` ? "My Profile" : "Profile";
  if (path.startsWith("/messages")) return "Messages";
  if (path.startsWith("/inbox")) return "Activity";
  if (path.startsWith("/live")) return "Live";
  if (path.startsWith("/upload")) return "Create";
  if (path.startsWith("/network")) return "Community";
  if (path.startsWith("/shop")) return "Shop";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/vault")) return "Vault";
  if (path.startsWith("/privacy")) return "Privacy";
  if (path.startsWith("/terms")) return "Terms";
  if (path.startsWith("/support")) return "Support";
  if (path.startsWith("/admin")) return "Reports";
  return "Aura";
}

const ROOT_SCREENS = ["/", "/following", "/explore", "/messages", "/live", "/network", "/shop"];

// Mobile header: round glass button left (menu, or back on inner screens),
// centred screen title, round notifications button right.
export default function MobileTopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useSelector((s) => s.session.user);
  const unread = useSelector((s) => s.notifications?.unreadCount || 0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isRoot = ROOT_SCREENS.includes(pathname) || pathname === `/users/${user?.id}`;
  const title = titleFor(pathname, user?.id);

  return (
    <header className="mtopbar">
      {isRoot ? (
        <button type="button" className="round-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          <FiMenu />
        </button>
      ) : (
        <button type="button" className="round-btn" onClick={() => navigate(-1)} aria-label="Back">
          <FiChevronLeft />
        </button>
      )}

      <h1 className="mtopbar-title">{title}</h1>

      <Link to="/inbox" className="round-btn" aria-label="Notifications">
        <FiBell />
        {user && unread > 0 && <span className="round-btn-dot" />}
      </Link>

      {menuOpen && (
        <>
          <div className="mtopbar-overlay" onClick={() => setMenuOpen(false)} />
          <nav className="mtopbar-menu" onClick={() => setMenuOpen(false)}>
            <Link to="/live"><FiRadio /> Live now</Link>
            <Link to="/network"><FiUsers /> Community</Link>
            <Link to="/shop"><FiShoppingBag /> Shop</Link>
            <Link to="/settings"><FiSettings /> Settings</Link>
            {user?.is_admin && <Link to="/admin/reports"><FiShield /> Review reports</Link>}
          </nav>
        </>
      )}
    </header>
  );
}
