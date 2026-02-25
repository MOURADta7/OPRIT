// Simple SVG icons for ORBIT
// These are base64 encoded SVG data URLs that can be used directly

const orbitIcon16 = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7" fill="none" stroke="#00d4ff" stroke-width="1.5"/>
  <circle cx="8" cy="8" r="2.5" fill="#00d4ff"/>
</svg>`)}`;

const orbitIcon32 = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="13" fill="none" stroke="#00d4ff" stroke-width="2"/>
  <circle cx="16" cy="16" r="5" fill="#00d4ff"/>
  <path d="M16 3 L16 8 M16 24 L16 29 M3 16 L8 16 M24 16 L29 16" stroke="#00d4ff" stroke-width="1.5"/>
</svg>`)}`;

const orbitIcon48 = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="none" stroke="#00d4ff" stroke-width="2.5"/>
  <circle cx="24" cy="24" r="7" fill="#00d4ff"/>
  <path d="M24 4 L24 12 M24 36 L24 44 M4 24 L12 24 M36 24 L44 24" stroke="#00d4ff" stroke-width="2"/>
</svg>`)}`;

const orbitIcon128 = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0088cc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="55" fill="none" stroke="url(#grad1)" stroke-width="6"/>
  <circle cx="64" cy="64" r="18" fill="url(#grad1)"/>
  <path d="M64 9 L64 25 M64 103 L64 119 M9 64 L25 64 M103 64 L119 64" stroke="url(#grad1)" stroke-width="5" stroke-linecap="round"/>
</svg>`)}`;

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { orbitIcon16, orbitIcon32, orbitIcon48, orbitIcon128 };
}