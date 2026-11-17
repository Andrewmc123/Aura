import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkToggleLike } from "../../redux/posts";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import AuraOrb from "../common/AuraOrb";
import { compact } from "../../utils/format";
import "./VideoCard.css";

// The Aura reaction ("like"): the energy orb that pops, glows and throws a
// ring of stars. Shared by the full-screen player and the Discover cards so
// both behave exactly the same.
export default function AuraLikeButton({ post, size = 36, className = "" }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [pop, setPop] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = (e) => {
    e.stopPropagation();
    if (!user) return setModalContent(<LoginFormModal />);
    setPop(true);
    setBurstKey((k) => k + 1); // remount the star ring so the animation restarts
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPop(false), 2300);
    dispatch(thunkToggleLike(post));
  };

  return (
    <button
      type="button"
      className={`rail-btn aura-btn ${post.liked ? "aura-on" : ""} ${pop ? "pop" : ""} ${className}`}
      onClick={onClick}
      aria-label={post.liked ? "Remove aura" : "Give aura"}
      aria-pressed={!!post.liked}
    >
      <span className="rail-icon aura-orb-icon">
        <AuraOrb size={size} className="rail-aura-orb" />
        <span className="aura-burst" aria-hidden="true" />
        <span className="aura-burst aura-burst-2" aria-hidden="true" />
        {pop && (
          <span className="aura-stars" key={burstKey} aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <i key={i} className="aura-star" style={{ "--a": `${i * 30}deg`, "--delay": `${i * 28}ms` }} />
            ))}
          </span>
        )}
      </span>
      <span className="rail-count">{compact(post.like_count)}</span>
      <span className="rail-tag">aura</span>
    </button>
  );
}
