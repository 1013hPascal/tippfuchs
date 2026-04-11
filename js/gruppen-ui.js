import { appState } from './state.js';
import { db, ref, get, child } from './firebase-config.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatumVonIdx } from './hilfsfunktionen.js';
import { ladeGruppen, ladeGruppe, nimmAnfrageAn, lehnAnfrageAb, ladeGruppenBestOfTime } from './gruppen.js';
import { ladeRanglisteFirebase } from './firebase-basis.js';
import { formatZeit } from './timer.js';
import { zeigeScreen } from './screens.js';
import { ladeFreundeslisteUI } from './freundesliste-ui.js';
import { sageLaut } from './live-region.js';
import { oeffneModal } from './modal.js';

// GRUPPEN-UI ANFANG
export async function zeigeGruppenScreen() {
  zeigeScreen('gruppen-screen');
  const keinKonto=document.getElementById('gruppen-kein-konto');
  const inhalt=document.getElementById('gruppen-inhalt');
  if (!appState.currentUser) { keinKonto.style.display='flex'; inhalt.style.display='none'; return; }
  keinKonto.style.display='none'; inhalt.style.display='flex';
  await ladeMeineGruppenListe();
  await ladeFreundeslisteUI();
}

export async function ladeMeineGruppenListe() {
  const liste=document.getElementById('meine-gruppen-liste');
  liste.innerHTML='<p style="font-size:.9rem;color:var(--text-muted);">Wird geladen...</p>';
  const gruppen=await ladeGruppen();
  liste.innerHTML='';
  if (gruppen.length===0) { liste.innerHTML='<p style="font-size:.9rem;color:var(--text-muted);">Du bist noch in keiner Tippfuchs Gruppe.</p>'; return; }
  gruppen.forEach(g=>{
    const anzM=g.mitglieder?Object.keys(g.mitglieder).length:0;
    const anzA=g.anfragen?Object.keys(g.anfragen).length:0;
    const btn=document.createElement('button');
    btn.className='gruppe-btn';
    btn.innerHTML=`<span class="gruppe-btn-name">${g.name}${anzA>0?' ('+anzA+' Anfrage'+(anzA!==1?'n':'')+') 📬':''}</span><span class="gruppe-btn-info">${anzM} Mitglied${anzM!==1?'er':''}</span>`;
    btn.addEventListener('click',()=>zeigeGruppeDetail(g.id));
    liste.appendChild(btn);
  });
}

