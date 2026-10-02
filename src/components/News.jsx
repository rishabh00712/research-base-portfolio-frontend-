// News.jsx - news list you can edit (type, date, title, description, link),
// switch on/off (is_active), add new items in the right place, and delete.
// Where a new item goes is decided by which "+" you click (top or bottom edge of a card).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import theme from '../theme';
import { JSON_HEADERS, api } from '../Api';

/* ---------- Icons ---------- */
// Note / document icon (used when is_active = false)
const NoteIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke={theme.colors.accent} strokeWidth="1.5" strokeLinejoin="round">
    <path d="M2 1.5h7l5 5v10H2z" />
    <path d="M9 1.5v5h5" />
  </svg>
);

// Small glowing red dot (used when is_active = true)
const GlowDot = () => (
  <span
    className="glow-dot inline-block rounded-full"
    style={{ width: 10, height: 10, backgroundColor: theme.colors.accent }}
  />
);

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

/* ---------- Helpers ---------- */
// The server sends DATE as "YYYY-MM-DD". Parse manually to avoid timezone shifts.
const formatDate = (raw) => {
  if (!raw) return '';
  const [y, m, d] = String(raw).slice(0, 10).split('-').map(Number);
  if (!y || !m) return '';
  return new Date(y, m - 1, d || 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const todayISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getLinkInfo = (raw = '') => {
  const link = (raw || '').trim();
  if (!link) return null;

  const plain = link.replace(/^mailto:/i, '');
  if (EMAIL_RE.test(plain.split('?')[0])) {
    return { href: `mailto:${plain}`, text: 'Get in touch', arrow: '→', external: false };
  }

  const href = /^(https?:\/\/|#|\/)/i.test(link) ? link : `https://${link}`;
  const external = /^https?:\/\//i.test(href);
  return { href, text: 'Read more', arrow: external ? '↗' : '→', external };
};

/* ---------- Reveal on scroll ---------- */
const useInView = (threshold = 0.15) => {
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
        { threshold }
      );
      observerRef.current.observe(node);
    },
    [threshold]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return [ref, visible];
};

/* ---------- Skeleton card (lazy loader) ---------- */
const SkeletonItem = ({ index, visible }) => (
  <div
    className="news-item grid grid-cols-1 lg:grid-cols-[260px_1fr_auto] gap-4 lg:gap-8 items-center box-border"
    style={{
      backgroundColor: theme.colors.newsBg,
      border: `1px solid ${theme.colors.newsBorder}`,
      borderRadius: '20px',
      padding: '28px 32px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 700ms ease ${index * 120}ms, transform 700ms cubic-bezier(.2,.8,.2,1) ${index * 120}ms`,
    }}
    aria-hidden="true"
  >
    <div className="flex items-center gap-3">
      <span className="skeleton rounded-full" style={{ width: 12, height: 12 }} />
      <span className="skeleton" style={{ width: 110, height: 12 }} />
    </div>
    <div className="flex flex-col gap-2">
      <span className="skeleton" style={{ width: '90%', height: 14 }} />
      <span className="skeleton" style={{ width: '65%', height: 14 }} />
    </div>
    <span className="skeleton" style={{ width: 90, height: 12 }} />
  </div>
);

/* ---------- Click-to-edit text ----------
   Enter / Shift+Enter or clicking outside saves. Esc cancels.
   `required` fields ignore an empty value. */
const Editable = ({ value = '', onSave, placeholder, multiline = false, required = false, bold = false, style }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  const active = useRef(false);

  const begin = () => {
    if (active.current) return;
    active.current = true;
    setDraft(value);
    setEditing(true);
  };

  const finish = (save) => {
    if (!active.current) return;
    active.current = false;
    setEditing(false);
    const v = draft.trim();
    if (save && v !== value && !(required && !v)) onSave(v);
  };

  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    el?.focus();
    el?.setSelectionRange?.(el.value.length, el.value.length);
  }, [editing]);

  useEffect(() => {
    if (!editing || !multiline) return;
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, multiline, draft]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Enter and Shift+Enter both save
      finish(true);
    } else if (e.key === 'Escape') {
      finish(false);
    }
  };

  const weight = bold ? 700 : 'inherit';

  if (editing) {
    const inputStyle = {
      font: 'inherit',
      fontWeight: weight,
      color: 'inherit',
      letterSpacing: 'inherit',
      textTransform: 'inherit',
      background: 'transparent',
      border: 'none',
      borderBottom: `1px dashed ${theme.colors.accent}`,
      outline: 'none',
      padding: 0,
      margin: 0,
    };

    return multiline ? (
      <textarea
        ref={ref}
        rows={1}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={onKeyDown}
        style={{ ...inputStyle, display: 'block', width: '100%', resize: 'none', overflow: 'hidden' }}
      />
    ) : (
      <input
        ref={ref}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={onKeyDown}
        style={{ ...inputStyle, width: `${Math.max(draft.length, (placeholder || '').length, 4) + 1}ch`, maxWidth: '100%' }}
      />
    );
  }

  return (
    <span
      onClick={begin}
      title="Click to edit"
      className="nw-editable"
      style={{ cursor: 'text', fontWeight: weight, opacity: value ? 1 : 0.5, ...style }}
    >
      {value || placeholder}
    </span>
  );
};

