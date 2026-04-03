// ═══════════════════════════════════════════════════════
//  Vue : Moyennes — S1 / S2
// ═══════════════════════════════════════════════════════
let _gradeTab = 's1';
let _collapsedModules = new Set(); // Modules avec sous-épreuves masquées

function viewGrades() {
  return `
<div class="ph">
  <span class="ph-title">Moyennes</span>
  <div style="display:flex;gap:.4rem">
    <button class="ph-action ph-action-sm" onclick="openGradeSimModal()" title="Simuler une note" style="font-size:.75rem;padding:.3rem .6rem">🔢</button>
    <button class="ph-action ph-action-sm" onclick="exportGradesCSV()" title="Exporter CSV" style="font-size:.75rem;padding:.3rem .6rem">📥</button>
    <button class="ph-action" onclick="openModuleModal()" aria-label="Nouveau module">+</button>
  </div>
</div>
<div class="well-tabs">
  <button class="well-tab${_gradeTab==='s1'?' active':''}" onclick="switchGradeTab('s1')">📘 Semestre 1</button>
  <button class="well-tab${_gradeTab==='s2'?' active':''}" onclick="switchGradeTab('s2')">📗 Semestre 2</button>
</div>
<div id="grades-content" class="pg">
  ${renderGradesSemester(_gradeTab)}
</div>`;
}

function switchGradeTab(tab) {
  _gradeTab = tab;
  const el = document.getElementById('grades-content');
  if (!el) { go('grades'); return; }
  el.innerHTML = renderGradesSemester(tab);
  document.querySelectorAll('.well-tab').forEach(b =>
    b.classList.toggle('active', b.textContent.includes(tab === 's1' ? 'Semestre 1' : 'Semestre 2'))
  );
}

