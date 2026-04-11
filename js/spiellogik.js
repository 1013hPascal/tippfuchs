import { appState, state } from './state.js';
import { db, ref, get, child } from './firebase-config.js';
import { LOESUNGSWOERTER, EINGABEWOERTER } from './wortliste.js';
import { ALLE_BUCHSTABEN } from './hilfsfunktionen.js';
import { TAGES_IDX, ladeTageswort } from './tageswort.js';
import { getDatum } from './hilfsfunktionen.js';
import { ladeRanglisteFirebase, speichereInRanglisteFirebase } from './firebase-basis.js';
import { starteTimer, stoppeTimer, formatZeit, getGesamtZeit } from './timer.js';
import { aktualisiereStats, aktualisiereRekord, aktualisiereStartStats, speichereZustand, ladeZustand } from './lokaler-zustand.js';
import { zeigeScreen } from './screens.js';
import { sageLaut } from './live-region.js';
import { fuchsAktion } from './fuchs-animation.js';

// SPIELLOGIK ANFANG
export function bewerteVersuch(versuch, loesung) {
  const erg = Array(5).fill('absent');
  const rest = loesung.split('');
  const arr = versuch.split('');
  for (let i=0;i<5;i++) if (arr[i]===rest[i]) { erg[i]='correct'; rest[i]=null; }
  for (let i=0;i<5;i++) {
    if (erg[i]==='correct') continue;
    const idx = rest.indexOf(arr[i]);
    if (idx!==-1) { erg[i]='present'; rest[idx]=null; }
  }
  return erg;
}

export function aktualisiereVerlauf() {
  const liste = document.getElementById('verlauf-liste');
  liste.innerHTML = '';

  // Fortschritts-Punkte aktualisieren
  for (let i = 1; i <= 6; i++) {
    const p = document.getElementById(`fp-${i}`);
    if (!p) continue;
    p.className = 'fp-punkt';
    if (i <= state.versuche.length) {
      if (state.spielende && state.gewonnen && i === state.versuche.length) {
        p.classList.add('gewonnen');
      } else if (state.spielende && !state.gewonnen) {
        p.classList.add('verloren');
      } else {
        p.classList.add('aktiv');
      }
    }
  }
  state.versuche.forEach((wort,idx) => {
    const erg = bewerteVersuch(wort,appState.TAGESWORT);
    const li = document.createElement('li');
    li.className = 'verlauf-eintrag';
    let srText = `Versuch ${idx+1}: ${wort}: `;
    let mini = '';
    erg.forEach((e,i) => {
      const cls = e==='correct'?'correct':e==='present'?'present':'absent';
      const s = e==='correct'?'richtig':e==='present'?'falsche Stelle':'nein';
      mini += `<span class="vb ${cls}" aria-hidden="true">${wort[i]}</span>`;
      srText += `${wort[i]}: ${s}, `;
    });
    li.innerHTML = `<span class="v-wort" aria-hidden="true">${wort}</span><span class="buchstaben" aria-hidden="true">${mini}</span><span class="sr-only">${srText}</span>`;
    liste.appendChild(li);
  });
  const enthullt = Array(5).fill(false);
  state.versuche.forEach(w =>
    bewerteVersuch(w,appState.TAGESWORT).forEach((e,i) => { if(e==='correct') enthullt[i]=true; })
  );
  const liL = document.createElement('li');
  liL.className = 'loesung-in-verlauf';
  let loesAria = 'Loesungsfortschritt: '; let loesHtml = '';
  for (let i=0;i<5;i++) {
    const z = enthullt[i]?appState.TAGESWORT[i]:'_';
    const cls = enthullt[i]?'':' leer';
    loesHtml += `<span class="lz-zeichen${cls}" aria-hidden="true">${z}</span>`;
    loesAria += enthullt[i]?appState.TAGESWORT[i]+' ':'_ ';
  }
  liL.innerHTML = `<span class="sr-only">${loesAria}</span>${loesHtml}`;
  liste.appendChild(liL);
  const wi = document.getElementById('wort-input');
  if (wi) wi.placeholder = enthullt.map((e,i)=>e?appState.TAGESWORT[i]:',').join('');
}

