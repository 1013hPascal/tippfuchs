// Modal-Verwaltung: öffnen, schließen, alle schließen

// MODAL ANFANG
export function oeffneModal(id) {
  schliesseAlleModals();
  const el=document.getElementById(id);
  el.style.display='flex';
  // kurze Pause damit der Browser display:flex registriert, dann Klasse hinzufügen
  requestAnimationFrame(()=>{
    el.classList.add('open'); el.setAttribute('aria-hidden','false');
    const c=el.querySelector('.modal-close');
    if (c) setTimeout(()=>c.focus(),100);
  });
}
export function schliesseModal(id) {
  const el=document.getElementById(id);
  el.classList.remove('open');
  el.setAttribute('aria-hidden','true');
  // Nach CSS-Transition display:none setzen, damit Screen Reader nichts mehr lesen
  setTimeout(()=>{ if (!el.classList.contains('open')) el.style.display='none'; }, 250);
}
export function schliesseAlleModals() {
  document.querySelectorAll('.modal-overlay').forEach(m=>{
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
    setTimeout(()=>{ if (!m.classList.contains('open')) m.style.display='none'; }, 250);
  });
}
// Beim Start alle Modals verstecken
document.querySelectorAll('.modal-overlay').forEach(m=>{
  m.setAttribute('aria-hidden','true');
  m.style.display='none';
});
// MODAL ENDE
