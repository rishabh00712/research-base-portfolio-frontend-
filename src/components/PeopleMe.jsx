// PeopleMe.jsx - People page: editable profile card + editable team members
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';

/* ---------- Fetch once, cache, start as soon as the file is imported ---------- */
const getJson = (url) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  });

let peoplePromise = null;
const fetchPeople = () => {
  if (!peoplePromise) {
    peoplePromise = getJson(`${API_URL}/api/people`).catch((err) => {
      console.error('Failed to load people:', err);
      peoplePromise = null;
      return null;
    });
  }
  return peoplePromise;
};
fetchPeople();

let teamPromise = null;
const fetchTeam = () => {
  if (!teamPromise) {
    teamPromise = getJson(`${API_URL}/api/team-members`)
      .then((data) => (Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to load team members:', err);
        teamPromise = null;
        return [];
      });
  }
  return teamPromise;
};
fetchTeam();

/* ---------- Scroll-reveal helpers ---------- */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const useInView = (threshold = 0.1) => {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observerRef.current?.disconnect();
          }
        },
        { threshold, rootMargin: '0px 0px 10% 0px' }
      );
      observerRef.current.observe(node);
    },
    [threshold]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);
  return [ref, visible];
};

const reveal = (visible, delay = 0, distance = 20) => {
  if (prefersReducedMotion()) return {};
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: `opacity 500ms ease ${delay}ms, transform 500ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
  };
};

/* ---------- Load animation helpers ---------- */
const Letters = ({ text, start = 0 }) => {
  let n = 0;
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((ch, c) => (
              <span key={c} className="pm-letter" style={{ animationDelay: `${start + n++ * 40}ms` }}>
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
      <span className="pm-word" style={{ animationDelay: `${start + Math.min(i * 18, 1000)}ms` }}>
        {word}
      </span>
    </React.Fragment>
  ));

/* ---------- Social icons (read-only) ---------- */
const ScholarIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path fill="#4285F4" d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
  </svg>
);
const UniversityIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      fill={theme.colors.accent}
      d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"
    />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      fill="#0A66C2"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    />
  </svg>
);
const OrcidIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#A6CE39" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
      iD
    </text>
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2.5" fill="#0078D4" />
    <path d="M3.5 7.5 12 13l8.5-5.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      fill={theme.colors.body}
      d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
    />
  </svg>
);

const pickIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('scholar')) return ScholarIcon;
  if (n.includes('linkedin')) return LinkedInIcon;
  if (n.includes('orcid')) return OrcidIcon;
  if (n.includes('mail') || n.includes('outlook')) return MailIcon;
  if (/(macewan|university|institution|faculty|profile)/.test(n)) return UniversityIcon;
  return LinkIcon;
};

const toSocialLinks = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .filter((row) => row.link)
    .map((row) => {
      let href = row.link.trim();
      if (!/^(https?:|mailto:|tel:)/i.test(href)) {
        href = href.includes('@') ? `mailto:${href}` : `https://${href}`;
      }
      return { key: row.id, label: row.name, Icon: pickIcon(row.name), href };
    });

