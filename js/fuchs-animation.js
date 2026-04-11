// Fuchs-Animationssteuerung: Reaktionen auf Spielereignisse

// FUCHS-ANIMATION ANFANG
export function fuchsAktion(aktion) {
  const gruppe = document.getElementById('fuchs-gruppe');
  const kopf = document.getElementById('fuchs-kopf');
  const schwanz = document.getElementById('fuchs-schwanz');
  const mund = document.getElementById('mund');
  const brauLinks = document.getElementById('braue-links');
  const brauRechts = document.getElementById('braue-rechts');
  const konfetti = document.getElementById('konfetti');
  const pupilleLinks = document.getElementById('pupille-links');
  const pupilleRechts = document.getElementById('pupille-rechts');
  if (!gruppe) return;

  // Alle Animationen zuruecksetzen
  gruppe.classList.remove('nicken','schuetteln','jubeln','zittern','traurig-anim','warten');
  kopf.classList.remove('nicken','schuetteln');
  schwanz.classList.remove('schwanz-wedeln');
  konfetti.style.opacity = '0';
  konfetti.style.animation = '';

  // Gesicht zuruecksetzen
  mund.setAttribute('d','M26,32 Q30,34 34,32');
  mund.setAttribute('stroke-width','1.2');
  brauLinks.setAttribute('d','M22,18 Q25,16 28,18');
  brauRechts.setAttribute('d','M32,18 Q35,16 38,18');
  pupilleLinks.setAttribute('r','2');
  pupilleRechts.setAttribute('r','2');

  void gruppe.offsetWidth; // Reflow

  switch(aktion) {
    case 'warten':
      gruppe.classList.add('warten');
      schwanz.classList.add('schwanz-wedeln');
      break;

    case 'richtig':
      // Augen werden zu Boegen
      pupilleLinks.setAttribute('r','0');
      pupilleRechts.setAttribute('r','0');
      mund.setAttribute('d','M24,31 Q30,36 36,31');
      mund.setAttribute('stroke-width','1.8');
      brauLinks.setAttribute('d','M22,19 Q25,17 28,19');
      brauRechts.setAttribute('d','M32,19 Q35,17 38,19');
      kopf.classList.add('nicken');
      schwanz.classList.add('schwanz-wedeln');
      // Nach Animation zurueck zu warten
      setTimeout(() => fuchsAktion('warten'), 800);
      break;

    case 'falsch':
      // Augenbrauen nach oben — ueberrascht
      brauLinks.setAttribute('d','M22,16 Q25,14 28,16');
      brauRechts.setAttribute('d','M32,16 Q35,14 38,16');
      mund.setAttribute('d','M26,33 Q30,31 34,33');
      gruppe.classList.add('schuetteln');
      setTimeout(() => fuchsAktion('warten'), 700);
      break;

    case 'letzter-versuch':
      // Nervoes zittern
      brauLinks.setAttribute('d','M22,17 Q25,15 28,17');
      brauRechts.setAttribute('d','M32,17 Q35,15 38,17');
      mund.setAttribute('d','M26,33 Q30,31 34,33');
      gruppe.classList.add('zittern');
      break;

    case 'gewonnen':
      // Grosse Freude — Augen zu Sternen
      mund.setAttribute('d','M23,31 Q30,37 37,31');
      mund.setAttribute('stroke-width','2');
      brauLinks.setAttribute('d','M22,19 Q25,16 28,19');
      brauRechts.setAttribute('d','M32,19 Q35,16 38,19');
      gruppe.classList.add('jubeln');
      // Konfetti erscheint
      konfetti.style.opacity = '1';
      konfetti.style.animation = 'konfetti-fall 1s ease forwards';
      setTimeout(() => fuchsAktion('warten'), 1200);
      break;

    case 'verloren':
      // Kopf haengt — traurig
      mund.setAttribute('d','M26,34 Q30,31 34,34');
      brauLinks.setAttribute('d','M22,19 Q25,21 28,19');
      brauRechts.setAttribute('d','M32,19 Q35,21 38,19');
      gruppe.classList.add('traurig-anim');
      break;
  }
}
// FUCHS-ANIMATION ENDE
