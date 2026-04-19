import { sageLaut } from './live-region.js';

// ANLEITUNG-AKKORDEON ANFANG
const ANLEITUNG_INHALTE = {
  spielprinzip: {
    titel: 'Erklaerung Spielprinzip',
    inhalt: `
      <p><strong>Ziel des Spiels</strong><br>Errate das geheime Wort mit 5 Buchstaben in maximal 6 Versuchen. Jeden Tag gibt es ein neues Wort fuer alle Spieler weltweit.</p>
      <p><strong>So funktioniert ein Versuch</strong><br>Gib ein deutsches Wort mit 5 Buchstaben ein und druecke Enter. Das Wort muss in der Wortliste vorhanden sein — erfundene Woerter werden nicht akzeptiert.</p>
      <p><strong>Was bedeuten die Farben?</strong><br>
      Gruen mit Rahmen — Der Buchstabe ist im Loesungswort und steht an der richtigen Stelle.<br>
      Orange mit Unterstrich — Der Buchstabe ist im Loesungswort, steht aber an einer anderen Stelle.<br>
      Rot mit Durchstrich — Dieser Buchstabe kommt im Loesungswort nicht vor.</p>
      <p><strong>Der Timer</strong><br>Die Zeit startet erst wenn du deinen ersten Versuch abschickst — nicht beim Oeffnen der Seite. Du kannst also in Ruhe nachdenken bevor du anfaengst.</p>
      <p><strong>Buchstabenstatus</strong><br>Unterhalb des Eingabefelds siehst du vier Gruppen: Falsche Stelle, Kommt nicht vor, Richtig (mehrfach vorkommen möglich) und Noch nicht verwendet. So behaeltst du immer den Ueberblick welche Buchstaben du schon kennst.</p>
      <p><strong>Fortschrittsanzeige</strong><br>Oberhalb der Verlaufsliste siehst du 6 kleine Punkte die sich mit jedem Versuch fuellen. Gruen bedeutet gewonnen, Rot bedeutet nicht geschafft.</p>
      <p><strong>Rangliste</strong><br>Wenn du eingeloggt bist und das Wort erraetst, wirst du automatisch in der Tagesrangliste eingetragen. Gewertet wird zuerst nach Anzahl der Versuche, bei Gleichstand nach Zeit.</p>
      <p><strong>Tipp</strong><br>Beginne mit einem Wort das viele haeufige Buchstaben enthaelt, zum Beispiel STERN, RATEN oder SALON.</p>`
  },
  barrierefrei: {
    titel: 'Erklaerung Barrierefreie Bedienung',
    inhalt: `
      <p><strong>Aufbau der Spielseite</strong><br>Die Spielseite heisst Heutiges Tippfuchsraetsel. Darunter folgen: Hinweistext, Fortschrittsanzeige, Timer, Verlaufsliste, Eingabefeld, Buchstabenstatus und ganz unten der Schalter Zurueck zum Menue. Auf allen anderen Seiten gibt es ebenfalls einen Zurueck-Schalter ganz unten.</p>
      <p><strong>Navigation mit dem Screenreader</strong><br>Alle Bereiche sind mit Ueberschriften ausgezeichnet. Du kannst mit der Ueberschriften-Navigation deines Screenreaders schnell zwischen den Bereichen wechseln. Alle Schalter haben beschreibende Bezeichnungen. Fehlermeldungen und Spielrueckmeldungen werden automatisch vorgelesen.</p>
      <p><strong>Eingabefeld am Handy</strong><br>Oberhalb des Eingabefelds siehst du den aktuellen Loesungsfortschritt als Unterstriche, zum Beispiel: _ _ _ _ _ am Anfang, oder B _ U _ _ wenn B und U bereits an richtiger Stelle stehen. Diese Darstellung wird von VoiceOver auf iOS korrekt vorgelesen.</p>
      <p><strong>Eingabefeld am Rechner</strong><br>Das Textfeld zeigt Kommas als Platzhalter fuer noch unbekannte Buchstaben, zum Beispiel: , , , , , am Anfang. Sobald du einen Buchstaben an richtiger Stelle erraetst, erscheint er direkt im Platzhalter — so siehst du sofort was du schon weisst.</p>
      <p><strong>Nach jedem Versuch</strong><br>Dein Screenreader liest automatisch vor was jeder Buchstabe bedeutet, zum Beispiel: B richtige Stelle, L falsche Stelle, U kommt nicht vor. So weisst du sofort Bescheid ohne Farben sehen zu muessen.</p>
      <p><strong>Tastaturkuerzel</strong><br>Enter bestaetigt die Eingabe. Escape leert das Eingabefeld. Alle Schalter sind mit der Tabulator-Taste erreichbar.</p>
      <p><strong>Animationen ausschalten</strong><br>Im Bereich Designauswahl gibt es einen Schalter Animationen an oder aus. Wenn du Animationen ausschaltest, werden alle Bewegungen deaktiviert — der Fuchs bewegt sich nicht mehr und alle Uebergaenge entfallen. Das ist hilfreich wenn Bewegung ablenkt oder stoert.</p>
      <p><strong>Schlicht und Barrierefrei Modus</strong><br>Unter Designauswahl kannst du das Design Schlicht und Barrierefrei auswaehlen. Dort gibt es kein Hintergrundbild und keine dekorativen Elemente — nur klare Struktur und gute Lesbarkeit. Empfohlen fuer Screenreader und Braillezeile.</p>
      <p><strong>Reduzierte Bewegung</strong><br>Wenn du in deinem Betriebssystem reduzierte Bewegung aktiviert hast, werden alle Animationen automatisch deaktiviert — auch ohne den manuellen Schalter.</p>`
  },
  anmeldung: {
    titel: 'Erklaerung Anmeldung und Spitzname',
    inhalt: `
      <p><strong>Ohne Account spielen</strong><br>Du kannst Tippfuchs jederzeit ohne Anmeldung spielen. Deine Ergebnisse werden nur lokal auf deinem Geraet gespeichert und erscheinen nicht in der Tagesrangliste oder den Statistiken.</p>
      <p><strong>Mit Google-Konto spielen</strong><br>Klicke auf Mit Google Konto spielen. Es oeffnet sich ein Google-Anmeldefenster. Nach erfolgreicher Anmeldung wirst du beim ersten Mal gebeten einen Spielernamen festzulegen.</p>
      <p><strong>Mit E-Mail und Passwort spielen</strong><br>Klicke auf Mit E-Mail anmelden und waehle dann Registrieren. Das Passwort muss mindestens 6 Zeichen haben. Bei vergessenem Passwort klicke auf Passwort vergessen — du erhaeltst eine E-Mail mit einem Link zum Zuruecksetzen.</p>
      <p><strong>Der Spielername</strong><br>Beim ersten Anmelden wirst du nach einem Spielernamen gefragt. Dieser Name erscheint in der Tagesrangliste und in den Gruppenstatistiken. Der Name muss mindestens 2 Zeichen haben und darf noch nicht vergeben sein. Du kannst ihn jederzeit unter Spielername aendern auf der Startseite aendern.</p>
      <p><strong>Vorteile eines Accounts</strong><br>Mit Account werden deine persoenlichen Erfolge geraeteuebergreifend gespeichert. Du kannst Gruppen erstellen und beitreten sowie in der allgemeinen Statistik erscheinen.</p>
      <p><strong>Spiel starten</strong><br>Wenn du angemeldet bist, kannst du direkt ueber den grossen Spiel-starten-Schalter ganz oben auf der Startseite spielen. Wenn du nicht angemeldet bist, fuehrt der Schalter dich zum Anmeldebereich.</p>`
  },
  erfolge: {
    titel: 'Erklaerung Persoenliche Erfolge',
    inhalt: `
      <p><strong>Was sind persoenliche Erfolge?</strong><br>Auf der Startseite siehst du zwei persoenliche Kennzahlen: deinen Tagesstreak und deine Bestleistung. Diese werden lokal gespeichert und wenn du eingeloggt bist auch in der Cloud.</p>
      <p><strong>Der Tagesstreak</strong><br>Der Streak zeigt wie viele Tage hintereinander du das Wort erfolgreich geloest hast. Er erhoeht sich nur wenn du gewinnst. Wenn du einen Tag aussetzt oder verlierst beginnt der Streak wieder bei null. Ab 7 Tagen in Folge erscheinen zwei Flammen.</p>
      <p><strong>Die Bestleistung</strong><br>Deine Bestleistung ist dein bisher bestes Spielergebnis. Zuerst zaehlt die Anzahl der Versuche — weniger ist besser. Bei gleicher Versuchsanzahl gewinnt die kuerzere Zeit. Gespeichert wird auch das Loesungswort und das Datum.</p>
      <p><strong>Geraeteuebergreifend</strong><br>Wenn du eingeloggt bist wird deine Bestleistung in Firebase gespeichert. Spielst du auf einem zweiten Geraet wird der bessere Wert von beiden Geraeten verwendet.</p>
      <p><strong>Tagessieger</strong><br>Wenn du am Vortag auf Platz 1 der Tagesrangliste warst erscheint ganz oben auf der Startseite eine Glueckwunsch-Meldung mit dem Loesungswort und dem Datum.</p>
      <p><strong>Meine Ergebnishistorie</strong><br>Darunter findest du eine Datumsauswahl fuer die letzten 30 Tage. Das neueste verfuegbare Datum ist immer der Vortag — so steht das Ergebnis fest. Fuer jeden Tag siehst du das Loesungswort, deine Platzierung, Anzahl Versuche und Zeit sowie die eingegebenen Woerter mit Farb-Feedback. Die Woerter sind nur verfuegbar wenn du an dem Tag mit einem Account gespielt hast.</p>
      <p><strong>Kein Account?</strong><br>Ohne Account ist die Ergebnishistorie nicht verfuegbar.</p>`
  },
  gruppen: {
    titel: 'Erklaerung Meine Tippfuchs Gruppen',
    inhalt: `
      <p><strong>Was sind Tippfuchs Gruppen?</strong><br>Gruppen ermoeglichen es dir mit anderen Spielern zu vergleichen — zum Beispiel mit deiner Familie, Freunden oder Arbeitskollegen. In einer Gruppe sieht jedes Mitglied wie alle anderen an einem bestimmten Tag abgeschnitten haben.</p>
      <p><strong>Gruppe erstellen</strong><br>Klicke auf Neue Tippfuchs Gruppe erstellen und vergib einen Gruppennamen. Du erhaeltst dann einen 8-stelligen Beitrittsschluessel zum Beispiel ABC12345. Diesen Schluessel kannst du per WhatsApp, E-Mail oder auf anderem Wege weitergeben.</p>
      <p><strong>Gruppe beitreten</strong><br>Klicke auf Tippfuchs Gruppe beitreten und gib den Beitrittsschluessel ein. Es wird eine Anfrage an den Gruppenersteller gesendet der diese annehmen oder ablehnen kann.</p>
      <p><strong>Gruppenstatistik Letzte Tage</strong><br>In der Gruppendetailansicht siehst du fuer jeden Tag eine Liste aller Mitglieder mit ihren Ergebnissen. Wer nicht gespielt hat wird als Nicht gespielt angezeigt.</p>
      <p><strong>Gruppenstatistik Best of all Time</strong><br>Diese Liste wird nur gewertet wenn alle Mitglieder der Gruppe an einem Tag gespielt und gewonnen haben. Dann bekommt jeder Punkte entsprechend seinem Platz — Platz 1 bekommt 1 Punkt usw. Wer am Ende die wenigsten Punkte hat gewinnt.</p>
      <p><strong>Gruppe verlassen</strong><br>Unter Tippfuchs Gruppe verlassen kannst du eine Gruppe auswaehlen und verlassen. Wenn du das letzte Mitglied bist wird die Gruppe automatisch geloescht.</p>
      <p><strong>Die Freundesliste</strong><br>Die Freundesliste ist etwas anderes als eine Gruppe. Sie ist nur fuer dich sichtbar und dient dazu einzelne Spieler im Blick zu behalten ohne eine gemeinsame Gruppe zu haben. Praktisch wenn du jemanden beobachten moechtest mit dem du keine Gruppe teilst.</p>
      <p><strong>Freunde hinzufuegen</strong><br>Suche im Suchfeld nach dem Spielernamen. Waehle die gewuenschten Spieler aus und klicke auf Hinzufuegen. Die Spieler merken davon nichts — die Freundesliste ist nur fuer dich sichtbar.</p>`
  },
  statistik: {
    titel: 'Erklaerung Statistik aller Tippfuechse',
    inhalt: `
      <p><strong>Tippfuchs Champion aller Zeiten</strong><br>Diese Liste zeigt wer insgesamt am haeufigsten auf Platz 1 der Tagesrangliste gelandet ist. Ein Eintrag ist nicht automatisch — dafuer muessen mindestens 3 Spieler an dem Tag gespielt haben und die Spieleranzahl muss mindestens 33 Prozent des Durchschnitts der drei Tage davor erreichen. Das verhindert Eintraege an Tagen mit sehr wenigen Spielern.</p>
      <p><strong>Letzte Tage</strong><br>Hier kannst du die Rangliste fuer jeden der letzten 30 Tage abrufen. Du siehst das Loesungswort des Tages, wie viele Spieler mitgemacht haben und die vollstaendige Rangliste mit Versuchen und Zeit.</p>
      <p><strong>Tippfuchs des Monats</strong><br>Zeigt wer in einem bestimmten Monat am haeufigsten Platz 1 belegt hat. Du kannst Jahr und Monat auswaehlen. Gezaehlt werden nur Tage an denen mindestens 5 Spieler mitgemacht haben.</p>
      <p><strong>Tippfuchs des Jahres</strong><br>Genauso wie die Monatsstatistik aber fuer ein ganzes Jahr. Die Jahresstatistik ist erst ab dem 2. Januar des Folgejahres verfuegbar.</p>`
  },
  design: {
    titel: 'Erklaerung Designauswahl',
    inhalt: `
      <p><strong>Was kann ich einstellen?</strong><br>Unter Designauswahl kannst du drei Dinge festlegen: das visuelle Design der Seite, ob du Hell- oder Dunkelmodus bevorzugst, und ob Animationen an oder aus sind. Alle Einstellungen werden gespeichert und beim naechsten Besuch automatisch wiederhergestellt.</p>
      <p><strong>Schlicht und Barrierefrei</strong><br>Schlichtes Design ohne Hintergrundbild und ohne dekorative Elemente. Empfohlen fuer Screenreader-Nutzer, Braillezeilen-Nutzer und alle die eine ablenkungsfreie Oberflaeche bevorzugen. Die Bedienung ist identisch zu allen anderen Designs.</p>
      <p><strong>Fuchsbau</strong><br>Warme Erdtoene mit einer gemaetlichen Hoehlenatmosphaere, Kamin, Moebeln und einer Wanduhr die synchron zum Spieltimer laeuft. Verfuegbar in Hell und Dunkel.</p>
      <p><strong>Natur am Tag</strong><br>Gruene Wiese mit blauem Himmel, Sonne, Wolken, Baeumen und einem Kirchturm mit Uhr die synchron zum Spieltimer laeuft. Auf der Startseite gibt es ein illustriertes Haus mit Pool und Fuchs. Verfuegbar in Hell und Dunkel.</p>
      <p><strong>Natur Nacht</strong><br>Dunkler Sternenhimmel mit Sternen, Mond, Baumsilhouetten und einem leuchtenden Kirchturm. Dieses Design erzwingt immer den Dunkelmodus.</p>
      <p><strong>Hell und Dunkel</strong><br>Direkt unter den vier Designs kannst du zwischen hellem und dunklem Hintergrund wechseln. Die Auswahl wird gespeichert.</p>
      <p><strong>Animationen</strong><br>Mit dem Schalter Animationen kannst du alle Bewegungen deaktivieren — Fuchs-Animation, Uebergaenge und alles andere. Das ist hilfreich fuer Menschen die durch Bewegung abgelenkt werden oder Autismus haben.</p>`
  }
};

