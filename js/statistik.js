import { appState } from './state.js';
import { db, ref, get, child } from './firebase-config.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatumVonIdx, getMonatName, getJahrGott } from './hilfsfunktionen.js';
import { ladeRanglisteFirebase, ladeBestOfTime } from './firebase-basis.js';
import { formatZeit } from './timer.js';

// ALLE-SPIELER-STATISTIK ANFANG
export async function ladeBotListe(suchtext='') {
  const botListe=document.getElementById('bot-liste');
  const botAnzahl=document.getElementById('bot-anzahl');
  const botMeinPlatz=document.getElementById('bot-mein-platz');
  botListe.innerHTML='<li style="color:var(--text-muted);font-size:.9rem;padding:8px 0;">Wird geladen...</li>';
  const alle = await ladeBestOfTime();
  botAnzahl.textContent=`(${alle.length} Spielende in der Liste)`;
  botMeinPlatz.style.display='none';
  if (appState.currentSpitzname) {
    const platz=alle.findIndex(e=>e.name.toLowerCase()===appState.currentSpitzname.toLowerCase())+1;
    if (platz>0) {
      const medal = platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':'';
      botMeinPlatz.textContent=`${medal}Du bist auf Platz ${platz} (${alle[platz-1].punkte} Sieg${alle[platz-1].punkte!==1?'e':''})`;
      botMeinPlatz.style.display='block';
    } else {
      botMeinPlatz.textContent='Du hast es noch nicht in die Liste geschafft.';
      botMeinPlatz.style.display='block';
    }
  }
  const gefiltert=suchtext?alle.filter(e=>e.name.toLowerCase().includes(suchtext.toLowerCase())):alle;
  botListe.innerHTML='';
  gefiltert.slice(0,20).forEach((e,i)=>{
    const medal = i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'';
    const li=document.createElement('li');
    li.className=`best-of-eintrag platz-${i+1}`;
    li.innerHTML=`<span class="best-of-platz">${medal}${i+1}.</span><span class="best-of-name">${e.name}</span><span class="best-of-punkte">${e.punkte} Sieg${e.punkte!==1?'e':''}</span>`;
    botListe.appendChild(li);
  });
  if (gefiltert.length===0) botListe.innerHTML='<li style="color:var(--text-muted);font-size:.9rem;padding:8px 0;">Keine Spieler gefunden.</li>';
  const botMehr=document.getElementById('bot-mehr');
  if (gefiltert.length>20) {
    botMehr.style.display='flex';
    const sel=document.getElementById('bot-dropdown');
    sel.innerHTML='';
    gefiltert.slice(20).forEach((e,i)=>{
      const opt=document.createElement('option');
      opt.textContent=`${i+21}. ${e.name} - ${e.punkte} Sieg${e.punkte!==1?'e':''}`;
      sel.appendChild(opt);
    });
  } else { botMehr.style.display='none'; }
}

export async function ladeTagsSelect() {
  const sel=document.getElementById('tage-select');
  sel.innerHTML='';
  for (let i=1;i<=30;i++) {
    const idx=TAGES_IDX-i; if (idx<0) break;
    const opt=document.createElement('option');
    opt.value=idx; opt.textContent=getDatumVonIdx(idx);
    sel.appendChild(opt);
  }
  sel.addEventListener('change',ladeTagesErgebnis);
  await ladeTagesErgebnis();
}

