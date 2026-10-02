// src/components/Research.jsx
// Research cards with Edit, Delete and Add (left / right) buttons on every card.
import React, { useCallback, useEffect, useState } from 'react';
import theme from '../theme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const c = theme.colors;

// 4 buttons, each with its own colour mix
// (all colours must be DARK enough for the white text on the buttons)
const SECTIONS = [
  { key: 'literature_survey', label: 'Literature Survey', no: '01', from: c.cardDark, to: c.cardLight },
  { key: 'apparatus', label: 'Apparatus', no: '02', from: c.selectionBackground, to: c.textActive },
  { key: 'methodology', label: 'Methodology', no: '03', from: c.heading, to: '#5b3a4a' },
  { key: 'conclusion', label: 'Conclusion', no: '04', from: c.accent, to: c.selectionBackground },
];
// "2025-03-01..." -> "1 March 2025" (no timezone shift)
const formatDate = (d) => {
  if (!d) return '';
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dt = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d);
  return isNaN(dt)
    ? String(d)
    : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

// 3 cards in a row on big screens, 2 on tablets, 1 on phones
const useColumns = () => {
  const get = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };
  const [cols, setCols] = useState(get);
  useEffect(() => {
    const onResize = () => setCols(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
};

const labelStyle = {
  fontFamily: theme.fonts.main,
  letterSpacing: theme.fonts.letterSpacing,
  fontSize: theme.fonts.size,
  textTransform: 'uppercase',
};

// Heading: every letter rises in one after another (same as the Home page)
const Letters = ({ text, start = 0 }) => {
  let n = 0;
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((ch, i) => (
              <span key={i} className="rs-letter" style={{ animationDelay: `${start + (n++) * 40}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
};

const CloseButton = ({ onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Close"
    className={`rs-close flex items-center justify-center rounded-full cursor-pointer ${className}`}
    style={{
      width: 36,
      height: 36,
      border: `1px solid ${c.heroTagBorder}`,
      backgroundColor: c.heroTagBg,
      color: c.heroTagText,
      fontSize: 18,
      lineHeight: 1,
    }}
  >
    ✕
  </button>
);

// small pills on the card
const pillStyle = {
  fontFamily: theme.fonts.main,
  letterSpacing: '1px',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  backgroundColor: c.heroTagBg,
  border: `1px solid ${c.heroTagBorder}`,
  color: c.heroTagText,
  borderRadius: 999,
  padding: '7px 13px',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
};

// round buttons on the card (+, edit, delete)
const roundBtn = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: `1px solid ${c.heroTagBorder}`,
  backgroundColor: 'rgba(35,31,32,0.72)',
  color: '#fff',
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: `1px solid ${c.newsBorder}`,
  borderRadius: 10,
  fontFamily: theme.fonts.body,
  fontSize: '1rem',
  color: c.body,
  backgroundColor: '#fff',
};

/* ---------- Full-screen image popup ---------- */
const ImageLightbox = ({ url, onClose }) => (
  <div
    className="rs-fade fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    onClick={onClose}
  >
    <CloseButton onClick={onClose} className="absolute top-4 right-4" />
    <img
      src={url}
      alt="Research"
      className="rs-pop"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain' }}
    />
  </div>
);

/* ---------- Big popup for the 4 sections (read only) ---------- */
const SectionModal = ({ research, section, onClose }) => (
  <div
    className="rs-fade fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(35,31,32,0.62)', backdropFilter: 'blur(6px)' }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="rs-pop relative w-full"
      style={{
        maxWidth: 900,
        maxHeight: '92vh',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden auto',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${section.from}, ${section.to})`,
          padding: '28px 32px',
          color: '#fff',
        }}
      >
        <p style={{ ...labelStyle, margin: 0, opacity: 0.85 }}>{formatDate(research.research_date)}</p>
        <h2
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: 400,
            fontSize: '1.7rem',
            margin: '6px 48px 0 0',
          }}
        >
          {research.title}
        </h2>
      </div>
      <CloseButton onClick={onClose} className="absolute top-4 right-4" />

      <div style={{ padding: '28px 32px 36px' }}>
        <h3
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: 400,
            color: c.accent,
            fontSize: '1.6rem',
            margin: '0 0 14px',
          }}
        >
          {section.label}
        </h3>

        <p
          style={{
            margin: 0,
            fontFamily: theme.fonts.body,
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: c.body,
            whiteSpace: 'pre-line',
          }}
        >
          {research[section.key] && research[section.key].trim()
            ? research[section.key]
            : 'Nothing has been added here yet.'}
        </p>
      </div>
    </div>
  </div>
);

