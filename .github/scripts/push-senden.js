// Tippfuchs Push-Erinnerungen
// Wird von GitHub Actions ausgeführt — sendet FCM-Benachrichtigungen an User
// die noch nicht gespielt haben und den jeweiligen Zeitslot aktiviert haben.

const admin = require('firebase-admin');

// Service Account aus GitHub Secret laden
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://wortjaeger-blindmove-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

// Zeitslot aus Cron-Schedule oder manuellem Input ermitteln
function ermittleZeitSlot() {
  const schedule = process.env.GITHUB_EVENT_SCHEDULE;
  const manuell  = process.env.MANUELLER_SLOT;

  if (schedule === '00 05 * * *') return 'erinnerung7';
  if (schedule === '00 10 * * *') return 'erinnerung12';
  if (schedule === '00 16 * * *') return 'erinnerung18';
  if (manuell) return manuell;

  console.log('Kein Zeitslot erkannt — verwende erinnerung7 als Fallback.');
  return 'erinnerung7';
}

// Heutigen TAGES_IDX berechnen (Tage seit 2024-01-01, identisch zur App-Logik)
function getTagesIdx() {
  const start = new Date('2024-01-01T00:00:00Z');
  const heute = new Date();
  return Math.floor((heute - start) / (1000 * 60 * 60 * 24));
}

async function sendePushErinnerungen() {
  const zeitSlot = ermittleZeitSlot();
  const tagesIdx = getTagesIdx();

  console.log(`Zeitslot: ${zeitSlot}, TAGES_IDX: ${tagesIdx}`);

  // Alle Spieler laden
  const spielerSnap = await db.ref('spieler').get();
  if (!spielerSnap.exists()) {
    console.log('Keine Spieler gefunden.');
    return;
  }

  const spieler = spielerSnap.val();
  const zuSenden = [];

  for (const [uid, daten] of Object.entries(spieler)) {
    // Push-Präferenzen prüfen
    if (!daten.push?.token || !daten.push[zeitSlot]) continue;

    // Prüfen ob User heute schon gespielt hat (Ranglisten-Eintrag vorhanden?)
    const spitzname = daten.spitzname;
    if (!spitzname) continue;

    const key = spitzname.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const rangSnap = await db.ref(`ranglisten/${tagesIdx}/${key}`).get();
    if (rangSnap.exists()) continue; // Bereits gespielt

    zuSenden.push({ token: daten.push.token, name: spitzname });
  }

  if (zuSenden.length === 0) {
    console.log('Alle haben bereits gespielt oder keine Abonnenten für diesen Slot.');
    return;
  }

  console.log(`Sende Benachrichtigungen an ${zuSenden.length} User...`);

  // FCM erlaubt max. 500 Tokens pro Batch
  const BATCH = 500;
  for (let i = 0; i < zuSenden.length; i += BATCH) {
    const batch = zuSenden.slice(i, i + BATCH);
    const tokens = batch.map(u => u.token);

    const nachricht = {
      notification: {
        title: 'Tippfuchs 🦊',
        body: 'Hey, heute schon Tippfuchs gespielt? Nein? Dann nichts wie los — die anderen Füchse warten bestimmt auf dich!'
      },
      webpush: {
        notification: {
          icon: 'https://1013hpascal.github.io/tippfuchs/icons/icon-192.png',
          badge: 'https://1013hpascal.github.io/tippfuchs/icons/icon-192.png',
          lang: 'de',
          requireInteraction: false
        },
        fcmOptions: {
          link: 'https://1013hpascal.github.io/tippfuchs/'
        }
      },
      tokens
    };

    try {
      const antwort = await admin.messaging().sendEachForMulticast(nachricht);
      console.log(`Batch ${Math.floor(i/BATCH)+1}: ${antwort.successCount} ok, ${antwort.failureCount} fehlgeschlagen`);

      // Ungültige Tokens aus Firebase entfernen
      const loeschPromises = [];
      antwort.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered') {
            // Token aus Spieler-Eintrag entfernen (Token-Feld leeren)
            const token = tokens[idx];
            console.log(`Ungültiges Token bei "${batch[idx].name}" wird entfernt.`);
            // Wir kennen nur den Token, nicht die UID — daher alle durchsuchen
            for (const [uid, daten] of Object.entries(spieler)) {
              if (daten.push?.token === token) {
                loeschPromises.push(db.ref(`spieler/${uid}/push/token`).remove());
              }
            }
          }
        }
      });
      await Promise.all(loeschPromises);
    } catch(e) {
      console.error('Fehler beim Senden des Batches:', e.message);
    }
  }

  console.log('Fertig.');
}

sendePushErinnerungen()
  .then(() => process.exit(0))
  .catch(e => { console.error('Kritischer Fehler:', e); process.exit(1); });