function renderGradesSemester(sem) {
  const data    = LS.grades();
  const modules = (data[sem] || []);

  // Calcul de la moyenne générale du semestre
  let totalCoef = 0, totalPoints = 0, hasAll = modules.length > 0;
  modules.forEach(m => {
    const avg = moduleAverage(m);
    if (avg === null) { hasAll = false; return; }
    totalCoef   += (m.coef || 1);
    totalPoints += avg * (m.coef || 1);
  });
  const semAvg = (hasAll && totalCoef > 0) ? (totalPoints / totalCoef) : null;

  if (modules.length === 0) {
    return `
<div class="empty" style="padding:2.5rem 0">
  <div class="empty-i">📊</div>
  <p>Aucun module pour ce semestre.<br>Ajoute tes matières avec leurs coefficients.</p>
  <button class="btn" onclick="openModuleModal()">+ Ajouter un module</button>
</div>`;
  }

  return `
<!-- Moyenne générale du semestre -->
${semAvg !== null ? `
<div class="grade-avg-banner">
  <div class="gab-label">Moyenne ${sem === 's1' ? 'S1' : 'S2'}</div>
  <div class="gab-score ${semAvg >= 10 ? 'gab-ok' : 'gab-ko'}">${semAvg.toFixed(2)} / 20</div>
  <div class="gab-mention">${gradeMention(semAvg)}</div>
</div>` : `
<div class="grade-avg-banner gab-incomplete">
  <div class="gab-label">Moyenne ${sem === 's1' ? 'S1' : 'S2'}</div>
  <div class="gab-score">— / 20</div>
  <div class="gab-mention">Notes incomplètes</div>
</div>`}

<!-- Liste des modules -->
${modules.map(m => {
  const avg = moduleAverage(m);
  const pct = avg !== null ? Math.round(avg / 20 * 100) : 0;
  const hasSubs = m.submodules && m.submodules.length > 0;
  const isCollapsed = _collapsedModules.has(m.id);
  return `
<div class="grade-module-card">
  <div class="gmc-header" onclick="toggleModuleExpand('${m.id}')">
    <div class="gmc-left">
      <div class="gmc-name">${esc(m.name)}</div>
      <div class="gmc-coef">Coef ${m.coef || 1}${hasSubs ? ` · ${m.submodules.length} épreuve${m.submodules.length>1?'s':''}` : ''}</div>
    </div>
    <div class="gmc-right">
      ${avg !== null
        ? `<div class="gmc-score ${avg >= 10 ? 'score-ok' : 'score-ko'}">${avg.toFixed(2)}</div>`
        : `<div class="gmc-score score-none">–</div>`}
      ${hasSubs ? `<span class="gmc-arrow">${isCollapsed ? '▸' : '▾'}</span>` : ''}
      <button class="gmc-edit" onclick="event.stopPropagation();openModuleModal('${m.id}','${sem}')">✏️</button>
    </div>
  </div>

  ${avg !== null ? `
  <div class="gmc-progbar">
    <div class="gmc-progfill ${avg >= 10 ? '' : 'gmc-progfill-bad'}" style="width:${pct}%"></div>
  </div>` : ''}

  <!-- Sous-modules (masquables) -->
  <div class="gmc-subs${isCollapsed ? ' gmc-subs-collapsed' : ''}" id="subs-${m.id}">
    ${hasSubs ? `
    <div class="gmc-sub-list">
      ${m.submodules.map(s => `
      <div class="gmc-sub-row">
        <div class="gmc-sub-info">
          <span class="gmc-sub-name">${esc(s.name)}</span>
          <span class="gmc-sub-weight">${Math.round((s.weight||0)*100)}%</span>
        </div>
        <div class="gmc-sub-grade">
          <input class="grade-input" type="number" min="0" max="20" step="0.25"
            value="${s.grade !== null && s.grade !== undefined ? s.grade : ''}"
            placeholder="–"
            oninput="saveSubGrade('${sem}','${m.id}','${s.id}',this.value)"
            onclick="event.stopPropagation()">
          <span class="gmc-sub-unit">/ 20</span>
        </div>
        <button class="gmc-sub-del" onclick="event.stopPropagation();delSubmodule('${sem}','${m.id}','${s.id}')">×</button>
      </div>`).join('')}
    </div>
    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openSubmoduleModal('${sem}','${m.id}')">
      + Sous-épreuve
    </button>` : `
    ${m.grade !== undefined && m.grade !== null
      ? `<div class="gmc-direct-grade">
          <span>Note directe :</span>
          <input class="grade-input grade-input-lg" type="number" min="0" max="20" step="0.25"
            value="${m.grade}"
            oninput="saveModuleGrade('${sem}','${m.id}',this.value)"
            onclick="event.stopPropagation()">
          <span>/ 20</span>
         </div>`
      : `<div class="gmc-no-subs">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openSubmoduleModal('${sem}','${m.id}')">
            + Ajouter des sous-épreuves (TP, Examen…)
          </button>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openDirectGradeModal('${sem}','${m.id}')">
            ✏️ Entrer note directement
          </button>
         </div>`}
    `}
  </div>
</div>`;
}).join('')}

<button class="btn btn-ghost btn-full mt" onclick="openModuleModal(null,'${sem}')">+ Ajouter un module</button>

${_renderGradeEvolution(modules, sem)}

<div class="grades-actions-row">
  <button class="btn btn-ghost btn-sm" onclick="openGradeSimModal('${sem}')">🔢 Simuler une note</button>
  <button class="btn btn-ghost btn-sm" onclick="exportGradesCSV('${sem}')">📥 Exporter CSV</button>
</div>
`;
}

// ── Calculs ────────────────────────────────────────────
function moduleAverage(m) {
  if (m.submodules && m.submodules.length > 0) {
    let total = 0, totalW = 0;
    for (const s of m.submodules) {
      if (s.grade === null || s.grade === undefined || s.grade === '') return null;
      total  += parseFloat(s.grade) * (s.weight || 0);
      totalW += (s.weight || 0);
    }
    if (totalW <= 0) return null;
    return total / totalW;
  }
  if (m.grade !== null && m.grade !== undefined && m.grade !== '') {
    return parseFloat(m.grade);
  }
  return null;
}

function gradeMention(avg) {
  if (avg >= 16) return '🏆 Très Bien';
  if (avg >= 14) return '⭐ Bien';
  if (avg >= 12) return '✨ Assez Bien';
  if (avg >= 10) return '✅ Passable';
  return '❌ Insuffisant';
}

function toggleModuleExpand(id) {
  const el = document.getElementById(`subs-${id}`);
  if (!el) return;
  if (_collapsedModules.has(id)) {
    _collapsedModules.delete(id);
    el.classList.remove('gmc-subs-collapsed');
  } else {
    _collapsedModules.add(id);
    el.classList.add('gmc-subs-collapsed');
  }
  // Mettre à jour la flèche sans re-render
  const arrow = el.closest('.grade-module-card')?.querySelector('.gmc-arrow');
  if (arrow) arrow.textContent = _collapsedModules.has(id) ? '▸' : '▾';
}

