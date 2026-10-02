// Home.jsx - hero (editable) + Explore + News
import React, { useEffect, useRef, useState } from 'react';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';
import Explore from './Explore';
import News from './News';
import SocialMedia from './Socialmedia';

/* Start fetching the moment this file is imported, so the data is
   usually ready before the person opens the home page. */
let profilePromise = null;
const fetchProfile = () => {
  if (!profilePromise) {
    profilePromise = fetch(`${API_URL}/api/profile`)
      .then((res) => res.json())
      .catch((err) => {
        console.error('Failed to load profile:', err);
        profilePromise = null; // allow retry on next visit
        return null;
      });
  }
  return profilePromise;
};
fetchProfile();

/* ---------- Load animation helpers ---------- */
// Title: every letter rises in one after another
const Letters = ({ text, start = 0 }) => {
  let n = 0;
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((ch, c) => (
              <span key={c} className="hm-letter" style={{ animationDelay: `${start + (n++) * 40}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
};

// Description: words fade up in a quick wave
const Words = ({ text, start = 0 }) =>
  text.split(/\s+/).map((word, i) => (
    <React.Fragment key={i}>
      {i > 0 && ' '}
      <span className="hm-word" style={{ animationDelay: `${start + Math.min(i * 18, 1000)}ms` }}>
        {word}
      </span>
    </React.Fragment>
  ));

/* ---------- Lab name: click to edit + chocolate cursor lens on hover ----------
   Enter / Shift+Enter or clicking outside saves. Esc cancels. */
const LENS_RADIUS = 36; // px

const LabTitle = ({ text, start = 0, onSave }) => {
  const headingRef = useRef(null);
  const lensRef = useRef(null);
  const inputRef = useRef(null);
  const activeRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  const begin = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setDraft(text);
    setEditing(true);
  };

  const finish = (save) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setEditing(false);
    const value = draft.trim();
    if (save && value && value !== text) onSave(value);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    const heading = headingRef.current;
    const lens = lensRef.current;
    if (!heading || !lens) return undefined;

    const noHover = window.matchMedia('(hover: none)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (noHover || reduce) return undefined;

    const s = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 };
    let raf = 0;
    let running = false;

    const paint = () => {
      lens.style.clipPath = `circle(${s.r.toFixed(2)}px at ${s.x.toFixed(1)}px ${s.y.toFixed(1)}px)`;
    };

    const tick = () => {
      s.x += (s.tx - s.x) * 0.2;
      s.y += (s.ty - s.y) * 0.2;
      s.r += (s.tr - s.r) * 0.16;
      paint();
      const settled =
        Math.abs(s.tx - s.x) < 0.1 && Math.abs(s.ty - s.y) < 0.1 && Math.abs(s.tr - s.r) < 0.1;
      if (settled && s.tr === 0) {
        s.r = 0;
        paint();
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start_ = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const local = (e) => {
      const b = heading.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    };

    const onEnter = (e) => {
      const [x, y] = local(e);
      s.x = s.tx = x;
      s.y = s.ty = y;
      s.tr = LENS_RADIUS;
      start_();
    };
    const onMove = (e) => {
      const [x, y] = local(e);
      s.tx = x;
      s.ty = y;
      s.tr = LENS_RADIUS;
      start_();
    };
    const onLeave = () => {
      s.tr = 0;
      start_();
    };

    heading.addEventListener('pointerenter', onEnter);
    heading.addEventListener('pointermove', onMove);
    heading.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      heading.removeEventListener('pointerenter', onEnter);
      heading.removeEventListener('pointermove', onMove);
      heading.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <h1
      ref={headingRef}
      onClick={begin}
      title={editing ? undefined : 'Click to edit'}
      className="relative w-fit max-w-full m-0 mb-8 leading-tight text-5xl sm:text-6xl"
      style={{
        fontFamily: theme.fonts.heading,
        color: theme.colors.heading,
        fontWeight: 400,
        cursor: 'text',
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          maxLength={255}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Enter and Shift+Enter both save
              finish(true);
            } else if (e.key === 'Escape') {
              finish(false);
            }
          }}
          style={{
            font: 'inherit',
            color: 'inherit',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${theme.colors.accent}`,
            outline: 'none',
            padding: 0,
            margin: 0,
            width: `${Math.max(draft.length, 6) + 1}ch`,
            maxWidth: '100%',
          }}
        />
      ) : (
        <Letters text={text || 'Add lab name'} start={start} />
      )}

      {/* lens layer */}
      <span
        aria-hidden="true"
        style={{
          display: editing ? 'none' : 'block',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          filter: `drop-shadow(0 8px 16px ${theme.colors.textHover}59)`,
        }}
      >
        <span
          ref={lensRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.colors.textHover,
            color: theme.colors.background,
            clipPath: 'circle(0px at 0px 0px)',
            willChange: 'clip-path',
          }}
        >
          {text}
        </span>
      </span>
    </h1>
  );
};

