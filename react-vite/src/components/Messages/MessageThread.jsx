import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa6";
import { fetchThread, sendMessage } from "../../redux/messages";
import { useModal } from "../../context/Modal";
import UserSafetyMenu from "../Safety/UserSafetyMenu";
import ReportModal from "../Safety/ReportModal";
import "./Messages.css";

export default function MessageThread() {
  const { userId } = useParams();
  const uid = Number(userId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const me = useSelector((s) => s.session.user);
  const thread = useSelector((s) => s.messages.threads[uid]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const { setModalContent } = useModal();
  const endRef = useRef(null);

  useEffect(() => {
    dispatch(fetchThread(uid));
  }, [dispatch, uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  const submit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError("");
    setText("");
    const sent = await dispatch(sendMessage(uid, { content }));
    setSending(false);
    if (sent && sent.error) {
      setSendError(sent.error);
      setText(content);
    }
  };

  const other = thread?.user;
  const messages = thread?.messages || [];

  return (
    <div className="page thread-page">
      <header className="thread-head">
        <button className="thread-back" onClick={() => navigate("/messages")} aria-label="Back">
          <FaArrowLeft />
        </button>
        {other && (
          <Link to={`/users/${other.id}`} className="thread-peer">
            <img
              className="avatar"
              width={40}
              height={40}
              src={other.profile_img || `https://i.pravatar.cc/70?u=${other.id}`}
              alt=""
            />
            <span>@{other.username}</span>
          </Link>
        )}
        {other && (
          <span style={{ marginLeft: "auto" }}>
            <UserSafetyMenu
              user={other}
              className="thread-back"
              onChange={(blocked) => blocked && navigate("/messages")}
            />
          </span>
        )}
      </header>

      <div className="thread-body">
        {messages.length === 0 && <p className="thread-empty">Say hi 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === me?.id;
          return (
            <div key={m.id} className={`bubble-row ${mine ? "mine" : ""}`}>
              <div className="bubble">
                {m.content && <span>{m.content}</span>}
                {m.shared_post && (
                  <Link to={`/video/${m.shared_post.id}`} className="bubble-video">
                    {m.shared_post.image_url && (
                      <img src={m.shared_post.image_url} alt="shared video" />
                    )}
                    <span className="bubble-video-label">
                      📹 {(m.shared_post.body || "Video").slice(0, 40)}
                    </span>
                  </Link>
                )}
              </div>
              {!mine && (
                <button
                  className="bubble-report"
                  onClick={() => setModalContent(
                    <ReportModal
                      targetType="message"
                      targetId={m.id}
                      owner={other}
                      onBlocked={() => navigate("/messages")}
                    />
                  )}
                >
                  Report
                </button>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {sendError && <p className="auth-error" style={{ padding: "0 14px" }}>{sendError}</p>}
      <form className="thread-composer" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message @${other?.username || ""}`}
          aria-label="Message"
        />
        <button
          type="submit"
          className="thread-send"
          disabled={!text.trim() || sending}
          aria-label="Send"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
