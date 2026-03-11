# 🌸 Planify

Application web personnelle de type PWA pour organiser sa vie étudiante.

## Fonctionnalités

- 📝 **Notes & Matières** — prends des notes par matière
- 📅 **Calendrier** — visualise tes événements en vue jour / semaine / mois
- ✅ **Tâches** — gère tes to-do lists
- 🌿 **Bien-être** — suivi de l'humeur, du cycle, de l'hydratation et du focus
- 🔄 **Sync cloud** — données synchronisées via Firebase (accès depuis n'importe quel appareil)
- 🔐 **Authentification** — connexion par email ou Google
- 📲 **Installable** — fonctionne comme une app native sur iPhone et Android (PWA)

## Stack technique

- HTML / CSS / JavaScript (Vanilla)
- Firebase Auth + Firestore
- PWA (manifest + service worker)
- Hébergé sur Firebase Hosting

## Lancer en local

```bash
# Cloner le repo
git clone https://github.com/CHERIFISarah/Planify.git

# Lancer un serveur local
cd Planify
python -m http.server 3456
```

Ouvre ensuite `http://localhost:3456` dans ton navigateur.

## Déploiement

L'app est déployée sur Firebase Hosting :

```bash
firebase deploy --only hosting
```
