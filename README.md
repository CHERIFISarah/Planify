<div align="center">

# 🌸 Planify

**Ton espace personnel. Organisée, sereine, et un peu girly.**

![PWA](https://img.shields.io/badge/PWA-100%25%20offline-c4778e?style=flat-square&logo=pwa&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Hosting-ffca28?style=flat-square&logo=firebase&logoColor=black)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-no%20framework-f7df1e?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-db7093?style=flat-square)
![Lang](https://img.shields.io/badge/langue-français-7A2E50?style=flat-square)

</div>

---

> Une app pensée pour les étudiantes qui jonglent entre les cours, les deadlines, les listes de courses et leur bien-être — sans avoir à ouvrir dix applis différentes.

<div align="center">

![Aperçu de Planify](https://via.placeholder.com/800x450/7A2E50/ffffff?text=📸+Capture+d%27écran+Planify)

*Accueil · Notes · Agenda · Luna IA · Bien-être*

</div>

---

## Ce que fait l'app

### 🤖 Luna — L'assistante IA intégrée

Luna c'est le truc dont on est le plus fières. Une IA 100% offline, qui parle vraiment français — y compris le texto. Elle comprend `"slt cv ?"`, `"c koi ma moy"`, `"fo que je fasse quoi auj"`. Pas de serveur, pas d'API externe, tout tourne dans le navigateur.

- Résumé de ta journée / semaine en un message
- Calcul de moyennes à la demande
- Gestion de notes, tâches et courses par la voix ou le texte
- 25+ intents, scoring NLP, mémoire de contexte courante
- Mode vocal avec reconnaissance de la parole

### 📝 Notes

Éditeur de texte enrichi avec formatage (gras, italique, titres), tableaux, images, et organisation par matière. Tes notes restent là, même sans connexion.

### 📅 Agenda

Vue calendrier classique + liste des événements à venir. Chaque événement a sa couleur, ses détails, ses rappels. Parfait pour ne plus rater un partiel.

### 🎓 Moyennes

Saisis tes notes par matière et par semestre, l'app calcule tout automatiquement. Tu sais en temps réel où tu en es et ce qu'il te faut pour valider.

### 💗 Bien-être

Le module dont on a le plus besoin et qu'on néglige le plus :

- Suivi de l'humeur (emoji par jour)
- Habitudes avec streaks (hydratation, sport, sommeil…)
- Tracker de cycle
- Suivi de la consommation d'eau au quotidien

### ✅ Tâches & 🛒 Courses

To-do lists simples et efficaces. Les courses sont triées par catégorie — fini de passer trois fois devant les pâtes.

---

## Stack

```
HTML · CSS · JavaScript (Vanilla, sans framework)
Firebase Auth        — connexion email + Google
Firebase Hosting     — déploiement
Service Worker       — cache offline complet
Web Speech API       — reconnaissance vocale pour Luna
Playfair Display     — typographie principale
Inter                — corps de texte
```

Aucun bundler, aucune dépendance npm. Juste des fichiers. C'est voulu.

---

## Lancer en local

```bash
# 1. Cloner
git clone https://github.com/CHERIFISarah/Planify.git
cd Planify

# 2. Lancer un petit serveur local (Python 3 suffit)
python -m http.server 3456
```

Ouvre `http://localhost:3456` — l'app se charge, et grâce au service worker elle est disponible offline dès la deuxième visite.

> **Note iOS** : pour installer l'app sur iPhone, ouvre le site dans Safari > Partager > Sur l'écran d'accueil. Chrome sur iOS ne supporte pas encore l'installation de PWA.

---

## Configuration Firebase

L'app a besoin d'un projet Firebase pour l'authentification et la sync cloud.

**1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com)**

**2. Active Authentication** (Email/Mot de passe + Google)

**3. Active Firestore** en mode production

**4. Copie tes clés dans `js/firebase-config.js` :**

```js
// js/firebase-config.js
const firebaseConfig = {
  apiKey:            "ta-clé",
  authDomain:        "ton-projet.firebaseapp.com",
  projectId:         "ton-projet",
  storageBucket:     "ton-projet.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

**5. Déploie sur Firebase Hosting :**

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # pointe vers le dossier racine "."
firebase deploy --only hosting
```

---

## Structure du projet

```
Planify/
├── index.html              # Shell de l'app (nav, canvas sparkle)
├── manifest.json           # Config PWA
├── sw.js                   # Service Worker — cache offline
├── css/
│   └── main.css            # Tout le style (variables, thème rose)
└── js/
    ├── app.js              # Router, init, gestion auth
    ├── data.js             # Couche données (Firestore + localStorage)
    ├── firebase-config.js  # Clés Firebase (à ne pas commit en prod)
    ├── luna-worker.js      # Worker NLP de Luna
    └── views/
        ├── dashboard.js    # Accueil / résumé
        ├── notes.js        # Éditeur de notes
        ├── calendar.js     # Agenda
        ├── grades.js       # Moyennes
        ├── wellness.js     # Bien-être
        ├── tasks.js        # Tâches
        ├── shopping.js     # Courses
        ├── luna.js         # Interface + moteur IA
        └── settings.js     # Paramètres compte
```

---

## Roadmap

- [ ] Widgets recap sur l'écran d'accueil (iOS 17+)
- [ ] Export PDF du relevé de notes
- [ ] Partage de listes de courses entre amies
- [ ] Notifications push pour les rappels d'événements
- [ ] Dark mode (avec thème mauve profond)

---

## Contribuer

C'est un projet perso / scolaire, mais les issues et PRs sont les bienvenues. Si tu veux ajouter une fonctionnalité, ouvre une issue d'abord pour qu'on en discute.

---

## Licence

MIT — fais-en ce que tu veux, mais garde la mention d'origine.

---

<div align="center">

Fait avec du café, des post-its et beaucoup de rose 🌸

</div>