/* ---------- Add / Edit form ---------- */
const FIELDS = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'research_date', label: 'Date', type: 'date', required: true },
  { key: 'description', label: 'Short description', type: 'area', rows: 3 },
  { key: 'paper_url', label: 'Paper link', type: 'url' },
  { key: 'pdf_url', label: 'PDF link', type: 'url' },
  { key: 'literature_survey', label: 'Literature Survey', type: 'area', rows: 5 },
  { key: 'apparatus', label: 'Apparatus', type: 'area', rows: 5 },
  { key: 'methodology', label: 'Methodology', type: 'area', rows: 5 },
  { key: 'conclusion', label: 'Conclusion', type: 'area', rows: 5 },
];

const today = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// mode "edit": initial = the research row. mode "add": anchor = { id, side } or null
const ResearchForm = ({ mode, initial, anchor, onSaved, onClose }) => {
  const [values, setValues] = useState(() => {
    const v = {};
    FIELDS.forEach((f) => {
      v[f.key] = (initial && initial[f.key]) || '';
    });
    if (!v.research_date) v.research_date = today();
    return v;
  });
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // preview of a newly chosen file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const currentImage = file ? preview : removeImage ? null : initial && initial.image_url;

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      FIELDS.forEach((f) => fd.append(f.key, values[f.key] || ''));
      if (file) fd.append('image', file);
      if (removeImage && !file) fd.append('remove_image', '1');
      if (mode === 'add' && anchor) {
        fd.append('anchor_id', anchor.id);
        fd.append('place', anchor.side); // "left" or "right"
      }

      const res = await fetch(
        mode === 'edit' ? `${API_URL}/api/research/${initial.id}` : `${API_URL}/api/research`,
        {
          method: mode === 'edit' ? 'PATCH' : 'POST',
          body: fd, // the browser sets the multipart header itself
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save. Please try again.');
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const heading =
    mode === 'edit'
      ? 'Edit research'
      : anchor
      ? `Add research to the ${anchor.side}`
      : 'Add research';

  return (
    <div
      className="rs-fade fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(35,31,32,0.62)', backdropFilter: 'blur(6px)' }}
    >
      <form
        onSubmit={submit}
        className="rs-pop relative w-full"
        style={{
          maxWidth: 760,
          maxHeight: '92vh',
          backgroundColor: '#fff',
          borderRadius: 20,
          overflow: 'hidden auto',
          padding: '28px 32px 32px',
          boxSizing: 'border-box',
        }}
      >
        <CloseButton onClick={onClose} className="absolute top-4 right-4" />
        <h3
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: 400,
            color: c.heading,
            fontSize: '1.6rem',
            margin: '0 48px 20px 0',
          }}
        >
          {heading}
        </h3>

        {/* image */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ ...labelStyle, color: c.accent, margin: '0 0 8px' }}>Image</p>
          {currentImage && (
            <img
              src={currentImage}
              alt="Selected"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, display: 'block' }}
            />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
                setRemoveImage(false);
              }}
              style={{ fontFamily: theme.fonts.body, fontSize: '0.9rem' }}
            />
            {mode === 'edit' && initial.image_url && !file && (
              <button
                type="button"
                onClick={() => setRemoveImage((r) => !r)}
                style={{ ...pillStyle, color: c.accent, borderColor: c.accent, backgroundColor: '#fff' }}
              >
                {removeImage ? 'Keep current image' : 'Remove image'}
              </button>
            )}
          </div>
        </div>

        {FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label
              htmlFor={`rs-${f.key}`}
              style={{ ...labelStyle, color: c.accent, display: 'block', margin: '0 0 6px' }}
            >
              {f.label}
              {f.required ? ' *' : ''}
            </label>
            {f.type === 'area' ? (
              <textarea
                id={`rs-${f.key}`}
                rows={f.rows}
                value={values[f.key]}
                onChange={set(f.key)}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            ) : (
              <input
                id={`rs-${f.key}`}
                type={f.type}
                required={f.required}
                value={values[f.key]}
                onChange={set(f.key)}
                style={inputStyle}
              />
            )}
          </div>
        ))}

        {error && (
          <p role="alert" style={{ color: c.accent, fontFamily: theme.fonts.body, margin: '4px 0 12px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ ...pillStyle, color: c.heading, borderColor: c.newsBorder, backgroundColor: '#fff' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...pillStyle,
              color: '#fff',
              borderColor: c.accent,
              backgroundColor: c.accent,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add research'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------- Big box that opens under the row ---------- */
const DetailBox = ({ research, onClose, onImage, onSection }) => (
  <div
    className="rs-pop relative"
    style={{
      backgroundColor: '#fff',
      border: `1px solid ${c.newsBorder}`,
      borderLeft: `3px solid ${c.newsBorderStrong}`,
      borderRadius: 20,
      padding: 24,
    }}
  >
    <CloseButton onClick={onClose} className="absolute top-4 right-4" />

    <p style={{ ...labelStyle, color: c.accent, margin: 0 }}>{formatDate(research.research_date)}</p>
    <h3
      style={{
        fontFamily: theme.fonts.heading,
        fontWeight: 400,
        color: c.heading,
        fontSize: '1.6rem',
        margin: '6px 48px 16px 0',
      }}
    >
      {research.title}
    </h3>

    {research.image_url && (
      <img
        src={research.image_url}
        alt={research.title || 'Research'}
        onClick={() => onImage(research.image_url)}
        style={{
          width: '100%',
          maxHeight: 460,
          objectFit: 'cover',
          borderRadius: 14,
          cursor: 'zoom-in',
          display: 'block',
        }}
      />
    )}

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 14,
        marginTop: 20,
      }}
    >
      {SECTIONS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          className="rs-section-btn rs-hover rs-reveal"
          onClick={() => onSection(research.id, s)}
          style={{
            animationDelay: `${150 + i * 90}ms`,
            background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '16px 18px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span>
            <span
              style={{
                display: 'block',
                fontFamily: theme.fonts.main,
                fontSize: '0.7rem',
                letterSpacing: '2px',
                opacity: 0.75,
              }}
            >
              {s.no}
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: theme.fonts.heading,
                fontSize: '1.2rem',
                marginTop: 2,
              }}
            >
              <span className="rs-ul">{s.label}</span>
            </span>
          </span>
          <span
            className="rs-arrow"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            →
          </span>
        </button>
      ))}
    </div>
  </div>
);

