import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaXmark, FaTrash, FaHeart, FaRegHeart, FaRegCommentDots, FaPaperPlane } from "react-icons/fa6";
import { sendMessage } from "../../redux/messages";
import { useModal } from "../../context/Modal";
import { thunkDeleteStory } from "../../redux/stories";
import { timeAgo } from "../../utils/format";
import "./StoryViewer.css";

const IMAGE_MS = 5000; // how long each photo story shows before advancing

// Full-screen story reel with segmented progress bars, tap to advance / go back,
// auto-advance for photos, and (own stories) a delete button.
// `people` (optional) is the story row's list of accounts; it shows as a
// strip of faces along the bottom so you can jump between people.
export default function StoryViewer({ stories = [], startIndex = 0, canDelete = false, onChanged, people = [], onPickPerson }) {
  const { closeModal } = useModal();
  const dispatch = useDispatch();
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const raf = useRef(null);
  const startedAt = useRef(0);
  const me = useSelector((s) => s.session.user);
  const [reply, setReply] = useState("");
  const [paused, setPaused] = useState(false);
  const [sent, setSent] = useState("");
  const [liked, setLiked] = useState(false);

  const current = stories[idx];

  const next = () => {
    setProgress(0);
    if (idx < stories.length - 1) setIdx((i) => i + 1);
    else closeModal();
  };
  const prev = () => {
    setProgress(0);
    if (idx > 0) setIdx((i) => i - 1);
  };

  // auto-advance photos; videos advance on their own `ended` event
  useEffect(() => {
    if (!current || current.media_type === "video" || paused) return undefined;
    startedAt.current = Date.now() - progress * IMAGE_MS;
    const tick = () => {
      const p = Math.min(1, (Date.now() - startedAt.current) / IMAGE_MS);
      setProgress(p);
      if (p >= 1) next();
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.id, paused]);

  useEffect(() => { setLiked(false); setSent(""); }, [idx]);

  if (!current) {
    closeModal();
    return null;
  }

  const ownerId = current.user?.id || current.user_id;
  const isMine = me && ownerId === me.id;

  const sendReply = async (text) => {
    if (!me || !text.trim()) return;
    const res = await dispatch(sendMessage(ownerId, { content: `Replied to your story: ${text.trim()}` }));
    setSent(res && !res.error ? "Sent" : (res?.error || "Couldn't send"));
    setReply("");
    setPaused(false);
  };

  const like = () => {
    if (!me || liked) return;
    setLiked(true);
    dispatch(sendMessage(ownerId, { content: "❤️ Loved your story" }));
  };

  const del = async () => {
    if (!window.confirm("Delete this story?")) return;
    await dispatch(thunkDeleteStory(current.id));
    onChanged && onChanged();
    closeModal();
  };

  return (
    <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
      <div className="story-progress-row">
        {stories.map((s, i) => (
          <div key={s.id} className="story-progress-track">
            <div
              className="story-progress-fill"
              style={{ width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      <div className="story-viewer-head">
        <div className="story-viewer-user">
          <img
            className="avatar"
            style={{ width: 32, height: 32 }}
            src={current.user?.profile_img || `https://i.pravatar.cc/60?u=${current.user_id}`}
            alt=""
          />
          <span className="story-viewer-name">@{current.user?.username}</span>
          <span className="story-viewer-time">{timeAgo(current.created_at)}</span>
        </div>
        <div className="story-viewer-actions">
          {canDelete && (
            <button className="story-icon-btn" onClick={del} aria-label="Delete story"><FaTrash /></button>
          )}
          <button className="story-icon-btn" onClick={closeModal} aria-label="Close"><FaXmark /></button>
        </div>
      </div>

      <div className="story-stage">
        {current.media_type === "video" ? (
          <video src={current.media_url} className="story-media" autoPlay playsInline onEnded={next} />
        ) : (
          <img src={current.media_url} className="story-media" alt={current.caption || "story"} />
        )}
        {current.caption && <div className="story-caption-overlay">{current.caption}</div>}
        <button className="story-tap story-tap-prev" onClick={prev} aria-label="Previous" />
        <button className="story-tap story-tap-next" onClick={next} aria-label="Next" />
      </div>

      <div className="story-bottom">
        {people.length > 1 && (
          <div className="story-people">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`story-person ${p.id === ownerId ? "on" : ""}`}
                onClick={() => p.id !== ownerId && onPickPerson && onPickPerson(p)}
              >
                <img src={p.profile_img || `https://i.pravatar.cc/90?u=${p.id}`} alt="" />
                <span>{p.username}</span>
              </button>
            ))}
          </div>
        )}

        {me && !isMine && (
          <form className="story-reply" onSubmit={(e) => { e.preventDefault(); sendReply(reply); }}>
            <span className="story-reply-icon"><FaRegCommentDots /></span>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => !reply && setPaused(false)}
              placeholder={sent || "Add a comment"}
              aria-label="Reply to this story"
              maxLength={300}
            />
            {reply ? (
              <button type="submit" className="story-reply-btn" aria-label="Send"><FaPaperPlane /></button>
            ) : (
              <button type="button" className={`story-reply-btn ${liked ? "liked" : ""}`} onClick={like} aria-label="Like story">
                {liked ? <FaHeart /> : <FaRegHeart />}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
