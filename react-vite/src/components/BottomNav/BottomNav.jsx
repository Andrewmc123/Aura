import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiHome, FiSearch, FiPlus, FiMessageCircle, FiUser } from "react-icons/fi";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import "./BottomNav.css";

// Floating glass nav: five icons in a rounded pill that hovers above the
// content, with a glowing purple create button in the middle.
export default function BottomNav() {
  const user = useSelector((s) => s.session.user);
  const unread = useSelector((s) => s.messages?.unreadTotal || 0);
  const { setModalContent } = useModal();

  const requireLogin = (e) => {
    if (!user) {
      e.preventDefault();
      setModalContent(<LoginFormModal />);
    }
  };

  const item = ({ isActive }) => `fnav-item ${isActive ? "active" : ""}`;

  return (
    <nav className="fnav" aria-label="Main">
      <div className="fnav-pill">
        <NavLink to="/" end className={item} aria-label="Home"><FiHome /></NavLink>
        <NavLink to="/explore" className={item} aria-label="Search and explore"><FiSearch /></NavLink>
        <NavLink to="/upload" onClick={requireLogin} className="fnav-create" aria-label="Create">
          <FiPlus />
        </NavLink>
        <NavLink to="/messages" onClick={requireLogin} className={item} aria-label="Messages">
          <span className="fnav-badge-wrap">
            <FiMessageCircle />
            {user && unread > 0 && <em>{unread > 9 ? "9+" : unread}</em>}
          </span>
        </NavLink>
        {user ? (
          <NavLink to={`/users/${user.id}`} className={item} aria-label="Profile"><FiUser /></NavLink>
        ) : (
          <button type="button" className="fnav-item" onClick={() => setModalContent(<LoginFormModal />)} aria-label="Log in">
            <FiUser />
          </button>
        )}
      </div>
    </nav>
  );
}
