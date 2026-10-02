// EducationCareer.jsx - timeline you can edit: add above/below, edit, delete
import React, { useCallback, useEffect, useRef, useState } from 'react';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';

/* ---------- Start fetching as soon as this file is imported, and cache the result ---------- */
let educationPromise = null;
const fetchEducation = () => {
  if (!educationPromise) {
    educationPromise = fetch(`${API_URL}/api/education`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to load education:', err);
        educationPromise = null; // allow retry on next mount
        return [];
      });
  }
  return educationPromise;
};
fetchEducation();

/* ---------- Reveal when scrolled into view ---------- */
const useInView = (threshold = 0.05) => {
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

/* ---------- Date label: "PRESENT", "2024", or "2019 – 2022" ---------- */
const getDateLabel = (start = '', end = '') => {
  const s = (start || '').trim();
  const e = (end || '').trim();
  if (!e) return 'Present';
  if (!s || s === e) return e;
  return `${s} – ${e}`;
};

/* ---------- form helpers ---------- */
const emptyDraft = {
  heading: '',
  start_date: '',
  end_date: '',
  university: '',
  location: '',
  subjects: '',
};

const toDraft = (item) => ({
  heading: item.heading || '',
  start_date: item.start_date || '',
  end_date: item.end_date || '',
  university: item.university || '',
  location: item.location || '',
  subjects: (Array.isArray(item.subjects) ? item.subjects : []).join(', '),
});

// commas or new lines both separate subjects
const parseSubjects = (text) =>
  text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const labelStyle = {
  fontFamily: theme.fonts.main,
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: theme.colors.body,
  opacity: 0.7,
};

const Field = ({ label, className = '', children }) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    <span style={labelStyle}>{label}</span>
    {children}
  </label>
);

