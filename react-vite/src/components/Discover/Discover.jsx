// Aura V2 Home — "Discover": a story row along the top, For you / Following
// chips, and a scrolling list of rounded post cards. Tapping a card opens the
// full-screen player (/video/:id).
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaShareNodes, FaRegCommentDots, FaPlay, FaPlus } from "react-icons/fa6";
import { fetchFeedPage, selectFeedPosts, selectFeed } from "../../redux/posts";
import AuraLikeButton from "../Feed/AuraLikeButton";
import { thunkFetchUserStories } from "../../redux/stories";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import StoryComposer from "../Stories/StoryComposer";
import StoryViewer from "../Stories/StoryViewer";
import CommentsDrawer from "../Feed/CommentsDrawer";
import ShareSheet from "../Feed/ShareSheet";
import AuraCheck from "../common/AuraCheck";
import { compact } from "../../utils/format";
import "./Discover.css";

const avatarOf = (u) => u?.profile_img || `https://i.pravatar.cc/120?u=${u?.id}`;

function StoryRow() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [rail, setRail] = useState({ me: null, users: [] });

  const load = () =>
    fetch("/api/stories/rail", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRail(d))
      .catch(() => {});

  useEffect(() => { load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const people = [...(rail.me?.has_story ? [rail.me] : []), ...rail.users];

  const open = async (u) => {
    const stories = await dispatch(thunkFetchUserStories(u.id));
    if (stories && stories.length) {
      setModalContent(
        <StoryViewer
          key={u.id}
          stories={stories}
          canDelete={u.id === user?.id}
          onChanged={load}
          people={people}
          onPickPerson={open}
        />
      );
    }
  };

  const add = () => {
    if (!user) return setModalContent(<LoginFormModal />);
    setModalContent(<StoryComposer onPosted={load} />);
  };

  return (
    <div className="story-row" role="list">
      <button type="button" className="story-chip" onClick={add} role="listitem">
        <span className="story-add"><FaPlus /></span>
        <span className="story-name">Add Story</span>
      </button>
      {rail.me?.has_story && (
        <button type="button" className="story-chip" onClick={() => open(rail.me)} role="listitem">
          <span className="story-ring"><img src={avatarOf(rail.me)} alt="" /></span>
          <span className="story-name">Your story</span>
        </button>
      )}
      {rail.users.map((u) => (
        <button type="button" key={u.id} className="story-chip" onClick={() => open(u)} role="listitem">
          <span className="story-ring"><img src={avatarOf(u)} alt="" /></span>
          <span className="story-name">{u.username}</span>
        </button>
      ))}
    </div>
  );
}

function PostCard({ post, onComments }) {
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const videoRef = useRef(null);
  const cardRef = useRef(null);

  const isVideo = post.media_type === "video" && post.video_url;
  const poster = post.image_url || (Array.isArray(post.images) ? post.images[0] : null);

  // muted preview plays only while the card is on screen
  useEffect(() => {
    if (!isVideo || !cardRef.current) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      const v = videoRef.current;
      if (!v) return;
      if (entry.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.6 });
    io.observe(cardRef.current);
    return () => io.disconnect();
  }, [isVideo]);

  return (
    <article className="pcard" ref={cardRef} onClick={() => navigate(`/video/${post.id}`)}>
      <div className="pcard-media">
        {isVideo ? (
          <video ref={videoRef} src={`${post.video_url}#t=0.1`} poster={poster || undefined} muted loop playsInline preload="metadata" />
        ) : poster ? (
          <img src={poster} alt="" loading="lazy" />
        ) : (
          <div className="pcard-textonly">{post.body}</div>
        )}
        {isVideo && <span className="pcard-play"><FaPlay /></span>}
      </div>

      <div className="pcard-shade" />

      <div className="pcard-rail" onClick={(e) => e.stopPropagation()}>
        <AuraLikeButton post={post} size={30} className="pcard-aura" />
        <span className="pcard-share-wrap">
          <button type="button" onClick={(e) => { e.stopPropagation(); setShareOpen((v) => !v); }} aria-label="Share">
            <FaShareNodes />
            <span>{compact(post.shares)}</span>
          </button>
          {shareOpen && <ShareSheet post={post} onClose={() => setShareOpen(false)} />}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onComments(post.id); }} aria-label="Comments">
          <FaRegCommentDots />
          <span>{compact(post.comment_count)}</span>
        </button>
      </div>

      <div className="pcard-info">
        <Link to={`/users/${post.user?.id}`} className="pcard-user" onClick={(e) => e.stopPropagation()}>
          <img src={avatarOf(post.user)} alt="" />
          <span>
            <strong>
              {[post.user?.firstname, post.user?.lastname].filter(Boolean).join(" ") || post.user?.username}
              <AuraCheck tierKey={post.user?.tier_key} size={13} />
            </strong>
            <em>@{post.user?.username}</em>
          </span>
        </Link>
        {post.body && (isVideo || poster) && <p className="pcard-caption">{post.body}</p>}
      </div>
    </article>
  );
}

export default function Discover() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [tab, setTab] = useState("foryou");
  const posts = useSelector(selectFeedPosts(tab));
  const feed = useSelector(selectFeed(tab));
  const [commentsId, setCommentsId] = useState(null);
  const sentinel = useRef(null);

  const needsAuth = tab === "following" && !user;

  useEffect(() => {
    if (!needsAuth && feed.ids.length === 0 && feed.hasMore && !feed.loading) {
      dispatch(fetchFeedPage(tab, 1));
    }
  }, [dispatch, tab, needsAuth, feed.ids.length, feed.hasMore, feed.loading]);

  // load the next page when the end of the list comes into view
  useEffect(() => {
    if (!sentinel.current) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !needsAuth && feed.hasMore && !feed.loading && feed.ids.length) {
        dispatch(fetchFeedPage(tab, feed.page + 1));
      }
    }, { rootMargin: "600px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [dispatch, tab, needsAuth, feed.hasMore, feed.loading, feed.page, feed.ids.length]);

  const commentsPost = posts.find((p) => p.id === commentsId);

  return (
    <div className="discover">
      <StoryRow />

      <div className="discover-chips" role="tablist">
        {[["foryou", "Aura Worldwide"], ["following", "Following"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`dchip ${tab === key ? "on" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
        <Link to="/live" className="dchip dchip-live"><span className="live-dot" /> Live</Link>
      </div>

      {needsAuth ? (
        <div className="discover-empty">
          <h2>See posts from people you follow</h2>
          <p>Log in to build your Following feed.</p>
          <button type="button" className="btn btn-primary" onClick={() => setModalContent(<LoginFormModal />)}>Log in</button>
        </div>
      ) : (
        <div className="pcard-list">
          {posts.map((p) => <PostCard key={p.id} post={p} onComments={setCommentsId} />)}
          {feed.loading && <div className="feed-spinner discover-spinner" aria-label="Loading" />}
          {!feed.loading && posts.length === 0 && (
            <div className="discover-empty">
              <h2>It&apos;s quiet in here 🌙</h2>
              <p>Follow creators to fill this feed.</p>
              <Link to="/explore" className="btn btn-primary">Find people</Link>
            </div>
          )}
          <div ref={sentinel} />
        </div>
      )}

      {commentsPost && <CommentsDrawer post={commentsPost} onClose={() => setCommentsId(null)} />}
    </div>
  );
}