/* ---------- One research card (image as background) ---------- */
const ResearchCard = ({ research, isOpen, onToggle }) => (
  <div
    onClick={onToggle}
    className="research-card"
    style={{
      backgroundColor: '#231f20',
      backgroundImage: research.image_url
        ? `linear-gradient(to top, rgba(35,31,32,0.9), rgba(35,31,32,0.25)), url("${research.image_url}")`
        : `linear-gradient(135deg, ${c.heading}, ${c.accent})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: 20,
      padding: '24px 22px 22px',
      height: 340,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      cursor: 'pointer',
      color: '#fff',
      outline: isOpen ? `2px solid ${c.accent}` : 'none',
      outlineOffset: 3,
    }}
  >
    <p style={{ ...labelStyle, fontSize: '0.72rem', margin: 0, color: '#fff', opacity: 0.85 }}>
      {formatDate(research.research_date)}
    </p>
    <h2
      style={{
        fontFamily: theme.fonts.heading,
        fontWeight: 400,
        fontSize: '1.4rem',
        lineHeight: 1.25,
        margin: '6px 0 8px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {research.title}
    </h2>
    {research.description && (
      <p
        style={{
          fontFamily: theme.fonts.body,
          fontSize: '0.92rem',
          lineHeight: 1.6,
          margin: '0 0 16px',
          opacity: 0.92,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {research.description}
      </p>
    )}

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rs-hover"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={pillStyle}
      >
        <span className="rs-ul">Read More</span>
      </button>

      {research.paper_url && (
        <a
          href={research.paper_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rs-hover"
          onClick={(e) => e.stopPropagation()}
          style={pillStyle}
        >
          <span className="rs-ul">Read Paper</span>
        </a>
      )}

      {research.pdf_url && (
        <a
          href={research.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rs-hover"
          onClick={(e) => e.stopPropagation()}
          style={pillStyle}
        >
          <span className="rs-ul">PDF Link</span>
        </a>
      )}
    </div>
  </div>
);

/* ---------- Edit / Delete / Add buttons drawn on top of a card ---------- */
const CardControls = ({ onEdit, onDelete, onAddLeft, onAddRight, busy }) => {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };
  return (
    <>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 2 }}>
        <button
          type="button"
          className="rs-admin-btn"
          aria-label="Edit research"
          title="Edit"
          disabled={busy}
          onClick={stop(onEdit)}
          style={{ ...roundBtn, fontSize: 15 }}
        >
          ✎
        </button>
        <button
          type="button"
          className="rs-admin-btn"
          aria-label="Delete research"
          title="Delete"
          disabled={busy}
          onClick={stop(onDelete)}
          style={{ ...roundBtn, fontSize: 15 }}
        >
          🗑
        </button>
      </div>
      <button
        type="button"
        className="rs-admin-btn"
        aria-label="Add research to the left"
        title="Add to the left"
        disabled={busy}
        onClick={stop(onAddLeft)}
        style={{ ...roundBtn, position: 'absolute', left: 10, top: '50%', marginTop: -17, zIndex: 2 }}
      >
        +
      </button>
      <button
        type="button"
        className="rs-admin-btn"
        aria-label="Add research to the right"
        title="Add to the right"
        disabled={busy}
        onClick={stop(onAddRight)}
        style={{ ...roundBtn, position: 'absolute', right: 10, top: '50%', marginTop: -17, zIndex: 2 }}
      >
        +
      </button>
    </>
  );
};

/* ---------- Loading placeholder card ---------- */
const CardSkeleton = ({ index }) => (
  <div
    className="rs-pulse rs-reveal"
    aria-hidden="true"
    style={{
      animationDelay: `${index * 90}ms`,
      height: 340,
      borderRadius: 20,
      backgroundColor: c.newsBg,
      border: `1px solid ${c.newsBorder}`,
      padding: '24px 22px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 12,
    }}
  >
    <div style={{ width: '40%', height: 10, borderRadius: 8, backgroundColor: c.newsBorder }} />
    <div style={{ width: '80%', height: 20, borderRadius: 8, backgroundColor: c.newsBorder }} />
    <div style={{ width: '95%', height: 10, borderRadius: 8, backgroundColor: c.newsBorder }} />
    <div style={{ width: '70%', height: 10, borderRadius: 8, backgroundColor: c.newsBorder }} />
  </div>
);

/* ---------- Page ---------- */
const Research = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // image url
  const [modal, setModal] = useState(null); // { id, section }
  const [form, setForm] = useState(null); // { mode, initial?, anchor? }
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const cols = useColumns();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/research`);
      if (!res.ok) throw new Error('backend not reachable');
      const rows = await res.json();
      setItems([...rows].sort((a, b) => Number(a.position) - Number(b.position)));
      setError('');
    } catch (err) {
      console.error('Failed to load research:', err);
      setError('Could not load research. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete "${r.title}"? Its image will also be removed. This cannot be undone.`)) return;
    setBusyId(r.id);
    setNotice('');
    try {
      const res = await fetch(`${API_URL}/api/research/${r.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not delete. Please try again.');
      }
      if (openId === r.id) setOpenId(null);
      await load();
    } catch (err) {
      setNotice(err.message || 'Could not delete. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = async () => {
    setForm(null);
    await load();
  };

  // Esc closes the top-most read-only popup (the form is closed with its own buttons)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || form) return;
      if (modal) setModal(null);
      else if (lightbox) setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, lightbox, form]);

  const modalResearch = modal ? items.find((r) => r.id === modal.id) : null;
  const openIndex = items.findIndex((r) => r.id === openId);

  // cards + the detail box placed right under the row of the opened card
  const cells = items.flatMap((r, i) => {
    const out = [
      <div
        key={`card-${r.id}`}
        className="rs-reveal"
        style={{ animationDelay: `${Math.min(i * 90, 700)}ms`, position: 'relative' }}
      >
        <ResearchCard
          research={r}
          isOpen={openId === r.id}
          onToggle={() => setOpenId(openId === r.id ? null : r.id)}
        />
        <CardControls
          busy={busyId === r.id}
          onEdit={() => setForm({ mode: 'edit', initial: r })}
          onDelete={() => handleDelete(r)}
          onAddLeft={() => setForm({ mode: 'add', anchor: { id: r.id, side: 'left' } })}
          onAddRight={() => setForm({ mode: 'add', anchor: { id: r.id, side: 'right' } })}
        />
      </div>,
    ];
    const endOfRow = i % cols === cols - 1 || i === items.length - 1;
    if (endOfRow && openIndex >= 0 && Math.floor(openIndex / cols) === Math.floor(i / cols)) {
      out.push(
        <div key={`detail-${openId}`} style={{ gridColumn: '1 / -1' }}>
          <DetailBox
            research={items[openIndex]}
            onClose={() => setOpenId(null)}
            onImage={setLightbox}
            onSection={(id, section) => setModal({ id, section })}
          />
        </div>
      );
    }
    return out;
  });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 24,
  };

  return (
    <section className="w-full box-border px-6 sm:px-12 py-16">
      <style>{`
        @keyframes rs-rise {
          from { opacity: 0; transform: translateY(0.45em); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes rs-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes rs-pop {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes rs-fade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

        .rs-label  { opacity: 0; animation: rs-rise 600ms ease-out forwards; }
        .rs-letter { display: inline-block; opacity: 0; animation: rs-rise 550ms cubic-bezier(.2,.8,.2,1) forwards; }
        .rs-reveal { opacity: 0; animation: rs-up 600ms cubic-bezier(.2,.8,.2,1) forwards; }
        .rs-pop    { animation: rs-pop 320ms cubic-bezier(.2,.8,.2,1); }
        .rs-fade   { animation: rs-fade 220ms ease-out; }
        .rs-pulse  { animation: rs-pulse 1.4s ease-in-out infinite, rs-up 600ms cubic-bezier(.2,.8,.2,1) forwards; }

        .research-card { transition: transform 220ms ease, box-shadow 220ms ease; }
        .research-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(35,31,32,0.18); }

        .rs-section-btn { transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease; }
        .rs-section-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(35,31,32,0.25); filter: brightness(1.08); }
        .rs-arrow { transition: transform 220ms ease; }
        .rs-section-btn:hover .rs-arrow { transform: translateX(4px); }

        .rs-close { transition: background-color 200ms ease, color 200ms ease; }
        .rs-close:hover { background-color: ${c.accent} !important; color: #fff !important; }

        .rs-admin-btn { transition: background-color 200ms ease, transform 200ms ease; }
        .rs-admin-btn:hover:not(:disabled) { background-color: ${c.accent} !important; transform: scale(1.08); }
        .rs-admin-btn:disabled { opacity: 0.5; cursor: not-allowed !important; }
        .rs-admin-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

        .rs-ul { position: relative; display: inline-block; padding-bottom: 3px; }
        .rs-ul::after {
          content: ''; position: absolute; left: 0; bottom: 0; width: 100%; height: 1.5px;
          background: currentColor; transform: scaleX(0); transform-origin: left;
          transition: transform 260ms ease;
        }
        .rs-hover:hover .rs-ul::after,
        .rs-hover:focus-visible .rs-ul::after { transform: scaleX(1); }
        .rs-hover:focus-visible { outline: 2px solid ${c.accent}; outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .rs-label, .rs-letter, .rs-reveal { animation: none; opacity: 1; }
          .rs-pop, .rs-fade, .rs-pulse { animation: none; }
          .research-card, .rs-section-btn, .rs-arrow, .rs-ul::after, .rs-admin-btn { transition: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <p className="rs-label" style={{ ...labelStyle, color: c.accent, margin: 0 }}>
          Research
        </p>
        <h1
          className="text-4xl sm:text-5xl"
          style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: c.heading, margin: '8px 0 40px' }}
        >
          <Letters text="Our research" start={60} />
        </h1>

        {notice && (
          <p role="alert" style={{ color: c.accent, fontFamily: theme.fonts.body, margin: '0 0 16px' }}>
            {notice}
          </p>
        )}

        {loading && (
          <div style={gridStyle}>
            {Array.from({ length: cols }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {!loading && error && <p style={{ color: c.accent, fontFamily: theme.fonts.body }}>{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="rs-reveal">
            <p style={{ color: c.body, fontFamily: theme.fonts.body, fontSize: '1.1rem' }}>
              Currently no research paper is written yet.
            </p>
            <button
              type="button"
              onClick={() => setForm({ mode: 'add', anchor: null })}
              style={{ ...pillStyle, color: '#fff', backgroundColor: c.accent, borderColor: c.accent }}
            >
              Add first research
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && <div style={gridStyle}>{cells}</div>}
      </div>

      {lightbox && <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />}

      {modal && modalResearch && (
        <SectionModal
          key={`${modal.id}-${modal.section.key}`}
          research={modalResearch}
          section={modal.section}
          onClose={() => setModal(null)}
        />
      )}

      {form && (
        <ResearchForm
          key={form.mode === 'edit' ? `edit-${form.initial.id}` : `add-${form.anchor ? form.anchor.id + form.anchor.side : 'first'}`}
          mode={form.mode}
          initial={form.initial}
          anchor={form.anchor}
          onSaved={handleSaved}
          onClose={() => setForm(null)}
        />
      )}
    </section>
  );
};

export default Research;