// ── Sauvegarde notes ───────────────────────────────────
function saveSubGrade(sem, modId, subId, val) {
  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;
  const sub = (mod.submodules || []).find(s => s.id === subId);
  if (!sub) return;
  sub.grade = val === '' ? null : Math.min(20, Math.max(0, parseFloat(val)));
  LS.s('pl_grades', data);
  // Mise à jour live de la moyenne
  _refreshGradeAvg(sem, modId);
}

function saveModuleGrade(sem, modId, val) {
  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;
  mod.grade = val === '' ? null : Math.min(20, Math.max(0, parseFloat(val)));
  LS.s('pl_grades', data);
  _refreshGradeAvg(sem, modId);
}

function _refreshGradeAvg(sem, modId) {
  const data = LS.grades();
  const modules = data[sem] || [];
  const mod = modules.find(m => m.id === modId);
  if (!mod) return;
  const avg = moduleAverage(mod);
  const scoreEl = document.querySelector(`#subs-${modId}`)?.closest('.grade-module-card')?.querySelector('.gmc-score');
  if (scoreEl) {
    if (avg !== null) {
      scoreEl.textContent = avg.toFixed(2);
      scoreEl.className = `gmc-score ${avg >= 10 ? 'score-ok' : 'score-ko'}`;
    } else {
      scoreEl.textContent = '–';
      scoreEl.className = 'gmc-score score-none';
    }
  }
  // Recalculate banner
  let totalCoef = 0, totalPoints = 0, hasAll = modules.length > 0;
  modules.forEach(m => {
    const a = moduleAverage(m);
    if (a === null) { hasAll = false; return; }
    totalCoef   += (m.coef || 1);
    totalPoints += a * (m.coef || 1);
  });
  const semAvg = (hasAll && totalCoef > 0) ? (totalPoints / totalCoef) : null;
  const banner = document.querySelector('.grade-avg-banner .gab-score');
  if (banner) {
    if (semAvg !== null) {
      banner.textContent = `${semAvg.toFixed(2)} / 20`;
      banner.className   = `gab-score ${semAvg >= 10 ? 'gab-ok' : 'gab-ko'}`;
      const ment = document.querySelector('.grade-avg-banner .gab-mention');
      if (ment) ment.textContent = gradeMention(semAvg);
    }
  }
}

// ── Suppression sous-module ────────────────────────────
function delSubmodule(sem, modId, subId) {
  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;
  mod.submodules = (mod.submodules || []).filter(s => s.id !== subId);
  LS.s('pl_grades', data);
  switchGradeTab(sem);
}

// ═══════════════════════════════════════════════════════
//  MODAL : Module
// ═══════════════════════════════════════════════════════
function openModuleModal(id, sem) {
  const s   = sem || _gradeTab;
  const data = LS.grades();
  const mod  = id ? (data[s] || []).find(m => m.id === id) : null;

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Nom du module</label>
    <input class="form-input" id="mod-name" type="text"
      value="${esc(mod?.name||'')}" placeholder="Ex: Physique, Maths…" maxlength="50">
  </div>
  <div class="form-group">
    <label class="form-label">Coefficient</label>
    <input class="form-input" id="mod-coef" type="number" min="0.5" max="20" step="0.5"
      value="${mod?.coef||1}" style="width:100px">
  </div>
  <div class="modal-actions">
    ${mod ? `<button class="btn btn-danger btn-sm" onclick="delModule('${s}','${id}')">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveModule('${s}','${id||''}')">Enregistrer</button>
  </div>
</div>`, mod ? 'Modifier le module' : 'Nouveau module');
}

function saveModule(sem, id) {
  const name = document.getElementById('mod-name')?.value?.trim();
  if (!name) { showToast('Entre un nom de module'); return; }
  const coef = parseFloat(document.getElementById('mod-coef')?.value) || 1;
  const data = LS.grades();
  if (!data[sem]) data[sem] = [];
  if (id) {
    const idx = data[sem].findIndex(m => m.id === id);
    if (idx >= 0) { data[sem][idx].name = name; data[sem][idx].coef = coef; }
  } else {
    data[sem].push({ id: uid(), name, coef, grade: null, submodules: [] });
  }
  LS.s('pl_grades', data);
  closeModal();
  switchGradeTab(sem);
}

