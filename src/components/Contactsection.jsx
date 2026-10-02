// ContactSection.jsx - editable contact details + CV upload (social icons are read-only)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import theme from '../theme';
import { API_URL, JSON_HEADERS, api } from '../Api';

/* ---------- Fetch once, cache, start as soon as the file is imported ---------- */
let contactPromise = null;
const fetchContact = () => {
  if (!contactPromise) {
    contactPromise = fetch(`${API_URL}/api/contact`)
      .then((res) => res.json())
      .catch((err) => {
        console.error('Failed to load contact info:', err);
        contactPromise = null;
        return null;
      });
  }
  return contactPromise;
};
fetchContact();

/* ---------- Social icons (inline SVG) ---------- */
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

/* ---------- Reveal when scrolled into view ---------- */
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

const reveal = (visible, delay = 0, distance = 20) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
  transition: `opacity 500ms ease ${delay}ms, transform 500ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
});

/* ---------- One editable detail: value + ✎ button; Enter / click outside saves, Esc cancels ---------- */
const EditableField = ({ label, value, placeholder, inputType = 'text', maxLength, onSave, renderValue }) => {
  const inputRef = useRef(null);
  const activeRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const begin = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setDraft(value);
    setEditing(true);
  };

  const finish = (save) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setEditing(false);
    const next = draft.trim();
    if (save && next !== value) onSave(next);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const textStyle = {
    fontFamily: theme.fonts.body,
    fontSize: '1.05rem',
    lineHeight: 1.5,
    color: theme.colors.heading,
  };

  return (
    <div className="contact-field">
      <p className="m-0" style={{ fontFamily: theme.fonts.body, fontSize: '1rem', color: theme.colors.body }}>
        {label}
      </p>

      {editing ? (
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              finish(true);
            } else if (e.key === 'Escape') finish(false);
          }}
          className="w-full box-border"
          style={{
            ...textStyle,
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${theme.colors.accent}`,
            outline: 'none',
            padding: '2px 0',
          }}
        />
      ) : (
        <div className="flex items-start gap-2" style={textStyle}>
          <div style={{ whiteSpace: 'pre-line', opacity: value ? 1 : 0.5 }}>
            {value ? (renderValue ? renderValue(value) : value) : placeholder}
          </div>
          <button
            type="button"
            onClick={begin}
            aria-label={`Edit ${label}`}
            title={`Edit ${label}`}
            className="contact-edit"
          >
            ✎
          </button>
        </div>
      )}
    </div>
  );
};