export async function ladeTagesErgebnis() {
  const idx=parseInt(document.getElementById('tage-select').value);
  if (isNaN(idx)) return;
  const div=document.getElementById('tage-ergebnis');
  div.style.display='flex'; div.innerHTML='<span style="color:var(--text-muted);font-size:.9rem;">Wird geladen...</span>';
  const liste=await ladeRanglisteFirebase(idx);
  let loesung='-';
  try { const wSnap=await get(child(ref(db),`tageswoerter/${idx}`)); if(wSnap.exists()) loesung=wSnap.val(); } catch(e) {}
  let html=`<div class="tages-info-zeile"><span>Anzahl Spieler: <strong>${liste.length}</strong></span><span>Loesungswort: <strong>${loesung}</strong></span></div>`;
  if (liste.length===0) { div.innerHTML=html+'<div class="tages-ergebnis-zeile">Keine Daten.</div>'; document.getElementById('tage-weitere').style.display='none'; return; }
  if (appState.currentSpitzname) {
    const platz=liste.findIndex(e=>e.name.toLowerCase()===appState.currentSpitzname.toLowerCase())+1;
    if (platz>0) {
      const medal=platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':'';
      html+=`<div class="tages-ergebnis-zeile" style="background:var(--accent);color:#fff;border-radius:4px;padding:6px 10px;font-weight:700;">${medal}Dein Platz: ${platz}.</div>`;
    }
  }
  div.innerHTML=html;
  const topDiv=document.createElement('div'); topDiv.style.cssText='display:flex;flex-direction:column;gap:4px;'; div.appendChild(topDiv);
  liste.slice(0,20).forEach((e,i)=>{
    const medal=i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'';
    const d=document.createElement('div'); d.className='tages-ergebnis-zeile';
    d.innerHTML=`<span>${medal}${i+1}. ${e.name}</span><span>${e.versuche} Versuch${e.versuche!==1?'e':''} - ${formatZeit(e.sekunden)}</span>`;
    topDiv.appendChild(d);
  });
  const weitereDiv=document.getElementById('tage-weitere');
  if (liste.length>20) {
    weitereDiv.style.display='flex';
    const sel=document.getElementById('tage-weitere-dropdown'); sel.innerHTML='';
    liste.slice(20).forEach((e,i)=>{ const opt=document.createElement('option'); opt.textContent=`${i+21}. ${e.name} - ${e.versuche} Versuch${e.versuche!==1?'e':''} - ${formatZeit(e.sekunden)}`; sel.appendChild(opt); });
  } else { weitereDiv.style.display='none'; }
}

export async function ladeMonatSelect() {
  const jSel=document.getElementById('monat-jahr-select'); jSel.innerHTML='';
  [2026,2025].forEach(j=>{ const o=document.createElement('option'); o.value=j; o.textContent=getJahrGott(j); jSel.appendChild(o); });
  const mSel=document.getElementById('monat-select'); mSel.innerHTML='';
  for (let m=11;m>=0;m--) { const o=document.createElement('option'); o.value=m; o.textContent=getMonatName(m); mSel.appendChild(o); }
  jSel.addEventListener('change',ladeMonatErgebnis);
  mSel.addEventListener('change',ladeMonatErgebnis);
  await ladeMonatErgebnis();
}

