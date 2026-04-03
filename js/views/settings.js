// ═══════════════════════════════════════════════════════
//  Vue : Réglages
// ═══════════════════════════════════════════════════════
function viewSettings() {
  const cfg      = LS.cfg();
  const email    = auth.currentUser?.email || '';
  const isGoogle = auth.currentUser?.providerData?.some(p => p.providerId === 'google.com');

  const stats = [
    ['Notes',       LS.notes().length],
    ['Sujets',      LS.subjects().length],
    ['Événements',  LS.events().length + LS.ics().length],
    ['Tâches',      LS.todos().length],
    ['Humeurs',     Object.keys(LS.moods()).length + ' j'],
    ['Logs cycle',  LS.cycleLog().length],
    ['Courses',     LS.shopping().length],
    ['Modules',     (LS.grades().s1.length + LS.grades().s2.length)],
  ];

  return `
<div class="ph">
  <button class="ph-back" onclick="go('dashboard')">←</button>
  <span class="ph-title">Réglages</span>
</div>
<div class="pg">

<!-- Profil -->
<div class="st">Mon profil</div>
<div class="card">
  ${email ? `
  <div class="setting-row" style="margin-bottom:.5rem">
    <div>
      <div class="setting-label">Compte connecté</div>
      <div class="setting-hint" style="font-size:.78rem;word-break:break-all">${esc(email)}</div>
    </div>
    <span class="st-provider-badge">${isGoogle
      ? `<svg width="14" height="14" viewBox="0 0 18 18" fill="none" style="vertical-align:middle;margin-right:.3rem"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.092 17.64 11.784 17.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>Google`
      : `✉️ Email`}</span>
  </div>
  <div class="setting-sep"></div>` : ''}
  <div class="setting-row">
    <div>
      <div class="setting-label">Prénom</div>
      <div class="setting-hint">Affiché sur le tableau de bord</div>
    </div>
    <input class="setting-input" type="text" value="${esc(cfg.name||'')}" placeholder="Ton prénom…"
      oninput="saveCfgField('name',this.value)">
  </div>
</div>

<!-- Apparence -->
<div class="st">Apparence</div>
<div class="card">
  <div class="setting-row">
    <div>
      <div class="setting-label">Mode sombre</div>
      <div class="setting-hint">Interface sombre pour le soir</div>
    </div>
    <label class="toggle">
      <input type="checkbox" ${cfg.dark?'checked':''} onchange="toggleDarkMode(this.checked)">
      <span class="toggle-slider"></span>
    </label>
  </div>
  <div class="setting-sep"></div>
  <div class="setting-row">
    <div>
      <div class="setting-label">Taille du texte</div>
      <div class="setting-hint">Ajuste la lisibilité</div>
    </div>
    <select class="setting-select" onchange="saveCfgField('fontSize',this.value)">
      <option value="normal" ${(!cfg.fontSize||cfg.fontSize==='normal')?'selected':''}>Normal</option>
      <option value="large"  ${cfg.fontSize==='large'?'selected':''}>Grand</option>
      <option value="xlarge" ${cfg.fontSize==='xlarge'?'selected':''}>Très grand</option>
    </select>
  </div>
</div>

<!-- Notifications -->
<div class="st">Notifications 🔔</div>
<div class="card">
  <div style="font-size:.8rem;color:var(--ts);line-height:1.6;margin-bottom:.75rem;background:var(--pl);padding:.65rem;border-radius:var(--rs)">
    ℹ️ <strong>iPhone</strong> : installe Planify via <em>Partager → Sur l'écran d'accueil</em> pour activer les notifications.
    Les notifs fonctionnent quand l'app est ouverte ou en arrière-plan.
  </div>

  <div class="setting-row">
    <div>
      <div class="setting-label">💧 Rappels hydratation</div>
      <div class="setting-hint">Toutes les ~1h30 pour boire de l'eau</div>
    </div>
    <label class="toggle">
      <input type="checkbox" ${cfg.notifs!==false?'checked':''} onchange="toggleNotifs(this.checked)">
      <span class="toggle-slider"></span>
    </label>
  </div>
  <div class="setting-sep"></div>
  <div class="setting-row">
    <div>
      <div class="setting-label">🌙 Récap du soir (21h)</div>
      <div class="setting-hint">Événements et habitudes de demain</div>
    </div>
    <label class="toggle">
      <input type="checkbox" ${cfg.notifEvening!==false?'checked':''} onchange="toggleCfgBool('notifEvening',this.checked)">
      <span class="toggle-slider"></span>
    </label>
  </div>
  <div class="setting-sep"></div>
  <div class="setting-row">
    <div>
      <div class="setting-label">🌹 Rappel règles (J-2)</div>
      <div class="setting-hint">Avertissement 2 jours avant tes règles prévues</div>
    </div>
    <label class="toggle">
      <input type="checkbox" ${cfg.notifPeriod!==false?'checked':''} onchange="toggleCfgBool('notifPeriod',this.checked)">
      <span class="toggle-slider"></span>
    </label>
  </div>
  <div class="setting-sep"></div>
  <div class="setting-row">
    <div>
      <div class="setting-label">📅 Rappel événements (15 min avant)</div>
      <div class="setting-hint">Alerte 15 min avant chaque événement du jour</div>
    </div>
    <label class="toggle">
      <input type="checkbox" ${cfg.notifEvents!==false?'checked':''} onchange="toggleCfgBool('notifEvents',this.checked)">
      <span class="toggle-slider"></span>
    </label>
  </div>
  <div class="setting-sep"></div>
  <button class="btn btn-ghost btn-sm btn-full" onclick="requestNotifNow()">
    🔔 Activer les notifications maintenant
  </button>
</div>

<!-- Calendrier / ICS -->
<div class="st">Calendrier universitaire</div>
<div class="card">
  <div class="setting-hint" style="margin-bottom:.75rem">
    Importe ton emploi du temps depuis ADE ou tout autre service iCal.
  </div>

  <!-- Import fichier ICS -->
  <div class="setting-row" style="align-items:flex-start;flex-direction:column;gap:.5rem">
    <div class="setting-label">📁 Importer un fichier .ics</div>
    <label class="btn btn-ghost btn-sm" style="cursor:pointer">
      Choisir un fichier
      <input type="file" accept=".ics" style="display:none" onchange="importICSFile(this)">
    </label>
  </div>

  <div class="setting-sep"></div>

  <!-- URL ICS -->
  <div style="margin-bottom:.5rem">
    <div class="setting-label" style="margin-bottom:.35rem">🔗 URL iCal (si CORS autorisé)</div>
    <div style="display:flex;gap:.5rem">
      <input class="setting-input" id="ics-url-in" type="url" value="${esc(cfg.icsUrl||'')}"
        placeholder="https://…/ical/…" style="flex:1">
      <button class="btn btn-sm" onclick="fetchICSFromSettings()">Importer</button>
    </div>
    <div id="ics-status" class="setting-hint" style="margin-top:.35rem"></div>
  </div>

  <div class="setting-sep"></div>

  <!-- Guide UJM -->
  <details class="accordion">
    <summary class="accordion-sum">📖 Comment obtenir l'URL ADE (UJM) ?</summary>
    <div class="accordion-body">
      <ol style="padding-left:1.2rem;line-height:1.9;font-size:.85rem">
        <li>Connecte-toi sur <strong>ade.univ-st-etienne.fr</strong></li>
        <li>Ouvre ton emploi du temps personnel</li>
        <li>Clique sur <strong>Partager → Exporter</strong></li>
        <li>Copie le lien <strong>iCalendar (.ics)</strong></li>
        <li>Colle-le ci-dessus et clique <strong>Importer</strong></li>
      </ol>
      <div class="setting-hint">
        ⚠️ En cas d'erreur CORS, télécharge le fichier .ics et utilise l'import par fichier ci-dessus.
      </div>
    </div>
  </details>

  ${LS.ics().length ? `
  <div class="setting-sep"></div>
  <div class="setting-row">
    <div>
      <div class="setting-label">Événements importés</div>
      <div class="setting-hint">${LS.ics().length} événement${LS.ics().length>1?'s':''} depuis iCal</div>
    </div>
    <button class="btn btn-danger btn-sm" onclick="clearICS()">Supprimer</button>
  </div>` : ''}
</div>

<!-- Cycle -->
<div class="st">Cycle menstruel</div>
<div class="card">
  <div class="setting-row">
    <div>
      <div class="setting-label">Durée moyenne du cycle</div>
      <div class="setting-hint">En jours (ex: 28)</div>
    </div>
    <input class="setting-input" type="number" min="18" max="50"
      value="${LS.cycleCfg().avgLen}"
      onchange="saveCycleCfg('avgLen',+this.value)" style="width:65px;text-align:center">
  </div>
  <div class="setting-sep"></div>
  <div class="setting-row">
    <div>
      <div class="setting-label">Durée des règles</div>
      <div class="setting-hint">En jours (ex: 5)</div>
    </div>
    <input class="setting-input" type="number" min="1" max="14"
      value="${LS.cycleCfg().perLen}"
      onchange="saveCycleCfg('perLen',+this.value)" style="width:65px;text-align:center">
  </div>
</div>

<!-- Luna IA -->
<div class="st">Luna IA 🌸</div>
<div class="card">
  <div style="font-size:.8rem;color:var(--ts);line-height:1.6;margin-bottom:.75rem;background:var(--pl);padding:.65rem;border-radius:var(--rs)">
    ✨ <strong>Mode intelligent (optionnel)</strong> : entre ta clé API Claude pour que Luna réponde avec l'intelligence de l'IA Claude. Sans clé, Luna fonctionne 100% hors ligne.
  </div>
  <div class="setting-row">
    <div>
      <div class="setting-label">🔑 Clé API Claude</div>
      <div class="setting-hint">Depuis <strong>console.anthropic.com</strong></div>
    </div>
  </div>
  <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center">
    <input class="setting-input" type="password" id="claude-key-in"
      value="${esc(cfg.claudeApiKey||'')}"
      placeholder="sk-ant-…"
      style="flex:1;font-size:.8rem"
      oninput="saveCfgField('claudeApiKey',this.value)">
    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('claude-key-in').type=document.getElementById('claude-key-in').type==='password'?'text':'password'">👁</button>
  </div>
  ${cfg.claudeApiKey?`<div style="font-size:.75rem;color:#7AA97C;margin-top:.4rem">✅ Clé configurée — Luna est en mode intelligent !</div>`:`<div style="font-size:.75rem;color:var(--ts);margin-top:.4rem">Sans clé : Luna locale · Avec clé : Luna niveau Claude ✨</div>`}
</div>

<!-- Données -->
<div class="st">Mes données</div>
<div class="card">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem">
    ${stats.map(([k,v]) => `
    <div class="setting-stat">
      <div class="setting-stat-val">${v}</div>
      <div class="setting-stat-lbl">${k}</div>
    </div>`).join('')}
  </div>
  <button class="btn btn-ghost btn-full btn-sm" onclick="exportData()">
    💾 Exporter toutes mes données (JSON)
  </button>
  <div class="setting-sep"></div>
  <button class="btn btn-ghost btn-full btn-sm" onclick="importDataPrompt()">
    📥 Restaurer depuis un fichier JSON
    <input type="file" id="import-json-in" accept=".json" style="display:none" onchange="importData(this)">
  </button>
  <div class="setting-sep"></div>
  <button class="btn btn-danger btn-full btn-sm" onclick="resetAll()">
    🗑️ Tout effacer et recommencer
  </button>
</div>

<!-- Compte -->
<div class="st">Compte</div>
<div class="card">
  ${auth.currentUser?.providerData?.some(p => p.providerId === 'password') ? `
  <button class="btn btn-ghost btn-full" onclick="openChangePasswordModal()" style="font-size:.9rem;padding:.8rem;margin-bottom:.6rem">
    🔑 Changer le mot de passe
  </button>
  <div class="setting-sep"></div>` : ''}
  <button class="btn btn-danger btn-full" onclick="signOutUser()" style="font-size:.9rem;padding:.8rem">
    🚪 Se déconnecter
  </button>
</div>

<!-- À propos -->
<div class="st">À propos</div>
<div class="card" style="text-align:center;padding:1.25rem">
  <div style="font-size:2rem;margin-bottom:.4rem">🌸</div>
  <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--p)">Planify</div>
  <div style="font-size:.8rem;color:var(--ts);margin-top:.2rem">Version 3.0</div>
</div>

</div>`;
}

