/* Lucide-style icons (2px stroke, round caps) for the console kits.
   Superset of the storefront set + back-office glyphs. window.Icons global. */
const _ic = (paths, extra = {}) => ({ size = 18, color = 'currentColor', strokeWidth = 2, ...rest } = {}) =>
  React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', ...extra, ...rest,
  }, paths.map((d, i) => React.createElement('path', { key: i, d })));

const Icons = {
  Shield: _ic(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']),
  ShieldCheck: _ic(['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4']),
  Zap: _ic(['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']),
  Mail: _ic(['m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7', 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z']),
  Search: _ic(['m21 21-4.34-4.34', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z']),
  Copy: _ic(['M8 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z', 'M16 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1']),
  Check: _ic(['M20 6 9 17l-5-5']),
  ChevronLeft: _ic(['m15 18-6-6 6-6']),
  ChevronRight: _ic(['m9 18 6-6-6-6']),
  Lock: _ic(['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2']),
  Headset: _ic(['M3 11a9 9 0 0 1 18 0', 'M21 16v2a4 4 0 0 1-4 4h-5', 'M3 11v3a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z', 'M21 11v3a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z']),
  RefreshCw: _ic(['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5']),
  Star: _ic(['M11.5 2.5 14 8l6 .5-4.5 4 1.4 6L11.5 15 6 18.5l1.4-6L3 8.5 9 8z']),
  Clock: _ic(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2']),
  Package: _ic(['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12']),
  AlertTriangle: _ic(['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z', 'M12 9v4', 'M12 17h.01']),
  Inbox: _ic(['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z']),
  Megaphone: _ic(['m3 11 18-5v12L3 14v-3z', 'M11.6 16.8a3 3 0 1 1-5.8-1.6']),
  QrCode: _ic(['M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M15 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z', 'M3 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M14 15h3v3', 'M20 15v.01', 'M14 21h7', 'M21 18v3']),
  Plus: _ic(['M12 5v14', 'M5 12h14']),
  Wallet: _ic(['M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2', 'M3 7h16a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3', 'M16 12h.01']),
  Tag: _ic(['M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'M7.5 7.5h.01']),
};
window.Icons = Icons;