const IconLink = ({ href, label, index, visible, baseDelay, children }) => {
  const delay = baseDelay + index * 80;
  const pop = prefersReducedMotion()
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.6)',
        transition: `opacity 400ms ease ${delay}ms, transform 450ms cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
      };
  return (
    <span className="inline-flex" style={pop}>
      <a
        href={href}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className="social-icon flex items-center justify-center rounded-full"
        style={{ width: '56px', height: '56px', backgroundColor: '#fff', border: `1px solid ${theme.colors.newsBorder}` }}
      >
        {children}
      </a>
    </span>
  );
};

const SocialIcons = ({ links, visible, baseDelay = 350 }) => {
  if (!links || links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3.5">
      <style>{`
        .social-icon { transition: transform 200ms ease, box-shadow 200ms ease; }
        .social-icon:hover { transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
        @media (prefers-reduced-motion: reduce) { .social-icon { transition: none; } }
      `}</style>
      {links.map(({ key, label, Icon, href }, i) => (
        <IconLink key={key} href={href} label={label} index={i} visible={visible} baseDelay={baseDelay}>
          <Icon />
        </IconLink>
      ))}
    </div>
  );
};

/* ---------- Click-to-edit text. Ctrl/Cmd+Enter saves, Esc cancels.
   (single-line fields also save on plain Enter). Clicking outside does nothing. ---------- */
const InlineText = ({ value, onSave, multiline = false, as: Tag = 'div', placeholder, editorStyle, children }) => {
  const ref = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const begin = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value.trim()) onSave(next);
  };

  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  useEffect(() => {
    const el = ref.current;
    if (!editing || !multiline || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft, multiline]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !multiline)) {
      e.preventDefault();
      commit();
    }
  };

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onKeyDown,
    };
    return (
      <Tag style={{ display: 'block' }}>
        {multiline ? (
          <textarea
            {...shared}
            rows={5}
            className="w-full box-border resize-none"
            style={{
              font: 'inherit',
              color: 'inherit',
              background: 'transparent',
              border: `1px dashed ${theme.colors.accent}`,
              borderRadius: 8,
              padding: '8px 12px',
              outline: 'none',
              overflow: 'hidden',
              ...editorStyle,
            }}
          />
        ) : (
          <input
            {...shared}
            className="w-full box-border"
            style={{
              font: 'inherit',
              color: 'inherit',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${theme.colors.accent}`,
              outline: 'none',
              padding: 0,
              ...editorStyle,
            }}
          />
        )}
        <small
          style={{ display: 'block', marginTop: 6, fontFamily: theme.fonts.main, fontSize: '0.7rem', opacity: 0.6 }}
        >
          Ctrl+Enter = save · Esc = cancel
        </small>
      </Tag>
    );
  }

  return (
    <Tag onClick={begin} title="Click to edit" className="pm-editable" style={{ display: 'block' }}>
      {value.trim() ? children : <span style={{ opacity: 0.5 }}>{placeholder}</span>}
    </Tag>
  );
};

/* ---------- Work roles: chips with × and a + ADD chip ---------- */
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

