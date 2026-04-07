<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Playfair+Display&size=42&duration=3000&pause=1000&color=C4778E&center=true&vCenter=true&width=600&lines=🌸+Planify;Ton+appli+préférée+t'attend." alt="Planify" />

**L'application qui organise ta vie d'étudiante — avec style.**

<br>

[![PWA](https://img.shields.io/badge/✦_PWA-100%25_offline-c4778e?style=for-the-badge&logoColor=white)](https://cherifisarah.github.io/Planify)
[![Gemini](https://img.shields.io/badge/✦_Luna_IA-Gemini_2.0-db7093?style=for-the-badge)](https://cherifisarah.github.io/Planify)
[![Firebase](https://img.shields.io/badge/✦_Firebase-Auth_%2B_Sync-ffca28?style=for-the-badge&logoColor=black)](https://cherifisarah.github.io/Planify)
[![Français](https://img.shields.io/badge/✦_Langue-Français-7A2E50?style=for-the-badge)](https://cherifisarah.github.io/Planify)

<br>

*Parce qu'une bonne organisation ça change vraiment tout.*

</div>

---

<div align="center">

## ✨ Pourquoi Planify ?

</div>

T'as déjà eu **dix applis ouvertes en même temps** — l'agenda dans un coin, les notes dans un autre, les courses dans les mémos vocaux, et les moyennes sur un post-it froissé au fond de ton sac ?

**Planify, c'est fini tout ça.**

Une seule appli, pensée de A à Z pour les étudiantes. Belle, rapide, qui marche même sans connexion, et avec une IA intégrée qui te parle vraiment — pas comme un robot.

---

<div align="center">

## 🌟 Ce que tu vas adorer

</div>

<br>

### 🤖 Luna — Ton assistante perso

> *"luna keskon mange ce soir"* · *"c koi ma moy en maths"* · *"rajoute du lait dans les courses"*

Luna c'est pas un chatbot classique. Elle te **connaît**. Elle sait tes notes, tes événements du jour, tes habitudes. Elle répond en vrai français — y compris le texto.

- 💬 Comprend le langage naturel et les abréviations
- 🎤 Mode vocal — parle-lui directement
- ✅ Execute des actions : ajoute des courses, crée des tâches, écrit des notes
- 🧠 Alimentée par Gemini 2.0 (gratuit) ou 100% offline sans connexion
- 💾 Mémorise vos conversations

<br>

### 📝 Notes — L'éditeur qui déchire

Fini les notes moches et désorganisées.

- **Gras**, *italique*, titres, listes — formatage complet
- Couleurs, surlignage 💛💗, taille du texte
- Tableaux intégrés
- **Export PDF** en un clic
- Organisées par matière

<br>

### 📅 Agenda — Plus jamais un partiel raté

- Vue calendrier claire et lisible
- Import de ton emploi du temps universitaire (fichier `.ics` / ADE)
- Événements colorés avec rappels
- Rappel automatique 15 min avant chaque événement 🔔

<br>

### 🎓 Moyennes — Ta situation en temps réel

- Saisis tes notes par matière et par semestre
- Calcul automatique de ta moyenne générale
- Tu sais exactement **quelle note il te faut pour valider**
- Semestre 1 et Semestre 2 séparés

<br>

### 💗 Bien-être — Parce que toi aussi tu comptes

C'est la partie qu'on préfère et qu'on oublie trop souvent.

- **Humeur du jour** — un emoji, une couleur, une trace
- **Habitudes** avec streaks (hydratation 💧, sport 🏃, sommeil 🌙…)
- **Tracker de cycle** avec prédictions et rappels J-2
- **Suivi d'eau** quotidien — 8 verres, c'est l'objectif
- Historique de tes émotions sur plusieurs semaines

<br>

### ✅ Tâches & 🛒 Courses

Simple, efficace, sans fioriture.

- To-do list avec priorités et deadlines
- Liste de courses triée par catégorie — fini de repasser devant les pâtes
- **Luna peut ajouter à ta liste directement** en vocal ou en texte

---

<div align="center">

## 📱 Installable sur ton téléphone

</div>

Planify est une **PWA** (Progressive Web App) — ça veut dire qu'elle s'installe comme une vraie appli, sans passer par l'App Store.

| Appareil | Comment installer |
|---|---|
| 📱 **iPhone** | Safari → Partager → Sur l'écran d'accueil |
| 🤖 **Android** | Chrome → Menu → Installer l'application |
| 💻 **PC / Mac** | Chrome → icône ➕ dans la barre d'adresse |

> Fonctionne **hors ligne** dès la première visite. Pas de connexion ? Luna continue en mode local. 💪

---

<div align="center">

## 🛠 Pour les curieuses (stack technique)

</div>

```
HTML · CSS · JavaScript (Vanilla — zéro framework)
Firebase Auth        — connexion email + Google
Firestore            — synchronisation cloud
Service Worker       — mode offline complet
Gemini 2.0 Flash     — IA de Luna (gratuit)
Web Speech API       — reconnaissance vocale
Playfair Display     — police principale
Inter                — corps de texte
```

Aucun bundler. Aucune dépendance npm. Des fichiers propres, du code lisible. C'est voulu.

---

<div align="center">

## 🚀 Lancer le projet

</div>

```bash
# Cloner le repo
git clone https://github.com/CHERIFISarah/Planify.git
cd Planify

# Lancer avec Node.js
node -e "require('http').createServer((req,res)=>{
  const fs=require('fs'), p=require('path');
  let f=p.join(__dirname,req.url==='/'?'/index.html':req.url.split('?')[0]);
  fs.existsSync(f)&&fs.statSync(f).isFile()
    ? res.writeHead(200).end(fs.readFileSync(f))
    : res.writeHead(200).end(fs.readFileSync(p.join(__dirname,'index.html')));
}).listen(3000,()=>console.log('http://localhost:3000'))"

# Ou avec Python 3
python -m http.server 3000
```

Ouvre **http://localhost:3000** — c'est prêt 🌸

---

<div align="center">

## 🔑 Activer Luna IA (optionnel, gratuit)

</div>

Sans clé API, Luna fonctionne déjà très bien en mode local. Mais avec une clé Gemini, elle devient vraiment intelligente.

1. Va sur **[aistudio.google.com](https://aistudio.google.com/app/apikey)**
2. Crée une clé gratuite (pas de carte bancaire)
3. Dans Planify → **Réglages** → **Luna IA 🌸** → colle ta clé

> Gratuit · 1 500 requêtes/jour · Aucune limite bancaire

---

<div align="center">

## 🗂 Structure du projet

</div>

```
Planify/
├── index.html              ← Shell de l'app
├── manifest.json           ← Config PWA
├── sw.js                   ← Service Worker (cache offline)
├── css/
│   └── main.css            ← Tout le style (thème rose, dark mode)
└── js/
    ├── app.js              ← Router & init
    ├── data.js             ← Données (Firestore + localStorage)
    ├── firebase-config.js  ← Clés Firebase
    └── views/
        ├── dashboard.js    ← Accueil
        ├── notes.js        ← Éditeur de notes
        ├── calendar.js     ← Agenda
        ├── grades.js       ← Moyennes
        ├── wellness.js     ← Bien-être
        ├── tasks.js        ← Tâches
        ├── shopping.js     ← Courses
        ├── luna.js         ← Luna IA
        └── settings.js     ← Réglages
```

---

<div align="center">

## 🌷 Roadmap

- [ ] Notifications push réelles (Firebase Cloud Messaging)
- [ ] Export PDF du relevé de notes complet
- [ ] Partage de listes entre amies
- [ ] Widgets iOS (écran d'accueil)
- [ ] Thème mauve / personnalisable

---

<br>

*Fait avec beaucoup de rose, un peu de café, et l'envie que cette appli existe vraiment* 🌸

<br>

**— Sarah ✨**

</div>
