// BeyondTheBench.jsx - editable: categories (add above/below, rename, delete)
// and project cards (add left/right, edit, delete) -> big popup
import React, { useCallback, useEffect, useRef, useState } from 'react';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';

const API = '/api/beyond-the-bench';

/* ---------- Helpers ---------- */
const toUrl = (value = '') => {
  const v = (value || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const today = () => new Date().toISOString().slice(0, 10);
const isPickableImage = (file) => file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024;

// Heading: every letter rises in one after another
const Letters = ({ text, start = 0 }) => {
  let n = 0;
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((ch, c) => (
              <span key={c} className="btb-letter" style={{ animationDelay: `${start + n++ * 40}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
};

const Chevron = ({ open }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 250ms ease' }}
  >
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const labelStyle = {
  fontFamily: theme.fonts.main,
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: theme.colors.body,
  opacity: 0.7,
};

const Field = ({ label, hint, children }) => (
  <label className="flex flex-col gap-1">
    <span style={labelStyle}>{label}</span>
    {children}
    {hint && <small style={{ fontFamily: theme.fonts.body, fontSize: '0.75rem', opacity: 0.6 }}>{hint}</small>}
  </label>
);

/* ---------- One project card (click anywhere -> popup) ---------- */
const ProjectCard = ({ item, onOpen }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [shown, setShown] = useState(false);
  const cardRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  // a new image address gets a fresh chance to load
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [item.image_url]);

  const imageUrl = (item.image_url || '').trim();
  const linkedin = toUrl(item.linkedin_url);
  const date = formatDate(item.date);

  return (
    <article
      ref={cardRef}
      onClick={() => onOpen(item)}
      className={`btb-card btb-reveal overflow-hidden flex flex-col cursor-pointer${shown ? ' in' : ''}`}
      style={{ backgroundColor: '#fff', border: `1px solid ${theme.colors.newsBorder}`, borderRadius: '20px' }}
    >
      {imageUrl && !failed && (
        <div className={loaded ? 'btb-imgbox' : 'btb-imgbox btb-pulse'} style={{ backgroundColor: theme.colors.newsBg }}>
          <img
            ref={imgRef}
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="btb-img"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>
      )}

      <div className="flex-1" style={{ borderLeft: `3px solid ${theme.colors.accent}`, padding: '24px 28px' }}>
        {date && (
          <p
            className="uppercase m-0 mb-2"
            style={{ fontFamily: theme.fonts.main, fontSize: '0.7rem', letterSpacing: '0.15em', color: theme.colors.body }}
          >
            {date}
          </p>
        )}

        <h3
          className="m-0 mb-3"
          style={{ fontFamily: theme.fonts.heading, fontWeight: 400, fontSize: '1.5rem', lineHeight: 1.25, color: theme.colors.heading }}
        >
          {item.name}
        </h3>

        <p
          className="btb-clamp m-0"
          style={{ fontFamily: theme.fonts.body, fontSize: '1rem', lineHeight: 1.7, color: theme.colors.body, whiteSpace: 'pre-line' }}
        >
          {item.description}
        </p>
      </div>

      <div className="flex flex-wrap" style={{ borderTop: `1px solid ${theme.colors.newsBorder}` }}>
        <button
          type="button"
          className="btb-foot btb-readmore uppercase"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(item);
          }}
          style={{ borderRight: linkedin ? `1px solid ${theme.colors.newsBorder}` : 'none' }}
        >
          <span className="btb-ul">Read more</span>
        </button>

        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="btb-foot btb-read uppercase"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="btb-ul">
              Read more on LinkedIn <span>↗</span>
            </span>
          </a>
        )}
      </div>
    </article>
  );
};

/* card + Edit/Delete + the two "+" buttons (left = add before, right = add after) */
const ProjectItem = ({ item, onOpen, onEdit, onDelete, onAdd }) => (
  <div className="btb-proj">
    <button type="button" className="btb-plus btb-plus-left" aria-label="Add a project on the left" title="Add left" onClick={() => onAdd('left')}>
      +
    </button>

    <div className="btb-tools">
      <button type="button" className="btb-mini" onClick={() => onEdit(item)}>
        Edit
      </button>
      <button type="button" className="btb-mini" onClick={() => onDelete(item)}>
        Delete
      </button>
    </div>

    <ProjectCard item={item} onOpen={onOpen} />

    <button type="button" className="btb-plus btb-plus-right" aria-label="Add a project on the right" title="Add right" onClick={() => onAdd('right')}>
      +
    </button>
  </div>
);

/* ---------- Big popup: heading + date + full description ---------- */
const ProjectModal = ({ item, onClose }) => {
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll('a[href], button');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const imageUrl = (item.image_url || '').trim();
  const linkedin = toUrl(item.linkedin_url);
  const date = formatDate(item.date);

  return (
    <div
      className="btb-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="btb-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="btb-modal-title"
        style={{ backgroundColor: '#fff' }}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          className="btb-close"
          onClick={onClose}
          style={{ color: theme.colors.heading, border: `1px solid ${theme.colors.newsBorder}` }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>

        <div className="btb-scroll">
          {imageUrl && !imgFailed && (
            <div className="btb-modal-img" style={{ backgroundColor: theme.colors.newsBg }}>
              <img
                src={imageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="btb-img"
              />
            </div>
          )}

          <div
            style={{
              borderLeft: `3px solid ${theme.colors.accent}`,
              margin: 'clamp(20px, 4vw, 40px)',
              padding: '4px 0 4px clamp(16px, 3vw, 32px)',
            }}
          >
            {date && (
              <p
                className="uppercase m-0 mb-3"
                style={{ fontFamily: theme.fonts.main, fontSize: '0.78rem', letterSpacing: '0.2em', color: theme.colors.accent }}
              >
                {date}
              </p>
            )}

            <h3
              id="btb-modal-title"
              className="m-0 mb-5"
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: 400,
                fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
                lineHeight: 1.2,
                color: theme.colors.heading,
              }}
            >
              {item.name}
            </h3>

            <p
              className="m-0"
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
                lineHeight: 1.8,
                color: theme.colors.body,
                whiteSpace: 'pre-line',
              }}
            >
              {item.description}
            </p>
          </div>
        </div>

        {linkedin && (
          <div style={{ borderTop: `1px solid ${theme.colors.newsBorder}` }}>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btb-foot btb-read uppercase"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
            >
              <span className="btb-ul">
                Read more on LinkedIn <span>↗</span>
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Add / edit a project (popup form) ---------- */
const ProjectForm = ({ title, initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial.name || '');
  const [date, setDate] = useState(initial.date || today());
  const [description, setDescription] = useState(initial.description || '');
  const [linkedin, setLinkedin] = useState(initial.linkedin_url || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState((initial.image_url || '').trim());
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, saving]);

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
    if (!isPickableImage(f)) return setError('Choose an image under 8 MB.');
    setError('');
    setFile(f);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(f));
  };

  const dropImage = () => {
    setFile(null);
    setPreview('');
    setRemoveImage(true);
  };

  const submit = async () => {
    if (saving) return;
    if (!name.trim()) return setError('Name is required.');
    if (!date) return setError('Choose a date.');
    if (!description.trim()) return setError('Description is required.');
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('date', date);
      fd.append('description', description.trim());
      fd.append('linkedin_url', linkedin.trim());
      if (file) fd.append('image', file);
      else if (removeImage) fd.append('remove_image', '1');
      await onSave(fd); // parent closes the form on success
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="btb-overlay">
      <div className="btb-panel" role="dialog" aria-modal="true" aria-label={title} style={{ backgroundColor: '#fff', maxWidth: 760 }}>
        <div className="btb-scroll" style={{ padding: 'clamp(20px, 4vw, 36px)' }}>
          <p className="m-0 mb-5 uppercase" style={{ ...labelStyle, opacity: 1, color: theme.colors.accent }}>
            {title}
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: theme.colors.newsBg }}
              >
                {preview ? (
                  <img src={preview} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={labelStyle}>No image</span>
                )}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button type="button" className="btb-btn" onClick={() => fileRef.current?.click()} disabled={saving}>
                  {preview ? 'Change image' : 'Add image'}
                </button>
                {preview && (
                  <button type="button" className="btb-btn" onClick={dropImage} disabled={saving}>
                    Remove image
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name *">
                <input ref={firstRef} className="btb-field" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Date *">
                <input type="date" className="btb-field" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>

            <Field label="Description *">
              <textarea
                className="btb-field"
                rows={8}
                maxLength={10000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>

            <Field label="LinkedIn link">
              <input className="btb-field" value={linkedin} maxLength={1000} onChange={(e) => setLinkedin(e.target.value)} />
            </Field>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${theme.colors.newsBorder}`, padding: '16px clamp(20px, 4vw, 36px)' }}>
          {error && (
            <p role="alert" className="m-0 mb-3" style={{ color: theme.colors.accent, fontFamily: theme.fonts.body }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={submit} disabled={saving} className="btb-btn btb-btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving} className="btb-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- One-line name form (new category / rename) ---------- */
const LabelForm = ({ title, initial = '', onSave, onCancel }) => {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const submit = async () => {
    if (saving) return;
    if (!value.trim()) return setError('Name is required.');
    setSaving(true);
    setError('');
    try {
      await onSave(value.trim());
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div>
      {title && (
        <p className="m-0 mb-3 uppercase" style={{ ...labelStyle, opacity: 1, color: theme.colors.accent }}>
          {title}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={ref}
          className="btb-field"
          style={{ flex: '1 1 240px', width: 'auto' }}
          aria-label="Category name"
          placeholder="Category name"
          value={value}
          maxLength={150}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            } else if (e.key === 'Escape') onCancel();
          }}
        />
        <button type="button" className="btb-btn btb-btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btb-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="m-0 mt-3" style={{ color: theme.colors.accent, fontFamily: theme.fonts.body }}>
          {error}
        </p>
      )}
    </div>
  );
};

/* ---------- Collapsible category ---------- */
const CategorySection = ({
  category,
  autoOpen,
  onOpen,
  onRename,
  onDelete,
  onAddCategory,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // cards are built only after the first open
  const [renaming, setRenaming] = useState(false);
  const panelRef = useRef(null);

  const projects = category.projects || [];
  const count = projects.length;
  const panelId = `btb-panel-${category.id}`;
  const buttonId = `btb-cat-${category.id}`;

  // a category that was just created opens by itself
  useEffect(() => {
    if (autoOpen) {
      setMounted(true);
      setOpen(true);
    }
  }, [autoOpen]);

  // collapsed content must not be reachable with the keyboard
  useEffect(() => {
    panelRef.current?.toggleAttribute('inert', !open);
  }, [open]);

  const toggle = () => {
    if (!open) setMounted(true);
    setOpen((o) => !o);
  };

  return (
    <div className="btb-catitem">
      <button type="button" className="btb-plus btb-plus-top" aria-label="Add a category above" title="Add category above" onClick={() => onAddCategory('above')}>
        +
      </button>

      <div
        className="overflow-hidden"
        style={{
          backgroundColor: '#fff',
          border: `1px solid ${open ? theme.colors.newsBorderStrong : theme.colors.newsBorder}`,
          borderRadius: '16px',
          transition: 'border-color 250ms ease',
        }}
      >
        {renaming ? (
          <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(18px, 3vw, 28px)', backgroundColor: theme.colors.newsBg }}>
            <LabelForm
              title="Rename category"
              initial={category.label}
              onSave={async (label) => {
                await onRename(category.id, label);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          </div>
        ) : (
          <div className="btb-cat-head" style={{ backgroundColor: open ? theme.colors.newsBg : 'transparent' }}>
            <h2 className="m-0 flex-1 min-w-0">
              <button
                id={buttonId}
                type="button"
                className="btb-cat-btn"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={panelId}
              >
                <span className="flex-1 min-w-0">
                  <span
                    className="block"
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontWeight: 400,
                      fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                      lineHeight: 1.2,
                      color: theme.colors.accent,
                    }}
                  >
                    {category.label}
                  </span>
                  <span
                    className="block uppercase mt-1"
                    style={{ fontFamily: theme.fonts.main, fontSize: '0.7rem', letterSpacing: '0.15em', color: theme.colors.body }}
                  >
                    {count} {count === 1 ? 'project' : 'projects'}
                  </span>
                </span>

                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '999px',
                    backgroundColor: open ? theme.colors.accent : theme.colors.newsBg,
                    color: open ? '#fff' : theme.colors.accent,
                    transition: 'background-color 250ms ease, color 250ms ease',
                  }}
                >
                  <Chevron open={open} />
                </span>
              </button>
            </h2>

            <div className="btb-cat-tools">
              <button type="button" className="btb-mini" onClick={() => setRenaming(true)}>
                Edit
              </button>
              <button type="button" className="btb-mini" onClick={() => onDelete(category)}>
                Delete
              </button>
            </div>
          </div>
        )}

        {/* smooth open/close: grid row goes 0fr -> 1fr */}
        <div
          id={panelId}
          ref={panelRef}
          role="region"
          aria-labelledby={buttonId}
          className="btb-collapse"
          style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        >
          <div className="min-h-0 overflow-hidden">
            <div style={{ padding: 'clamp(16px, 3vw, 28px)', borderTop: `1px solid ${theme.colors.newsBorder}` }}>
              {mounted &&
                (count > 0 ? (
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((item) => (
                      <ProjectItem
                        key={item.id}
                        item={item}
                        onOpen={onOpen}
                        onEdit={(p) => onEditProject(category.id, p)}
                        onDelete={(p) => onDeleteProject(p)}
                        onAdd={(place) => onAddProject(category.id, item.id, place)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-4">
                    <p className="m-0" style={{ fontFamily: theme.fonts.body, color: theme.colors.body }}>
                      Nothing here yet.
                    </p>
                    <button type="button" className="btb-btn" onClick={() => onAddProject(category.id, null, 'left')}>
                      + Add project
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <button type="button" className="btb-plus btb-plus-bottom" aria-label="Add a category below" title="Add category below" onClick={() => onAddCategory('below')}>
        +
      </button>
    </div>
  );
};

/* ---------- Loading placeholder ---------- */
const CategorySkeleton = () => (
  <div
    className="btb-pulse"
    aria-hidden="true"
    style={{ backgroundColor: '#fff', border: `1px solid ${theme.colors.newsBorder}`, borderRadius: '16px', padding: '22px 24px' }}
  >
    <div style={{ width: '220px', maxWidth: '70%', height: '22px', borderRadius: '8px', backgroundColor: theme.colors.newsBg }} />
    <div style={{ width: '80px', height: '12px', borderRadius: '8px', backgroundColor: theme.colors.newsBg, marginTop: '10px' }} />
  </div>
);

/* ---------- Page ---------- */
const BeyondTheBench = () => {
  const [categories, setCategories] = useState(null); // null = still loading
  const [error, setError] = useState(false);
  const [active, setActive] = useState(null); // project shown in the popup
  const [addingCat, setAddingCat] = useState(null); // { anchorId, place } | null
  const [form, setForm] = useState(null); // project form: { mode, ... } | null
  const [justAdded, setJustAdded] = useState(null);
  const [notice, setNotice] = useState('');

  const closeModal = useCallback(() => setActive(null), []);
  const closeForm = useCallback(() => setForm(null), []);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}${API}`)
      .then((res) => {
        if (!res.ok) throw new Error('backend not reachable');
        return res.json();
      })
      .then((data) => {
        if (alive) setCategories(Array.isArray(data?.categories) ? data.categories : []);
      })
      .catch((err) => {
        console.error('Failed to load Beyond the Bench:', err);
        if (alive) setError(true);
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

  /* ----- categories ----- (forms show their own errors, so create/rename throw on failure) */
  const createCategory = async (label) => {
    const target = addingCat;
    const body = { label };
    if (target?.anchorId) {
      body.anchor_id = target.anchorId;
      body.place = target.place;
    }
    const row = await api(`${API}/categories`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) });
    setCategories((prev) => {
      const list = prev || [];
      const i = target?.anchorId ? list.findIndex((c) => c.id === target.anchorId) : -1;
      if (i < 0) return [row, ...list];
      const at = target.place === 'above' ? i : i + 1;
      return [...list.slice(0, at), row, ...list.slice(at)];
    });
    setJustAdded(row.id);
    setAddingCat(null);
  };

  const renameCategory = async (id, label) => {
    const saved = await api(`${API}/categories/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ label }) });
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, label: saved.label } : c)));
  };

  const deleteCategory = async (category) => {
    const n = (category.projects || []).length;
    const extra = n > 0 ? ` and its ${n} project${n === 1 ? '' : 's'}` : '';
    if (!window.confirm(`Delete "${category.label}"${extra}? All their images will be deleted too.`)) return;
    try {
      await api(`${API}/categories/${category.id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setActive((a) => (a && a.category_id === category.id ? null : a));
    } catch (err) {
      setNotice(err.message);
    }
  };

  /* ----- projects ----- */
  const createProject = async (fd) => {
    const target = form;
    if (target.anchorId) {
      fd.append('anchor_id', target.anchorId);
      fd.append('place', target.place);
    } else {
      fd.append('category_id', target.categoryId);
    }
    const row = await api(`${API}/projects`, { method: 'POST', body: fd });
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== row.category_id) return c;
        const list = c.projects || [];
        const i = target.anchorId ? list.findIndex((p) => p.id === target.anchorId) : -1;
        if (i < 0) return { ...c, projects: [row, ...list] };
        const at = target.place === 'left' ? i : i + 1;
        return { ...c, projects: [...list.slice(0, at), row, ...list.slice(at)] };
      })
    );
    setForm(null);
  };

  const saveProject = async (id, fd) => {
    const row = await api(`${API}/projects/${id}`, { method: 'PATCH', body: fd });
    setCategories((prev) =>
      prev.map((c) => (c.id === row.category_id ? { ...c, projects: (c.projects || []).map((p) => (p.id === id ? row : p)) } : c))
    );
    setForm(null);
  };

  const deleteProject = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? Its image will be deleted too.`)) return;
    try {
      await api(`${API}/projects/${item.id}`, { method: 'DELETE' });
      setCategories((prev) =>
        prev.map((c) => (c.id === item.category_id ? { ...c, projects: (c.projects || []).filter((p) => p.id !== item.id) } : c))
      );
      setActive((a) => (a && a.id === item.id ? null : a));
    } catch (err) {
      setNotice(err.message);
    }
  };

  const muted = { fontFamily: theme.fonts.body, fontSize: '1.1rem', color: theme.colors.body };

  const catForm = (
    <div className="box-border" style={{ border: `1px dashed ${theme.colors.accent}`, borderRadius: 16, padding: 20, backgroundColor: '#fff' }}>
      <LabelForm title="New category" onSave={createCategory} onCancel={() => setAddingCat(null)} />
    </div>
  );

  return (
    <section className="w-full box-border px-6 sm:px-12 pt-16 pb-20">
      <style>{`
        .btb-card:hover { box-shadow: 0 8px 22px rgba(0,0,0,0.06); }

        .btb-reveal { opacity: 0; transform: translateY(14px); transition: opacity 450ms ease, transform 450ms ease, box-shadow 200ms ease; }
        .btb-reveal.in { opacity: 1; transform: none; }

        .btb-imgbox { width: 100%; height: 220px; overflow: hidden; }
        .btb-img { display: block; width: 100%; height: 100%; object-fit: cover; transition: opacity 400ms ease; }

        .btb-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        @keyframes btb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .btb-pulse { animation: btb-pulse 1.4s ease-in-out infinite; }

        @keyframes btb-rise {
          from { opacity: 0; transform: translateY(0.45em); }
          to   { opacity: 1; transform: none; }
        }
        .btb-label  { opacity: 0; animation: btb-rise 600ms ease-out forwards; }
        .btb-letter { display: inline-block; opacity: 0; animation: btb-rise 550ms cubic-bezier(.2,.8,.2,1) forwards; }

        /* category open / close */
        .btb-collapse { display: grid; transition: grid-template-rows 350ms ease; }
        .btb-cat-head { display: flex; align-items: center; transition: background-color 200ms ease; }
        .btb-cat-head:hover { background-color: ${theme.colors.newsBg} !important; }
        .btb-cat-btn {
          width: 100%; display: flex; align-items: center; gap: 16px; text-align: left; background: transparent;
          padding: clamp(16px, 2.5vw, 24px) clamp(18px, 3vw, 28px);
          border: 0; cursor: pointer;
        }
        .btb-cat-btn:focus-visible, .btb-foot:focus-visible, .btb-close:focus-visible {
          outline: 2px solid ${theme.colors.accent}; outline-offset: -2px;
        }

        /* footer buttons on each card */
        .btb-foot {
          flex: 1 1 auto; text-align: center; text-decoration: none; cursor: pointer;
          font-family: ${theme.fonts.main}; font-size: 0.75rem; letter-spacing: 0.15em;
          padding: 16px 20px; border: 0;
        }
        .btb-readmore { color: ${theme.colors.accent}; background-color: #fff; }
        .btb-readmore:hover { background-color: ${theme.colors.newsBg}; }
        .btb-read { color: #fff; background-color: ${theme.colors.accent}; }
        .btb-read:hover { filter: brightness(1.12); }

        .btb-ul { position: relative; display: inline-block; padding-bottom: 4px; }
        .btb-ul::after {
          content: ''; position: absolute; left: 0; bottom: 0; width: 100%; height: 1.5px;
          background: currentColor; transform: scaleX(0); transition: transform 200ms ease;
        }
        .btb-foot:hover .btb-ul::after, .btb-foot:focus-visible .btb-ul::after { transform: scaleX(1); }

        /* popup */
        @keyframes btb-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes btb-pop  { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: none; } }
        .btb-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: clamp(10px, 3vw, 32px);
          background-color: rgba(35, 31, 32, 0.62);
          -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          animation: btb-fade 200ms ease-out;
        }
        .btb-panel {
          position: relative; display: flex; flex-direction: column;
          width: 100%; max-width: 1100px;
          max-height: 92vh; max-height: 92dvh;
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          animation: btb-pop 280ms cubic-bezier(.2,.8,.2,1);
        }
        .btb-scroll { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; }
        .btb-modal-img { width: 100%; height: clamp(200px, 38vh, 420px); overflow: hidden; }
        .btb-close {
          position: absolute; top: 14px; right: 14px; z-index: 5;
          width: 42px; height: 42px; border-radius: 999px; background-color: #fff;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18); transition: background-color 200ms ease, color 200ms ease;
        }
        .btb-close:hover { background-color: ${theme.colors.accent}; color: #fff !important; }

        /* ---- editing controls ---- */
        .btb-catitem, .btb-proj { position: relative; }
        .btb-proj { display: flex; flex-direction: column; }
        .btb-proj > article { flex: 1 1 auto; }

        .btb-mini {
          font-family: ${theme.fonts.main}; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: ${theme.colors.accent}; background: none; border: 0; padding: 0; cursor: pointer;
        }
        .btb-mini:hover { text-decoration: underline; }

        .btb-plus {
          position: absolute; z-index: 3; width: 32px; height: 32px; border-radius: 50%; padding: 0; cursor: pointer;
          font-size: 20px; line-height: 1; color: ${theme.colors.accent}; background: #fff;
          border: 1px solid ${theme.colors.accent};
          transition: opacity 200ms ease, background-color 200ms ease, color 200ms ease;
        }
        .btb-plus:hover, .btb-plus:focus-visible { background: ${theme.colors.accent}; color: #fff; }
        .btb-plus-top, .btb-plus-bottom { left: 50%; transform: translateX(-50%); }
        .btb-plus-top { top: -16px; }
        .btb-plus-bottom { bottom: -16px; }
        .btb-plus-left, .btb-plus-right { top: 50%; transform: translateY(-50%); }
        .btb-plus-left { left: -16px; }
        .btb-plus-right { right: -16px; }

        .btb-tools {
          position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; gap: 14px;
          background: #fff; border: 1px solid ${theme.colors.newsBorder}; border-radius: 999px; padding: 6px 14px;
        }
        .btb-cat-tools { display: flex; gap: 14px; padding-right: clamp(16px, 2.5vw, 24px); }

        .btb-plus, .btb-tools, .btb-cat-tools { opacity: 0; transition: opacity 200ms ease; }
        .btb-catitem:hover > .btb-plus, .btb-catitem:focus-within > .btb-plus,
        .btb-proj:hover .btb-plus, .btb-proj:focus-within .btb-plus,
        .btb-proj:hover .btb-tools, .btb-proj:focus-within .btb-tools,
        .btb-cat-head:hover .btb-cat-tools, .btb-cat-head:focus-within .btb-cat-tools { opacity: 1; }
        @media (hover: none) { .btb-plus, .btb-tools, .btb-cat-tools { opacity: 0.9; } }

        .btb-field {
          font-family: ${theme.fonts.body}; font-size: 1rem; color: ${theme.colors.body};
          background: transparent; border: 1px solid ${theme.colors.newsBorder}; border-radius: 8px;
          padding: 8px 12px; outline: none; width: 100%; box-sizing: border-box;
        }
        .btb-field:focus { border-color: ${theme.colors.accent}; }
        .btb-btn {
          font-family: ${theme.fonts.main}; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: ${theme.colors.accent}; background: transparent; border: 1px solid ${theme.colors.accent};
          border-radius: 999px; padding: 8px 20px; cursor: pointer;
        }
        .btb-btn-primary { background: ${theme.colors.accent}; color: #fff; }
        .btb-btn:disabled { opacity: 0.6; cursor: default; }

        @media (prefers-reduced-motion: reduce) {
          .btb-reveal { opacity: 1; transform: none; transition: none; }
          .btb-pulse, .btb-overlay, .btb-panel { animation: none; }
          .btb-img, .btb-collapse, .btb-plus, .btb-tools, .btb-cat-tools { transition: none; }
          .btb-label, .btb-letter { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <p
          className="btb-label uppercase m-0 mb-2"
          style={{ fontFamily: theme.fonts.main, color: theme.colors.accent, fontSize: '0.85rem', letterSpacing: '0.25em' }}
        >
          Beyond the Bench
        </p>
        <h1 className="m-0 text-4xl sm:text-5xl" style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.heading }}>
          <Letters text="Life outside the lab" start={60} />
        </h1>

        <div className="mt-12">
          {error && (
            <p className="m-0" style={muted}>
              Couldn't load projects right now — please check back shortly.
            </p>
          )}

          {!error && categories === null && (
            <div className="flex flex-col gap-8">
              <CategorySkeleton />
              <CategorySkeleton />
            </div>
          )}

          {!error && categories && categories.length === 0 && (
            <div className="flex flex-col items-start gap-4">
              <p className="m-0" style={muted}>
                No categories yet.
              </p>
              {addingCat ? (
                <div className="w-full">{catForm}</div>
              ) : (
                <button type="button" className="btb-btn" onClick={() => setAddingCat({ anchorId: null, place: 'above' })}>
                  + Add category
                </button>
              )}
            </div>
          )}

          {!error && categories && categories.length > 0 && (
            <>
              <p
                className="uppercase m-0 mb-8"
                style={{ fontFamily: theme.fonts.main, fontSize: '0.75rem', letterSpacing: '0.15em', color: theme.colors.body }}
              >
                Click a category to see its projects
              </p>
              <div className="flex flex-col gap-8">
                {categories.map((category) => (
                  <React.Fragment key={category.id}>
                    {addingCat?.anchorId === category.id && addingCat.place === 'above' && catForm}

                    <CategorySection
                      category={category}
                      autoOpen={justAdded === category.id}
                      onOpen={setActive}
                      onRename={renameCategory}
                      onDelete={deleteCategory}
                      onAddCategory={(place) => setAddingCat({ anchorId: category.id, place })}
                      onAddProject={(categoryId, anchorId, place) => setForm({ mode: 'add', categoryId, anchorId, place })}
                      onEditProject={(categoryId, item) => setForm({ mode: 'edit', categoryId, item })}
                      onDeleteProject={deleteProject}
                    />

                    {addingCat?.anchorId === category.id && addingCat.place === 'below' && catForm}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {active && <ProjectModal key={active.id} item={active} onClose={closeModal} />}

      {form && (
        <ProjectForm
          key={form.mode === 'edit' ? `edit-${form.item.id}` : `add-${form.anchorId ?? form.categoryId}-${form.place}`}
          title={form.mode === 'edit' ? 'Edit project' : 'New project'}
          initial={form.mode === 'edit' ? form.item : {}}
          onSave={form.mode === 'edit' ? (fd) => saveProject(form.item.id, fd) : createProject}
          onCancel={closeForm}
        />
      )}

      {notice && (
        <div
          role="alert"
          className="fixed left-1/2 -translate-x-1/2 text-white"
          style={{
            bottom: 24,
            background: theme.colors.accent,
            padding: '10px 18px',
            borderRadius: 999,
            zIndex: 10000,
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

export default BeyondTheBench;