/* ---------- Click-to-edit date ---------- */
const DateField = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);
  const active = useRef(false);

  const begin = () => {
    if (active.current) return;
    active.current = true;
    setDraft(value || '');
    setEditing(true);
  };

  const finish = (save) => {
    if (!active.current) return;
    active.current = false;
    setEditing(false);
    if (save && draft !== (value || '')) onSave(draft || null); // empty = remove the date
  };

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
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
          borderBottom: `1px dashed ${theme.colors.accent}`,
          outline: 'none',
          padding: 0,
        }}
      />
    );
  }

  const text = formatDate(value);
  return (
    <span
      onClick={begin}
      title="Click to change the date"
      className="nw-editable"
      style={{ cursor: 'pointer', opacity: text ? 1 : 0.5 }}
    >
      {text || 'Add date'}
    </span>
  );
};

/* ---------- Link cell: show the link button, edit or add the URL ---------- */
const LinkCell = ({ link, onSave }) => {
  const info = getLinkInfo(link);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(link || '');
  const ref = useRef(null);
  const active = useRef(false);

  const begin = () => {
    if (active.current) return;
    active.current = true;
    setDraft(link || '');
    setEditing(true);
  };

  const finish = (save) => {
    if (!active.current) return;
    active.current = false;
    setEditing(false);
    const v = draft.trim();
    if (save && v !== (link || '')) onSave(v); // empty = remove the link
  };

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const small = {
    fontFamily: theme.fonts.main,
    fontSize: '0.8rem',
    letterSpacing: '0.15em',
    color: theme.colors.accent,
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        placeholder="https://… or name@example.com"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
          } else if (e.key === 'Escape') {
            finish(false);
          }
        }}
        className="box-border"
        style={{
          width: 240,
          maxWidth: '100%',
          padding: '6px 10px',
          borderRadius: 8,
          border: `1px dashed ${theme.colors.accent}`,
          background: 'transparent',
          outline: 'none',
          fontFamily: theme.fonts.body,
          fontSize: '0.9rem',
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 lg:justify-end">
      {info ? (
        <>
          <a
            href={info.href}
            {...(info.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="news-cta uppercase no-underline inline-flex items-center gap-2"
            style={small}
          >
            {info.text}
            <span className="news-arrow">{info.arrow}</span>
          </a>
          <button
            type="button"
            onClick={begin}
            aria-label="Edit link"
            title="Edit link"
            className="flex items-center justify-center rounded-full border-0 cursor-pointer p-0"
            style={{ width: 22, height: 22, background: theme.colors.accent, color: '#fff' }}
          >
            <PencilIcon />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={begin}
          className="uppercase cursor-pointer bg-transparent"
          style={{ ...small, opacity: 0.6, border: `1px dashed ${theme.colors.accent}`, borderRadius: 999, padding: '4px 12px' }}
        >
          + Add link
        </button>
      )}
    </div>
  );
};

/* ---------- On / off switch (is_active) ---------- */
const Switch = ({ on, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={on ? 'Active' : 'Inactive'}
    title={on ? 'Active (glowing dot). Click to turn off' : 'Inactive (note icon). Click to turn on'}
    onClick={onToggle}
    className="relative border-0 p-0 cursor-pointer rounded-full flex-shrink-0"
    style={{ width: 36, height: 20, background: on ? theme.colors.accent : '#c9c4c5', transition: 'background 200ms ease' }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'left 200ms ease',
      }}
    />
  </button>
);

/* ---------- Add-news box ---------- */
const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${theme.colors.iconBorder}`,
  outline: 'none',
  fontFamily: theme.fonts.body,
  fontSize: '0.95rem',
  background: '#fff',
};

const labelStyle = {
  display: 'block',
  marginBottom: 4,
  fontFamily: theme.fonts.main,
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: theme.colors.accent,
};

// No "Place" dropdown: the position is fixed by the "+" the user clicked.
const NewsForm = ({ defaultPlace, onCancel, onSubmit }) => {
  const [form, setForm] = useState({
    type: '',
    title: '',
    description: '',
    link: '',
    date: todayISO(),
    is_active: true,
    place: defaultPlace,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return setError('Please enter a title.');
    setBusy(true);
    setError('');
    try {
      await onSubmit({ ...form, date: form.date || null });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div
      className="box-border bg-white"
      style={{
        borderRadius: 20,
        padding: 24,
        border: `1px solid ${theme.colors.newsBorderStrong}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        fontFamily: theme.fonts.body,
      }}
    >
      <p
        className="m-0 mb-4 uppercase"
        style={{ fontFamily: theme.fonts.main, fontSize: '0.8rem', letterSpacing: '0.2em', color: theme.colors.accent }}
      >
        Add news
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle} htmlFor="nf-type">Type</label>
          <input id="nf-type" style={fieldStyle} maxLength={100} placeholder="e.g. Notice, Admissions" value={form.type} onChange={set('type')} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="nf-date">Date</label>
          <input id="nf-date" type="date" style={fieldStyle} value={form.date} onChange={set('date')} />
        </div>
        <div className="sm:col-span-2">
          <label style={labelStyle} htmlFor="nf-title">Title *</label>
          <input id="nf-title" autoFocus style={fieldStyle} placeholder="Short heading" value={form.title} onChange={set('title')} />
        </div>
        <div className="sm:col-span-2">
          <label style={labelStyle} htmlFor="nf-desc">Description</label>
          <textarea id="nf-desc" rows={3} style={{ ...fieldStyle, resize: 'vertical' }} placeholder="A sentence or two" value={form.description} onChange={set('description')} />
        </div>
        <div className="sm:col-span-2">
          <label style={labelStyle} htmlFor="nf-link">Link</label>
          <input id="nf-link" style={fieldStyle} placeholder="https://… or name@example.com" value={form.link} onChange={set('link')} />
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 cursor-pointer" style={{ fontSize: '0.95rem' }}>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
        />
        Active (shows the glowing dot)
      </label>

      {error && (
        <p className="m-0 mt-3" role="alert" style={{ color: theme.colors.accent, fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="border-0 cursor-pointer disabled:opacity-60"
          style={{ background: theme.colors.accent, color: '#fff', padding: '9px 20px', borderRadius: 8 }}
        >
          {busy ? 'Adding…' : 'Add news'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer bg-transparent"
          style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${theme.colors.iconBorder}` }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ---------- "+" button sitting on the top or bottom edge of a card ---------- */
const EdgeAdd = ({ edge, onClick }) => {
  const label = edge === 'top' ? 'Add news above this one' : 'Add news below this one';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="edge-add absolute flex items-center justify-center rounded-full border-0 cursor-pointer p-0"
      style={{
        [edge]: -11,
        left: '50%',
        width: 22,
        height: 22,
        background: theme.colors.accent,
        color: '#fff',
        fontSize: 17,
        lineHeight: 1,
        zIndex: 3,
        boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
      }}
    >
      +
    </button>
  );
};

/* ---------- One news card ---------- */
const NewsItem = ({ item, index, visible, onPatch, onAddAbove, onAddBelow, onDelete }) => {
  const labelFallback = item.is_active ? 'Now' : 'Update';

  return (
    <div
      className="news-item relative grid grid-cols-1 lg:grid-cols-[260px_1fr_auto] gap-4 lg:gap-8 items-center box-border"
      style={{
        backgroundColor: theme.colors.newsBg,
        border: `1px solid ${theme.colors.newsBorder}`,
        borderRadius: '20px',
        padding: '28px 32px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        filter: visible ? 'blur(0)' : 'blur(6px)',
        transition: `opacity 700ms ease ${index * 120}ms, transform 700ms cubic-bezier(.2,.8,.2,1) ${index * 120}ms, filter 700ms ease ${index * 120}ms, box-shadow 300ms ease, border-color 300ms ease`,
      }}
    >
      {/* toolbar: on/off, delete */}
      <div
        className="absolute flex items-center gap-2 bg-white"
        style={{
          top: -14,
          right: 24,
          padding: '4px 10px',
          borderRadius: 999,
          border: `1px solid ${theme.colors.newsBorderStrong}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 2,
        }}
      >
        <Switch on={item.is_active} onToggle={() => onPatch(item.id, { is_active: !item.is_active })} />
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label="Delete this news"
          title="Delete this news"
          className="border-0 bg-transparent cursor-pointer p-0"
          style={{ color: theme.colors.accent, fontSize: 18, lineHeight: 1, width: 18, opacity: 0.7 }}
        >
          ×
        </button>
      </div>

      {/* add a new news above / below this card */}
      <EdgeAdd edge="top" onClick={onAddAbove} />
      <EdgeAdd edge="bottom" onClick={onAddBelow} />

      {/* Label: icon + TYPE · DATE */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 18 }}>
          {item.is_active ? <GlowDot /> : <NoteIcon />}
        </span>
        <span
          className="uppercase inline-flex flex-wrap items-center gap-x-2"
          style={{
            fontFamily: theme.fonts.main,
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
            color: theme.colors.accent,
          }}
        >
          <Editable
            value={item.type || ''}
            placeholder={labelFallback}
            onSave={(v) => onPatch(item.id, { type: v })}
          />
          <span aria-hidden="true">·</span>
          <DateField value={item.date} onSave={(v) => onPatch(item.id, { date: v })} />
        </span>
      </div>

      {/* Text: title + description */}
      <p
        className="m-0"
        style={{
          fontFamily: theme.fonts.body,
          fontSize: '1.05rem',
          lineHeight: 1.65,
          color: theme.colors.heading,
        }}
      >
        <Editable
          bold
          required
          value={item.title}
          placeholder="Title"
          onSave={(v) => onPatch(item.id, { title: v })}
        />{' '}
        <Editable
          multiline
          value={item.description || ''}
          placeholder="Add a description"
          onSave={(v) => onPatch(item.id, { description: v })}
        />
      </p>

      {/* Link */}
      <LinkCell link={item.link} onSave={(v) => onPatch(item.id, { link: v })} />
    </div>
  );
};