// ── Helpers settings ───────────────────────────────────
function saveCfgField(key, val) {
  const cfg = LS.cfg();
  cfg[key] = val;
  LS.s('pl_cfg', cfg);
  if (key === 'name') {
    const el = document.querySelector('.welcome h1');
    if (el && val) el.textContent = `Bonjour ${val} ✨`;
  }
  if (key === 'fontSize') applyFontSize(val);
}

function applyFontSize(size) {
  const map = {normal:'16px', large:'18px', xlarge:'20px'};
  document.documentElement.style.fontSize = map[size] || '16px';
}

function toggleDarkMode(on) {
  saveCfgField('dark', on);
  document.body.classList.toggle('dark', on);
}

function toggleNotifs(on) {
  saveCfgField('notifs', on);
  if (on) {
    initNotifications().then(() => {
      showToast('🔔 Rappels activés ! Tu seras notifiée 💧');
    });
  } else {
    showToast('🔕 Rappels désactivés');
  }
}

function toggleCfgBool(key, val) {
  saveCfgField(key, val);
  showToast(val ? '🔔 Activé ✓' : '🔕 Désactivé');
}

async function requestNotifNow() {
  if (!('Notification' in window)) {
    showToast('❌ Ton navigateur ne supporte pas les notifications');
    return;
  }
  const p = await Notification.requestPermission();
  if (p === 'granted') {
    showToast('✅ Notifications autorisées ! 🎉');
    initNotifications();
  } else if (p === 'denied') {
    showToast('❌ Notifications refusées. Active-les dans les Réglages iOS.');
  } else {
    showToast('⚠️ Permission en attente');
  }
}

