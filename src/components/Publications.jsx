// Publications.jsx - editable Publications page
// Edit / Delete the Scholar + ORCID links, Edit / Delete each publication,
// and add a new publication above (+ top) or below (+ bottom) any publication.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';

/* ---------- Fetch once and cache ---------- */
const EMPTY = { google_scholar: '', orcid: '', publications: [] };

let publicationsPromise = null;
const fetchPublications = () => {
  if (!publicationsPromise) {
    publicationsPromise = fetch(`${API_URL}/api/publications`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((data) => ({
        google_scholar: data?.google_scholar || '',
        orcid: data?.orcid || '',
        publications: Array.isArray(data?.publications) ? data.publications : [],
      }))
      .catch((err) => {
        console.error('Failed to load publications:', err);
        publicationsPromise = null;
        return EMPTY;
      });
  }
  return publicationsPromise;
};
fetchPublications();

/* ---------- Small helpers ---------- */
const toUrl = (value = '') => {
  const v = (value || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

/* Add ?v=... so the browser never reuses an old cached copy after an image update */
const withVersion = (url, version) => {
  if (!url || !version || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
};

/* Image address can be: full https link, Google Drive share link,
   /path on your backend, or a bare path like uploads/abstract.png */
const toImageUrl = (value = '') => {
  const v = (value || '').trim();
  if (!v) return '';

  const drive = v.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1600`;

  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
  if (v.startsWith('/')) return `${API_URL}${v}`;
  if (/^[\w-]+(\.[\w-]+)+\//.test(v)) return `https://${v}`;
  return `${API_URL}/${v}`;
};

const getOrcidId = (orcid = '') => (orcid.match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/) || [])[0] || '';
const toOrcidUrl = (orcid = '') => {
  const o = (orcid || '').trim();
  if (!o) return '';
  return /^https?:\/\//i.test(o) ? o : `https://orcid.org/${o}`;
};

const today = () => new Date().toISOString().slice(0, 10);
const isPickableImage = (file) => file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024;

const MAX_IMAGE_RETRIES = 2;

/* ---------- Load animation helper ---------- */
const Letters = ({ text, start = 0 }) => {
  let n = 0;
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((ch, c) => (
              <span key={c} className="pb-letter" style={{ animationDelay: `${start + n++ * 40}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
};

/* Description supports light formatting: **bold** and *italic* */
const renderDescription = (text = '') => {
  const nodes = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let key = 0;
  let m;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];

    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} style={{ fontWeight: 600, color: theme.colors.heading }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <em key={key++} style={{ color: theme.colors.body }}>
          {token.slice(1, -1)}
        </em>
      );
    }
    last = m.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

/* ---------- One publication card (display only) ---------- */
const PublicationCard = ({ item }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tries, setTries] = useState(0);
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

  const baseUrl = toImageUrl(item.image);
  const versioned = withVersion(baseUrl, item.__v);
  // on a retry, add one more query value so the browser makes a fresh request
  const imageUrl = tries > 0 ? withVersion(versioned, `r${tries}`) : versioned;

  // ONE effect: reset for a new image, then check if it is already loaded (cached).
  // (Before, two separate effects fought each other and left the image at opacity 0.)
  useEffect(() => {
    setFailed(false);
    setTries(0);
    const img = imgRef.current;
    setLoaded(Boolean(img && img.complete && img.naturalWidth > 0));
  }, [baseUrl, item.__v]);

  const handleError = () => {
    if (tries < MAX_IMAGE_RETRIES) {
      // new uploads can be unavailable for a moment - try again shortly
      setTimeout(() => setTries((t) => t + 1), 800 * (tries + 1));
    } else {
      setFailed(true);
    }
  };

  const readLink = toUrl(item.paper_link);
  const tags = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];

  return (
    <article
      ref={cardRef}
      className={`pub-card pub-reveal overflow-hidden${shown ? ' in' : ''}`}
      style={{ backgroundColor: '#fff', border: `1px solid ${theme.colors.newsBorder}`, borderRadius: '20px' }}
    >
      {imageUrl && !failed && (
        <div className={loaded ? 'pub-imgbox' : 'pub-imgbox pub-pulse'} style={{ backgroundColor: theme.colors.newsBg }}>
          <img
            key={imageUrl}
            ref={imgRef}
            src={imageUrl}
            alt="Graphical abstract"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={handleError}
            className="pub-img"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>
      )}

      <div style={{ borderLeft: `3px solid ${theme.colors.accent}`, padding: '28px 32px' }}>
        <p
          className="m-0"
          style={{ fontFamily: theme.fonts.body, fontSize: '1.15rem', lineHeight: 1.7, color: theme.colors.heading }}
        >
          {renderDescription(item.description)}
        </p>

        {tags.length > 0 && (
          <ul className="list-none m-0 mt-5 p-0 flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="uppercase"
                style={{
                  fontFamily: theme.fonts.main,
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  color: theme.colors.accent,
                  backgroundColor: theme.colors.newsBg,
                  border: `1px solid ${theme.colors.newsBorder}`,
                  borderRadius: '999px',
                  padding: '6px 14px',
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      {readLink && (
        <div style={{ borderTop: `1px solid ${theme.colors.newsBorder}` }}>
          <a
            href={readLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pub-read uppercase inline-block"
            style={{
              fontFamily: theme.fonts.main,
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
              textDecoration: 'none',
              padding: '18px 28px',
            }}
          >
            <span className="pub-ul">
              Read paper <span className="pub-arrow">↗</span>
            </span>
          </a>
        </div>
      )}
    </article>
  );
};

/* card + Edit/Delete + the two "+" buttons (top = add above, bottom = add below) */
const PublicationItem = ({ item, onEdit, onDelete, onAdd }) => (
  <div className="pub-item">
    <button type="button" className="pub-plus pub-plus-top" aria-label="Add a publication above" title="Add above" onClick={() => onAdd('above')}>
      +
    </button>

    <div className="pub-tools">
      <button type="button" className="pub-mini" onClick={() => onEdit(item.id)}>
        Edit
      </button>
      <button type="button" className="pub-mini" onClick={() => onDelete(item)}>
        Delete
      </button>
    </div>

    <PublicationCard item={item} />

    <button type="button" className="pub-plus pub-plus-bottom" aria-label="Add a publication below" title="Add below" onClick={() => onAdd('below')}>
      +
    </button>
  </div>
);

/* ---------- Add / edit form (one form for both) ---------- */
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

const PubForm = ({ title, initial, onSave, onCancel }) => {
  const [date, setDate] = useState(initial.date || today());
  const [description, setDescription] = useState(initial.description || '');
  const [paperLink, setPaperLink] = useState(initial.paper_link || '');
  const [tags, setTags] = useState(Array.isArray(initial.tags) ? initial.tags.join(', ') : '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial.image ? withVersion(toImageUrl(initial.image), initial.__v) : '');
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

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
    if (!date) return setError('Choose a date.');
    if (!description.trim()) return setError('Description is required.');
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('date', date);
      fd.append('description', description.trim());
      fd.append('paper_link', paperLink.trim());
      fd.append('tags', tags);
      if (file) fd.append('image', file);
      else if (removeImage) fd.append('remove_image', '1');
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
    <div
      onKeyDown={onKeyDown}
      className="box-border"
      style={{ border: `1px dashed ${theme.colors.accent}`, borderRadius: 20, padding: 24, backgroundColor: '#fff' }}
    >
      <p className="m-0 mb-4 uppercase" style={{ ...labelStyle, opacity: 1, color: theme.colors.accent }}>
        {title}
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div style={{ width: 240, maxWidth: '100%' }}>
            <div
              className="flex items-center justify-center overflow-hidden"
              style={{ width: '100%', height: 140, borderRadius: 12, backgroundColor: theme.colors.newsBg }}
            >
              {preview ? (
                <img src={preview} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ ...labelStyle }}>No image</span>
              )}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button type="button" className="pub-btn" onClick={() => fileRef.current?.click()} disabled={saving}>
                {preview ? 'Change image' : 'Add image'}
              </button>
              {preview && (
                <button type="button" className="pub-btn" onClick={dropImage} disabled={saving}>
                  Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          </div>

          <div className="flex-1 w-full flex flex-col gap-4">
            <Field label="Date *">
              <input ref={firstRef} type="date" className="pub-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Tags" hint="Separate with commas">
              <input className="pub-field" value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
          </div>
        </div>

        <Field label="Description *" hint="Use **bold** and *italic*.">
          <textarea
            className="pub-field"
            rows={5}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </Field>

        <Field label="Paper link (“Read paper” bar)">
          <input className="pub-field" value={paperLink} maxLength={1000} onChange={(e) => setPaperLink(e.target.value)} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="m-0 mt-3" style={{ color: theme.colors.accent, fontFamily: theme.fonts.body }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-5">
        <button type="button" onClick={submit} disabled={saving} className="pub-btn pub-btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="pub-btn">
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ---------- Google Scholar / ORCID links: add, edit, delete ---------- */
const LinkBar = ({ scholar, orcid, onSave, onNotice }) => {
  const [editing, setEditing] = useState(null); // 'google_scholar' | 'orcid' | null
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const linkStyle = {
    fontFamily: theme.fonts.main,
    color: theme.colors.accent,
    fontSize: '0.85rem',
    letterSpacing: '0.15em',
    textDecoration: 'none',
  };

  const begin = (field, value) => {
    setDraft(value || '');
    setEditing(field);
  };

  const commit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(editing, draft.trim());
      setEditing(null);
    } catch (err) {
      onNotice(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clear = async (field, label) => {
    if (!window.confirm(`Delete the ${label} link?`)) return;
    try {
      await onSave(field, '');
    } catch (err) {
      onNotice(err.message);
    }
  };

  const items = [
    { field: 'google_scholar', label: 'Google Scholar', raw: scholar, url: toUrl(scholar), delay: 150, placeholder: 'https://scholar.google.com/citations?user=…' },
    { field: 'orcid', label: 'ORCID', raw: orcid, url: toOrcidUrl(orcid), id: getOrcidId(orcid), delay: 300, placeholder: '0000-0000-0000-0000' },
  ];

  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-4 mt-8">
      {items.map(({ field, label, raw, url, id, delay, placeholder }) => (
        <div key={field} className="pb-pop flex flex-wrap items-center gap-3 pub-linkrow" style={{ animationDelay: `${delay}ms` }}>
          {editing === field ? (
            <div className="flex flex-wrap items-center gap-2" onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}>
              <input
                ref={inputRef}
                className="pub-field"
                style={{ width: 280, maxWidth: '100%' }}
                aria-label={`${label} link`}
                placeholder={placeholder}
                value={draft}
                maxLength={1000}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                  }
                }}
              />
              <button type="button" className="pub-btn pub-btn-primary" onClick={commit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="pub-btn" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </button>
            </div>
          ) : url ? (
            <>
              <a href={url} target="_blank" rel="noopener noreferrer" className="pub-link uppercase" style={linkStyle}>
                {label}
                {id && <span style={{ color: theme.colors.body, letterSpacing: '0.05em', marginLeft: '0.7em' }}>{id}</span>}
                <span className="pub-arrow" style={{ marginLeft: '0.5em' }}>↗</span>
              </a>
              <span className="pub-linktools">
                <button type="button" className="pub-mini" onClick={() => begin(field, raw)}>
                  Edit
                </button>
                <button type="button" className="pub-mini" onClick={() => clear(field, label)}>
                  Delete
                </button>
              </span>
            </>
          ) : (
            <button type="button" className="pub-btn" onClick={() => begin(field, '')}>
              + Add {label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

/* ---------- Loading placeholder ---------- */
const PublicationSkeleton = () => (
  <div
    className="pub-pulse overflow-hidden"
    style={{ backgroundColor: '#fff', border: `1px solid ${theme.colors.newsBorder}`, borderRadius: '20px' }}
    aria-hidden="true"
  >
    <div className="pub-imgbox" style={{ backgroundColor: theme.colors.newsBg }} />
    <div style={{ padding: '28px 32px' }}>
      <div style={{ width: '92%', height: '16px', borderRadius: '8px', backgroundColor: theme.colors.newsBg }} />
      <div style={{ width: '70%', height: '16px', borderRadius: '8px', backgroundColor: theme.colors.newsBg, marginTop: '12px' }} />
      <div style={{ width: '28%', height: '24px', borderRadius: '999px', backgroundColor: theme.colors.newsBg, marginTop: '20px' }} />
    </div>
  </div>
);

/* ---------- Page ---------- */
const Publications = () => {
  const [data, setData] = useState(null); // null = still loading
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(null); // { anchorId, place } | null
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    fetchPublications().then((d) => {
      if (alive) setData(d);
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

  // change the state AND the module-level cache so coming back later isn't stale
  const change = (fn) =>
    setData((prev) => {
      const next = fn(prev || EMPTY);
      publicationsPromise = Promise.resolve(next);
      return next;
    });

  // the forms show their own errors, so create/save throw on failure
  const create = async (fd) => {
    const target = adding;
    if (target?.anchorId) {
      fd.append('anchor_id', target.anchorId);
      fd.append('place', target.place);
    }
    const created = await api('/api/publications', { method: 'POST', body: fd });
    // fresh image -> new cache-buster so it always displays right away
    const row = fd.has('image') ? { ...created, __v: Date.now() } : created;
    change((prev) => {
      const list = prev.publications;
      const i = target?.anchorId ? list.findIndex((p) => p.id === target.anchorId) : -1;
      if (i < 0) return { ...prev, publications: [row, ...list] }; // no anchor = top
      const at = target.place === 'above' ? i : i + 1;
      return { ...prev, publications: [...list.slice(0, at), row, ...list.slice(at)] };
    });
    setAdding(null);
  };

  const save = async (id, fd) => {
    const saved = await api(`/api/publications/${id}`, { method: 'PATCH', body: fd });
    // image replaced or removed -> new cache-buster so the card shows the new image immediately
    const imageChanged = fd.has('image') || fd.has('remove_image');
    change((prev) => ({
      ...prev,
      publications: prev.publications.map((p) => {
        if (p.id !== id) return p;
        return imageChanged ? { ...saved, __v: Date.now() } : { ...saved, __v: p.__v };
      }),
    }));
    setEditingId(null);
  };

  // The server must also delete the image from Cloudinary (see backend notes)
  const remove = async (item) => {
    if (!window.confirm('Delete this publication? Its image will be deleted too.')) return;
    try {
      await api(`/api/publications/${item.id}`, { method: 'DELETE' });
      change((prev) => ({ ...prev, publications: prev.publications.filter((p) => p.id !== item.id) }));
      if (editingId === item.id) setEditingId(null);
    } catch (err) {
      setNotice(err.message);
    }
  };

  const saveLink = async (field, value) => {
    const saved = await api('/api/publications/links', {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ [field]: value }),
    });
    change((prev) => ({ ...prev, google_scholar: saved.google_scholar || '', orcid: saved.orcid || '' }));
  };

  const startAdd = (anchorId, place) => {
    setEditingId(null);
    setAdding({ anchorId, place });
  };

  // group by year while keeping the position order (a new year heading starts whenever the year changes)
  const groups = useMemo(() => {
    const out = [];
    (data?.publications || []).forEach((p) => {
      const last = out[out.length - 1];
      if (last && last.year === p.year) last.items.push(p);
      else out.push({ year: p.year, items: [p] });
    });
    return out;
  }, [data]);

  const addForm = (anchor) => (
    <PubForm
      key="new-publication"
      title="New publication"
      initial={{ date: anchor?.date }}
      onSave={create}
      onCancel={() => setAdding(null)}
    />
  );

  return (
    <section className="w-full box-border px-6 sm:px-12 pt-16 pb-20">
      <style>{`
        .pub-card:hover { box-shadow: 0 8px 22px rgba(0,0,0,0.06); }

        .pub-reveal { opacity: 0; transform: translateY(14px); transition: opacity 450ms ease, transform 450ms ease, box-shadow 200ms ease; }
        .pub-reveal.in { opacity: 1; transform: none; }

        .pub-imgbox { width: 100%; height: 320px; overflow: hidden; }
        @media (max-width: 640px) { .pub-imgbox { height: 220px; } }
        .pub-img { display: block; width: 100%; height: 100%; object-fit: cover; transition: opacity 400ms ease; }

        @keyframes pub-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .pub-pulse { animation: pub-pulse 1.4s ease-in-out infinite; }

        @keyframes pb-rise {
          from { opacity: 0; transform: translateY(0.45em); }
          to   { opacity: 1; transform: none; }
        }
        .pb-label  { opacity: 0; animation: pb-rise 600ms ease-out forwards; }
        .pb-letter { display: inline-block; opacity: 0; animation: pb-rise 550ms cubic-bezier(.2,.8,.2,1) forwards; }
        .pb-pop    { opacity: 0; animation: pb-rise 500ms ease-out forwards; }

        .pub-link, .pub-ul { position: relative; display: inline-block; padding-bottom: 4px; }
        .pub-link::after, .pub-ul::after {
          content: ''; position: absolute; left: 0; bottom: 0; width: 100%; height: 1.5px;
          background: currentColor; transform: scaleX(0); transition: transform 200ms ease;
        }
        .pub-link:hover::after, .pub-link:focus-visible::after,
        .pub-read:hover .pub-ul::after, .pub-read:focus-visible .pub-ul::after { transform: scaleX(1); }
        .pub-arrow { display: inline-block; }

        .pub-read { color: #fff; background-color: ${theme.colors.accent}; }
        .pub-read:hover { filter: brightness(1.12); }

        /* ---- editing controls ---- */
        .pub-item { position: relative; }
        .pub-tools {
          position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; gap: 14px;
          background: #fff; border: 1px solid ${theme.colors.newsBorder}; border-radius: 999px; padding: 6px 14px;
        }
        .pub-mini {
          font-family: ${theme.fonts.main}; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: ${theme.colors.accent}; background: none; border: 0; padding: 0; cursor: pointer;
        }
        .pub-mini:hover { text-decoration: underline; }
        .pub-plus {
          position: absolute; left: 50%; transform: translateX(-50%); z-index: 2;
          width: 32px; height: 32px; border-radius: 50%; padding: 0; cursor: pointer;
          font-size: 20px; line-height: 1; color: ${theme.colors.accent}; background: #fff;
          border: 1px solid ${theme.colors.accent};
          transition: opacity 200ms ease, background-color 200ms ease, color 200ms ease;
        }
        .pub-plus:hover, .pub-plus:focus-visible { background: ${theme.colors.accent}; color: #fff; }
        .pub-plus-top { top: -16px; }
        .pub-plus-bottom { bottom: -16px; }

        .pub-tools, .pub-plus, .pub-linktools { opacity: 0; transition: opacity 200ms ease; }
        .pub-item:hover .pub-tools, .pub-item:focus-within .pub-tools,
        .pub-item:hover .pub-plus, .pub-item:focus-within .pub-plus,
        .pub-linkrow:hover .pub-linktools, .pub-linkrow:focus-within .pub-linktools { opacity: 1; }
        .pub-linktools { display: inline-flex; gap: 12px; }
        @media (hover: none) { .pub-tools, .pub-plus, .pub-linktools { opacity: 0.9; } }

        .pub-field {
          font-family: ${theme.fonts.body}; font-size: 1rem; color: ${theme.colors.body};
          background: transparent; border: 1px solid ${theme.colors.newsBorder}; border-radius: 8px;
          padding: 8px 12px; outline: none; width: 100%; box-sizing: border-box;
        }
        .pub-field:focus { border-color: ${theme.colors.accent}; }
        .pub-btn {
          font-family: ${theme.fonts.main}; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: ${theme.colors.accent}; background: transparent; border: 1px solid ${theme.colors.accent};
          border-radius: 999px; padding: 8px 20px; cursor: pointer;
        }
        .pub-btn-primary { background: ${theme.colors.accent}; color: #fff; }
        .pub-btn:disabled { opacity: 0.6; cursor: default; }

        @media (prefers-reduced-motion: reduce) {
          .pub-reveal { opacity: 1; transform: none; transition: none; }
          .pub-pulse { animation: none; }
          .pub-img, .pub-tools, .pub-plus, .pub-linktools { transition: none; }
          .pb-label, .pb-letter, .pb-pop { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <p
          className="pb-label uppercase m-0 mb-2"
          style={{ fontFamily: theme.fonts.main, color: theme.colors.accent, fontSize: '0.85rem', letterSpacing: '0.25em' }}
        >
          Publications
        </p>
        <h1 className="m-0 text-4xl sm:text-5xl" style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.heading }}>
          <Letters text="Peer-reviewed work" start={60} />
        </h1>

        {data && <LinkBar scholar={data.google_scholar} orcid={data.orcid} onSave={saveLink} onNotice={setNotice} />}

        <div className="mt-14">
          {data === null && (
            <div>
              <div
                className="pub-pulse"
                style={{ width: '90px', height: '34px', borderRadius: '8px', backgroundColor: theme.colors.newsBg }}
                aria-hidden="true"
              />
              <div className="flex flex-col gap-8 mt-6">
                <PublicationSkeleton />
                <PublicationSkeleton />
              </div>
            </div>
          )}

          {data && data.publications.length === 0 && (
            <div className="flex flex-col items-start gap-4">
              <p className="m-0" style={{ fontFamily: theme.fonts.body, fontSize: '1.1rem', color: theme.colors.body }}>
                No publications yet.
              </p>
              {adding ? (
                addForm(null)
              ) : (
                <button type="button" className="pub-btn" onClick={() => startAdd(null, 'above')}>
                  + Add publication
                </button>
              )}
            </div>
          )}

          {groups.map((group, gi) => (
            <div key={`${group.year}-${gi}`} className={gi === 0 ? '' : 'mt-14'}>
              <h2
                className="m-0 text-3xl sm:text-4xl"
                style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.accent }}
              >
                {group.year}
              </h2>
              <div className="flex flex-col gap-8 mt-6">
                {group.items.map((item) => (
                  <React.Fragment key={item.id}>
                    {adding?.anchorId === item.id && adding.place === 'above' && addForm(item)}

                    {editingId === item.id ? (
                      <PubForm
                        title="Edit publication"
                        initial={item}
                        onSave={(fd) => save(item.id, fd)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <PublicationItem
                        item={item}
                        onEdit={(id) => {
                          setAdding(null);
                          setEditingId(id);
                        }}
                        onDelete={remove}
                        onAdd={(place) => startAdd(item.id, place)}
                      />
                    )}

                    {adding?.anchorId === item.id && adding.place === 'below' && addForm(item)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
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

export default Publications;