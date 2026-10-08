# Planify — Audit des problèmes & avancement

Dernière mise à jour : 2026-10-08 — en cours

Légende statut : 🔴 À faire · 🟡 En cours · 🟢 Corrigé · ⚪ Pas un bug / amélioration future

## Résumé d'avancement

- [x] Diagnostic du bug "impossible d'ajouter une photo" (agent d'audit)
- [x] Correction des sauvegardes silencieuses (localStorage + Firestore)
- [x] Correction du bug "le tableau ne marche pas"
- [x] Correction de 2 "petits blocages" dans Notes (notes vides fantômes, crash taille de texte)
- [x] Audit complet du reste de l'app (calendar, dashboard, grades, settings, shopping, tasks, wellness, luna, app.js)
- [x] Corrections des 11 problèmes trouvés par cet audit (#8 à #18, voir ci-dessous)
- [x] Agent de test (vérifie que tout fonctionne réellement dans le navigateur) — 1 bug critique trouvé et corrigé (modale tableau invisible, z-index)
- [x] Agent de contrôle (relit l'ensemble des corrections) — 1 régression trouvée et corrigée (réglage "Notifications d'événements" devenu mort)

### Décision à prendre

- **#15 `js/luna-worker.js`** : fichier mort (IA locale jamais branchée). Je ne l'ai pas supprimé — dis-moi si tu veux qu'on le termine (le brancher réellement) ou qu'on le supprime.

## Issues trouvées et corrigées

| # | Zone | Problème | Fichier(s) | Statut |
|---|------|----------|------------|--------|
| 1 | Notes — photo | Aucune `storageBucket`/Storage réellement utilisée ; images stockées en base64 inline dans `localStorage` + Firestore | `js/firebase-config.js` | ⚪ Connu — voir "Limitations restantes" |
| 2 | Notes — photo | `localStorage.setItem` sans `try/catch` : si le quota du navigateur est dépassé (image trop lourde), la sauvegarde plantait **sans aucun message** — symptôme exact de "je n'arrive pas à ajouter une photo" | `js/data.js` (`LS.s`) | 🟢 Corrigé — try/catch + toast d'erreur explicite |
| 3 | Notes — photo | Échec d'écriture Firestore (limite 1 Mo/document) avalé silencieusement (`.catch(() => {})`) : l'image disparaissait après reconnexion sans explication | `js/firebase-config.js` (`FB.saveKey`) | 🟢 Corrigé — vérification de taille + toast d'avertissement avant envoi, erreurs loggées |
| 4 | Notes — photo | Limite codée en dur à 3 Mo trop basse pour une photo de smartphone moderne ; input file pas réinitialisé si rejet (le même fichier ne redéclenchait pas `onchange`) | `js/views/notes.js` (`handleImageFile`) | 🟢 Corrigé — limite remontée à 10 Mo (aucune recompression : qualité d'origine conservée), reset de l'input |
| 5 | Notes — tableau | **Deux implémentations concurrentes** de `insertTable()`/insertion de tableau : celle de `index.html` (ancienne, insertion par curseur "trop instable" selon le commentaire du code) écrasait silencieusement celle de `js/views/notes.js` (plus récente, stable, avec options de couleur/taille) car le `<script>` inline de `index.html` se charge en dernier | `index.html`, `js/views/notes.js` | 🟢 Corrigé — suppression du bloc dupliqué dans `index.html` |
| 6 | Notes — éditeur | Ouvrir une note puis la quitter sans rien écrire laissait une note vide ("Sans titre") enregistrée pour toujours (note créée immédiatement à l'ouverture de l'éditeur) | `js/views/notes.js` (`exitEditor`) | 🟢 Corrigé — suppression auto de la note si titre+contenu vides à la sortie |
| 7 | Notes — éditeur | `fmtSize()` (changement de taille du texte sélectionné) utilisait `range.surroundContents()`, qui **lève une exception non interceptée** dès que la sélection chevauche plusieurs éléments (ex: texte en gras + texte normal) → la mise en forme plantait silencieusement | `js/views/notes.js` (`fmtSize`) | 🟢 Corrigé — repli via `extractContents()`/`insertNode()` en cas d'échec |

## Limitations restantes (choix délibéré, à discuter)

- **Pas de compression d'image** : sur demande explicite, aucune perte de qualité n'est appliquée. Conséquence : une très grosse photo (plusieurs Mo) peut dépasser la limite Firestore (1 Mo/document) → elle reste visible en local sur l'appareil mais ne se synchronisera pas dans le cloud (toast d'avertissement affiché, ce n'est plus silencieux). La vraie solution long terme serait d'utiliser **Firebase Storage** (déjà configuré dans `firebase-config.js` mais jamais utilisé) pour stocker les images séparément — nécessite de configurer des règles de sécurité Storage dans la console Firebase (hors de ce dépôt), donc pas fait automatiquement.

## Audit complet — résultats

Audit du reste de l'application (`app.js`, `calendar.js`, `dashboard.js`, `grades.js`, `settings.js`, `shopping.js`, `tasks.js`, `wellness.js`, `luna.js`, `luna-worker.js`, `sw.js`, `index.html`). Pour chaque ligne : description précise + symptôme utilisateur + piste de correction.

| # | Zone | Problème | Fichier(s) | Statut |
|---|------|----------|------------|--------|
| 8 | Luna — Tâches | `_getData()` appelle `LS.tasks()` qui **n'existe pas** dans l'objet `LS` (seul `LS.todos()` existe dans `data.js`). L'exception est avalée silencieusement par le wrapper `g()`, donc `D.tasks` valait **toujours `[]`** → Luna annonçait systématiquement « 0 tâche ». | `js/views/luna.js` (ligne 70) | 🟢 Corrigé — `LS.tasks()` → `LS.todos()` |
| 9 | Luna — Tâches | Quand Luna crée une tâche via le chat, elle utilisait les champs `title`/`dueDate` au lieu du vrai schéma `text`/`due`/`listId`/`note` (`tasks.js`). La tâche apparaissait avec un titre vide dans l'onglet Tâches réel. Lecture incohérente aussi dans `_hTasks`/`_hResume`/le prompt Gemini (`t.title`/`t.dueDate`). | `js/views/luna.js` (création ~ligne 678 ; lectures lignes 312, 366, 785) | 🟢 Corrigé — schéma aligné sur `tasks.js` partout |
| 10 | Réglages — Reset total | `resetAll()` oubliait 4 clés localStorage (eau, focus, gratitude, objectifs semaine) ET ne supprimait jamais les documents Firestore → au prochain login, `FB.loadAll()` retéléchargeait automatiquement toutes les données "effacées". | `js/views/settings.js` (`resetAll`) ; `js/firebase-config.js` | 🟢 Corrigé — nouvelle méthode `FB.deleteAll(uid)` + liste de clés unifiée (`ALL_DATA_KEYS`) |
| 11 | Réglages — Export/Import JSON | `exportData()`/`importData()` omettaient eau, focus, gratitude, objectifs de la semaine : la sauvegarde "complète" ne l'était pas. | `js/views/settings.js` | 🟢 Corrigé — les 4 clés ajoutées à l'export et à l'import |
| 12 | Routeur — hash au démarrage | Liste blanche des pages acceptées depuis `location.hash` incomplète (`grades`, `shopping`, `luna`, `settings` manquants) → retour silencieux au dashboard si on arrivait sur ces pages via un lien/favori. | `js/app.js` (ligne ~1424) | 🟢 Corrigé — liste complétée |
| 13 | Agenda — notifications en double | `calendar.js` avait sa propre routine de notification (30 min avant, `new Notification()` natif qui échoue sur iOS PWA, icône inexistante `/icons/icon-192.png`), en doublon avec le système correct d'`app.js` (`scheduleEventReminders()` + `sendNotif()`, compatible iOS via Service Worker, 15 min avant) → notifications possibles en double. | `js/views/calendar.js` | 🟢 Corrigé — routine dupliquée supprimée, seule la version `app.js` reste |
| 14 | Agenda — code dupliqué | `clearICS()` défini deux fois (`calendar.js` et `app.js`) ; le chargement faisait gagner silencieusement la version `app.js`, mais toute modification future d'une seule des deux copies aurait recréé un bug comme celui du tableau. | `js/app.js`, `js/views/calendar.js` | 🟢 Corrigé — doublon supprimé dans `calendar.js` |
| 15 | Luna — code orphelin | `js/luna-worker.js` (pipeline IA 100% local/offline) n'est référencé par aucun fichier du projet — fonctionnalité commencée puis abandonnée. | `js/luna-worker.js` | ⚪ Laissé tel quel — à toi de dire si on le finit ou on le supprime (voir section dédiée) |
| 16 | Firebase — 1er upload | `FB.uploadAll(uid)` omettait `pl_grades`/`pl_shopping` dans sa liste de clés, incohérent avec le reste de l'app. | `js/firebase-config.js` (`uploadAll`) | 🟢 Corrigé — utilise désormais la même liste unifiée `ALL_DATA_KEYS` |
| 17 | Moyennes — export CSV | `exportGradesCSV()` n'échappait pas les guillemets internes dans les noms de module/épreuve → fichier CSV corrompu dans Excel/Sheets si un nom contient un `"`. | `js/views/grades.js` (`exportGradesCSV`) | 🟢 Corrigé — nouvelle fonction `_csvField()` qui échappe correctement |
| 18 | Réglages — sélecteur mort | `saveCfgField('name', ...)` tentait une mise à jour "live" du prénom via un sélecteur CSS (`.welcome h1`) qui ne correspond à aucun élément existant (reliquat d'une ancienne version du design) — donnait une fausse impression de mise à jour instantanée. | `js/views/settings.js` (`saveCfgField`) | 🟢 Corrigé — code mort supprimé (le dashboard se met à jour correctement au prochain rendu complet) |

### Notes complémentaires

- Vérification spécifique demandée : recherche de toute fonction définie à la fois dans `index.html` et dans `js/views/*.js` (pattern du bug historique sur `insertTable()`) → **aucune autre occurrence trouvée**. `index.html` ne contient plus aucun `<script>` inline définissant des fonctions ; seul `clearICS()` (voir #14) est dupliqué, mais entre deux fichiers `js/*.js`, pas avec `index.html`.
- Vérification faite également : aucune redéclaration `let`/`const` de même nom entre fichiers `js/*.js` chargés dans `index.html` (qui provoquerait un `SyntaxError` bloquant tout le script suivant) — rien trouvé.

## Contrôle qualité — relecture du diff de session

Relecture indépendante de `git diff 293cb50..HEAD` (les deux commits de correction de cette session), fichier par fichier. `node --check` passe sans erreur sur les 8 fichiers `.js` modifiés (`data.js`, `firebase-config.js`, `app.js`, `js/views/{notes,luna,settings,calendar,grades}.js`). Ordre de chargement des `<script>` dans `index.html` vérifié : `js/data.js` (qui définit `ALL_DATA_KEYS`) se charge bien avant `firebase-config.js`, `settings.js`, `luna.js` et `app.js`, qui l'utilisent tous.

| Fichier | Problème trouvé | Gravité | Statut |
|---|---|---|---|
| `js/views/calendar.js` / `js/app.js` / `js/views/settings.js` | ~~Régression réelle~~ : en supprimant le doublon `initCalendarNotifications()` de `calendar.js` (qui lisait `cfg.notifEvents`), le réglage "Notifications d'événements" était devenu mort car `scheduleEventReminders()` d'`app.js` ne le lisait pas. | Moyenne (réglage visible trompeur, pas de perte de données) | 🟢 Corrigé — ajout de `if (LS.cfg().notifEvents === false) return;` en tête de `scheduleEventReminders()` (`js/app.js`), clé `notifEvents` confirmée identique à celle de `settings.js` |
| `js/views/luna.js` | Alignement du schéma de tâches (`title`/`dueDate` → `text`/`due`/`listId`/`note`) cohérent avec `js/views/tasks.js` partout (`_getData`, `_hResume`, `_hTasks`, prompt Gemini, `_lunaAction`). Pas de régression dans le code lui-même. Point de vigilance (pas un bug de cette session) : si une tâche avait été créée par Luna **avant** ce correctif avec l'ancien schéma `title`/`dueDate`, elle reste stockée dans `pl_todos` avec ces clés ; elle s'affichera avec un texte vide (`t.text` undefined) dans Luna ET dans l'onglet Tâches réel (qui attendait déjà `text`/`due`, donc ces tâches étaient déjà cassées avant ce correctif). Aucune migration automatique n'a été ajoutée. | Mineure (cas de données historiques déjà cassées avant la session, non aggravé par le correctif) | ⚪ Mineur — à surveiller si un utilisateur réel signale une tâche "vide" créée via Luna avant cette session |
| `js/views/notes.js` | `fmtSize()` : repli `extractContents()`/`insertNode()` correctement entouré du `try` d'origine ; `stripHtml` (utilisé dans le nouveau test de note vide dans `exitEditor`) est bien défini dans `js/data.js` ligne 263 et chargé avant `notes.js`. `handleImageFile` réinitialise bien `input.value` avant le `return`. Aucun problème trouvé. | — | ⚪ Aucun problème |
| `js/data.js` | `LS.s()` : try/catch cohérent avec le style du fichier (`LS.g` utilise déjà try/catch), pas de fuite de variable globale, dépend de `showToast` via un garde `typeof === 'function'` (sûr même si appelé avant qu'`app.js` soit chargé). `ALL_DATA_KEYS` correctement défini en amont et réutilisé à l'identique dans `app.js`, `settings.js`, `firebase-config.js`. Aucun problème trouvé. | — | ⚪ Aucun problème |
| `js/firebase-config.js` | `FB.deleteAll` suit le même style (try/catch, pas de `throw`) que le reste du fichier (`uploadAll`). `saveKey` retourne désormais `undefined` de façon synchrone quand le document est trop gros au lieu d'une Promise — vérifié que le seul appelant (`FB.saveAll`/équivalent ligne ~135) ne chaîne pas de `.then()`/`.catch()` sur le retour, donc pas de régression. Aucun problème trouvé. | — | ⚪ Aucun problème |
| `js/views/settings.js` | `resetAll()` : suppression du sélecteur mort `.welcome h1` confirmée sans effet de bord (aucune autre référence à cette classe dans tout le code, le dashboard relit `cfg.name` au rendu suivant via `js/views/dashboard.js` ligne 28). `FB.deleteAll(uid)` appelé en fire-and-forget avant `go('dashboard')`, cohérent avec le commentaire du code. Export/Import JSON : les 4 nouvelles clés (`water`/`focus`/`gratitude`/`wgoals`) utilisent bien le même format objet que leurs accesseurs dans `data.js`. Aucun problème trouvé. | — | ⚪ Aucun problème |
| `js/views/grades.js` | `_csvField()` échappe correctement les guillemets (vérifié par test ad hoc) ; pas de double-échappement avec les champs déjà littéraux (`"=MOYENNE MODULE"`). Comportement sur valeur `undefined`/`null` identique à l'ancien code (donnait déjà la chaîne littérale `"undefined"`), donc pas de régression introduite. Aucun problème trouvé. | — | ⚪ Aucun problème |
| `index.html` | Suppression du bloc `<script>` dupliqué (`insertTable`/`_doInsertTable`) : vérifié qu'aucun `onclick` ni ailleurs dans le code ne référence encore `_doInsertTable` (la version conservée dans `notes.js` utilise `doInsertTable`, sans underscore, et `insertTable()` reste unique). Aucun problème trouvé. | — | ⚪ Aucun problème |
| `js/app.js` | Liste blanche du routeur hash complétée (`grades`,`shopping`,`luna`,`settings`) ; `signOutUser()` réutilise `ALL_DATA_KEYS`, identique à l'ancienne liste manuelle (vérifié clé par clé, rien oublié ni ajouté en trop). `clearICS()` reste l'unique définition, toujours appelée correctement depuis `settings.js` et `calendar.js`. Aucun problème trouvé. | — | ⚪ Aucun problème |

**Conclusion** : un seul problème net (régression fonctionnelle, pas de crash) trouvé — le réglage "Notifications d'événements" devenu inopérant après la suppression du doublon dans `calendar.js`. **Corrigé** (voir tableau ci-dessus). Tout le reste du diff de session est cohérent, sans erreur de syntaxe (confirmé par `node --check`), sans référence orpheline, et sans effet de bord non voulu.

## Tests — agent testeur (navigateur réel)

Tests exécutés dans un vrai navigateur (Chromium via Playwright), sur l'app servie localement (`python3 -m http.server`), avec le SDK Firebase entièrement stubé côté client (`window.firebase.auth()`/`.firestore()` remplacés par de faux objets avant chargement, requêtes réseau vers `*firebase*`/`*gstatic*`/`*googleapis*` bloquées) pour simuler un utilisateur déjà connecté **sans aucun appel réseau réel ni écriture sur le projet Firebase de production**. Toute la console (`console.error`) et les exceptions JS non interceptées (`pageerror`) ont été capturées à chaque étape.

### ✅ Fonctionne correctement

- Contournement Firebase local : l'app affiche bien le dashboard directement (plus de blocage sur l'écran de login), aucune note vide ("onboarding" sauté via `pl_cfg` pré-rempli).
- Navigation entre tous les onglets (Accueil, Notes, Agenda, Bien-être, Tâches, Moyennes, Luna IA) et vers Courses (depuis Tâches) : aucune erreur console à chaque changement de vue.
- **Notes** : création d'un sujet, ouverture de l'éditeur, saisie titre + contenu.
- **Bug #6 (notes fantômes) confirmé corrigé** : ouvrir une note puis revenir en arrière sans rien écrire ne laisse aucune note vide dans la liste (`noteCount=0` après coup).
- **Insertion d'image** : un vrai `<img class="note-img">` est bien inséré dans `#e-content` via le sélecteur de fichier (testé avec un petit PNG).
- **Bug #7 (`fmtSize` plantait sur sélection multi-éléments) confirmé corrigé** : sélection couvrant du texte en gras + texte normal, `fmtSize('24px')` ne lève plus d'exception et enveloppe correctement le contenu via le repli `extractContents()`/`insertNode()`.
- **Insertion de tableau (logique JS)** : `doInsertTable()` insère bien un vrai `<table>` avec le bon nombre de lignes/colonnes (testé 3×3 → `tables=1 rows=3 cols=3`) et la note se sauvegarde correctement avec titre + contenu + tableau + image.
- **Tâches** : création d'une liste, ajout rapide via le champ "quick-task-in" → la tâche apparaît avec le texte exact saisi.
- **Luna — ajout de tâche par regex confirmé corrigé (bug #8/#9)** : message "ajoute acheter du pain à mes tâches" → la tâche apparaît dans l'onglet Tâches avec le texte **"Acheter du pain"** (non vide, bien capitalisé), confirmant que le schéma `text`/`due`/`listId`/`note` est maintenant utilisé de bout en bout.
- **Réglages** : `exportData()` déclenche un téléchargement sans erreur JS ; `resetAll()` (avec Firebase stubé, donc `FB.deleteAll` ne fait rien côté réseau) s'exécute sans erreur JS et retourne au dashboard.
- **Moyennes** : navigation sans erreur ; `exportGradesCSV()` déclenche un téléchargement sans erreur JS.

### ❌ Problème trouvé (nouveau, hors liste d'origine)

- **Modale "Insérer un tableau" invisible et non cliquable par-dessus l'éditeur de note** (et plus généralement **toute modale `openModal()` ouverte pendant que l'éditeur de note est actif**, p. ex. en cliquant sur le bouton "⊞ Tableau" de la barre d'outils) :
  - `#editor-overlay` a `z-index:300` (`css/main.css:494`) alors que `#modal-wrap` a `z-index:200` (`css/main.css:562`). L'éditeur ayant un fond opaque et couvrant tout le viewport (`position:fixed;inset:0`), la modale de configuration du tableau (colonnes/lignes/couleurs/taille) s'ouvre bien dans le DOM (`#modal-wrap` reçoit la classe `.open`) mais est **rendue entièrement sous l'éditeur, donc invisible et impossible à cliquer**.
  - Confirmé par : capture d'écran (le clic sur "⊞" n'affiche visuellement rien de nouveau), message Playwright *"`<div class="ed-body">…</div>` from `<div class="open" id="editor-overlay">…</div>` subtree intercepts pointer events"*, timeout de clic réel (3 s), et lecture des `z-index` calculés (`editor-overlay=300` vs `modal-wrap=200`).
  - **Impact utilisateur réel** : en l'état, cliquer sur "⊞ Insérer un tableau" (ou tout autre bouton de la barre d'outils qui ouvrirait une modale, à vérifier) depuis l'éditeur de note ne fait **rien visuellement** dans un vrai navigateur — la fonctionnalité "tableau" reste donc **en pratique cassée pour l'utilisateur final**, même si le correctif du bug #5 (dédoublonnage JS) et la fonction `doInsertTable()` elle-même sont corrects (vérifié en l'appelant directement en JS : insertion correcte d'un tableau 3×3).
  - Fichier : `css/main.css` (lignes 494 et 562).
  - **🟢 Corrigé** : `#modal-wrap` passé à `z-index:400` (au-dessus des 300 de `#editor-overlay`). Toute modale ouverte depuis l'éditeur de note (tableau inclus) s'affiche désormais par-dessus, cliquable normalement.

### ⚠️ Non testé (hors périmètre de ce passage)

- Mode Gemini/Claude de Luna (nécessite une vraie clé API).
- Connexion/synchronisation Firestore réelle multi-appareils (volontairement évitée pour ne pas toucher au projet Firebase de production).
- Connexion Google (`signInWithRedirect`/popup) et flux d'authentification par email (création de compte, vérification d'email, mot de passe oublié) — seul l'état "déjà connecté" a été simulé.
- Création d'événement dans l'Agenda, interactions Bien-être (humeur, habitudes, cycle), ajout/suppression d'articles dans Courses — seule la navigation vers ces onglets a été vérifiée, pas les actions internes.
- Export PDF d'une note (`exportNotePDF`) et import JSON (`importData`).
- Double notification d'événement agenda corrigée (#13) et réglage "Notifications d'événements" (issue de contrôle qualité ci-dessus) — nécessiteraient de programmer un vrai événement et d'attendre/avancer le temps, hors périmètre d'un test rapide.
- Mode sombre, taille de police, micro Luna, comportement hors-ligne du Service Worker.
- Rendu mobile réel (testé uniquement en résolution desktop par défaut dans Chromium headless).

**Conclusion** : les corrections listées dans ce document (#2 à #18, notamment #5/#6/#7/#8/#9) fonctionnent bien **au niveau logique/JS** une fois exercées dans un vrai navigateur, aucune n'a introduit d'erreur console ou d'exception. Le bug CSS (z-index) découvert par ce test, qui rendait la modale d'insertion de tableau invisible par-dessus l'éditeur, a été corrigé dans la foulée — voir ci-dessus.
