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
- [ ] Agent de test (vérifie que tout fonctionne réellement dans le navigateur) — **en cours**
- [ ] Agent de contrôle (relit l'ensemble des corrections)

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
