// SocialMedia.jsx - social icon buttons + add / edit / remove links
// Props:
//   links     -> array from the DB: [{ id, name, link }]
//   onChange  -> called with the new links array after any save/remove
//   onNotice  -> called with an error message (optional)
import React, { useState } from 'react';
import theme from '../theme';
import { JSON_HEADERS, api } from '../Api';

/* ---------- Icons (matched by the `name` column) ---------- */
const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24' };

const ScholarIcon = () => (
  <svg {...iconProps}>
    <path fill="#4285F4" d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3z" />
    <path fill="#356AC3" d="M5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z" />
  </svg>
);

const InstitutionIcon = () => (
  <svg {...iconProps}>
    <path fill="#8B1E3F" d="M12 2 2 7v2h20V7L12 2zM4 10v7h3v-7H4zm6.5 0v7h3v-7h-3zM17 10v7h3v-7h-3zM2 19v3h20v-3H2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg {...iconProps}>
    <rect width="24" height="24" rx="3" fill="#0A66C2" />
    <path fill="#fff" d="M5 9h3v10H5V9zm1.5-4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10 9h2.9v1.4c.5-.9 1.6-1.6 3.1-1.6 3 0 3.5 2 3.5 4.5V19h-3v-5c0-1.2 0-2.6-1.6-2.6S13 12.7 13 14v5h-3V9z" />
  </svg>
);

const OrcidIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="11" fill="#A6CE39" />
    <path fill="#fff" d="M8 7.2a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0zM6.3 9h1.6v7H6.3V9zm3 0h3.4c2.7 0 4 1.5 4 3.5S15.4 16 12.7 16H9.3V9zm1.6 1.4v4.2h1.7c1.8 0 2.5-.9 2.5-2.1s-.7-2.1-2.5-2.1h-1.7z" />
  </svg>
);

const EmailIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="5" width="20" height="14" rx="2" fill="#0F78D4" />
    <path fill="none" stroke="#fff" strokeWidth="1.8" d="m3 7 9 6 9-6" />
  </svg>
);

const GitHubIcon = () => (
  <svg {...iconProps}>
    <path fill="#24292F" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.4-3.88-1.4-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.56-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5z" />
  </svg>
);

const TwitterIcon = () => (
  <svg {...iconProps}>
    <path fill="#111" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.19L2 3h6.33l4.37 5.78L17.75 3zm-1.08 16.16h1.7L7.4 4.74H5.58l11.09 14.42z" />
  </svg>
);