export function aktualisiereBuchstabenStatus() {
  const cS=new Set(),pS=new Set(),aS=new Set(),uS=new Set();
  state.versuche.forEach(w => {
    const erg = bewerteVersuch(w,appState.TAGESWORT);
    w.split('').forEach((b,i) => {
      uS.add(b);
      if (erg[i]==='correct') cS.add(b);
      else if (erg[i]==='present') pS.add(b);
      else aS.add(b);
    });
  });
  const falsch=[...pS].filter(b=>!cS.has(b));
  const nein=[...aS].filter(b=>!cS.has(b)&&!pS.has(b));
  document.getElementById('bz-falsch').textContent=(falsch.length?falsch.join(' '):'keine')+' (Falsche Stelle)';
  document.getElementById('bz-nein').textContent=(nein.length?nein.join(' '):'keine')+' (Nicht vorhanden)';
  document.getElementById('bz-used').textContent=([...uS].sort().join(' ')||'keine')+' (Bereits verwendet)';
  document.getElementById('bz-unused').textContent=(ALLE_BUCHSTABEN.filter(b=>!uS.has(b)).join(' ')||'keine')+' (Noch nicht verwendet)';
}

export async function verarbeiteWort() {
  if (state.spielende) return;
  const input = document.getElementById('wort-input');
  const wort = input.value.toUpperCase().trim();
  const fehler = document.getElementById('fehler-msg');
  if (wort.length < 5) {
    fehler.textContent='Das Wort muss 5 Buchstaben haben.';
    sageLaut('Fehler: Das Wort muss 5 Buchstaben haben.');
    input.value=''; input.focus(); return;
  }
  if (EINGABEWOERTER?.length > 0) {
    if (!EINGABEWOERTER.map(w=>w.toUpperCase()).includes(wort) && !LOESUNGSWOERTER.includes(wort)) {
      fehler.textContent='Unbekanntes Wort - bitte ein gueltiges deutsches Wort eingeben.';
      sageLaut('Unbekanntes Wort.');
      fuchsAktion('falsch');
      input.value=''; input.focus(); return;
    }
  }
  fehler.textContent='';
  if (!state.ersterVersuchGemacht) {
    state.ersterVersuchGemacht=true; state.startZeit=Date.now(); starteTimer();
  }
  const erg = bewerteVersuch(wort,appState.TAGESWORT);
  state.versuche.push(wort);
  input.value=''; input.focus();
  aktualisiereVerlauf(); aktualisiereBuchstabenStatus(); speichereZustand();
  sageLaut(erg.map((e,i)=>`${wort[i]}: ${e==='correct'?'richtige Stelle':e==='present'?'falsche Stelle':'kommt nicht vor'}`).join(', '));
  const gewonnen = erg.every(e=>e==='correct');
  const korrektAnzahl = erg.filter(e=>e==='correct').length;

  // Fuchs reagiert auf Ergebnis
  if (gewonnen) {
    fuchsAktion('gewonnen');
  } else if (korrektAnzahl >= 1) {
    fuchsAktion('richtig');
  } else if (state.versuche.length === 5) {
    fuchsAktion('letzter-versuch');
  } else {
    fuchsAktion('falsch');
  }

  if (gewonnen) {
    stoppeTimer(); state.spielende=true; state.gewonnen=true;
    speichereZustand(); aktualisiereStats(true,state.versuche.length);
    if (appState.currentUser&&appState.currentSpitzname) await speichereInRanglisteFirebase();
    const sek = state.endZeit ? Math.floor((state.endZeit-state.startZeit)/1000) : 9999;
    await aktualisiereRekord(state.versuche.length, sek, appState.TAGESWORT, getDatum(0));
    await aktualisiereStartStats();
    setTimeout(()=>zeigeErgebnis(true),800);
  } else if (state.versuche.length>=6) {
    stoppeTimer(); state.spielende=true; state.gewonnen=false;
    speichereZustand(); aktualisiereStats(false,0);
    fuchsAktion('verloren');
    if (appState.currentUser&&appState.currentSpitzname) await speichereInRanglisteFirebase();
    setTimeout(()=>zeigeErgebnis(false),800);
  }
}