function saveCycleCfg(key, val) {
  if (!val || val < 1) return;
  const cfg = LS.cycleCfg();
  cfg[key] = val;
  LS.s('pl_cyclecfg', cfg);
  showToast('Paramètres cycle sauvegardés ✓');
}

function fetchICSFromSettings() {
  const url = document.getElementById('ics-url-in')?.value?.trim();
  if (!url) return;
  saveCfgField('icsUrl', url);
  const st = document.getElementById('ics-status');
  if (st) st.textContent = '⏳ Import en cours…';
  fetchICS(url)
    .then(n => {
      if (st) st.textContent = `✅ ${n} événement${n>1?'s':''} importé${n>1?'s':''}`;
    })
    .catch(e => {
      if (st) st.textContent = `❌ Erreur : ${e.message}. Utilise l'import par fichier.`;
    });
}

function importDataPrompt() {
  document.getElementById('import-json-in')?.click();
}

function exportData() {
  const data = {
    exported: new Date().toISOString(),
    subjects:  LS.subjects(),
    notes:     LS.notes(),
    events:    LS.events(),
    ics:       LS.ics(),
    moods:     LS.moods(),
    habits:    LS.habits(),
    habitLogs: LS.habitLogs(),
    cycleLog:  LS.cycleLog(),
    cycleCfg:  LS.cycleCfg(),
    lists:     LS.lists(),
    todos:     LS.todos(),
    grades:    LS.grades(),
    shopping:  LS.shopping(),
    cfg:       LS.cfg(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `planify-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Export téléchargé ✓');
}

function importData(input) {
  const f = input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!confirm('Cela remplacera toutes tes données actuelles. Continuer ?')) return;
      if (d.subjects)  LS.s('pl_subjects',  d.subjects);
      if (d.notes)     LS.s('pl_notes',     d.notes);
      if (d.events)    LS.s('pl_events',    d.events);
      if (d.ics)       LS.s('pl_ics',       d.ics);
      if (d.moods)     LS.s('pl_moods',     d.moods);
      if (d.habits)    LS.s('pl_habits',    d.habits);
      if (d.habitLogs) LS.s('pl_hlogs',     d.habitLogs);
      if (d.cycleLog)  LS.s('pl_cycle',     d.cycleLog);
      if (d.cycleCfg)  LS.s('pl_cyclecfg',  d.cycleCfg);
      if (d.lists)     LS.s('pl_lists',     d.lists);
      if (d.todos)     LS.s('pl_todos',     d.todos);
      if (d.grades)    LS.s('pl_grades',    d.grades);
      if (d.shopping)  LS.s('pl_shopping',  d.shopping);
      if (d.cfg)       LS.s('pl_cfg',       d.cfg);
      showToast('Données restaurées ✓');
      go('dashboard');
    } catch {
      showToast('❌ Fichier invalide');
    }
  };
  r.readAsText(f);
  input.value = '';
}

function resetAll() {
  if (!confirm('Effacer TOUTES les données ? Cette action est irréversible.')) return;
  if (!confirm('Es-tu certaine ? Toutes tes notes, tâches et données seront supprimées.')) return;
  ['pl_subjects','pl_notes','pl_events','pl_ics','pl_moods','pl_habits',
   'pl_hlogs','pl_cycle','pl_cyclecfg','pl_lists','pl_todos','pl_cfg',
   'pl_grades','pl_shopping'].forEach(k =>
    localStorage.removeItem(k));
  showToast('Données effacées');
  go('dashboard');
}