function delModule(sem, id) {
  if (!confirm('Supprimer ce module et toutes ses notes ?')) return;
  const data = LS.grades();
  data[sem] = (data[sem] || []).filter(m => m.id !== id);
  LS.s('pl_grades', data);
  closeModal();
  switchGradeTab(sem);
}

// ═══════════════════════════════════════════════════════
//  MODAL : Sous-module (TP, Examen…)
// ═══════════════════════════════════════════════════════
function openSubmoduleModal(sem, modId) {
  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;

  // Calculer le total des poids existants
  const usedWeight = (mod.submodules || []).reduce((s, x) => s + (x.weight || 0), 0);
  const remaining  = Math.max(0, 1 - usedWeight);

  openModal(`
<div class="modal-body">
  <div style="font-size:.82rem;color:var(--ts);margin-bottom:.75rem;background:var(--pl);padding:.6rem;border-radius:var(--rs)">
    Module : <strong>${esc(mod.name)}</strong> · Poids restant : <strong>${Math.round(remaining * 100)}%</strong>
  </div>
  <div class="form-group">
    <label class="form-label">Nom de l'épreuve</label>
    <input class="form-input" id="sub-name-g" type="text"
      placeholder="Ex: TP noté, Examen, Projet…" maxlength="40">
  </div>
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">Poids (%)</label>
      <div style="display:flex;align-items:center;gap:.4rem">
        <input class="form-input" id="sub-weight-g" type="number" min="1" max="100" step="1"
          value="${Math.round(remaining * 100)}" style="width:75px">
        <span style="color:var(--ts);font-size:.85rem">%</span>
      </div>
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">Note (optionnel)</label>
      <div style="display:flex;align-items:center;gap:.4rem">
        <input class="form-input" id="sub-grade-g" type="number" min="0" max="20" step="0.25"
          placeholder="–" style="width:75px">
        <span style="color:var(--ts);font-size:.85rem">/ 20</span>
      </div>
    </div>
  </div>
  <div style="font-size:.75rem;color:var(--ts);margin-bottom:.5rem">
    Ex : TP 20% · Projet 30% · Examen 50% → total 100%
  </div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveSubmodule('${sem}','${modId}')">Ajouter</button>
  </div>
</div>`, 'Ajouter une épreuve');
}

function saveSubmodule(sem, modId) {
  const name   = document.getElementById('sub-name-g')?.value?.trim();
  const weightPct = parseInt(document.getElementById('sub-weight-g')?.value) || 0;
  if (!name) { showToast('Entre un nom d\'épreuve'); return; }
  if (weightPct <= 0 || weightPct > 100) { showToast('Poids entre 1 et 100%'); return; }

  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;
  if (!mod.submodules) mod.submodules = [];

  const usedW = mod.submodules.reduce((s, x) => s + (x.weight || 0), 0);
  const newW  = weightPct / 100;
  if (usedW + newW > 1.001) {
    showToast(`⚠️ Total dépasse 100% (${Math.round((usedW + newW) * 100)}%)`); return;
  }

  // Récupérer la note si saisie
  const gradeRaw = document.getElementById('sub-grade-g')?.value;
  const grade = (gradeRaw === '' || gradeRaw === undefined || gradeRaw === null)
    ? null
    : Math.min(20, Math.max(0, parseFloat(gradeRaw)));

  mod.submodules.push({ id: uid(), name, weight: newW, grade });
  // Supprimer note directe si sous-modules ajoutés
  mod.grade = null;
  LS.s('pl_grades', data);
  closeModal();
  switchGradeTab(sem);
}

