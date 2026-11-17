import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaFire, FaHashtag, FaMusic, FaMagnifyingGlass, FaPlus, FaCheck, FaXmark, FaSliders, FaEye, FaHeart, FaRegCommentDots } from "react-icons/fa6";
import { fetchExplore, selectCollection } from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import VideoGrid from "../VideoGrid";
import { compact } from "../../utils/format";
import "./Explore.css";

const CATEGORY_LABELS = {
  all: "All",
  dance: "Dance 🕺",
  comedy: "Comedy 😂",
  animals: "Animals 🐶",
  food: "Food 🍜",
  sports: "Sports 🏀",
  gaming: "Gaming 🎮",
  music: "Music 🎵",
  films: "Films 🎬",
  travel: "Travel ✈️",
};

// Follow / Following pill used on each creator result.
function FollowButton({ targetId }) {
  const dispatch = useDispatch();
  const sessionUser = useSelector((s) => s.session.user);
  const isFollowing = useSelector(selectIsFollowing(targetId));
  const { setModalContent } = useModal();

  if (sessionUser && sessionUser.id === targetId) return null;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionUser) return setModalContent(<LoginFormModal />);
    dispatch(thunkToggleFollow(targetId, isFollowing));
  };

  return (
    <button
      className={`explore-follow ${isFollowing ? "following" : ""}`}
      onClick={onClick}
    >
      {isFollowing ? (<><FaCheck /> Following</>) : (<><FaPlus /> Follow</>)}
    </button>
  );
}