/* ---------- Section ---------- */
const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  // { place: 'top' | 'end' | '<id it follows>', beforeId?: id, afterId?: id }
  // beforeId / afterId = which card the add box is drawn next to
  const [adding, setAdding] = useState(null);
  const [notice, setNotice] = useState('');
  const [ref, visible] = useInView();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/news');
        if (!cancelled) setNews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  /* change one or more fields of an item (instant, rolls back on error) */
  const patchItem = async (id, patch) => {
    const before = news.find((n) => n.id === id);
    if (!before) return;
    const revert = Object.fromEntries(Object.keys(patch).map((k) => [k, before[k]]));

    setNews((list) => list.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    try {
      const saved = await api(`/api/news/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(patch),
      });
      setNews((list) => list.map((n) => (n.id === id ? { ...n, ...saved } : n)));
    } catch (err) {
      setNews((list) => list.map((n) => (n.id === id ? { ...n, ...revert } : n)));
      setNotice(err.message);
    }
  };

  const addNews = async (values) => {
    const data = await api('/api/news', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(values),
    });
    setNews(data);
    setAdding(null);
  };

  const deleteNews = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      const data = await api(`/api/news/${item.id}`, { method: 'DELETE' });
      setNews(data);
    } catch (err) {
      setNotice(err.message);
    }
  };

  // The server only needs "after which item". So "above" the first card = 'top',
  // and "above" any other card = "after the card before it".
  const openAbove = (index) =>
    setAdding({
      place: index === 0 ? 'top' : String(news[index - 1].id),
      beforeId: news[index].id,
    });
  const openBelow = (index) => setAdding({ place: String(news[index].id), afterId: news[index].id });

  const formBeforeId = adding?.beforeId ?? null;
  const formAfterId = adding?.afterId ?? null;

  const form = adding && (
    <NewsForm
      key={`${adding.place}-${formBeforeId ?? 'x'}-${formAfterId ?? 'x'}`}
      defaultPlace={adding.place}
      onCancel={() => setAdding(null)}
      onSubmit={addNews}
    />
  );

  return (
    <section ref={ref} className="w-full box-border px-6 sm:px-12 pt-4 pb-4">
      <style>{`
        .news-item:hover {
          box-shadow: 0 10px 28px rgba(154, 33, 57, 0.15);
          border-color: ${theme.colors.newsBorderStrong} !important;
        }
        .news-arrow { display: inline-block; transition: transform 300ms ease; }
        .news-cta:hover .news-arrow { transform: translateX(6px); }

        .news-cta { position: relative; padding-bottom: 4px; }
        .news-cta::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 1px;
          background-color: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 350ms cubic-bezier(.2,.8,.2,1);
        }
        .news-cta:hover::after { transform: scaleX(1); }

        .edge-add { transform: translateX(-50%); transition: transform 200ms ease; }
        .edge-add:hover { transform: translateX(-50%) scale(1.15); }

        .nw-editable { border-radius: 4px; transition: background 200ms ease; }
        .nw-editable:hover { background: rgba(0,0,0,0.05); }

        .news-line { transform-origin: left; transform: scaleX(0); transition: transform 900ms cubic-bezier(.2,.8,.2,1) 300ms; }
        .news-in-view .news-line { transform: scaleX(1); }

        .glow-dot { animation: glowPulse 2s ease-in-out infinite; }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 3px 1px rgba(185, 46, 72, 0.35); }
          50%      { box-shadow: 0 0 9px 3px rgba(185, 46, 72, 0.6); }
        }

        .skeleton {
          display: block;
          border-radius: 6px;
          background: linear-gradient(90deg, rgba(154,33,57,0.08) 25%, rgba(154,33,57,0.18) 50%, rgba(154,33,57,0.08) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .glow-dot { animation: none; box-shadow: 0 0 6px 2px rgba(185,46,72,0.45); }
          .skeleton { animation: none; }
        }
      `}</style>

      <div className={`mx-auto max-w-6xl ${visible ? 'news-in-view' : ''}`}>
        {/* Heading */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 700ms ease, transform 700ms ease',
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
            Latest
          </p>

          <h2
            className="inline-block m-0 relative pb-1 text-4xl sm:text-5xl"
            style={{
              fontFamily: theme.fonts.heading,
              fontWeight: 400,
              color: theme.colors.heading,
            }}
          >
            News
            <span
              className="news-line absolute left-0 bottom-0 w-full"
              style={{ height: '3px', backgroundColor: theme.colors.accent }}
            />
          </h2>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-8 mt-10" aria-busy={loading}>
          {loading ? (
            [0, 1].map((i) => <SkeletonItem key={`sk-${i}`} index={i} visible={visible} />)
          ) : (
            <>
              {news.map((item, i) => (
                <React.Fragment key={item.id}>
                  {formBeforeId === item.id && form}
                  <NewsItem
                    item={item}
                    index={i}
                    visible={visible}
                    onPatch={patchItem}
                    onAddAbove={() => openAbove(i)}
                    onAddBelow={() => openBelow(i)}
                    onDelete={deleteNews}
                  />
                  {formAfterId === item.id && form}
                </React.Fragment>
              ))}

              {/* add box for an empty list */}
              {adding && formBeforeId === null && formAfterId === null && form}

              {/* empty list: the first + button */}
              {news.length === 0 && !adding && (
                <button
                  type="button"
                  onClick={() => setAdding({ place: 'end' })}
                  className="cursor-pointer bg-transparent uppercase"
                  style={{
                    padding: '22px',
                    borderRadius: 20,
                    border: `2px dashed ${theme.colors.accent}`,
                    color: theme.colors.accent,
                    fontFamily: theme.fonts.main,
                    fontSize: '0.85rem',
                    letterSpacing: '0.2em',
                  }}
                >
                  + Add news
                </button>
              )}
            </>
          )}
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

export default News;