/* ---------- Form used both for "add" and "edit" ---------- */
const EntryForm = ({ title, initial, onSave, onCancel }) => {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = async () => {
    if (saving) return;
    if (!draft.heading.trim()) {
      setError('Heading is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...draft, subjects: parseSubjects(draft.subjects) });
      // on success the parent closes this form
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
    <div
      onKeyDown={onKeyDown}
      className="relative"
      style={{
        border: `1px dashed ${theme.colors.accent}`,
        borderRadius: 12,
        padding: 20,
        maxWidth: '44rem',
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          left: '-46px',
          top: '26px',
          width: '12px',
          height: '12px',
          border: `2px solid ${theme.colors.accent}`,
          background: theme.colors.background,
        }}
      />

      <p className="m-0 mb-4 uppercase" style={{ ...labelStyle, opacity: 1, color: theme.colors.accent }}>
        {title}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Heading *" className="sm:col-span-2">
          <input ref={firstRef} className="tl-field" value={draft.heading} maxLength={255} onChange={set('heading')} />
        </Field>

        <Field label="Start (e.g. 2019)">
          <input className="tl-field" value={draft.start_date} maxLength={50} onChange={set('start_date')} />
        </Field>
        <Field label="End (empty = Present)">
          <input className="tl-field" value={draft.end_date} maxLength={50} onChange={set('end_date')} />
        </Field>

        <Field label="University / place">
          <input className="tl-field" value={draft.university} maxLength={255} onChange={set('university')} />
        </Field>
        <Field label="Location">
          <input className="tl-field" value={draft.location} maxLength={255} onChange={set('location')} />
        </Field>

        <Field label="Subjects / details (separate with commas)" className="sm:col-span-2">
          <textarea className="tl-field" rows={3} value={draft.subjects} onChange={set('subjects')} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="m-0 mt-3" style={{ color: theme.colors.accent, fontFamily: theme.fonts.body }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-5">
        <button type="button" onClick={submit} disabled={saving} className="tl-btn tl-btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="tl-btn">
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ---------- One timeline entry ---------- */
const TimelineItem = ({ item, index, onAdd, onEdit, onDelete }) => {
  const [ref, visible] = useInView();

  const place = [item.university, item.location].filter(Boolean).join(' · ');
  const details = Array.isArray(item.subjects) ? item.subjects.filter(Boolean).join(', ') : '';
  const delay = Math.min(index, 3) * 80;

  return (
    <li
      ref={ref}
      className="tl-item relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 400ms ease ${delay}ms, transform 400ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
      }}
    >
      {/* + above: adds a new entry BEFORE this one */}
      <button
        type="button"
        className="tl-add tl-tool"
        style={{ top: '-24px' }}
        onClick={() => onAdd(`before:${item.id}`)}
        aria-label="Add entry above"
        title="Add entry above"
      >
        +
      </button>

      <span
        className="absolute rounded-full"
        style={{
          left: '-46px',
          top: '5px',
          width: '12px',
          height: '12px',
          backgroundColor: theme.colors.accent,
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <p
          className="uppercase m-0"
          style={{
            fontFamily: theme.fonts.main,
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
            color: theme.colors.body,
          }}
        >
          {getDateLabel(item.start_date, item.end_date)}
        </p>

        <div className="tl-tool flex gap-3">
          <button type="button" className="tl-link" onClick={() => onEdit(item.id)}>
            Edit
          </button>
          <button type="button" className="tl-link" onClick={() => onDelete(item)}>
            Delete
          </button>
        </div>
      </div>

      <h3
        className="m-0 mt-2"
        style={{
          fontFamily: theme.fonts.heading,
          fontWeight: 500,
          fontSize: '1.6rem',
          lineHeight: 1.25,
          color: theme.colors.heading,
        }}
      >
        {item.heading}
      </h3>

      {place && (
        <p className="m-0 mt-2" style={{ fontFamily: theme.fonts.body, fontSize: '1.05rem', color: theme.colors.accent }}>
          {place}
        </p>
      )}

      {details && (
        <p
          className="m-0 mt-2"
          style={{
            fontFamily: theme.fonts.body,
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: theme.colors.body,
            maxWidth: '44rem',
          }}
        >
          {details}
        </p>
      )}

      {/* + below: adds a new entry AFTER this one */}
      <button
        type="button"
        className="tl-add tl-tool"
        style={{ bottom: '-24px' }}
        onClick={() => onAdd(`after:${item.id}`)}
        aria-label="Add entry below"
        title="Add entry below"
      >
        +
      </button>
    </li>
  );
};

/* ---------- Section ---------- */
const EducationCareer = () => {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(null); // null | "before:<id>" | "after:<id>" | "end"
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [headRef, headVisible] = useInView(0.1);

  useEffect(() => {
    let alive = true;
    fetchEducation().then((data) => {
      if (!alive) return;
      setItems(data);
      setLoaded(true);
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

  // change the list AND the module-level cache, so coming back later isn't stale
  const update = (fn) =>
    setItems((prev) => {
      const next = fn(prev);
      educationPromise = Promise.resolve(next);
      return next;
    });

  const openAdd = (place) => {
    setEditingId(null);
    setAdding(place);
  };
  const openEdit = (id) => {
    setAdding(null);
    setEditingId(id);
  };

  // The forms show the error themselves, so these throw on failure.
  const create = async (fields, place) => {
    const list = await api('/api/education', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ ...fields, place }),
    });
    update(() => list); // server returns the full, correctly ordered list
    setAdding(null);
  };

  const save = async (id, fields) => {
    const row = await api(`/api/education/${id}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(fields),
    });
    update((prev) => prev.map((i) => (i.id === id ? row : i)));
    setEditingId(null);
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.heading}"?`)) return;
    try {
      const list = await api(`/api/education/${item.id}`, { method: 'DELETE' });
      update(() => list);
      if (editingId === item.id) setEditingId(null);
    } catch (err) {
      setNotice(err.message);
    }
  };

  if (!loaded) return null;

  const formRow = (place) => (
    <li key={`new-${place}`} className="relative">
      <EntryForm
        title="New entry"
        initial={emptyDraft}
        onSave={(fields) => create(fields, place)}
        onCancel={() => setAdding(null)}
      />
    </li>
  );

  const rows = [];
  items.forEach((item, i) => {
    if (adding === `before:${item.id}`) rows.push(formRow(adding));

    rows.push(
      editingId === item.id ? (
        <li key={item.id} className="relative">
          <EntryForm
            title="Edit entry"
            initial={toDraft(item)}
            onSave={(fields) => save(item.id, fields)}
            onCancel={() => setEditingId(null)}
          />
        </li>
      ) : (
        <TimelineItem key={item.id} item={item} index={i} onAdd={openAdd} onEdit={openEdit} onDelete={remove} />
      )
    );

    if (adding === `after:${item.id}`) rows.push(formRow(adding));
  });
  if (adding === 'end') rows.push(formRow('end'));

  return (
    <section className="w-full box-border px-6 sm:px-12 pt-8 pb-20">
      <style>{`
        .tl-field {
          font-family: ${theme.fonts.body};
          font-size: 1rem;
          color: ${theme.colors.body};
          background: transparent;
          border: 1px solid ${theme.colors.newsBorder};
          border-radius: 8px;
          padding: 8px 12px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
        }
        .tl-field:focus { border-color: ${theme.colors.accent}; }

        .tl-btn {
          font-family: ${theme.fonts.main};
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${theme.colors.accent};
          background: transparent;
          border: 1px solid ${theme.colors.accent};
          border-radius: 999px;
          padding: 8px 20px;
          cursor: pointer;
        }
        .tl-btn-primary { background: ${theme.colors.accent}; color: #fff; }
        .tl-btn:disabled { opacity: 0.6; cursor: default; }

        .tl-link {
          font-family: ${theme.fonts.main};
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${theme.colors.accent};
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
        }
        .tl-link:hover { text-decoration: underline; }

        /* + buttons sit on the timeline line, above / below each entry */
        .tl-add {
          position: absolute;
          left: -51px;
          width: 22px;
          height: 22px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: ${theme.colors.accent};
          color: #fff;
          font-size: 16px;
          line-height: 22px;
          text-align: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* tools appear on hover / keyboard focus; always visible on touch screens */
        .tl-tool { opacity: 0; transition: opacity 200ms ease; }
        .tl-item:hover .tl-tool,
        .tl-item:focus-within .tl-tool { opacity: 1; }
        @media (hover: none) { .tl-tool { opacity: 0.85; } }

        @media (prefers-reduced-motion: reduce) {
          .tl-item, .tl-head, .tl-tool { transition: none !important; }
          .tl-item, .tl-head { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div
          ref={headRef}
          className="tl-head"
          style={{
            opacity: headVisible ? 1 : 0,
            transform: headVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 400ms ease, transform 400ms cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <p
            className="uppercase m-0 mb-2"
            style={{
              fontFamily: theme.fonts.main,
              color: theme.colors.accent,
              fontSize: '0.85rem',
              letterSpacing: '0.25em',
            }}
          >
            Journey
          </p>
          <h2
            className="m-0 text-4xl sm:text-5xl"
            style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.heading }}
          >
            Education &amp; career
          </h2>
        </div>

        {/* Empty state: the only way to add the very first entry */}
        {items.length === 0 && adding === null && (
          <button type="button" className="tl-btn mt-10" onClick={() => openAdd('end')}>
            + Add first entry
          </button>
        )}

        {/* Timeline */}
        {rows.length > 0 && (
          <ol
            className="list-none m-0 mt-14 p-0 flex flex-col gap-16"
            style={{
              marginLeft: '6px',
              paddingLeft: '40px',
              borderLeft: `1px solid ${theme.colors.newsBorder}`,
            }}
          >
            {rows}
          </ol>
        )}
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

export default EducationCareer;