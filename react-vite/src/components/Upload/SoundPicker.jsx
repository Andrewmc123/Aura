import { useMemo, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { compact } from "../../utils/format";

/**
 * Browsable sound list: Trending (what people are using), From videos
 * (original audio you can reuse), All, and one tab per genre — plus search.
 *
 * `catalog` is the /api/discover/sounds response.
 */
export default function SoundPicker({ catalog, pickedId, onPick, className = "" }) {
  const [tab, setTab] = useState("Trending");
  const [query, setQuery] = useState("");

  const sounds = useMemo(() => catalog?.sounds || [], [catalog]);
  const trending = useMemo(() => catalog?.trending || [], [catalog]);
  const originals = useMemo(() => catalog?.originals || [], [catalog]);
  const genres = catalog?.genres || [];

  const tabs = ["Trending", ...(originals.length ? ["From videos"] : []), "All", ...genres];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      const seen = new Set();
      return [...sounds, ...originals].filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return `${s.name} ${s.artist} ${s.genre}`.toLowerCase().includes(q);
      });
    }
    if (tab === "Trending") return trending;
    if (tab === "From videos") return originals;
    if (tab === "All") return sounds;
    return sounds.filter((s) => s.genre === tab);
  }, [query, tab, sounds, trending, originals]);

  return (
    <div className={`sound-picker ${className}`}>
      <label className="sound-search">
        <FaMagnifyingGlass />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sounds"
          aria-label="Search sounds"
        />
      </label>

      {!query && (
        <div className="sound-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`sound-tab ${tab === t ? "on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "Trending" ? "🔥 Trending" : t}
            </button>
          ))}
        </div>
      )}

      <div className="sound-list">
        {list.length === 0 && (
          <p className="studio-hint">
            {catalog ? "No sounds match that." : "Loading sounds…"}
          </p>
        )}
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`sound-row ${pickedId === s.id ? "on" : ""}`}
            onClick={() => onPick(s)}
          >
            <span className="sound-emoji">{s.emoji}</span>
            <span className="sound-meta">
              <strong>{s.name}</strong>
              <em>
                {s.artist}
                {s.uses > 0 && s.genre !== "Original" ? ` · ${compact(s.uses)} ${s.uses === 1 ? "video" : "videos"}` : ""}
              </em>
            </span>
            {pickedId === s.id && <span className="sound-on">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