export async function zeigeGruppeDetail(gruppenId) {
  appState.aktiveGruppeId=gruppenId;
  const gruppe=await ladeGruppe(gruppenId);
  if (!gruppe) return;
  appState.aktiveGruppeDaten=gruppe;
  zeigeScreen('gruppe-detail-screen');
  document.getElementById('gruppe-detail-titel').textContent=gruppe.name;
  document.getElementById('gruppe-id-anzeige').textContent=gruppenId;

  const btnTeilen = document.getElementById('btn-gruppe-code-teilen');
  if (btnTeilen) {
    btnTeilen.onclick = () => {
      const gruppenName = gruppe?.name || 'Tippfuchs Gruppe';
      const code = gruppenId;
      const text = `Ich lade dich ein zu meiner Tippfuchs Gruppe "${gruppenName}"!\n\nTippfuchs ist ein tägliches Worträtsel, 5 Buchstaben, 6 Versuche, jeden Tag ein neues Wort. Für alle spielbar!\n\nÖffne die Seite: https://blindmove.blogspot.com/p/tippfuchs.html\nGehe zu Statistiken, dann Meine Tippfuchs Gruppen, dann Gruppe beitreten.\nGib diesen Beitrittscode ein: ${code}\n\nIch freue mich darauf mit dir zu spielen!`;
      if (navigator.share) {
        navigator.share({ text }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          btnTeilen.textContent = '✓ Kopiert!';
          setTimeout(() => { btnTeilen.innerHTML = '🦊 Beitrittscode teilen'; }, 2500);
        });
      } else {
        prompt('Text kopieren:', text);
      }
    };
  }
  const mListe=document.getElementById('gruppe-mitglieder-liste');
  mListe.innerHTML='';
  if (gruppe.mitglieder) {
    Object.values(gruppe.mitglieder).forEach(m=>{
      const div=document.createElement('div'); div.className='mitglied-zeile';
      div.innerHTML=`<span style="font-weight:700;flex:1;">${m.name}</span>`;
      mListe.appendChild(div);
    });
  }
  const aBereich=document.getElementById('gruppe-anfragen-bereich');
  const aListe=document.getElementById('gruppe-anfragen-liste');
  if (gruppe.anfragen&&Object.keys(gruppe.anfragen).length>0) {
    aBereich.style.display='flex'; aListe.innerHTML='';
    Object.entries(gruppe.anfragen).forEach(([uid,a])=>{
      const div=document.createElement('div');
      div.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 0;';
      div.innerHTML=`<span style="flex:1;font-weight:700;">${a.name}</span>`;
      const btnA=document.createElement('button');
      btnA.className='btn-primary'; btnA.style.cssText='padding:6px 10px;font-size:.82rem;width:auto;';
      btnA.textContent='Annehmen ✅';
      btnA.addEventListener('click',async()=>{ await nimmAnfrageAn(gruppenId,uid,a.name); sageLaut(`${a.name} hinzugefuegt.`); zeigeGruppeDetail(gruppenId); });
      const btnL=document.createElement('button');
      btnL.className='btn-secondary'; btnL.style.cssText='padding:6px 10px;font-size:.82rem;width:auto;';
      btnL.textContent='Ablehnen ❌';
      btnL.addEventListener('click',async()=>{ await lehnAnfrageAb(gruppenId,uid); zeigeGruppeDetail(gruppenId); });
      div.appendChild(btnA); div.appendChild(btnL);
      aListe.appendChild(div);
    });
  } else { aBereich.style.display='none'; }
  const {liste:botL,anzahlSpiele}=await ladeGruppenBestOfTime(gruppenId);
  document.getElementById('gruppe-bot-anzahl').textContent=`(${anzahlSpiele} Spiel${anzahlSpiele!==1?'e':''} gewertet)`;
  const botMeinPlatz=document.getElementById('gruppe-bot-mein-platz');
  botMeinPlatz.style.display='none';
  if (appState.currentSpitzname&&botL.length>0) {
    const platz=botL.findIndex(e=>e.name.toLowerCase()===appState.currentSpitzname.toLowerCase())+1;
    if (platz>0) {
      const medal=platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':'';
      botMeinPlatz.textContent=`${medal}Du bist auf Platz ${platz}`;
      botMeinPlatz.style.display='block';
    }
  }
  const botEl=document.getElementById('gruppe-bot-liste'); botEl.innerHTML='';
  if (botL.length===0) {
    botEl.innerHTML='<li style="color:var(--text-muted);font-size:.9rem;padding:8px 0;">Noch keine gemeinsamen Spiele.</li>';
  } else {
    botL.forEach((e,i)=>{ const medal=i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''; const li=document.createElement('li'); li.className=`best-of-eintrag platz-${i+1}`; li.innerHTML=`<span class="best-of-platz">${medal}${i+1}.</span><span class="best-of-name">${e.name}</span><span class="best-of-punkte">${e.punkte} Pkt - ${e.spiele} Spiel${e.spiele!==1?'e':''}</span>`; botEl.appendChild(li); });
  }
  const gSel=document.getElementById('gruppe-tage-select'); gSel.innerHTML='';
  for (let i=1;i<=30;i++) { const idx=TAGES_IDX-i; if (idx<0) break; const o=document.createElement('option'); o.value=idx; o.textContent=getDatumVonIdx(idx); gSel.appendChild(o); }
  const newSel=gSel.cloneNode(true); gSel.parentNode.replaceChild(newSel,gSel);
  newSel.addEventListener('change',ladeGruppeTagesErgebnis);
  await ladeGruppeTagesErgebnis();
}