// Horizontal row of big rounded tiles: live streams first (pink "Live"
// badge), then the most-watched posts as "Premiere" picks.
function FeaturedRow({ lives, posts }) {
  const tiles = [
    ...lives.slice(0, 6).map((s) => ({
      key: `live-${s.id}`, to: `/live/${s.id}`, badge: "Live", live: true,
      img: s.host?.profile_img, views: s.viewer_count, title: s.title || `@${s.host?.username}`,
    })),
    ...posts.slice(0, 6).map((p) => ({
      key: `post-${p.id}`, to: `/video/${p.id}`, badge: "Premiere", live: false,
      img: p.image_url, video: !p.image_url && p.media_type === "video" ? p.video_url : null,
      views: p.views, likes: p.like_count, comments: p.comment_count,
    })),
  ];
  if (!tiles.length) return null;
  return (
    <div className="xfeat-row">
      {tiles.map((t) => (
        <Link key={t.key} to={t.to} className="xfeat-tile">
          {t.video
            ? <video src={`${t.video}#t=0.1`} muted playsInline preload="metadata" />
            : t.img && <img src={t.img} alt="" loading="lazy" />}
          <span className="xfeat-shade" />
          <span className={`xfeat-badge ${t.live ? "live" : ""}`}>{t.badge}</span>
          <span className="xfeat-views"><FaEye /> {compact(t.views || 0)}</span>
          <span className="xfeat-foot">
            {t.live ? (
              <span className="xfeat-title">{t.title}</span>
            ) : (
              <>
                <span><FaHeart /> {compact(t.likes || 0)}</span>
                <span><FaRegCommentDots /> {compact(t.comments || 0)}</span>
              </>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}

// One large "Trending" card for the top post.
function TrendingHero({ post }) {
  if (!post) return null;
  const isVideo = post.media_type === "video" && post.video_url;
  return (
    <Link to={`/video/${post.id}`} className="xtrend">
      {isVideo
        ? <video src={`${post.video_url}#t=0.1`} poster={post.image_url || undefined} muted playsInline preload="metadata" />
        : post.image_url && <img src={post.image_url} alt="" loading="lazy" />}
      <span className="xfeat-shade" />
      <span className="xtrend-rail">
        <span><FaHeart /> {compact(post.like_count)}</span>
        <span><FaRegCommentDots /> {compact(post.comment_count)}</span>
        <span><FaEye /> {compact(post.views)}</span>
      </span>
      <span className="xtrend-user">
        <img src={post.user?.profile_img || `https://i.pravatar.cc/80?u=${post.user?.id}`} alt="" />
        <span>
          <strong>{[post.user?.firstname, post.user?.lastname].filter(Boolean).join(" ") || post.user?.username}</strong>
          <em>@{post.user?.username}</em>
        </span>
      </span>
    </Link>
  );
}

export default function Explore() {
  const dispatch = useDispatch();
  const [category, setCategory] = useState("all");
  const [trending, setTrending] = useState(null);
  const [lives, setLives] = useState([]);
  const posts = useSelector(selectCollection(`explore:${category}`));

  // ---- user / content search ----
  const [query, setQuery] = useState("");
  const [showCats, setShowCats] = useState(false);
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [searching, setSearching] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    dispatch(fetchExplore(category));
  }, [dispatch, category]);

  useEffect(() => {
    fetch("/api/live/active")
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((d) => setLives(d.sessions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/discover/trending")
      .then((r) => r.json())
      .then(setTrending)
      .catch(() => {});
  }, []);

  // debounced search as you type
  useEffect(() => {
    if (!trimmed) {
      setResults({ users: [], posts: [], hashtags: [] });
      setSearching(false);
      return;
    }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/discover/search?q=${encodeURIComponent(trimmed)}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (!alive) return;
          setResults({ users: data.users || [], posts: data.posts || [], hashtags: data.hashtags || [] });
          setSearching(false);
        })
        .catch(() => alive && setSearching(false));
    }, 280);
    return () => { alive = false; clearTimeout(t); };
  }, [trimmed]);

  return (
    <div className="page explore-page">
      <header className="explore-head">
        <h1>Search</h1>
      </header>

      {/* search bar — find users by name and add them */}
      <div className="explore-search">
        <FaMagnifyingGlass className="explore-search-icon" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Aura"
          aria-label="Search Aura"
        />
        {query && (
          <button className="explore-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
            <FaXmark />
          </button>
        )}
        <button
          type="button"
          className={`explore-filter ${showCats ? "on" : ""}`}
          onClick={() => setShowCats((v) => !v)}
          aria-label="Filter by category"
          aria-pressed={showCats}
        >
          <FaSliders />
        </button>
      </div>

      {trimmed ? (
        /* ---------- search results ---------- */
        <div className="explore-results">
          {searching && <div className="feed-spinner explore-spinner" />}

          {!searching && results.users.length > 0 && (
            <section className="explore-result-section">
              <h2>Creators</h2>
              <div className="explore-users">
                {results.users.map((u) => (
                  <Link to={`/users/${u.id}`} key={u.id} className="explore-user">
                    <img
                      className="avatar"
                      width={48}
                      height={48}
                      src={u.profile_img || `https://i.pravatar.cc/80?u=${u.id}`}
                      alt=""
                    />
                    <div className="explore-user-meta">
                      <strong>@{u.username}</strong>
                      <span>{u.firstname} {u.lastname} · {compact(u.followers_count)} followers</span>
                    </div>
                    <FollowButton targetId={u.id} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!searching && results.hashtags.length > 0 && (
            <section className="explore-result-section">
              <h2>Hashtags</h2>
              <div className="explore-tag-row">
                {results.hashtags.map((h) => (
                  <Link to={`/tag/${h.tag}`} key={h.tag} className="chip">
                    <FaHashtag /> {h.tag} · {h.count}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!searching && (
            <section className="explore-result-section">
              <h2>Videos</h2>
              <VideoGrid posts={results.posts} emptyText={`No videos matching “${trimmed}”`} />
            </section>
          )}

          {!searching && results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0 && (
            <p className="text-dim explore-empty">No results for “{trimmed}”. Try another name or hashtag.</p>
          )}
        </div>
      ) : (
        /* ---------- default explore ---------- */
        <>
          {trending && trending.hashtags?.length > 0 && (
            <div className="explore-trend-chips">
              {trending.hashtags.slice(0, 6).map((h, i) => (
                <Link to={`/tag/${h.tag}`} key={h.tag} className={`chip ${i === 0 ? "chip-hot" : ""}`}>
                  {i === 0 ? <FaFire /> : <FaHashtag />} {h.tag}
                </Link>
              ))}
            </div>
          )}

          {showCats && (
          <div className="explore-cats">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`chip ${category === key ? "active" : ""}`}
                onClick={() => setCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>
          )}

          {category === "all" && <FeaturedRow lives={lives} posts={posts} />}

          {category === "all" && posts[0] && (
            <>
              <h2 className="xsection-title">Trending</h2>
              <TrendingHero post={posts[0]} />
            </>
          )}

          <h2 className="xsection-title">{category === "all" ? "More to explore" : CATEGORY_LABELS[category]}</h2>
          <div className="xmosaic">
            <VideoGrid posts={category === "all" ? posts.slice(1) : posts} emptyText="Nothing in this category yet — be the first to post!" />
          </div>

          {trending && trending.sounds?.length > 0 && (
            <section className="explore-sounds">
              <h2><FaMusic /> Trending sounds</h2>
              <div className="explore-sound-list">
                {trending.sounds.map((s) => (
                  <div key={s.name} className="sound-pill">
                    <span className="sound-disc spin">♪</span>
                    <span className="sound-name">{s.name}</span>
                    <span className="sound-count">{s.count} videos</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
