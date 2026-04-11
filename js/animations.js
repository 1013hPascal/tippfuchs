// Animations-Schalter: aktiviert/deaktiviert alle CSS-Animationen

// ANIMATIONS-SCHALTER ANFANG
export function ladeAnimationen() {
  const gespeichert = localStorage.getItem('tippfuchs_animationen');
  const an = gespeichert !== 'aus';
  setzeAnimationen(an, false);
}

export function setzeAnimationen(an, save=true) {
  if (an) {
    document.body.classList.remove('keine-animationen');
  } else {
    document.body.classList.add('keine-animationen');
  }
  const labelAn = document.getElementById('label-anim-an');
  const labelAus = document.getElementById('label-anim-aus');
  const radioAn = document.getElementById('anim-an');
  const radioAus = document.getElementById('anim-aus');
  if (labelAn) labelAn.classList.toggle('aktiv', an);
  if (labelAus) labelAus.classList.toggle('aktiv', !an);
  if (radioAn) radioAn.checked = an;
  if (radioAus) radioAus.checked = !an;
  if (save) localStorage.setItem('tippfuchs_animationen', an ? 'an' : 'aus');
}

document.querySelectorAll('input[name="animationen"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.checked) setzeAnimationen(this.value === 'an');
  });
});
// ANIMATIONS-SCHALTER ENDE