export async function ladeMonatErgebnis() {
  const jahr=parseInt(document.getElementById('monat-jahr-select').value);
  const monat=parseInt(document.getElementById('monat-select').value);
  const div=document.getElementById('monat-ergebnis');
  div.style.display='flex'; div.innerHTML='<span style="color:var(--text-muted);font-size:.9rem;">Wird geladen...</span>';
  const start=new Date(jahr,monat,1), ende=new Date(jahr,monat+1,0);
  const sIdx=Math.floor((start-new Date('2025-01-01'))/86400000);
  const eIdx=Math.floor((ende-new Date('2025-01-01'))/86400000);
  const gMap={};
  for (let idx=sIdx;idx<=eIdx&&idx<TAGES_IDX;idx++) {
    const l=await ladeRanglisteFirebase(idx);
    if (l.length>=5&&l[0]) { const g=l[0],k=g.name.toLowerCase().replace(/[^a-z0-9]/g,'_'); gMap[k]={name:g.name,punkte:(gMap[k]?.punkte||0)+1}; }
  }
  const sortiert=Object.values(gMap).sort((a,b)=>b.punkte-a.punkte);
  if (sortiert.length===0) { div.innerHTML='<div class="tages-ergebnis-zeile">Keine Monatsstatistik verfuegbar.</div>'; document.getElementById('monat-weitere').style.display='none'; return; }
  let html='';
  if (appState.currentSpitzname) {
    const platz=sortiert.findIndex(e=>e.name.toLowerCase()===appState.currentSpitzname.toLowerCase())+1;
    if (platz>0) { const medal=platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':''; html+=`<div class="tages-ergebnis-zeile" style="background:var(--accent);color:#fff;border-radius:4px;padding:6px 10px;font-weight:700;">${medal}Dein Platz: ${platz}.</div>`; }
  }
  div.innerHTML=html;
  const topDiv=document.createElement('div'); topDiv.style.cssText='display:flex;flex-direction:column;gap:4px;'; div.appendChild(topDiv);
  sortiert.slice(0,20).forEach((e,i)=>{ const medal=i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''; const d=document.createElement('div'); d.className='tages-ergebnis-zeile'; d.innerHTML=`<span>${medal}${i+1}. ${e.name}</span><span>${e.punkte} Sieg${e.punkte!==1?'e':''}</span>`; topDiv.appendChild(d); });
  const wDiv=document.getElementById('monat-weitere');
  if (sortiert.length>20) { wDiv.style.display='flex'; const sel=document.getElementById('monat-weitere-dropdown'); sel.innerHTML=''; sortiert.slice(20).forEach((e,i)=>{ const o=document.createElement('option'); o.textContent=`${i+21}. ${e.name} - ${e.punkte} Sieg${e.punkte!==1?'e':''}`; sel.appendChild(o); }); }
  else { wDiv.style.display='none'; }
}

export async function ladeJahrSelect() {
  const sel=document.getElementById('jahr-select'); sel.innerHTML='';
  const aj=new Date().getFullYear();
  for (let j=aj;j>=2025;j--) { const o=document.createElement('option'); o.value=j; o.textContent=getJahrGott(j); sel.appendChild(o); }
  sel.addEventListener('change',ladeJahrErgebnis);
  await ladeJahrErgebnis();
}

export async function ladeJahrErgebnis() {
  const jahr=parseInt(document.getElementById('jahr-select').value);
  const div=document.getElementById('jahr-ergebnis');
  div.style.display='flex'; div.innerHTML='<span style="color:var(--text-muted);font-size:.9rem;">Wird geladen...</span>';
  const aj=new Date().getFullYear();
  if (jahr>=aj) { div.innerHTML=`<div class="tages-ergebnis-zeile">Jahresstatistik ist erst ab 02.01.${aj+1} verfuegbar.</div>`; document.getElementById('jahr-weitere').style.display='none'; return; }
  const start=new Date(jahr,0,1),ende=new Date(jahr,11,31);
  const sIdx=Math.floor((start-new Date('2025-01-01'))/86400000);
  const eIdx=Math.floor((ende-new Date('2025-01-01'))/86400000);
  const gMap={};
  for (let idx=sIdx;idx<=eIdx&&idx<TAGES_IDX;idx++) {
    const l=await ladeRanglisteFirebase(idx);
    if (l.length>=5&&l[0]) { const g=l[0],k=g.name.toLowerCase().replace(/[^a-z0-9]/g,'_'); gMap[k]={name:g.name,punkte:(gMap[k]?.punkte||0)+1}; }
  }
  const sortiert=Object.values(gMap).sort((a,b)=>b.punkte-a.punkte);
  if (sortiert.length===0) { div.innerHTML='<div class="tages-ergebnis-zeile">Keine Jahresstatistik verfuegbar.</div>'; document.getElementById('jahr-weitere').style.display='none'; return; }
  let html='';
  if (appState.currentSpitzname) {
    const platz=sortiert.findIndex(e=>e.name.toLowerCase()===appState.currentSpitzname.toLowerCase())+1;
    if (platz>0) { const medal=platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':''; html+=`<div class="tages-ergebnis-zeile" style="background:var(--accent);color:#fff;border-radius:4px;padding:6px 10px;font-weight:700;">${medal}Dein Platz: ${platz}.</div>`; }
  }
  div.innerHTML=html;
  const topDiv=document.createElement('div'); topDiv.style.cssText='display:flex;flex-direction:column;gap:4px;'; div.appendChild(topDiv);
  sortiert.slice(0,20).forEach((e,i)=>{ const medal=i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''; const d=document.createElement('div'); d.className='tages-ergebnis-zeile'; d.innerHTML=`<span>${medal}${i+1}. ${e.name}</span><span>${e.punkte} Sieg${e.punkte!==1?'e':''}</span>`; topDiv.appendChild(d); });
  const wDiv=document.getElementById('jahr-weitere');
  if (sortiert.length>20) { wDiv.style.display='flex'; const sel=document.getElementById('jahr-weitere-dropdown'); sel.innerHTML=''; sortiert.slice(20).forEach((e,i)=>{ const o=document.createElement('option'); o.textContent=`${i+21}. ${e.name} - ${e.punkte} Sieg${e.punkte!==1?'e':''}`; sel.appendChild(o); }); }
  else { wDiv.style.display='none'; }
}
// ALLE-SPIELER-STATISTIK ENDE