// ═══════════════════════════════════════════════════════
//  MODAL : Note directe (sans sous-modules)
// ═══════════════════════════════════════════════════════
function openDirectGradeModal(sem, modId) {
  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Note de ${esc(mod.name)}</label>
    <div style="display:flex;align-items:center;gap:.5rem">
      <input class="form-input" id="direct-grade" type="number" min="0" max="20" step="0.25"
        value="${mod.grade !== null && mod.grade !== undefined ? mod.grade : ''}"
        placeholder="Ex: 14.5" style="width:110px">
      <span>/ 20</span>
    </div>
  </div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="_saveDirectGrade('${sem}','${modId}')">Enregistrer</button>
  </div>
</div>`, 'Note directe');
}

function _saveDirectGrade(sem, modId) {
  const val = document.getElementById('direct-grade')?.value;
  const data = LS.grades();
  const mod  = (data[sem] || []).find(m => m.id === modId);
  if (!mod) return;
  mod.grade = val === '' ? null : Math.min(20, Math.max(0, parseFloat(val)));
  LS.s('pl_grades', data);
  closeModal();
  switchGradeTab(sem);
}

// ═══════════════════════════════════════════════════════
//  Graphique d'évolution — barres CSS
// ═══════════════════════════════════════════════════════
function _renderGradeEvolution(modules, sem) {
  const withAvg = modules.map(m => {
    const a = moduleAverage(m);
    return { name: m.name, avg: a, coef: m.coef || 1 };
  }).filter(x => x.avg !== null);

  if (withAvg.length < 2) return '';

  const sorted = [...withAvg].sort((a,b) => b.avg - a.avg);
  const max = 20;

  const bars = sorted.map(x => {
    const pct = Math.round(x.avg / max * 100);
    const color = x.avg >= 16 ? 'var(--sage)' : x.avg >= 14 ? 'var(--gold)' : x.avg >= 10 ? 'var(--rose)' : 'var(--red)';
    const shortName = x.name.length > 12 ? x.name.slice(0,11)+'…' : x.name;
    return `
<div class="grade-evo-row">
  <div class="grade-evo-label" title="${esc(x.name)}">${esc(shortName)}</div>
  <div class="grade-evo-track">
    <div class="grade-evo-bar" style="width:${pct}%;background:${color}">
      <span class="grade-evo-val">${x.avg.toFixed(1)}</span>
    </div>
    <div class="grade-evo-line10"></div>
  </div>
  <div class="grade-evo-coef">×${x.coef}</div>
</div>`;
  }).join('');

  return `
<div class="st" style="margin-top:1.25rem">📊 Évolution des notes</div>
<div class="grade-evo-chart card">
  <div class="grade-evo-legend">
    <span class="grade-evo-leg-item" style="color:var(--sage)">● ≥16 TB</span>
    <span class="grade-evo-leg-item" style="color:var(--gold)">● ≥14 Bien</span>
    <span class="grade-evo-leg-item" style="color:var(--rose)">● ≥10 Pass.</span>
    <span class="grade-evo-leg-item" style="color:var(--red)">● &lt;10 Insuff.</span>
  </div>
  ${bars}
  <div class="grade-evo-axis">
    <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span>
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════
//  Simulation de note
// ═══════════════════════════════════════════════════════
function openGradeSimModal(sem) {
  const s = sem || _gradeTab;
  const data = LS.grades();
  const modules = (data[s] || []);
  if (!modules.length) { showToast('Ajoute des modules d\'abord !'); return; }

  const opts = modules.map(m => `<option value="${m.id}">${esc(m.name)} (coef ${m.coef||1})</option>`).join('');

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Semestre</label>
    <select class="setting-select" id="sim-sem" onchange="updateSimPreview()" style="width:100%">
      <option value="s1" ${s==='s1'?'selected':''}>Semestre 1</option>
      <option value="s2" ${s==='s2'?'selected':''}>Semestre 2</option>
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Module</label>
    <select class="setting-select" id="sim-mod" data-sem="${s}" onchange="updateSimPreview()" style="width:100%">
      ${opts}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Note hypothétique / 20</label>
    <div style="display:flex;align-items:center;gap:.5rem">
      <input class="form-input" id="sim-grade" type="number" min="0" max="20" step="0.25"
        placeholder="Ex: 14" style="width:100px" oninput="updateSimPreview()">
      <span style="color:var(--ts)">/ 20</span>
    </div>
  </div>
  <div id="sim-preview" class="sim-preview-box" style="display:none"></div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Fermer</button>
  </div>
</div>`, '🔢 Simuler une note');
}

function updateSimPreview() {
  const semEl = document.getElementById('sim-sem');
  const modEl = document.getElementById('sim-mod');
  const gradeEl = document.getElementById('sim-grade');
  const previewEl = document.getElementById('sim-preview');
  if (!semEl || !modEl || !gradeEl || !previewEl) return;

  const sem = semEl.value;
  const gradeVal = gradeEl.value;

  const data = LS.grades();
  const modules = (data[sem] || []);

  if (modEl.dataset.sem !== sem) {
    modEl.innerHTML = modules.map(m => `<option value="${m.id}">${esc(m.name)} (coef ${m.coef||1})</option>`).join('');
    modEl.dataset.sem = sem;
  }

  const modId = modEl.value;
  if (!gradeVal || !modId) { previewEl.style.display='none'; return; }
  const grade = Math.min(20, Math.max(0, parseFloat(gradeVal)));

  const simMods = modules.map(m => {
    if (m.id !== modId) return m;
    const simM = JSON.parse(JSON.stringify(m));
    if (simM.submodules && simM.submodules.length > 0) {
      const empty = simM.submodules.find(s => s.grade === null || s.grade === undefined || s.grade === '');
      if (empty) empty.grade = grade;
      else simM.submodules[simM.submodules.length-1].grade = grade;
    } else {
      simM.grade = grade;
    }
    return simM;
  });

  let tc=0,tp=0,hasAll=simMods.length>0;
  simMods.forEach(m => {
    const a = moduleAverage(m);
    if (a === null) { hasAll=false; return; }
    tc+=m.coef||1; tp+=a*(m.coef||1);
  });
  const newAvg = (hasAll && tc>0) ? tp/tc : null;
  const curMod = modules.find(m => m.id === modId);
  const curModAvg = curMod ? moduleAverage(curMod) : null;

  let currentSemAvg = null, hasCurAll = modules.length > 0, cTc=0, cTp=0;
  modules.forEach(m => {
    const a = moduleAverage(m);
    if (a===null){hasCurAll=false;return;}
    cTc+=m.coef||1; cTp+=a*(m.coef||1);
  });
  if (hasCurAll && cTc>0) currentSemAvg = cTp/cTc;

  previewEl.style.display='';
  previewEl.innerHTML = `
<div class="sim-row"><span>Note actuelle du module :</span> <strong>${curModAvg!==null?curModAvg.toFixed(2)+'/20':'–'}</strong></div>
<div class="sim-row"><span>Note simulée :</span> <strong>${grade}/20</strong></div>
${currentSemAvg!==null?`<div class="sim-row"><span>Moyenne ${sem.toUpperCase()} actuelle :</span> <strong>${currentSemAvg.toFixed(2)}/20</strong></div>`:''}
${newAvg!==null?`
<div class="sim-result ${newAvg>=10?'sim-ok':'sim-ko'}">
  <div class="sim-res-label">Nouvelle moyenne ${sem.toUpperCase()}</div>
  <div class="sim-res-val">${newAvg.toFixed(2)} / 20</div>
  <div class="sim-res-mention">${gradeMention(newAvg)}</div>
  ${currentSemAvg!==null?`<div class="sim-res-diff">${newAvg>currentSemAvg?'📈':'📉'} ${newAvg>currentSemAvg?'+':'-'}${Math.abs(newAvg-currentSemAvg).toFixed(2)} points</div>`:''}
</div>`:'<div class="sim-incomplete">⚠️ Des notes manquent pour calculer la moyenne globale</div>'}`;
}

// ═══════════════════════════════════════════════════════
//  Export CSV
// ═══════════════════════════════════════════════════════
function exportGradesCSV(sem) {
  const data = LS.grades();
  const sems = sem ? [sem] : ['s1','s2'];
  let csv = 'Semestre,Module,Coefficient,Épreuve,Poids (%),Note /20\n';

  sems.forEach(s => {
    const modules = data[s] || [];
    modules.forEach(m => {
      const avg = moduleAverage(m);
      if (m.submodules && m.submodules.length > 0) {
        m.submodules.forEach(sub => {
          csv += `${s.toUpperCase()},"${m.name}",${m.coef||1},"${sub.name}",${Math.round((sub.weight||0)*100)},${sub.grade!==null&&sub.grade!==undefined?sub.grade:''}\n`;
        });
        csv += `${s.toUpperCase()},"${m.name}",${m.coef||1},"=MOYENNE MODULE",,${avg!==null?avg.toFixed(2):''}\n`;
      } else {
        csv += `${s.toUpperCase()},"${m.name}",${m.coef||1},,100,${m.grade!==null&&m.grade!==undefined?m.grade:''}\n`;
      }
    });
    let tc=0,tp=0,hasAll=modules.length>0;
    modules.forEach(m2 => {
      const a = moduleAverage(m2);
      if(a===null){hasAll=false;return;}
      tc+=m2.coef||1; tp+=a*(m2.coef||1);
    });
    if (hasAll && tc>0) {
      csv += `${s.toUpperCase()},"=== MOYENNE GÉNÉRALE ===",,,,${(tp/tc).toFixed(2)}\n`;
    }
    csv += '\n';
  });

  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `planify-notes-${sem||'tous'}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('📥 Export CSV téléchargé ✓');
}
