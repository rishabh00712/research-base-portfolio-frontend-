// About.jsx - the About page: 1) intro (editable text + hobbies + 3D molecule)
// 2) Education & Career  3) Contact
import React, { useEffect, useRef, useState } from 'react';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';

import EducationCareer from './Educationcareer';
import ContactSection from './Contactsection';

/* Start fetching the moment this file is imported */
let aboutPromise = null;
const fetchAbout = () => {
  if (!aboutPromise) {
    aboutPromise = fetch(`${API_URL}/api/about`)
      .then((res) => res.json())
      .catch((err) => {
        console.error('Failed to load about:', err);
        aboutPromise = null; // allow retry on next visit
        return null;
      });
  }
  return aboutPromise;
};
fetchAbout();

/* "Dr. Hriday Bhattacharjee" -> "Hriday" */
const TITLE_RE = /^(dr|prof|professor|mr|mrs|ms|mx)\.?$/i;
const getShortName = (full = '') => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const rest = parts.filter((p) => !TITLE_RE.test(p));
  return rest[0] || parts[0] || '';
};

/* ---------- Load animation helpers ---------- */
const Letters = ({ text }) => {
  let n = 0;
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((ch, c) => (
              <span key={c} className="fx-letter" style={{ animationDelay: `${n++ * 45}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
};

const Words = ({ text, start = 0 }) =>
  text.split(/\s+/).map((word, i) => (
    <React.Fragment key={i}>
      {i > 0 && ' '}
      <span className="fx-word" style={{ animationDelay: `${350 + Math.min((start + i) * 18, 1000)}ms` }}>
        {word}
      </span>
    </React.Fragment>
  ));

/* ---------- Heading: click to edit the FULL name (shows only the first name) ---------- */
const NameTitle = ({ name, onSave }) => {
  const inputRef = useRef(null);
  const activeRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const begin = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setDraft(name);
    setEditing(true);
  };

  const finish = (save) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setEditing(false);
    const value = draft.trim();
    if (save && value && value !== name) onSave(value);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  return (
    <h1
      onClick={begin}
      title={editing ? undefined : 'Click to edit your name'}
      className="m-0 text-5xl sm:text-6xl w-fit max-w-full"
      style={{
        fontFamily: theme.fonts.heading,
        fontWeight: 400,
        lineHeight: 1.1,
        color: theme.colors.heading,
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
              e.preventDefault();
              finish(true);
            } else if (e.key === 'Escape') finish(false);
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
        <Letters text={`Hi, I'm ${getShortName(name) || 'there'}.`} />
      )}
    </h1>
  );
};

/* ---------- Long description: click to edit.
   Enter = new paragraph, Ctrl/Cmd+Enter or click outside = save, Esc = cancel ---------- */
const LongDescription = ({ text, onSave }) => {
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

  useEffect(() => {
    const el = areaRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  useEffect(() => {
    if (editing) {
      const el = areaRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const typography = {
    fontFamily: theme.fonts.body,
    fontSize: '1.15rem',
    lineHeight: 1.8,
    fontWeight: 400,
    color: theme.colors.body,
  };

  const paragraphs = text.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
  const offsets = [];
  paragraphs.reduce((sum, p) => {
    offsets.push(sum);
    return sum + p.split(/\s+/).length;
  }, 0);

  return (
    <div className="mt-8" style={{ maxWidth: '38rem' }}>
      {editing ? (
        <>
          <textarea
            ref={areaRef}
            value={draft}
            rows={6}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => finish(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                finish(true);
              } else if (e.key === 'Escape') finish(false);
            }}
            className="w-full box-border resize-none"
            style={{
              ...typography,
              background: 'transparent',
              border: `1px dashed ${theme.colors.accent}`,
              borderRadius: 8,
              padding: '8px 12px',
              outline: 'none',
              overflow: 'hidden',
            }}
          />
          <p className="m-0 mt-2" style={{ fontFamily: theme.fonts.main, fontSize: '0.75rem', opacity: 0.6 }}>
            Enter = new paragraph · Ctrl+Enter or click outside = save · Esc = cancel
          </p>
        </>
      ) : paragraphs.length === 0 ? (
        <p onClick={begin} className="m-0 fx-editable" style={{ ...typography, opacity: 0.5 }}>
          Click to add a description
        </p>
      ) : (
        <div onClick={begin} title="Click to edit" className="fx-editable">
          {paragraphs.map((p, i) => (
            <p key={i} className="m-0 mb-5" style={typography}>
              <Words text={p} start={offsets[i]} />
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Hobbies: chips with delete (×) and an add (+) chip ---------- */
const chipStyle = {
  fontFamily: theme.fonts.main,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  color: theme.colors.accent,
  backgroundColor: theme.colors.newsBg,
  border: `1px solid ${theme.colors.newsBorder}`,
  borderRadius: '999px',
  padding: '8px 18px',
};

const Hobbies = ({ hobbies, onAdd, onRemove }) => {
  const inputRef = useRef(null);
  const busyRef = useRef(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const close = () => {
    setAdding(false);
    setDraft('');
  };

  const submit = () => {
    if (busyRef.current) return; // Enter + blur would fire twice
    busyRef.current = true;
    const value = draft.trim();
    close();
    if (value) onAdd(value);
    setTimeout(() => (busyRef.current = false), 0);
  };

  return (
    <ul className="list-none m-0 mt-8 p-0 flex flex-wrap gap-3">
      {hobbies.map((hobby, i) => (
        <li
          key={hobby}
          className="uppercase fx-tag inline-flex items-center gap-2"
          style={{ ...chipStyle, animationDelay: `${Math.min(1000 + i * 110, 1800)}ms` }}
        >
          {hobby}
          <button
            type="button"
            onClick={() => onRemove(hobby)}
            aria-label={`Remove ${hobby}`}
            title="Remove"
            className="border-0 bg-transparent cursor-pointer p-0 leading-none"
            style={{ color: theme.colors.accent, fontSize: '1.1rem', opacity: 0.6 }}
          >
            ×
          </button>
        </li>
      ))}

      <li>
        {adding ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={50}
            placeholder="New hobby"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape') {
                busyRef.current = true; // stop blur from saving
                close();
                setTimeout(() => (busyRef.current = false), 0);
              }
            }}
            style={{ ...chipStyle, outline: 'none', width: 160, textTransform: 'uppercase' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add hobby"
            title="Add hobby"
            className="cursor-pointer"
            style={{ ...chipStyle, borderStyle: 'dashed', background: 'transparent', fontSize: '0.9rem' }}
          >
            + ADD
          </button>
        )}
      </li>
    </ul>
  );
};

/* ---------- Intro ---------- */
const Intro = ({ profile, onChange }) => {
  const [notice, setNotice] = useState('');
  const hobbies = Array.isArray(profile.hobbies) ? profile.hobbies : [];

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // name / long_description: optimistic, roll back on error, apply only the field we sent
  const saveField = async (field, value) => {
    const previous = profile[field];
    onChange({ [field]: value });
    try {
      const saved = await api('/api/about', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ [field]: value }),
      });
      onChange({ [field]: saved[field] });
    } catch (err) {
      onChange({ [field]: previous });
      setNotice(err.message);
    }
  };

  // hobbies: the server decides (duplicates, limit), so wait for its answer
  const addHobby = async (hobby) => {
    try {
      const saved = await api('/api/about/hobbies', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ hobby }),
      });
      onChange({ hobbies: saved.hobbies });
    } catch (err) {
      setNotice(err.message);
    }
  };

  const removeHobby = async (hobby) => {
    const previous = hobbies;
    onChange({ hobbies: hobbies.filter((h) => h !== hobby) }); // instant
    try {
      const saved = await api(`/api/about/hobbies/${encodeURIComponent(hobby)}`, { method: 'DELETE' });
      onChange({ hobbies: saved.hobbies });
    } catch (err) {
      onChange({ hobbies: previous });
      setNotice(err.message);
    }
  };

  return (
    <section className="w-full box-border px-6 sm:px-12 pt-8 pb-16">
      <style>{`
        @keyframes fx-rise {
          from { opacity: 0; transform: translateY(0.45em); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes fx-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.92); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes fx-fade { from { opacity: 0; } to { opacity: 1; } }

        .fx-letter { display: inline-block; opacity: 0; animation: fx-rise 550ms cubic-bezier(.2,.8,.2,1) forwards; }
        .fx-word   { display: inline-block; opacity: 0; animation: fx-rise 500ms ease-out forwards; }
        .fx-tag    { opacity: 0; animation: fx-pop 450ms cubic-bezier(.2,.8,.2,1) forwards; }
        .fx-fade   { opacity: 0; animation: fx-fade 900ms ease-out 400ms forwards; }

        .fx-editable { cursor: text; border-radius: 8px; transition: background 200ms ease; }
        .fx-editable:hover { background: rgba(0,0,0,0.035); }

        @media (prefers-reduced-motion: reduce) {
          .fx-letter, .fx-word, .fx-tag, .fx-fade { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
        {/* Left: text */}
        <div>
          <NameTitle name={profile.name || ''} onSave={(v) => saveField('name', v)} />
          <LongDescription
            text={profile.long_description || ''}
            onSave={(v) => saveField('long_description', v)}
          />
          <Hobbies hobbies={hobbies} onAdd={addHobby} onRemove={removeHobby} />
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

/* ---------- Page ---------- */
const About = () => {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchAbout().then((data) => {
      if (!alive) return;
      setProfile(data);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // merge into state AND the module-level cache so revisiting isn't stale
  const updateProfile = (patch) =>
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      aboutPromise = Promise.resolve(next);
      return next;
    });

  if (!ready) return <div style={{ minHeight: '70vh' }} aria-hidden="true" />;

  return (
    <>
      {profile && <Intro profile={profile} onChange={updateProfile} />}
       <EducationCareer /> 
      <ContactSection /> 
    </>
  );
};

export default About;