// App-Einstiegspunkt — importiert alle Module und startet die Anwendung

import { ladeDarkMode, ladeDesign, setzeDesign } from './design.js';
import { ladeAnimationen } from './animations.js';
import { aktualisiereStartStats } from './lokaler-zustand.js';
import { fuchsAktion } from './fuchs-animation.js';
import { initialisiereHausFenster } from './haus-fenster.js';
import { zeigeStart } from './auth.js';
import { ladeTageswort } from './tageswort.js';
import { zeigeGruppenScreen } from './gruppen-ui.js';
import './event-listener.js';

// Globale Funktionen die von inline-HTML (onclick=...) benötigt werden
window.zeigeGruppenScreen = zeigeGruppenScreen;
window.setzeDesign = setzeDesign;

// App starten
// APP-START ANFANG
ladeDarkMode();
ladeDesign();
ladeAnimationen();
aktualisiereStartStats();
fuchsAktion('warten');
initialisiereHausFenster();
zeigeStart();
// APP-START ENDE