// SPIE: blue rounded badge with a white "S" stroke
const SpieIcon = () => (
  <svg {...iconProps}>
    <rect width="24" height="24" rx="4" fill="#00539B" />
    <path
      d="M16.2 8.3C15.6 5.9 8 6 8 9.8c0 3.6 8.2 1.8 8.2 5.3 0 3.6-7.6 3.7-8.4 1"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PencilIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

// key = lowercase keyword found in the `name` column
const ICON_MAP = [
  { match: ['scholar'], Icon: ScholarIcon },
  { match: ['institution', 'university', 'college', 'department', 'website', 'faculty'], Icon: InstitutionIcon },
  { match: ['linkedin'], Icon: LinkedInIcon },
  { match: ['orcid'], Icon: OrcidIcon },
  { match: ['spie'], Icon: SpieIcon },
  { match: ['email', 'mail', 'outlook'], Icon: EmailIcon },
  { match: ['github'], Icon: GitHubIcon },
  { match: ['twitter', 'x'], Icon: TwitterIcon },
];

const getIcon = (name = '') => {
  const n = name.toLowerCase().trim();
  const found = ICON_MAP.find(({ match }) => match.some((m) => (m === 'x' ? n === 'x' : n.includes(m))));
  return found ? found.Icon : null;
};

const buildHref = (name = '', link = '') => {
  const isEmail = name.toLowerCase().includes('mail') || name.toLowerCase().includes('outlook');
  if (isEmail && link.includes('@') && !link.startsWith('mailto:')) return `mailto:${link}`;
  return link;
};

const PLATFORMS = ['Google Scholar', 'Institution', 'LinkedIn', 'ORCID', 'SPIE', 'Email', 'GitHub', 'Twitter'];

/* ---------- Component ---------- */
const SocialMedia = ({ links = [], onChange, onNotice }) => {
  const [editor, setEditor] = useState(null); // { id, name, link, isNew }
  const [busy, setBusy] = useState(false);

  const notify = (msg) => onNotice && onNotice(msg);

  const allSocials = links.filter((s) => getIcon(s.name));
  const freePlatforms = PLATFORMS.filter(
    (p) => !allSocials.some((s) => s.name.toLowerCase() === p.toLowerCase())
  );

  const save = async () => {
    const raw = editor.link.trim();
    if (!raw) return notify('Enter a link first.');
    const isMail = /mail/i.test(editor.name);
    if (isMail && !raw.includes('@')) return notify('Enter a valid email address.');
    const link = isMail || /^(https?:\/\/|mailto:)/i.test(raw) ? raw : `https://${raw}`;

    setBusy(true);
    try {
      const data = await api(editor.isNew ? '/api/social' : `/api/social/${editor.id}`, {
        method: editor.isNew ? 'POST' : 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: editor.name, link }),
      });
      onChange(data);
      setEditor(null);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const data = await api(`/api/social/${editor.id}`, { method: 'DELETE' });
      onChange(data);
      setEditor(null);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center" style={{ zIndex: 1 }}>
      <style>{`
        @keyframes sm-pop {
          from { opacity: 0; transform: translateY(12px) scale(0.9); }
          to   { opacity: 1; transform: none; }
        }
        .sm-item { opacity: 0; animation: sm-pop 450ms cubic-bezier(.2,.8,.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .sm-item { animation: none; opacity: 1; }
        }
      `}</style>

      {/* icon buttons */}
      <div className="flex flex-wrap justify-center gap-3.5 mt-8">
        {allSocials.map((s, i) => {
          const Icon = getIcon(s.name);
          const hasLink = !!s.link;
          const shared = {
            'aria-label': s.name,
            title: hasLink ? s.name : `Add ${s.name} link`,
            className:
              'sm-item flex items-center justify-center rounded-full bg-white transition-transform duration-300 ease-out hover:-translate-y-1 cursor-pointer p-0',
            style: {
              animationDelay: `${900 + i * 90}ms`,
              width: '56px',
              height: '56px',
              border: `1px solid ${theme.colors.iconBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              opacity: hasLink ? undefined : 0.45,
            },
          };
          return (
            <div key={s.id} className="relative">
              {hasLink ? (
                <a href={buildHref(s.name, s.link)} target="_blank" rel="noopener noreferrer" {...shared}>
                  <Icon />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditor({ id: s.id, name: s.name, link: '', isNew: false })}
                  {...shared}
                >
                  <Icon />
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditor({ id: s.id, name: s.name, link: s.link || '', isNew: false })}
                aria-label={`Edit ${s.name} link`}
                title={`Edit ${s.name} link`}
                className="absolute flex items-center justify-center rounded-full border-0 cursor-pointer p-0"
                style={{
                  top: -4,
                  right: -4,
                  width: 22,
                  height: 22,
                  background: theme.colors.accent,
                  color: '#fff',
                  zIndex: 2,
                }}
              >
                <PencilIcon />
              </button>
            </div>
          );
        })}

        {freePlatforms.length > 0 && (
          <button
            type="button"
            onClick={() => setEditor({ id: null, name: freePlatforms[0], link: '', isNew: true })}
            aria-label="Add a link"
            title="Add a link"
            className="flex items-center justify-center rounded-full bg-transparent cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            style={{
              width: 56,
              height: 56,
              border: `2px dashed ${theme.colors.accent}`,
              color: theme.colors.accent,
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            +
          </button>
        )}
      </div>

      {/* link editor */}
      {editor && (
        <div
          className="relative w-full box-border mt-5 bg-white"
          style={{
            maxWidth: 380,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${theme.colors.iconBorder}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
            fontFamily: theme.fonts.body,
          }}
        >
          {editor.isNew ? (
            <select
              value={editor.name}
              onChange={(e) => setEditor({ ...editor, name: e.target.value })}
              className="w-full box-border mb-3"
              style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${theme.colors.iconBorder}` }}
            >
              {freePlatforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            <p
              className="m-0 mb-3 uppercase"
              style={{ fontFamily: theme.fonts.main, fontSize: '0.8rem', letterSpacing: '0.15em', color: theme.colors.accent }}
            >
              {editor.name}
            </p>
          )}

          <input
            autoFocus
            value={editor.link}
            onChange={(e) => setEditor({ ...editor, link: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditor(null);
            }}
            placeholder={/mail/i.test(editor.name) ? 'name@example.com' : 'https://...'}
            className="w-full box-border"
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${theme.colors.iconBorder}`, outline: 'none' }}
          />

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="border-0 cursor-pointer disabled:opacity-60"
              style={{ background: theme.colors.accent, color: '#fff', padding: '8px 16px', borderRadius: 8 }}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="cursor-pointer bg-transparent"
              style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.colors.iconBorder}` }}
            >
              Cancel
            </button>
            {!editor.isNew && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="ml-auto cursor-pointer bg-transparent disabled:opacity-60"
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', color: theme.colors.accent }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMedia;