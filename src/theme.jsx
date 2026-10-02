// theme.jsx
const theme = {
  colors: {
    background: '#F4F5F7',
    selectionBackground: '#5C3A21',
    // News
    newsBg: '#EEDDDF',
    newsBorder: '#DDB8BE',
    newsBorderStrong: '#B92E48',
    textPrimary: '#5C3A21',
    textActive: '#D2691E',
    textHover: '#3E2723',
    textSelection: '#ffffff',
    // Explore cards
    cardDark: '#9A2139',
    cardLight: '#B92E48',
    dot: 'rgba(107, 98, 102, 0.18)',
    // Home page additions
    accent: '#9B1C2E',        // "WELCOME TO THE" crimson
    heading: '#231F20',       // big serif title
    body: '#6B6266',          // paragraph text
    glow: 'rgba(155, 28, 46, 0.08)', // soft glow behind the photo
    iconBorder: '#ECE7E6',
    // Footer
    footerBg: '#ECE7E6',      // footer background
    footerBorder: '#DDB8BE',  // line above the footer
    affilText: '#9B1C2E',     // affiliation chip text
    affilBg: '#EEDDDF',       // affiliation chip background
    affilBorder: '#DDB8BE',   // affiliation chip border
  },
  fonts: {
    main: '"Space Mono", "Courier New", Courier, monospace',
    heading: '"Fraunces", Georgia, "Times New Roman", serif',
    body: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    size: '0.85rem',
    letterSpacing: '1.5px',
  },
  spacing: {
    navGap: '2.5rem',
    padding: '24px 48px',
  },
};

export default theme;