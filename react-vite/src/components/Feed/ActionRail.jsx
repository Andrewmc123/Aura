import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaEye, FaCommentDots, FaBookmark, FaShare, FaPlus, FaCheck, FaEllipsisVertical, FaTrash, FaFlag, FaBan,
} from "react-icons/fa6";
import { thunkToggleBookmark, thunkDeletePost } from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import ShareSheet from "./ShareSheet";
import AuraLikeButton from "./AuraLikeButton";
import VerifiedAvatar from "../common/VerifiedAvatar";
import { compact } from "../../utils/format";
import { blockUser } from "../../utils/safety";
import ReportModal from "../Safety/ReportModal";

export default function ActionRail({ post, onOpenComments }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const isFollowing = useSelector(selectIsFollowing(post.user?.id));
  const { setModalContent } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const onDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    await dispatch(thunkDeletePost(post.id));
    // if we're on the standalone video page, the post is gone — head home
    if (location.pathname.startsWith("/video/")) navigate("/");
  };

  // After a block the person's posts are filtered out by the server, so a
  // fresh load is the simplest way to clear them from every feed at once.
  const afterBlock = () => {
    if (location.pathname.startsWith("/video/")) navigate("/");
    else window.location.reload();
  };

  const onReport = () => {
    setMenuOpen(false);
    if (!user) return setModalContent(<LoginFormModal />);
    setModalContent(
      <ReportModal targetType="post" targetId={post.id} owner={post.user} onBlocked={afterBlock} />
    );
  };

  const onBlock = async () => {
    setMenuOpen(false);
    if (!user) return setModalContent(<LoginFormModal />);
    const sure = window.confirm(
      `Block @${post.user?.username}? You won't see each other's posts, comments or messages.`
    );
    if (sure && (await blockUser(post.user.id))) afterBlock();
  };

  const gate = (fn) => () => {
    if (!user) {
      setModalContent(<LoginFormModal />);
      return;
    }
    fn();
  };

  const onBookmark = gate(() => dispatch(thunkToggleBookmark(post)));

  const onFollow = gate(() => dispatch(thunkToggleFollow(post.user.id, isFollowing)));

  const isOwnPost = user && post.user && user.id === post.user.id;

  return (
    <aside className="action-rail" onClick={(e) => e.stopPropagation()}>
      {post.user && (
        <div className="rail-more-wrap">
          <button className="rail-btn rail-more-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="More options">
            <span className="rail-icon"><FaEllipsisVertical /></span>
          </button>
          {menuOpen && (
            <>
              <div className="rail-more-overlay" onClick={() => setMenuOpen(false)} />
              <div className="rail-more-menu">
                {isOwnPost ? (
                  <button className="rail-more-item danger" onClick={onDelete}>
                    <FaTrash /> Delete post
                  </button>
                ) : (
                  <>
                    <button className="rail-more-item" onClick={onReport}>
                      <FaFlag /> Report
                    </button>
                    <button className="rail-more-item danger" onClick={onBlock}>
                      <FaBan /> Block @{post.user.username}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="rail-avatar-wrap">
        <Link to={`/users/${post.user?.id}`}>
          <VerifiedAvatar user={post.user} size={48} className="rail-avatar" />
        </Link>
        {!isOwnPost && (
          <button
            className={`rail-follow ${isFollowing ? "following" : ""}`}
            onClick={onFollow}
            aria-label={isFollowing ? "Following" : "Follow"}
          >
            {isFollowing ? <FaCheck /> : <FaPlus />}
          </button>
        )}
      </div>

      <AuraLikeButton post={post} />

      <button className="rail-btn" onClick={onOpenComments} aria-label="Comments">
        <span className="rail-icon"><FaCommentDots /></span>
        <span className="rail-count">{compact(post.comment_count)}</span>
      </button>

      <button className={`rail-btn ${post.bookmarked ? "bookmarked" : ""}`} onClick={onBookmark} aria-label="Save">
        <span className="rail-icon"><FaBookmark /></span>
        <span className="rail-count">{compact(post.bookmark_count)}</span>
      </button>

      <div className="rail-share-wrap">
        <button className="rail-btn" onClick={() => setShareOpen(!shareOpen)} aria-label="Share">
          <span className="rail-icon"><FaShare /></span>
          <span className="rail-count">{compact(post.shares)}</span>
        </button>
        {shareOpen && <ShareSheet post={post} onClose={() => setShareOpen(false)} />}
      </div>

      <div className="rail-views" aria-label={`${compact(post.views)} views`}><FaEye /><span>{compact(post.views)}</span><span className="rail-views-label">views</span></div>
    </aside>
  );
}