export async function ladeGruppeTagesErgebnis() {
  if (!appState.aktiveGruppeId||!appState.aktiveGruppeDaten) return;
  const idx=parseInt(document.getElementById('gruppe-tage-select').value);
  if (isNaN(idx)) return;
  const div=document.getElementById('gruppe-tage-ergebnis');
  div.style.display='flex'; div.innerHTML='<span style="color:var(--text-muted);font-size:.9rem;">Wird geladen...</span>';
  const tL=await ladeRanglisteFirebase(idx);
  let loesung='-';
  try { const wSnap=await get(child(ref(db),`tageswoerter/${idx}`)); if(wSnap.exists()) loesung=wSnap.val(); } catch(e) {}
  const mitglieder=appState.aktiveGruppeDaten.mitglieder?Object.values(appState.aktiveGruppeDaten.mitglieder):[];
  div.innerHTML=`<div class="tages-info-zeile"><span>Loesungswort: <strong>${loesung}</strong></span></div>`;
  const topDiv=document.createElement('div'); topDiv.style.cssText='display:flex;flex-direction:column;gap:4px;'; div.appendChild(topDiv);
  const mMitPlatz=mitglieder.map(m=>{ const e=tL.find(e=>e.name.toLowerCase()===m.name.toLowerCase()); return e?{...e,gespielt:true}:{name:m.name,gespielt:false}; })
    .sort((a,b)=>{ if (!a.gespielt&&!b.gespielt) return 0; if (!a.gespielt) return 1; if (!b.gespielt) return -1; if (a.versuche!==b.versuche) return a.versuche-b.versuche; return a.sekunden-b.sekunden; });
  mMitPlatz.forEach((e,i)=>{ const div2=document.createElement('div'); div2.className='tages-ergebnis-zeile'; if (e.gespielt) { const medal=i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''; div2.innerHTML=`<span>${medal}${i+1}. ${e.name}</span><span>${e.versuche} Versuch${e.versuche!==1?'e':''} - ${formatZeit(e.sekunden)}</span>`; } else { div2.style.color='var(--text-muted)'; div2.innerHTML=`<span>${e.name}</span><span>Nicht gespielt</span>`; } topDiv.appendChild(div2); });
}
// GRUPPEN-UI ENDE

// GRUPPE-VERLASSEN-MODAL ANFANG
export async function zeigeGruppeVerlassenModal() {
  const liste=document.getElementById('gruppe-verlassen-liste');
  const btn=document.getElementById('btn-gruppe-verlassen-bestaetigen');
  const fehler=document.getElementById('gruppe-verlassen-fehler');
  liste.innerHTML=''; btn.style.display='none'; fehler.textContent=''; appState.gruppenVerlassenAuswahl=null;
  const gruppen=await ladeGruppen();
  if (gruppen.length===0) { liste.innerHTML='<p style="font-size:.9rem;color:var(--text-muted);">Du bist in keiner Gruppe.</p>'; }
  else {
    gruppen.forEach(g=>{
      const label=document.createElement('label'); label.className='checkbox-label';
      const rb=document.createElement('input'); rb.type='radio'; rb.name='gruppe-verlassen'; rb.value=g.id;
      rb.addEventListener('change',()=>{ appState.gruppenVerlassenAuswahl=g; btn.style.display='block'; btn.textContent=`"${g.name}" verlassen 🚪`; });
      label.appendChild(rb); label.appendChild(document.createTextNode(g.name));
      liste.appendChild(label);
    });
  }
  oeffneModal('modal-gruppe-verlassen');
}
// GRUPPE-VERLASSEN-MODAL ENDE
