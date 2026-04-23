// Screen-Navigation: blendet Screens ein/aus

// SCREENS ANFANG
export function zeigeScreen(id) {
  document.querySelectorAll('main > section').forEach(s => {
    s.style.display = 'none'; s.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex'; el.classList.add('active');
    // Fokus auf erste Überschrift setzen (tabindex="-1": per JS fokussierbar, nicht per Tab)
    const h1 = el.querySelector('h1');
    if (h1) {
      if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
      setTimeout(() => h1.focus(), 50);
    }
  }

  // Globaler Zurück-Button oben: sichtbar auf allen Seiten außer Start
  const topZurueck = document.getElementById('global-top-zurueck');
  const topBtn = document.getElementById('btn-global-zurueck-top');
  if (topZurueck && topBtn) {
    if (id === 'start-screen') {
      topZurueck.style.display = 'none';
    } else {
      topZurueck.style.display = 'block';
      // Klickt den unteren Zurück-Button der aktiven Sektion
      topBtn.onclick = () => {
        // Erst prüfen ob ein Modal offen ist — dann nur dieses schließen
        const offeneModal = document.querySelector('.modal-overlay.open');
        if (offeneModal) {
          offeneModal.classList.remove('open');
          offeneModal.setAttribute('aria-hidden', 'true');
          return;
        }
        const aktiv = document.getElementById(id);
        if (!aktiv) return;
        const zurueckBtn = aktiv.querySelector('[id^="btn-zurueck"]');
        if (zurueckBtn) zurueckBtn.click();
      };
    }
  }
  // Startseite: immer zum Seitenanfang scrollen damit das Haus sichtbar ist
  if (id === 'start-screen') window.scrollTo({ top: 0, behavior: 'instant' });
  // Design-Hintergrund nur auf Spielfeld zeigen
  const hintergrund = document.getElementById('design-hintergrund');
  if (hintergrund) {
    const design = document.documentElement.dataset.design;
    if (design && design !== 'standard') {
      hintergrund.style.display = id === 'spiel-screen' ? 'block' : 'none';
    }
  }
}
function zeigeStart() { aktualisiereStartseite(); zeigeScreen('start-screen'); document.getElementById('fuchs-container').style.display = 'none'; }
// SCREENS ENDE