const Roles = ({ roles, onAdd, onRemove, style }) => {
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
    <ul className="list-none m-0 mt-5 p-0 flex flex-wrap gap-3" style={style}>
      {roles.map((role) => (
        <li key={role} className="uppercase inline-flex items-center gap-2" style={chipStyle}>
          {role}
          <button
            type="button"
            onClick={() => onRemove(role)}
            aria-label={`Remove ${role}`}
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
            maxLength={100}
            placeholder="New role"
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
            style={{ ...chipStyle, outline: 'none', width: 170, textTransform: 'uppercase' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add role"
            title="Add role"
            className="cursor-pointer"
            style={{ ...chipStyle, borderStyle: 'dashed', background: 'transparent', fontSize: '0.8rem' }}
          >
            + ADD
          </button>
        )}
      </li>
    </ul>
  );
};

/* ---------- Team members ---------- */
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

const toSiteUrl = (link = '') => {
  const l = (link || '').trim();
  if (!l) return '';
  return /^https?:\/\//i.test(l) ? l : `https://${l}`;
};

const labelStyle = {
  fontFamily: theme.fonts.main,
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: theme.colors.body,
  opacity: 0.7,
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span style={labelStyle}>{label}</span>
    {children}
  </label>
);

const isPickableImage = (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;

/* one form for both "add" and "edit" */
const TeamForm = ({ title, initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial.name || '');
  const [role, setRole] = useState(initial.role || '');
  const [link, setLink] = useState(initial.link || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial.image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  // free the temporary preview URL when it changes or the form closes
  useEffect(
    () => () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const onPick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!isPickableImage(f)) return setError('Choose an image under 5 MB.');
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (saving) return;
    if (!name.trim()) return setError('Name is required.');
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('role', role.trim());
      fd.append('link', link.trim());
      if (file) fd.append('image', file);
      await onSave(fd); // parent closes the form on success
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onCancel();
    else if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <li className="m-0 p-0" style={{ gridColumn: '1 / -1' }}>
      <div
        onKeyDown={onKeyDown}
        className="box-border"
        style={{ border: `1px dashed ${theme.colors.accent}`, borderRadius: 28, padding: 24, backgroundColor: '#fff' }}
      >
        <p className="m-0 mb-4 uppercase" style={{ ...labelStyle, opacity: 1, color: theme.colors.accent }}>
          {title}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center overflow-hidden"
              style={{ width: 96, height: 96, borderRadius: '50%', backgroundColor: theme.colors.newsBg }}
            >
              {preview ? (
                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: theme.fonts.heading, fontSize: '1.6rem', color: theme.colors.accent }}>
                  {initials(name) || '+'}
                </span>
              )}
            </div>
            <button type="button" className="pm-btn" onClick={() => fileRef.current?.click()} disabled={saving}>
              {preview ? 'Change photo' : 'Add photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
            <Field label="Name *">
              <input ref={firstRef} className="pm-field" value={name} maxLength={255} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Role">
              <input className="pm-field" value={role} maxLength={255} onChange={(e) => setRole(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Link (website)">
                <input className="pm-field" value={link} maxLength={500} onChange={(e) => setLink(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="m-0 mt-3" style={{ color: theme.colors.accent, fontFamily: theme.fonts.body }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={submit} disabled={saving} className="pm-btn pm-btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className="pm-btn">
            Cancel
          </button>
        </div>
      </div>
    </li>
  );
};

const TeamCard = ({ member, index, onEdit, onDelete }) => {
  const [ref, visible] = useInView(0.15);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const href = toSiteUrl(member.link);
  const showImage = member.image && !failed;

  return (
    <li ref={ref} className="pm-member m-0 p-0" style={reveal(visible, (index % 4) * 100, 32)}>
      <div
        className="team-card relative box-border h-full flex flex-col items-center text-center"
        style={{
          backgroundColor: '#fff',
          border: `1px solid ${theme.colors.newsBorder}`,
          borderRadius: '28px',
          padding: '32px 24px',
        }}
      >
        <div className="pm-tool absolute flex gap-3" style={{ top: 14, right: 20 }}>
          <button type="button" className="pm-link" onClick={() => onEdit(member.id)}>
            Edit
          </button>
          <button type="button" className="pm-link" onClick={() => onDelete(member)}>
            Delete
          </button>
        </div>

        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: theme.colors.newsBg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {showImage ? (
            <img
              src={member.image}
              alt={member.name}
              width="120"
              height="120"
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 600ms ease',
              }}
            />
          ) : (
            <span style={{ fontFamily: theme.fonts.heading, fontSize: '2rem', color: theme.colors.accent }}>
              {initials(member.name)}
            </span>
          )}
        </div>

        <h3
          className="m-0 mt-5"
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: 500,
            fontSize: '1.35rem',
            lineHeight: 1.25,
            color: theme.colors.heading,
          }}
        >
          {member.name}
        </h3>

        {member.role && (
          <p className="m-0 mt-1" style={{ fontFamily: theme.fonts.body, fontSize: '1rem', color: theme.colors.body }}>
            {member.role}
          </p>
        )}

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="team-btn uppercase inline-block mt-auto"
            style={{
              fontFamily: theme.fonts.main,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textDecoration: 'none',
              borderRadius: '999px',
              padding: '8px 18px',
              marginTop: '20px',
            }}
          >
            View site <span className="team-arrow">↗</span>
          </a>
        )}
      </div>
    </li>
  );
};

const TeamSkeleton = () => (
  <li className="m-0 p-0">
    <div
      className="team-skel box-border h-full flex flex-col items-center"
      style={{
        backgroundColor: '#fff',
        border: `1px solid ${theme.colors.newsBorder}`,
        borderRadius: '28px',
        padding: '32px 24px',
      }}
    >
      <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: theme.colors.newsBg }} />
      <div style={{ width: '60%', height: '16px', borderRadius: '8px', backgroundColor: theme.colors.newsBg, marginTop: '24px' }} />
      <div style={{ width: '40%', height: '12px', borderRadius: '6px', backgroundColor: theme.colors.newsBg, marginTop: '12px' }} />
    </div>
  </li>
);