/* ---------- Description: click to edit (Enter / Shift+Enter / click outside saves) ---------- */
const Description = ({ text, start = 0, onSave }) => {
  const areaRef = useRef(null);
  const activeRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  const begin = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setDraft(text);
    setEditing(true);
  };

  const finish = (save) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setEditing(false);
    if (save && draft.trim() !== text) onSave(draft.trim());
  };

  // auto-grow
  useEffect(() => {
    const el = areaRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  // focus
  useEffect(() => {
    if (editing) {
      const el = areaRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const typography = {
    fontFamily: theme.fonts.body,
    color: theme.colors.body,
    lineHeight: 1.75,
    fontWeight: 400,
    maxWidth: '34rem',
  };

  if (editing) {
    return (
      <textarea
        ref={areaRef}
        value={draft}
        rows={2}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // Enter and Shift+Enter both save
            finish(true);
          } else if (e.key === 'Escape') {
            finish(false);
          }
        }}
        className="text-lg w-full box-border resize-none"
        style={{
          ...typography,
          background: 'transparent',
          border: `1px dashed ${theme.colors.accent}`,
          borderRadius: 8,
          padding: '6px 10px',
          outline: 'none',
          overflow: 'hidden',
        }}
      />
    );
  }

  return (
    <p
      onClick={begin}
      title="Click to edit"
      className="hm-editable m-0 text-lg"
      style={{ ...typography, opacity: text ? 1 : 0.5 }}
    >
      {text ? <Words text={text} start={start} /> : 'Click to add a description'}
    </p>
  );
};

/* ---------- Hero ---------- */
const Hero = ({ profile, onChange }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  const title = profile.lab_name || '';

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  /* lab name / description */
  const saveField = async (field, value) => {
    const previous = profile[field];
    onChange({ [field]: value }); // instant
    try {
      const saved = await api('/api/profile', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ [field]: value }),
      });
      onChange(saved);
    } catch (err) {
      onChange({ [field]: previous }); // roll back
      setNotice(err.message);
    }
  };

  /* image */
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setNotice('Please choose an image file.');
    if (file.size > 5 * 1024 * 1024) return setNotice('Image must be under 5 MB.');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const data = await api('/api/profile/image', { method: 'POST', body: fd });
      onChange({ image: data.image });
    } catch (err) {
      setNotice(err.message);
    } finally {
      setUploading(false);
    }
  };

  const circle = 'min(400px, 80vw)';

  return (
    <section className="w-full box-border px-6 sm:px-12 py-12 lg:py-20">
      <style>{`
        @keyframes hm-rise {
          from { opacity: 0; transform: translateY(0.45em); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes hm-photo {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes hm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes hm-spin { to { transform: rotate(360deg); } }

        .hm-label  { opacity: 0; animation: hm-rise 600ms ease-out forwards; }
        .hm-letter { display: inline-block; opacity: 0; animation: hm-rise 550ms cubic-bezier(.2,.8,.2,1) forwards; }
        .hm-word   { display: inline-block; opacity: 0; animation: hm-rise 500ms ease-out forwards; }
        .hm-photo  { opacity: 0; animation: hm-photo 800ms cubic-bezier(.2,.8,.2,1) 100ms forwards; }
        .hm-glow   { opacity: 0; animation: hm-fade 1200ms ease-out 200ms forwards; }

        .hm-editable { cursor: text; border-radius: 8px; transition: background 200ms ease; }
        .hm-editable:hover { background: rgba(0,0,0,0.035); }
        .hm-spinner { animation: hm-spin 800ms linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .hm-label, .hm-letter, .hm-word, .hm-photo, .hm-glow { animation: none; opacity: 1; }
          .hm-spinner { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* LEFT: text */}
        <div>
          <p
            className="hm-label uppercase m-0 mb-4"
            style={{
              fontFamily: theme.fonts.main,
              color: theme.colors.accent,
              fontSize: '1.15rem',
              letterSpacing: '0.35em',
            }}
          >
            Welcome to the
          </p>

          <LabTitle text={title} start={60} onSave={(v) => saveField('lab_name', v)} />

          {/* This is the description shown in the hero. Change 'short_description' to
              'mid_description' in both places below if you want that column instead. */}
          <Description
            text={profile.short_description || ''}
            start={450}
            onSave={(v) => saveField('short_description', v)}
          />
        </div>

        {/* RIGHT: image + social buttons */}
        <div className="relative flex flex-col items-center">
          <div
            aria-hidden="true"
            className="hm-glow absolute rounded-full"
            style={{
              width: '520px',
              height: '520px',
              maxWidth: '120%',
              background: `radial-gradient(circle, ${theme.colors.glow} 0%, transparent 70%)`,
              top: '-40px',
              zIndex: 0,
            }}
          />

          {/* photo + "+" upload button */}
          <div className="hm-photo relative" style={{ width: circle, height: circle, zIndex: 1 }}>
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.name || profile.lab_name}
                className="w-full h-full object-cover rounded-full"
                style={{ boxShadow: '0 20px 50px rgba(155, 28, 46, 0.12)' }}
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{
                  border: `2px dashed ${theme.colors.accent}`,
                  color: theme.colors.accent,
                  fontFamily: theme.fonts.main,
                  fontSize: '0.85rem',
                  letterSpacing: '0.15em',
                }}
              >
                ADD A PHOTO
              </div>
            )}

            {uploading && (
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.65)' }}
              >
                <svg className="hm-spinner" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={theme.colors.accent} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 3a9 9 0 1 0 9 9" />
                </svg>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Upload new photo"
              title="Upload new photo"
              className="absolute flex items-center justify-center rounded-full border-0 cursor-pointer transition-transform duration-200 hover:scale-110 disabled:opacity-60"
              style={{
                right: '7%',
                bottom: '7%',
                width: 48,
                height: 48,
                background: theme.colors.accent,
                color: '#fff',
                fontSize: 30,
                lineHeight: 1,
                boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              }}
            >
              +
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          </div>

          {/* social media icons + editor (its own component) */}
          <SocialMedia
            links={profile.social_media_links || []}
            onChange={(links) => onChange({ social_media_links: links })}
            onNotice={setNotice}
          />
        </div>
      </div>

      {notice && (
        <div
          role="alert"
          className="fixed left-1/2 -translate-x-1/2 text-white"
          style={{
            bottom: 24,
            background: theme.colors.accent,
            padding: '10px 18px',
            borderRadius: 999,
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            fontFamily: theme.fonts.body,
          }}
        >
          {notice}
        </div>
      )}
    </section>
  );
};

/* ---------- Page: hero first, then Explore, then News ---------- */
const Home = () => {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchProfile().then((data) => {
      if (!alive) return;
      setProfile(data);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // merge changes into state AND into the module-level cache,
  // so coming back to Home later doesn't show stale data
  const updateProfile = (patch) =>
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      profilePromise = Promise.resolve(next);
      return next;
    });

  if (!ready) return <div style={{ minHeight: '70vh' }} aria-hidden="true" />;

  return (
    <>
      {profile && <Hero profile={profile} onChange={updateProfile} />}
      <Explore />
      <News />
    </>
  );
};

export default Home;