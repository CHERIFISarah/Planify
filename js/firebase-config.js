// ═══════════════════════════════════════════════════════
//  PLANIFY — Firebase Config · Auth · Firestore Sync
// ═══════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBuCCCUNYz6BtihwwEsMYJ2jZsWdI_IBDE",
  authDomain:        "planify-98749.firebaseapp.com",
  projectId:         "planify-98749",
  storageBucket:     "planify-98749.firebasestorage.app",
  messagingSenderId: "814814241699",
  appId:             "1:814814241699:web:51e8cd492565c2afb9f016",
  measurementId:     "G-0DVMRT0GFN"
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
    // iOS/Android : signInWithPopup est bloqué → utiliser redirect
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      return auth.signInWithRedirect(prov);
    }
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
    // Firestore refuse tout document > 1 MiB : on prévient plutôt que
    // d'échouer en silence (les données restent dispo en local).
    const approxSize = JSON.stringify(value).length;
    if (approxSize > 900 * 1024) {
      console.warn('[FB] saveKey: document trop volumineux pour Firestore, sync ignorée', key, approxSize);
      if (typeof showToast === 'function') {
        showToast('⚠️ Trop volumineux pour la sauvegarde cloud (réduis la taille des images)');
      }
      return;
    }
    const docId = key.replace(/^pl_/, '');
    db.collection('users').doc(uid)
      .collection('data').doc(docId)
      .set({ v: value })
      .catch(e => {
        console.error('[FB] saveKey failed:', key, e);
        if (typeof showToast === 'function') showToast('⚠️ Sauvegarde cloud échouée');
      });
  },

  // Upload tout le localStorage actuel vers Firestore (première connexion)
  async uploadAll(uid) {
    try {
      const batch = db.batch();
      ALL_DATA_KEYS.forEach(k => {
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

  // Supprime tous les documents de données Firestore d'un utilisateur
  // (utilisé par le reset total des réglages)
  async deleteAll(uid) {
    try {
      const batch = db.batch();
      ALL_DATA_KEYS.forEach(k => {
        const docId = k.replace(/^pl_/, '');
        const ref   = db.collection('users').doc(uid)
                       .collection('data').doc(docId);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (e) {
      console.warn('[FB] deleteAll:', e.message);
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