const IconLink = ({ href, label, index, visible, children }) => (
  <span
    className="contact-pop inline-flex"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.6)',
      transition: `opacity 400ms ease ${350 + index * 80}ms, transform 450ms cubic-bezier(.34,1.56,.64,1) ${350 + index * 80}ms`,
    }}
  >
    <a
      href={href}
      target={href.startsWith('mailto:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="contact-icon flex items-center justify-center rounded-full"
      style={{
        width: '56px',
        height: '56px',
        backgroundColor: '#fff',
        border: `1px solid ${theme.colors.newsBorder}`,
      }}
    >
      {children}
    </a>
  </span>
);

const smallBtn = {
  fontFamily: theme.fonts.main,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  borderRadius: 999,
  padding: '10px 20px',
  cursor: 'pointer',
};

/* ---------- Section ---------- */
const ContactSection = () => {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false); // CV upload / remove in progress
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);
  const [headRef, headVisible] = useInView(0.2);
  const [cardsRef, cardsVisible] = useInView(0.1);

  useEffect(() => {
    let alive = true;
    fetchContact().then((data) => {
      if (alive && data && !data.error) setProfile(data);
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
  const updateProfile = (patch) =>
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      contactPromise = Promise.resolve(next);
      return next;
    });

  // text fields: instant, roll back on error, apply only the field we sent
  const saveField = async (field, value) => {
    const previous = profile[field];
    updateProfile({ [field]: value });
    try {
      const saved = await api('/api/contact', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ [field]: value }),
      });
      updateProfile({ [field]: saved[field] });
    } catch (err) {
      updateProfile({ [field]: previous });
      setNotice(err.message);
    }
  };

  const onCvFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return setNotice('Please choose a PDF file.');
    if (file.size > 10 * 1024 * 1024) return setNotice('CV must be under 10 MB.');

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('cv', file);
      const data = await api('/api/contact/cv', { method: 'POST', body: fd });
      updateProfile({ cv: data.cv });
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeCv = async () => {
    if (!window.confirm('Remove your CV? The file will be deleted.')) return;
    setBusy(true);
    try {
      await api('/api/contact/cv', { method: 'DELETE' });
      updateProfile({ cv: null });
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return null;

  // social icons stay read-only
  const social = Array.isArray(profile.social_links) ? profile.social_links : [];
  const links = social
    .filter((row) => row.link)
    .map((row) => {
      let href = row.link.trim();
      if (!/^(https?:|mailto:|tel:)/i.test(href)) {
        href = href.includes('@') ? `mailto:${href}` : `https://${href}`;
      }
      return { key: row.id, label: row.name, Icon: pickIcon(row.name), href };
    });

  return (
    <section className="w-full box-border px-6 sm:px-12 pt-8 pb-20">
      <style>{`
        .contact-icon { transition: transform 200ms ease, box-shadow 200ms ease; }
        .contact-icon:hover { transform: translateY(-4px); box-shadow: 0 8px 18px rgba(0,0,0,0.12); }
        .contact-cv { transition: transform 200ms ease, box-shadow 200ms ease, filter 200ms ease; }
        .contact-cv:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,0,0,0.18); filter: brightness(1.08); }
        .contact-arrow { display: inline-block; transition: transform 200ms ease; }
        .contact-cv:hover .contact-arrow { transform: translate(3px, -3px); }

        .contact-edit {
          border: 0; background: none; padding: 0 4px; cursor: pointer;
          color: ${theme.colors.accent}; font-size: 1rem; line-height: 1.5;
          opacity: 0; transition: opacity 200ms ease;
        }
        .contact-field:hover .contact-edit,
        .contact-edit:focus-visible { opacity: 0.85; }
        @media (hover: none) { .contact-edit { opacity: 0.7; } }

        @media (prefers-reduced-motion: reduce) {
          .contact-pop, .contact-head, .contact-card { transition: none !important; opacity: 1 !important; transform: none !important; }
          .contact-icon, .contact-cv, .contact-arrow, .contact-edit { transition: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl" style={{ borderTop: `1px solid ${theme.colors.newsBorder}` }}>
        <div className="pt-16">
          <div ref={headRef} className="contact-head" style={reveal(headVisible, 0, 16)}>
            <p
              className="uppercase m-0 mb-2"
              style={{
                fontFamily: theme.fonts.main,
                color: theme.colors.accent,
                fontSize: '0.85rem',
                letterSpacing: '0.25em',
              }}
            >
              Contact
            </p>
            <h2
              className="m-0 text-4xl sm:text-5xl"
              style={{ fontFamily: theme.fonts.heading, fontWeight: 400, color: theme.colors.heading }}
            >
              Get in touch
            </h2>
          </div>

          <div ref={cardsRef} className="mt-14 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
            {/* Left: contact details */}
            <div
              className="contact-card box-border"
              style={{
                ...reveal(cardsVisible, 0, 28),
                backgroundColor: '#fff',
                border: `1px solid ${theme.colors.newsBorder}`,
                borderRadius: '28px',
                padding: '40px',
              }}
            >
              <div className="flex flex-col gap-6">
                <EditableField
                  label="Email"
                  value={profile.email || ''}
                  placeholder="Add email"
                  inputType="email"
                  maxLength={255}
                  onSave={(v) => saveField('email', v)}
                  renderValue={(v) => (
                    <a href={`mailto:${v}`} style={{ color: theme.colors.accent, textDecoration: 'none' }}>
                      {v}
                    </a>
                  )}
                />
                <EditableField
                  label="Phone"
                  value={profile.number || ''}
                  placeholder="Add phone number"
                  inputType="tel"
                  maxLength={50}
                  onSave={(v) => saveField('number', v)}
                  renderValue={(v) => (
                    <a href={`tel:${v}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {v}
                    </a>
                  )}
                />
                <EditableField
                  label="Office"
                  value={profile.office_location || ''}
                  placeholder="Add office location"
                  maxLength={255}
                  onSave={(v) => saveField('office_location', v)}
                />
                <EditableField
                  label="Department"
                  value={profile.department || ''}
                  placeholder="Add department"
                  maxLength={255}
                  onSave={(v) => saveField('department', v)}
                />
              </div>

              {links.length > 0 && (
                <div className="flex flex-wrap gap-3.5 mt-10">
                  {links.map(({ key, label, Icon, href }, i) => (
                    <IconLink key={key} href={href} label={label} index={i} visible={cardsVisible}>
                      <Icon />
                    </IconLink>
                  ))}
                </div>
              )}
            </div>

            {/* Right: CV card */}
            <div
              className="contact-card box-border flex flex-col justify-center"
              style={{
                ...reveal(cardsVisible, 150, 28),
                backgroundColor: theme.colors.newsBg,
                border: `1px solid ${theme.colors.newsBorder}`,
                borderRadius: '28px',
                padding: '40px',
              }}
            >
              <h3
                className="m-0"
                style={{
                  fontFamily: theme.fonts.heading,
                  fontWeight: 500,
                  fontSize: '1.6rem',
                  color: theme.colors.heading,
                }}
              >
                Curriculum vitae
              </h3>
              <p
                className="m-0 mt-3"
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: theme.colors.body,
                  maxWidth: '24rem',
                }}
              >
                The full record — education, positions, publications, and awards.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                {profile.cv && (
                  <a
                    href={profile.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-cv uppercase inline-block"
                    style={{
                      fontFamily: theme.fonts.main,
                      fontSize: '0.8rem',
                      letterSpacing: '0.2em',
                      color: '#fff',
                      backgroundColor: theme.colors.accent,
                      borderRadius: '999px',
                      padding: '16px 30px',
                      textDecoration: 'none',
                    }}
                  >
                    Full CV <span className="contact-arrow">↗</span>
                  </a>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    ...smallBtn,
                    color: theme.colors.accent,
                    background: 'transparent',
                    border: `1px solid ${theme.colors.accent}`,
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy ? 'Working…' : profile.cv ? 'Replace PDF' : 'Upload CV (PDF)'}
                </button>

                {profile.cv && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={removeCv}
                    style={{
                      ...smallBtn,
                      color: theme.colors.body,
                      background: 'transparent',
                      border: 'none',
                      textDecoration: 'underline',
                      padding: '10px 6px',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    Remove
                  </button>
                )}

                <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onCvFile} />
              </div>
            </div>
          </div>
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

export default ContactSection;