const TeamSection = ({ onNotice }) => {
  const [team, setTeam] = useState(null); // null = still loading
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [headRef, headVisible] = useInView(0.2);

  useEffect(() => {
    let alive = true;
    fetchTeam().then((data) => {
      if (alive) setTeam(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  // change the list AND the module-level cache
  const update = (fn) =>
    setTeam((prev) => {
      const next = fn(prev || []);
      teamPromise = Promise.resolve(next);
      return next;
    });

  // the forms show errors themselves, so these throw on failure
  const create = async (fd) => {
    const row = await api('/api/team-members', { method: 'POST', body: fd });
    update((prev) => [...prev, row]);
    setAdding(false);
  };

  const save = async (id, fd) => {
    const row = await api(`/api/team-members/${id}`, { method: 'PATCH', body: fd });
    update((prev) => prev.map((m) => (m.id === id ? row : m)));
    setEditingId(null);
  };

  const remove = async (member) => {
    if (!window.confirm(`Delete "${member.name}"? Their photo will be deleted too.`)) return;
    try {
      await api(`/api/team-members/${member.id}`, { method: 'DELETE' });
      update((prev) => prev.filter((m) => m.id !== member.id));
      if (editingId === member.id) setEditingId(null);
    } catch (err) {
      onNotice(err.message);
    }
  };

  return (
    <div className="mt-20">
      <style>{`
        .team-card { transition: transform 220ms ease, box-shadow 220ms ease; }
        .team-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .team-btn {
          color: ${theme.colors.accent};
          background-color: ${theme.colors.newsBg};
          border: 1px solid ${theme.colors.newsBorder};
          transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
        }
        .team-btn:hover { color: #fff; background-color: ${theme.colors.accent}; border-color: ${theme.colors.accent}; }
        .team-btn .team-arrow { display: inline-block; transition: transform 200ms ease; }
        .team-btn:hover .team-arrow { transform: translate(2px, -2px); }
        @keyframes team-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        .team-skel { animation: team-pulse 1.4s ease-in-out infinite; }

        .pm-field {
          font-family: ${theme.fonts.body}; font-size: 1rem; color: ${theme.colors.body};
          background: transparent; border: 1px solid ${theme.colors.newsBorder}; border-radius: 8px;
          padding: 8px 12px; outline: none; width: 100%; box-sizing: border-box;
        }
        .pm-field:focus { border-color: ${theme.colors.accent}; }
        .pm-btn {
          font-family: ${theme.fonts.main}; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: ${theme.colors.accent}; background: transparent; border: 1px solid ${theme.colors.accent};
          border-radius: 999px; padding: 8px 20px; cursor: pointer;
        }
        .pm-btn-primary { background: ${theme.colors.accent}; color: #fff; }
        .pm-btn:disabled { opacity: 0.6; cursor: default; }
        .pm-link {
          font-family: ${theme.fonts.main}; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: ${theme.colors.accent}; background: none; border: 0; padding: 0; cursor: pointer;
        }
        .pm-link:hover { text-decoration: underline; }

        /* Edit / Delete appear on hover or keyboard focus; always visible on touch screens */
        .pm-tool { opacity: 0; transition: opacity 200ms ease; }
        .pm-member:hover .pm-tool, .pm-member:focus-within .pm-tool { opacity: 1; }
        @media (hover: none) { .pm-tool { opacity: 0.85; } }

        @media (prefers-reduced-motion: reduce) {
          .team-card, .team-btn, .team-btn .team-arrow, .pm-tool { transition: none; }
          .team-card:hover { transform: none; }
          .team-skel { animation: none; }
        }
      `}</style>

      <div ref={headRef} style={reveal(headVisible, 0, 16)}>
        <h2
          className="m-0 text-3xl sm:text-4xl"
          style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.heading }}
        >
          Team members
        </h2>
      </div>

      <ul
        className="list-none m-0 mt-10 p-0 grid gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
      >
        {team === null ? (
          [0, 1, 2].map((i) => <TeamSkeleton key={i} />)
        ) : (
          <>
            {team.map((member, i) =>
              editingId === member.id ? (
                <TeamForm
                  key={member.id}
                  title="Edit member"
                  initial={member}
                  onSave={(fd) => save(member.id, fd)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TeamCard
                  key={member.id}
                  member={member}
                  index={i}
                  onEdit={(id) => {
                    setAdding(false);
                    setEditingId(id);
                  }}
                  onDelete={remove}
                />
              )
            )}

            {adding ? (
              <TeamForm title="New member" initial={{}} onSave={create} onCancel={() => setAdding(false)} />
            ) : (
              <li className="m-0 p-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setAdding(true);
                  }}
                  className="w-full h-full cursor-pointer box-border"
                  style={{
                    minHeight: 200,
                    background: 'transparent',
                    border: `1px dashed ${theme.colors.accent}`,
                    borderRadius: 28,
                    color: theme.colors.accent,
                    fontFamily: theme.fonts.main,
                    fontSize: '0.8rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  + Add member
                </button>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
};

/* ---------- Page ---------- */
const PeopleMe = () => {
  const [person, setPerson] = useState(null);
  const [cardRef, cardVisible] = useInView(0.1);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const photoRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetchPeople().then((data) => {
      if (alive && data && !data.error) setPerson(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // merge into state AND the module-level cache so coming back later isn't stale
  const updatePerson = (patch) =>
    setPerson((prev) => {
      const next = { ...prev, ...patch };
      peoplePromise = Promise.resolve(next);
      return next;
    });

  // name / one-line / mid description: instant, roll back on error, apply only the field we sent
  const saveField = async (field, value) => {
    const previous = person[field];
    updatePerson({ [field]: value });
    try {
      const saved = await api('/api/people', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ [field]: value }),
      });
      updatePerson({ [field]: saved[field] });
    } catch (err) {
      updatePerson({ [field]: previous });
      setNotice(err.message);
    }
  };

  // roles: the server decides (duplicates, limit), so wait for its answer
  const addRole = async (role) => {
    try {
      const saved = await api('/api/people/roles', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ role }),
      });
      updatePerson({ work_role: saved.work_role });
    } catch (err) {
      setNotice(err.message);
    }
  };

  const removeRole = async (role) => {
    const previous = person.work_role || [];
    updatePerson({ work_role: previous.filter((r) => r !== role) });
    try {
      const saved = await api(`/api/people/roles/${encodeURIComponent(role)}`, { method: 'DELETE' });
      updatePerson({ work_role: saved.work_role });
    } catch (err) {
      updatePerson({ work_role: previous });
      setNotice(err.message);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isPickableImage(file)) return setNotice('Choose an image under 5 MB.');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const data = await api('/api/people/image', { method: 'POST', body: fd });
      updatePerson({ image: data.image });
    } catch (err) {
      setNotice(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!person) return null;

  // mid_description: 1st line = position line, the rest = the bio
  const lines = (person.mid_description || '')
    .split(/\r?\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const [positionLine, ...bioParagraphs] = lines;

  const roles = Array.isArray(person.work_role) ? person.work_role.filter(Boolean) : [];
  const links = toSocialLinks(person.social_links);
  const r = (delay) => reveal(cardVisible, delay, 14);

  return (
    <section className="w-full box-border px-6 sm:px-12 pt-16 pb-20">
      <style>{`
        .people-bio .people-arrow { display: inline-block; transition: transform 200ms ease; }
        .people-bio:hover .people-arrow { transform: translateX(4px); }

        .pm-editable { cursor: text; border-radius: 8px; transition: background 200ms ease; }
        .pm-editable:hover { background: rgba(0,0,0,0.035); }

        @keyframes pm-rise {
          from { opacity: 0; transform: translateY(0.45em); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes pm-spin { to { transform: rotate(360deg); } }
        .pm-label  { opacity: 0; animation: pm-rise 600ms ease-out forwards; }
        .pm-letter { display: inline-block; opacity: 0; animation: pm-rise 550ms cubic-bezier(.2,.8,.2,1) forwards; }
        .pm-word   { display: inline-block; opacity: 0; animation: pm-rise 500ms ease-out forwards; }
        .pm-spinner { animation: pm-spin 800ms linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .people-bio .people-arrow, .pm-editable { transition: none; }
          .pm-label, .pm-letter, .pm-word { animation: none; opacity: 1; }
          .pm-spinner { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div>
          <p
            className="pm-label uppercase m-0 mb-2"
            style={{
              fontFamily: theme.fonts.main,
              color: theme.colors.accent,
              fontSize: '0.85rem',
              letterSpacing: '0.25em',
            }}
          >
            The group
          </p>
          <h1
            className="m-0 text-4xl sm:text-5xl"
            style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.heading }}
          >
            <Letters text="People" start={60} />
          </h1>

          {/* one-line description: click to edit */}
          <p
            className="m-0 mt-4"
            style={{ fontFamily: theme.fonts.body, fontSize: '1.15rem', lineHeight: 1.6, color: theme.colors.body }}
          >
            <InlineText
              as="span"
              value={person.one_line_description || ''}
              placeholder="Click to add a one-line description"
              onSave={(v) => saveField('one_line_description', v)}
            >
              <Words text={person.one_line_description || ''} start={350} />
            </InlineText>
          </p>
        </div>

        {/* One card: photo + details + links */}
        <div
          ref={cardRef}
          className="mt-14 box-border grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-8 md:gap-12 items-center"
          style={{
            ...reveal(cardVisible, 0, 28),
            backgroundColor: '#fff',
            border: `1px solid ${theme.colors.newsBorder}`,
            borderRadius: '28px',
            padding: '40px',
          }}
        >
          {/* Photo + upload button */}
          <div className="flex justify-center" style={r(150)}>
            <div className="relative" style={{ width: 200, height: 200 }}>
              {person.image ? (
                <img
                  src={person.image}
                  alt={person.name}
                  width="200"
                  height="200"
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                  }}
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    border: `2px dashed ${theme.colors.accent}`,
                    color: theme.colors.accent,
                    fontFamily: theme.fonts.main,
                    fontSize: '0.75rem',
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
                  <svg className="pm-spinner" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme.colors.accent} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                </div>
              )}

              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={uploading}
                aria-label="Upload new photo"
                title="Upload new photo"
                className="absolute flex items-center justify-center rounded-full border-0 cursor-pointer transition-transform duration-200 hover:scale-110 disabled:opacity-60"
                style={{
                  right: '4%',
                  bottom: '4%',
                  width: 40,
                  height: 40,
                  background: theme.colors.accent,
                  color: '#fff',
                  fontSize: 26,
                  lineHeight: 1,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                }}
              >
                +
              </button>
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            </div>
          </div>

          {/* Details */}
          <div>
            <p
              className="uppercase m-0"
              style={{
                fontFamily: theme.fonts.main,
                color: theme.colors.accent,
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                ...r(100),
              }}
            >
              Research Scholar
            </p>

            {/* name: click to edit */}
            <h2
              className="m-0 mt-2"
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: 500,
                fontSize: '2rem',
                lineHeight: 1.2,
                color: theme.colors.heading,
                ...r(180),
              }}
            >
              <InlineText
                as="span"
                value={person.name || ''}
                placeholder="Click to add a name"
                onSave={(v) => saveField('name', v)}
              >
                {person.name}
              </InlineText>
            </h2>

            {/* mid description: first line = position, rest = bio. Click anywhere on it to edit */}
            <div className="mt-2" style={{ maxWidth: '40rem', ...r(240) }}>
              <InlineText
                multiline
                value={person.mid_description || ''}
                placeholder="Click to add a position line and a short bio"
                onSave={(v) => saveField('mid_description', v)}
                editorStyle={{
                  fontFamily: theme.fonts.body,
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: theme.colors.body,
                }}
              >
                {positionLine && (
                  <p className="m-0" style={{ fontFamily: theme.fonts.body, fontSize: '1.05rem', color: theme.colors.body }}>
                    {positionLine}
                  </p>
                )}
                {bioParagraphs.length > 0 && (
                  <div className="mt-3">
                    {bioParagraphs.map((text, i) => (
                      <p
                        key={i}
                        className="m-0 mb-3"
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: '1.05rem',
                          lineHeight: 1.7,
                          color: theme.colors.body,
                        }}
                      >
                        {text}
                      </p>
                    ))}
                  </div>
                )}
              </InlineText>
            </div>

            <Roles roles={roles} onAdd={addRole} onRemove={removeRole} style={r(380)} />

            <div className="flex flex-wrap items-center gap-6 mt-7">
              <Link
                to="/dr-ferrocene"
                className="people-bio uppercase"
                style={{
                  fontFamily: theme.fonts.main,
                  color: theme.colors.accent,
                  fontSize: '0.8rem',
                  letterSpacing: '0.2em',
                  textDecoration: 'none',
                  ...r(450),
                }}
              >
                Full bio <span className="people-arrow">→</span>
              </Link>

              <SocialIcons links={links} visible={cardVisible} baseDelay={550} />
            </div>
          </div>
        </div>

        <TeamSection onNotice={setNotice} />
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

export default PeopleMe;