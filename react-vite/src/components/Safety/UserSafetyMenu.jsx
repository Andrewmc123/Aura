import { useState } from "react";
import { FaEllipsis, FaFlag, FaBan } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import { blockUser, unblockUser } from "../../utils/safety";
import ReportModal from "./ReportModal";
import "./Safety.css";

/**
 * The "…" menu shown next to another person: report them, block or unblock
 * them. `onChange(blocked)` fires after a block or unblock goes through.
 */
export default function UserSafetyMenu({ user, blocked = false, onChange, className = "btn btn-ghost" }) {
  const { setModalContent } = useModal();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const report = () => {
    setOpen(false);
    setModalContent(
      <ReportModal targetType="user" targetId={user.id} owner={blocked ? null : user} onBlocked={() => onChange?.(true)} />
    );
  };

  const toggleBlock = async () => {
    setOpen(false);
    if (blocked) {
      if (await unblockUser(user.id)) onChange?.(false);
      return;
    }
    const sure = window.confirm(
      `Block @${user.username}? You won't see each other's posts, comments or messages, and they won't be told.`
    );
    if (sure && (await blockUser(user.id))) onChange?.(true);
  };

  return (
    <span className="safety-menu-wrap">
      <button type="button" className={className} onClick={() => setOpen((v) => !v)} aria-label="More options" title="More options">
        <FaEllipsis />
      </button>
      {open && (
        <>
          <div className="safety-menu-overlay" onClick={() => setOpen(false)} />
          <div className="safety-menu">
            <button type="button" onClick={report}><FaFlag /> Report</button>
            <button type="button" className="danger" onClick={toggleBlock}>
              <FaBan /> {blocked ? "Unblock" : "Block"} @{user.username}
            </button>
          </div>
        </>
      )}
    </span>
  );
}
