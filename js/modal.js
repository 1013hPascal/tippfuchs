// Modal-Verwaltung: öffnen, schließen, alle schließen

// MODAL ANFANG
export function oeffneModal(id) {
  schliesseAlleModals();
  const el=document.getElementById(id);
  el.classList.add('open'); el.setAttribute('aria-hidden','false');
  const c=el.querySelector('.modal-close');
  if (c) setTimeout(()=>c.focus(),100);
}
export function schliesseModal(id) { const el=document.getElementById(id); el.classList.remove('open'); el.setAttribute('aria-hidden','true'); }
export function schliesseAlleModals() { document.querySelectorAll('.modal-overlay').forEach(m=>{ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }); }
document.querySelectorAll('.modal-overlay').forEach(m=>m.setAttribute('aria-hidden','true'));
// MODAL ENDE
