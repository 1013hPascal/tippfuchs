// PUSH-BENACHRICHTIGUNGEN ANFANG
import { appState } from './state.js';
import { db, ref, set, get, child, firebaseApp } from './firebase-config.js';
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js";
import { sageLaut } from './live-region.js';

const VAPID_KEY = 'BODtxTHNXbFaOmpVg1j-Rw-_3FII9Nn4PyjpJDYqIM8tEGrrVnOERZ4cHfJDf4Ha11PX6XLtaQ4sK4LW-NH8H-M';

let _messaging = null;
function getMsg() {
  if (!_messaging) _messaging = getMessaging(firebaseApp);
  return _messaging;
}

export async function ladePushPraeferenzen(uid) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/push`));
    const prefs = snap.exists() ? snap.val() : {};
    const cb7  = document.getElementById('push-7');
    const cb12 = document.getElementById('push-12');
    const cb18 = document.getElementById('push-18');
    if (cb7)  cb7.checked  = !!prefs.erinnerung7;
    if (cb12) cb12.checked = !!prefs.erinnerung12;
    if (cb18) cb18.checked = !!prefs.erinnerung18;
    if (prefs.token) setzePushStatus('Benachrichtigungen aktiv.');
  } catch(e) {}
}

export async function handlePushCheckboxChange() {
  if (!appState.currentUser) return;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    setzePushStatus('Dein Browser unterstützt leider keine Push-Benachrichtigungen. Auf iPhone: App zum Home-Bildschirm hinzufügen und von dort öffnen.');
    sageLaut('Push-Benachrichtigungen nicht unterstützt.');
    return;
  }

  // iOS-Hinweis: Erlaubnis SOFORT als erstes anfragen, bevor jede andere async-Operation
  // (iOS verwirft den Nutzer-Gesten-Kontext nach dem ersten await)
  if (Notification.permission === 'denied') {
    setzePushStatus('Benachrichtigungen sind blockiert. Auf iPhone: Einstellungen → Safari → [Tippfuchs-Seite] → Benachrichtigungen → Erlauben. Oder App löschen und neu zum Home-Bildschirm hinzufügen.');
    sageLaut('Benachrichtigungen blockiert. Bitte in den Einstellungen erlauben.');
    document.getElementById('push-7').checked  = false;
    document.getElementById('push-12').checked = false;
    document.getElementById('push-18').checked = false;
    return;
  }

  if (Notification.permission === 'default') {
    // Sofort anfragen — noch vor jedem await, damit iOS den Dialog zeigt
    setzePushStatus('Bitte Benachrichtigungen im Dialog erlauben...');
    const erlaubnis = await Notification.requestPermission();
    if (erlaubnis !== 'granted') {
      setzePushStatus('Nicht erlaubt. Auf iPhone: Einstellungen → Safari → [Tippfuchs-Seite] → Benachrichtigungen → Erlauben.');
      sageLaut('Benachrichtigungen nicht erlaubt.');
      document.getElementById('push-7').checked  = false;
      document.getElementById('push-12').checked = false;
      document.getElementById('push-18').checked = false;
      return;
    }
  }

  // Ab hier: Notification.permission === 'granted'
  const e7  = document.getElementById('push-7')?.checked  || false;
  const e12 = document.getElementById('push-12')?.checked || false;
  const e18 = document.getElementById('push-18')?.checked || false;

  if (!e7 && !e12 && !e18) {
    try {
      await set(ref(db, `spieler/${appState.currentUser.uid}/push`), null);
      setzePushStatus('Benachrichtigungen deaktiviert.');
      sageLaut('Benachrichtigungen deaktiviert.');
    } catch(e) {}
    return;
  }

  // FCM-Token holen
  try {
    setzePushStatus('Wird eingerichtet...');
    const swReg = await navigator.serviceWorker.register('/tippfuchs/firebase-messaging-sw.js');
    const token = await getToken(getMsg(), { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!token) {
      setzePushStatus('Fehler beim Einrichten. Bitte Seite neu laden und erneut versuchen.');
      return;
    }
    await set(ref(db, `spieler/${appState.currentUser.uid}/push`), {
      token,
      erinnerung7:  e7,
      erinnerung12: e12,
      erinnerung18: e18
    });
    setzePushStatus('Gespeichert. Benachrichtigungen sind aktiv.');
    sageLaut('Benachrichtigungseinstellungen gespeichert.');
  } catch(e) {
    console.error('Push-Fehler:', e);
    setzePushStatus('Fehler beim Einrichten: ' + (e.message || e));
    sageLaut('Fehler beim Einrichten der Benachrichtigungen.');
  }
}

function setzePushStatus(text) {
  const el = document.getElementById('push-status');
  if (el) el.textContent = text;
}
// PUSH-BENACHRICHTIGUNGEN ENDE
