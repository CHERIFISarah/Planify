# Planify — Audit des problèmes & avancement

Dernière mise à jour : 2026-10-08 — en cours

Légende statut : 🔴 À faire · 🟡 En cours · 🟢 Corrigé · ⚪ Pas un bug / amélioration future

## Résumé d'avancement

- [x] Diagnostic du bug "impossible d'ajouter une photo" (agent d'audit)
- [x] Correction des sauvegardes silencieuses (localStorage + Firestore)
- [x] Correction du bug "le tableau ne marche pas"
- [x] Correction de 2 "petits blocages" dans Notes (notes vides fantômes, crash taille de texte)
- [ ] Audit complet du reste de l'app (calendar, dashboard, grades, settings, shopping, tasks, wellness, luna, app.js) — **en cours**
- [ ] Corrections issues de cet audit
- [ ] Agent de test (vérifie que tout fonctionne réellement dans le navigateur)
- [ ] Agent de contrôle (relit l'ensemble des corrections)

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

## Audit complet en cours

Un agent analyse actuellement le reste du code (`app.js`, `calendar.js`, `dashboard.js`, `grades.js`, `settings.js`, `shopping.js`, `tasks.js`, `wellness.js`, `luna.js`, `luna-worker.js`, `sw.js`) pour détecter d'autres bugs. Les résultats seront ajoutés ci-dessous au fur et à mesure.
