import { appState } from './state.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatumVonIdx } from './hilfsfunktionen.js';
import { ladeFriendesliste, fuegeFreundHinzu, entferneFreund, sucheSpielernamen } from './freundesliste.js';
import { ladeRanglisteFirebase } from './firebase-basis.js';
import { formatZeit } from './timer.js';
import { sageLaut } from './live-region.js';

// FREUNDESLISTE-UI ANFANG
export async function ladeFreundeslisteUI() {
  if (!appState.currentUser) return;
  const freunde=await ladeFriendesliste();
  const fSel=document.getElementById('freunde-tage-select'); fSel.innerHTML='';
  for (let i=1;i<=30;i++) { const idx=TAGES_IDX-i; if (idx<0) break; const o=document.createElement('option'); o.value=idx; o.textContent=getDatumVonIdx(idx); fSel.appendChild(o); }
  const newFSel=fSel.cloneNode(true); fSel.parentNode.replaceChild(newFSel,fSel);
  newFSel.addEventListener('change',ladeFreundeTagesErgebnis);
  await ladeFreundeTagesErgebnis();
  ladeFreundeEntfernenListe(freunde);
}

export async function ladeFreundeTagesErgebnis() {
  if (!appState.currentUser) return;
  const idx=parseInt(document.getElementById('freunde-tage-select').value);
  if (isNaN(idx)) return;
  const div=document.getElementById('freunde-tage-ergebnis');
  div.style.display='flex'; div.innerHTML='<span style="color:var(--text-muted);font-size:.9rem;">Wird geladen...</span>';
  const freunde=await ladeFriendesliste();
  if (freunde.length===0) { div.innerHTML='<div class="tages-ergebnis-zeile">Noch keine Freunde in der Liste.</div>'; return; }
  const tL=await ladeRanglisteFirebase(idx);
  let loesung='-';
  try { const wSnap=await get(child(ref(db),`tageswoerter/${idx}`)); if(wSnap.exists()) loesung=wSnap.val(); } catch(e) {}
  div.innerHTML=`<div class="tages-info-zeile"><span>Loesungswort: <strong>${loesung}</strong></span></div>`;
  const topDiv=document.createElement('div'); topDiv.style.cssText='display:flex;flex-direction:column;gap:4px;'; div.appendChild(topDiv);
  const alleNamen=[...freunde.map(f=>f.name)];
  if (appState.currentSpitzname&&!alleNamen.find(n=>n.toLowerCase()===appState.currentSpitzname.toLowerCase())) alleNamen.unshift(appState.currentSpitzname);
  const mMitPlatz=alleNamen.map(name=>{ const e=tL.find(e=>e.name.toLowerCase()===name.toLowerCase()); return e?{...e,gespielt:true}:{name,gespielt:false}; })
    .sort((a,b)=>{ if (!a.gespielt&&!b.gespielt) return 0; if (!a.gespielt) return 1; if (!b.gespielt) return -1; if (a.versuche!==b.versuche) return a.versuche-b.versuche; return a.sekunden-b.sekunden; });
  mMitPlatz.forEach((e,i)=>{ const d=document.createElement('div'); d.className='tages-ergebnis-zeile'; if (e.gespielt) { const medal=i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''; d.innerHTML=`<span>${medal}${i+1}. ${e.name}</span><span>${e.versuche} Versuch${e.versuche!==1?'e':''} - ${formatZeit(e.sekunden)}</span>`; } else { d.style.color='var(--text-muted)'; d.innerHTML=`<span>${e.name}</span><span>Nicht gespielt</span>`; } topDiv.appendChild(d); });
}

export function ladeFreundeEntfernenListe(freunde) {
  const liste=document.getElementById('freunde-entfernen-liste');
  const btn=document.getElementById('btn-freunde-entfernen');
  liste.innerHTML='';
  const selected=new Set();
  if (freunde.length===0) { liste.innerHTML='<p style="font-size:.9rem;color:var(--text-muted);padding:4px;">Noch keine Freunde in der Liste.</p>'; btn.style.display='none'; return; }
  freunde.forEach(f=>{
    const label=document.createElement('label'); label.className='checkbox-label';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.value=f.name;
    cb.addEventListener('change',()=>{ if (cb.checked) selected.add(f.name); else selected.delete(f.name); btn.style.display=selected.size>0?'block':'none'; btn.textContent=`${[...selected].join(', ')} entfernen ➖`; });
    label.appendChild(cb); label.appendChild(document.createTextNode(f.name));
    liste.appendChild(label);
  });
  btn.style.display='none';
  btn.onclick=async()=>{
    if (!confirm(`Moechtest du wirklich ${[...selected].join(', ')} aus deiner Freundesliste entfernen?`)) return;
    for (const name of selected) await entferneFreund(name);
    sageLaut('Freunde entfernt.');
    await ladeFreundeslisteUI();
  };
}

let suchTimeout=null;
document.getElementById('freunde-suche').addEventListener('input', async function() {
  clearTimeout(suchTimeout);
  const suchtext=this.value.trim();
  const ergebnisDiv=document.getElementById('freunde-suche-ergebnis');
  const hinzufuegenBtn=document.getElementById('btn-freunde-hinzufuegen');
  if (suchtext.length<2) { ergebnisDiv.style.display='none'; hinzufuegenBtn.style.display='none'; return; }
  suchTimeout=setTimeout(async()=>{
    const treffer=await sucheSpielernamen(suchtext);
    ergebnisDiv.innerHTML=''; ergebnisDiv.style.display='flex';
    const selectedNamen=new Set();
    if (treffer.length===0) { ergebnisDiv.innerHTML='<p style="font-size:.9rem;color:var(--text-muted);padding:4px;">Keine Spieler gefunden.</p>'; hinzufuegenBtn.style.display='none'; return; }
    const freunde=await ladeFriendesliste();
    const freundeNamen=new Set(freunde.map(f=>f.name.toLowerCase()));
    treffer.forEach(n=>{
      if (freundeNamen.has(n)) return;
      const label=document.createElement('label'); label.className='checkbox-label';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.value=n;
      cb.addEventListener('change',()=>{ if (cb.checked) selectedNamen.add(n); else selectedNamen.delete(n); hinzufuegenBtn.style.display=selectedNamen.size>0?'block':'none'; });
      label.appendChild(cb); label.appendChild(document.createTextNode(n));
      ergebnisDiv.appendChild(label);
    });
    hinzufuegenBtn.style.display='none';
    hinzufuegenBtn.onclick=async()=>{
      for (const n of selectedNamen) await fuegeFreundHinzu(n);
      sageLaut('Freunde hinzugefuegt.');
      document.getElementById('freunde-suche').value='';
      ergebnisDiv.style.display='none'; hinzufuegenBtn.style.display='none';
      await ladeFreundeslisteUI();
    };
  },400);
});
// FREUNDESLISTE-UI ENDE