let aktivesThema = null;

document.querySelectorAll('.anleitung-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const thema = this.dataset.thema;
    const inhaltDiv = document.getElementById('anleitung-inhalt');

    // Wenn dasselbe Thema nochmal geklickt — schliessen
    if (aktivesThema === thema) {
      inhaltDiv.style.display = 'none';
      inhaltDiv.innerHTML = '';
      this.removeAttribute('aria-expanded');
      aktivesThema = null;
      return;
    }

    // Alle Buttons zuruecksetzen
    document.querySelectorAll('.anleitung-btn').forEach(b => b.removeAttribute('aria-expanded'));

    // Neues Thema oeffnen
    aktivesThema = thema;
    this.setAttribute('aria-expanded', 'true');

    const data = ANLEITUNG_INHALTE[thema];
    inhaltDiv.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="font-family:var(--font-display);font-size:1rem;color:var(--text);margin-bottom:4px;">${data.titel}</h3>
        <div style="font-size:.9rem;line-height:1.7;color:var(--text-muted);display:flex;flex-direction:column;gap:10px;">
          ${data.inhalt}
        </div>
        <button class="btn-secondary" id="btn-anleitung-schliessen" style="margin-top:4px;">Schliessen</button>
      </div>`;
    inhaltDiv.style.display = 'block';

    document.getElementById('btn-anleitung-schliessen').addEventListener('click', () => {
      inhaltDiv.style.display = 'none';
      inhaltDiv.innerHTML = '';
      document.querySelectorAll('.anleitung-btn').forEach(b => b.removeAttribute('aria-expanded'));
      aktivesThema = null;
    });

    // Inhalt in Sicht scrollen und fokussieren
    inhaltDiv.scrollIntoView({behavior:'smooth', block:'nearest'});
    sageLaut(data.titel + ' geoeffnet.');
  });
});
// ANLEITUNG-AKKORDEON ENDE
