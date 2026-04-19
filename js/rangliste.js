import { appState } from './state.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatum } from './hilfsfunktionen.js';
import { ladeRanglisteFirebase } from './firebase-basis.js';
import { formatZeit } from './timer.js';
import { zeigeScreen } from './screens.js';

// RANGLISTE ANFANG
export async function zeigeTagesrangliste() {
  zeigeScreen('tagstats-screen');
  const ol = document.getElementById('tagstats-liste');
  ol.innerHTML='<li class="rang-leer">Wird geladen...</li>';
  document.getElementById('tagstats-titel').textContent=`Rangliste - ${getDatum(0)}`;
  const liste = await ladeRanglisteFirebase(TAGES_IDX);
  ol.innerHTML='';
  if (liste.length===0) {
    ol.innerHTML='<li class="rang-leer">Noch keine Ergebnisse fuer heute.</li>';
  } else {
    liste.slice(0,50).forEach((e,i)=>{
      const nichtGelöst = e.versuche >= 99;
      const medal = (!nichtGelöst && i===0)?'🥇 ':(!nichtGelöst && i===1)?'🥈 ':(!nichtGelöst && i===2)?'🥉 ':'';
      const li=document.createElement('li');
      li.className=`rang-eintrag platz-${i+1}`;
      if (nichtGelöst) {
        li.innerHTML=`<span class="rang-platz"></span><span class="rang-name">${e.name}</span><span class="rang-detail">Gespielt, Wort nicht gefunden</span>`;
      } else {
        li.innerHTML=`<span class="rang-platz">${medal}${i+1}.</span><span class="rang-name">${e.name}</span><span class="rang-detail">${e.versuche} Versuch${e.versuche!==1?'e':''} - ${formatZeit(e.sekunden)}</span>`;
      }
      ol.appendChild(li);
    });
  }
  document.getElementById('tagstats-titel').focus();
}
// RANGLISTE ENDE
