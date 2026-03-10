// ═══════════════════════════════════════════════════════
//  PLANIFY — Firebase Config · Auth · Firestore Sync
// ═══════════════════════════════════════════════════════
// !! Remplace ces valeurs par ta config Firebase !!
// (Paramètres projet → Tes applications → Config)
const FIREBASE_CONFIG = {
  apiKey:            "VOTRE_API_KEY",
  authDomain:        "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId:         "VOTRE_PROJECT_ID",
  storageBucket:     "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId:             "VOTRE_APP_ID"
};

// ── Init ──────────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.firestore();

// Mode offline : les données fonctionnent sans connexion
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

// ── Objet FB — toutes les opérations Firebase ─────────
const FB = {

  // ── Auth ─────────────────────────────────────────────
  signUp(email, pass) {
    return auth.createUserWithEmailAndPassword(email, pass);
  },
  signIn(email, pass) {
    return auth.signInWithEmailAndPassword(email, pass);
  },
  signInGoogle() {
    const prov = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(prov);
  },
  signOut() {
    return auth.signOut();
  },

  // ── Firestore — lecture ───────────────────────────────
  // Charge tous les docs users/{uid}/data/* → localStorage
  async loadAll(uid) {
    try {
      const snap = await db.collection('users').doc(uid)
                           .collection('data').get();
      snap.forEach(doc => {
        LS._set('pl_' + doc.id, doc.data().v);
      });
    } catch (e) {
      console.warn('[FB] loadAll:', e.message);
    }
  },

  // ── Firestore — écriture ──────────────────────────────
  // Sauvegarde une clé localStorage vers Firestore (fire-and-forget)
  saveKey(key, value) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const docId = key.replace(/^pl_/, '');
    db.collection('users').doc(uid)
      .collection('data').doc(docId)
      .set({ v: value })
      .catch(() => {});
  },

  // Upload tout le localStorage actuel vers Firestore (première connexion)
  async uploadAll(uid) {
    const keys = [
      'pl_cfg','pl_subjects','pl_notes','pl_events','pl_ics',
      'pl_todos','pl_lists','pl_moods','pl_habits','pl_hlogs',
      'pl_cycle','pl_cyclecfg','pl_water','pl_focus',
      'pl_gratitude','pl_wgoals'
    ];
    try {
      const batch = db.batch();
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        try {
          const docId = k.replace(/^pl_/, '');
          const ref   = db.collection('users').doc(uid)
                         .collection('data').doc(docId);
          batch.set(ref, { v: JSON.parse(raw) });
        } catch {}
      });
      await batch.commit();
    } catch (e) {
      console.warn('[FB] uploadAll:', e.message);
    }
  },

  // Sauvegarde le profil (nom, emoji…) dans le doc root users/{uid}
  async saveProfile(uid, data) {
    await db.collection('users').doc(uid)
            .set(data, { merge: true })
            .catch(() => {});
  }
};

// ── Intercept LS.s → sync automatique vers Firestore ──
// Doit être après data.js (qui définit LS)
const _origLSs = LS.s.bind(LS);
LS._set = _origLSs;          // version directe (sans Firestore), pour loadAll
LS.s = function(key, value) {
  _origLSs(key, value);      // localStorage en premier (synchrone)
  FB.saveKey(key, value);    // Firestore en arrière-plan
};