export async function starteSpiel() {
  ladeZustand();
  if (!appState.TAGESWORT) await ladeTageswort();
  aktualisiereVerlauf(); aktualisiereBuchstabenStatus();
  zeigeScreen('game-screen');
  // Fuchs nur im Standard-Design im Header zeigen
  if (document.documentElement.dataset.design === 'standard') {
    document.getElementById('fuchs-container').style.display = 'flex';
  } else {
    document.getElementById('fuchs-container').style.display = 'none';
  }
  if (state.spielende) { zeigeErgebnis(state.gewonnen); return; }
  if (state.ersterVersuchGemacht&&state.startZeit&&!state.endZeit) starteTimer();
  setTimeout(()=>document.getElementById('wort-input').focus(),100);
  sageLaut(`Spiel gestartet! Das Wort hat 5 Buchstaben. Du hast ${6-state.versuche.length} Versuche.`);
}
// ZEIGERGEBNIS ANFANG
export async function zeigeErgebnis(gewonnen) {
  zeigeScreen('ergebnis-screen');
  // Nochmal versuchen falls Login beim Spielen noch nicht bereit war
  if (state.spielende && appState.currentUser && appState.currentSpitzname) {
    await speichereInRanglisteFirebase();
  }
  const titel = document.getElementById('erg-titel');
  const banner = document.getElementById('erg-banner');
  if (gewonnen) {
    titel.textContent = 'Wort gelöst! 🎉';
    titel.className = 'gewonnen';
    banner.style.display = 'block';
    banner.textContent = `🏆 Glückwunsch! Du hast das Wort in ${state.versuche.length} Versuch${state.versuche.length!==1?'en':''} erraten!`;
  } else {
    titel.textContent = 'Nicht geschafft';
    titel.className = 'verloren';
    banner.style.display = 'none';
  }
  document.getElementById('erg-wort').textContent = appState.TAGESWORT;
  document.getElementById('erg-versuche').textContent = gewonnen?`${state.versuche.length} / 6`:'Nicht geloest';
  document.getElementById('erg-zeit').textContent = getGesamtZeit();
  const platzZeile = document.getElementById('erg-platz-zeile');
  platzZeile.style.display='none';
  if (appState.currentUser&&appState.currentSpitzname&&gewonnen) {
    const liste = await ladeRanglisteFirebase(TAGES_IDX);
    const platz = liste.findIndex(e=>e.name.toLowerCase()===appState.currentSpitzname.toLowerCase())+1;
    if (platz>0) {
      const medal = platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':'';
      document.getElementById('erg-platz').textContent=`${medal}${platz}. Platz`;
      platzZeile.style.display='flex';
      // Tagessieger speichern
      if (platz===1) {
        try {
          localStorage.setItem('tippfuchs_tagessieger', JSON.stringify({
            tagIdx: TAGES_IDX,
            datum: getDatum(0),
            wort: appState.TAGESWORT
          }));
        } catch(e) {}
      }
    }
  }
  if (gewonnen) {
    const sek = state.endZeit ? Math.floor((state.endZeit-state.startZeit)/1000) : 9999;
    await aktualisiereRekord(state.versuche.length, sek, appState.TAGESWORT, getDatum(0));
    await aktualisiereStartStats();
  }
  const wl = document.getElementById('erg-wortliste');
  wl.innerHTML='';
  state.versuche.forEach((wort,idx)=>{
    const e=bewerteVersuch(wort,appState.TAGESWORT);
    const status=e.map((ev,i)=>`${wort[i]}: ${ev==='correct'?'richtig':ev==='present'?'falsche Stelle':'nicht enthalten'}`).join(', ');
    const li=document.createElement('li');
    li.innerHTML=`${idx+1}. ${wort}<span class="sr-only"> - ${status}</span>`;
    wl.appendChild(li);
  });
  sageLaut(gewonnen?`Gewonnen! Wort: ${appState.TAGESWORT}. Versuche: ${state.versuche.length}. Zeit: ${getGesamtZeit()}.`:`Verloren. Das Wort war: ${appState.TAGESWORT}.`);
  document.getElementById('erg-titel').focus();
}
// ZEIGERGEBNIS ENDE
// SPIELLOGIK ENDE
