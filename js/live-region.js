// Barrierefreiheit: Screenreader-Ankündigungen via ARIA-Live-Region

// LIVE-REGION ANFANG
export function sageLaut(text) {
  const el = document.getElementById('live-region');
  el.textContent = '';
  setTimeout(() => { el.textContent = text; }, 200);
}
