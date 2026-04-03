// ═══════════════════════════════════════════════════════
//  Vue : Notes — Premium v2
// ═══════════════════════════════════════════════════════
let _savedRange = null; // Sauvegarde curseur avant ouverture modale tableau

function viewNotes() {
  const subs  = LS.subjects();
  const notes = LS.notes();

  // Notes récentes (4 dernières toutes matières confondues)
  const recent = [...notes]
    .sort((a,b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);

  const recentHTML = recent.length === 0 ? '' : `
<div class="st">Récemment modifiées</div>
<div class="recent-notes-strip">
  ${recent.map(n => {
    const sub     = subs.find(s => s.id === n.subjectId);
    const preview = stripHtml(n.content||'').slice(0, 55);
    const dot     = sub?.color.dot || 'var(--p)';
    return `
<div class="recent-note-card" onclick="go('editor',{nid:'${n.id}',sid:'${n.subjectId}'})"
     style="--rnc:${dot}">
  <div class="rnc-tag">${sub ? sub.emoji + ' ' + esc(sub.name) : '📝 Note'}</div>
  <div class="rnc-title">${esc(n.title) || '<em>Sans titre</em>'}</div>
  <div class="rnc-preview">${esc(preview) || '…'}</div>
  <div class="rnc-date">${dmy(new Date(n.updatedAt).toISOString().slice(0,10))}</div>
</div>`;
  }).join('')}
</div>`;

  const subsHTML = subs.length === 0
    ? `<div class="empty">
        <div class="empty-i">📂</div>
        <p>Crée ton premier sujet<br>pour organiser tes notes</p>
        <button class="btn" onclick="openSubjectModal()">+ Nouveau sujet</button>
       </div>`
    : `<div class="sub-grid-v2">
        ${subs.map(s => {
          const cnt      = notes.filter(n => n.subjectId === s.id).length;
          const lastNote = notes
            .filter(n => n.subjectId === s.id)
            .sort((a,b) => b.updatedAt - a.updatedAt)[0];
          const preview  = lastNote
            ? (stripHtml(lastNote.content||'').slice(0,45) || lastNote.title || '…')
            : null;
          return `
<div class="sub-card-v2" onclick="go('subject',{sid:'${s.id}'})"
     style="--sdot:${s.color.dot};--sbg:${s.color.bg}">
  <div class="scv2-header">
    <span class="scv2-emoji">${s.emoji}</span>
    <span class="scv2-count">${cnt} note${cnt!==1?'s':''}</span>
  </div>
  <div class="scv2-name">${esc(s.name)}</div>
  ${preview
    ? `<div class="scv2-preview">${esc(preview)}</div>`
    : `<div class="scv2-preview scv2-empty">Aucune note</div>`}
</div>`;
        }).join('')}
        <div class="sub-card-v2 sub-add-v2" onclick="openSubjectModal()">
          <div class="scv2-add-ico">+</div>
          <div class="scv2-add-lbl">Nouveau sujet</div>
        </div>
       </div>`;

  return `
<div class="ph">
  <span class="ph-title">Notes</span>
  <button class="ph-action" onclick="openSubjectModal()">+</button>
</div>
<div class="pg">

  <!-- Barre de recherche -->
  <div class="notes-searchbar">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input type="search" placeholder="Rechercher dans mes notes…"
           oninput="searchNotesInline(this.value)" autocomplete="off">
  </div>

  <!-- Résultats de recherche (masqués par défaut) -->
  <div id="notes-search-results"></div>

  <!-- Contenu principal -->
  <div id="notes-main-content">
    ${recentHTML}
    <div class="st">Mes matières</div>
    ${subsHTML}
  </div>

</div>`;
}

// ── Recherche inline (sans rechargement de vue) ───────
function searchNotesInline(q) {
  const mainEl    = document.getElementById('notes-main-content');
  const resultsEl = document.getElementById('notes-search-results');
  if (!mainEl || !resultsEl) return;

  if (!q || q.length < 2) {
    mainEl.style.display   = '';
    resultsEl.innerHTML    = '';
    return;
  }

  mainEl.style.display = 'none';
  const notes = LS.notes();
  const subs  = LS.subjects();
  const ql    = q.toLowerCase();
  const hits  = notes.filter(n =>
    (n.title||'').toLowerCase().includes(ql) ||
    stripHtml(n.content||'').toLowerCase().includes(ql)
  ).slice(0, 12);

  if (hits.length === 0) {
    resultsEl.innerHTML = `
<div class="search-nores">
  <div style="font-size:1.5rem">🔍</div>
  <div>Aucun résultat pour <strong>${esc(q)}</strong></div>
</div>`;
    return;
  }

  resultsEl.innerHTML = `
<div class="st">${hits.length} résultat${hits.length>1?'s':''}</div>
<div class="note-grid-v2">
  ${hits.map(n => {
    const sub     = subs.find(s => s.id === n.subjectId);
    const preview = stripHtml(n.content||'').slice(0, 80);
    const dot     = sub?.color.dot || 'var(--p)';
    return `
<div class="note-card-v2" onclick="go('editor',{nid:'${n.id}',sid:'${n.subjectId}'})"
     style="--scolor:${dot}">
  ${sub ? `<div class="ncv2-tag" style="background:${sub.color.bg};color:${dot}">${sub.emoji} ${esc(sub.name)}</div>` : ''}
  <div class="ncv2-title">${esc(n.title)||'<em style="color:var(--ts)">Sans titre</em>'}</div>
  <div class="ncv2-preview">${esc(preview)||'…'}</div>
  <div class="ncv2-footer">
    <span class="ncv2-date">${dmy(new Date(n.updatedAt).toISOString().slice(0,10))}</span>
  </div>
</div>`;
  }).join('')}
</div>`;
}

// ── Vue : Sujet (liste de notes) ──────────────────────
function viewSubject() {
  const subs = LS.subjects();
  const s    = subs.find(x => x.id === _sid);
  if (!s) return viewNotes();

  const notes = LS.notes()
    .filter(n => n.subjectId === _sid)
    .sort((a,b) => b.updatedAt - a.updatedAt);

  const notesHTML = notes.length === 0
    ? `<div class="empty">
        <div class="empty-i">${s.emoji}</div>
        <p>Aucune note dans ce sujet</p>
        <button class="btn" onclick="newNote('${_sid}')">+ Nouvelle note</button>
       </div>`
    : `<div class="note-grid-v2">
        ${notes.map(n => {
          const preview = stripHtml(n.content||'').slice(0, 90);
          const dateStr = dmy(new Date(n.updatedAt).toISOString().slice(0,10));
          const tagHtml = (n.tags||[]).length > 0 ? `<div class="ncv2-tags">${(n.tags||[]).slice(0,3).map(t=>`<span class="ncv2-tag-chip">${esc(t)}</span>`).join('')}</div>` : '';
          return `
<div class="note-card-v2" onclick="go('editor',{nid:'${n.id}',sid:'${_sid}'})"
     style="--scolor:${s.color.dot}">
  <div class="ncv2-title">${esc(n.title)||'<em style="color:var(--ts)">Sans titre</em>'}</div>
  <div class="ncv2-preview">${esc(preview)||'…'}</div>
  ${tagHtml}
  <div class="ncv2-footer">
    <span class="ncv2-date">${dateStr}</span>
    <button class="ncv2-del" onclick="event.stopPropagation();delNote('${n.id}')">🗑️</button>
  </div>
</div>`;
        }).join('')}
       </div>`;

  return `
<div class="ph">
  <button class="ph-back" onclick="go('notes')">←</button>
  <span class="ph-title">${s.emoji} ${esc(s.name)}</span>
  <button class="ph-action" onclick="newNote('${_sid}')">+</button>
</div>
<div class="pg">

  <!-- Header du sujet -->
  <div class="subject-header-v2" style="--sdot:${s.color.dot};--sbg:${s.color.bg}">
    <div class="shv2-left">
      <div class="shv2-emoji">${s.emoji}</div>
      <div>
        <div class="shv2-name">${esc(s.name)}</div>
        <div class="shv2-count">${notes.length} note${notes.length!==1?'s':''}</div>
      </div>
    </div>
    <div class="shv2-actions">
      <button class="btn btn-ghost btn-sm" onclick="openSubjectModal('${_sid}')">✏️</button>
      <button class="btn btn-danger btn-sm" onclick="delSubject('${_sid}')">🗑️</button>
    </div>
  </div>

  <!-- Barre de recherche dans ce sujet -->
  <div class="notes-searchbar notes-searchbar-sub">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input type="search" placeholder="Rechercher dans ${esc(s.name)}…"
           oninput="searchSubjectInline(this.value,'${_sid}')" autocomplete="off">
  </div>
  <div id="subject-search-results"></div>
  <div id="subject-notes-content">${notesHTML}</div>

</div>`;
}

// ── Recherche dans un sujet ───────────────────────────
function searchSubjectInline(q, sid) {
  const mainEl    = document.getElementById('subject-notes-content');
  const resultsEl = document.getElementById('subject-search-results');
  if (!mainEl || !resultsEl) return;

  if (!q || q.length < 2) {
    mainEl.style.display = '';
    resultsEl.innerHTML  = '';
    return;
  }

  mainEl.style.display = 'none';
  const subs  = LS.subjects();
  const s     = subs.find(x => x.id === sid);
  const ql    = q.toLowerCase();
  const hits  = LS.notes()
    .filter(n => n.subjectId === sid)
    .filter(n =>
      (n.title||'').toLowerCase().includes(ql) ||
      stripHtml(n.content||'').toLowerCase().includes(ql)
    );

  if (hits.length === 0) {
    resultsEl.innerHTML = `<div class="search-nores"><div style="font-size:1.5rem">🔍</div><div>Aucun résultat</div></div>`;
    return;
  }

  const dot = s?.color.dot || 'var(--p)';
  resultsEl.innerHTML = `
<div class="note-grid-v2">
  ${hits.map(n => {
    const preview = stripHtml(n.content||'').slice(0, 90);
    return `
<div class="note-card-v2" onclick="go('editor',{nid:'${n.id}',sid:'${sid}'})"
     style="--scolor:${dot}">
  <div class="ncv2-title">${esc(n.title)||'<em style="color:var(--ts)">Sans titre</em>'}</div>
  <div class="ncv2-preview">${esc(preview)||'…'}</div>
  <div class="ncv2-footer">
    <span class="ncv2-date">${dmy(new Date(n.updatedAt).toISOString().slice(0,10))}</span>
    <button class="ncv2-del" onclick="event.stopPropagation();delNote('${n.id}')">🗑️</button>
  </div>
</div>`;
  }).join('')}
</div>`;
}

// ── Initialise l'éditeur plein écran ──────────────────
function buildEditor() {
  document.getElementById('nav').style.display = 'none';
  document.getElementById('fab').style.display = 'none';

  const notes = LS.notes();
  let note = notes.find(n => n.id === _nid);

  if (!note) {
    note = {id:uid(), subjectId:_sid, title:'', content:'', createdAt:Date.now(), updatedAt:Date.now()};
    _nid = note.id;
    LS.s('pl_notes', [...notes, note]);
  }

  const overlay   = document.getElementById('editor-overlay');
  const titleEl   = document.getElementById('e-title');
  const contentEl = document.getElementById('e-content');

  titleEl.value = note.title || '';
  contentEl.innerHTML = note.content || '';
  document.getElementById('ed-st').textContent = '';
  document.getElementById('ed-del').onclick = () => delNote(_nid, true);

  // Charger les tags
  _renderEditorTags(note.tags || []);

  overlay.classList.add('open');
  setTimeout(() => titleEl.focus(), 80);

  // Auto-save 900ms debounce
  let saveTimer = null;
  function save() {
    const ns  = LS.notes();
    const idx = ns.findIndex(n => n.id === _nid);
    if (idx < 0) return;
    ns[idx].title     = titleEl.value;
    ns[idx].content   = contentEl.innerHTML;
    ns[idx].tags      = _getEditorTags();
    ns[idx].updatedAt = Date.now();
    LS.s('pl_notes', ns);
    const st = document.getElementById('ed-st');
    st.textContent = '✓ Sauvegardé'; st.style.color = 'var(--p)';
    setTimeout(() => { st.textContent = ''; st.style.color = ''; }, 2000);
  }
  function onInput() {
    const st = document.getElementById('ed-st');
    st.textContent = '…'; st.style.color = 'var(--ts)';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 900);
  }
  titleEl.oninput = onInput;
  contentEl.addEventListener('input', onInput);
  document.addEventListener('selectionchange', updateToolbarState);
}

function updateToolbarState() {
  if (!document.getElementById('editor-overlay')?.classList.contains('open')) return;
  ['bold','italic','underline'].forEach(cmd => {
    const btn = document.querySelector(`.tb-btn[onclick="fmt('${cmd}')"]`);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}

// ── Rich text formatting ──────────────────────────────
function fmt(cmd) {
  document.getElementById('e-content').focus();
  document.execCommand(cmd, false, null);
  updateToolbarState();
  triggerEditorInput();
}

function fmtBlock(tag) {
  const el = document.getElementById('e-content');
  el.focus();
  if (tag === 'ul' || tag === 'ol') {
    document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false, null);
  } else if (tag === 'blockquote') {
    document.execCommand('formatBlock', false, 'blockquote');
  } else {
    document.execCommand('formatBlock', false, tag);
  }
  triggerEditorInput();
}

function insertTable() {
  // ── Sauvegarder la position du curseur avant d'ouvrir la modale ──
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    _savedRange = sel.getRangeAt(0).cloneRange();
  }

  openModal(`
<div class="modal-body">
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">Colonnes</label>
      <input class="form-input" id="tbl-cols" type="number" min="1" max="10" value="3" style="width:70px">
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">Lignes</label>
      <input class="form-input" id="tbl-rows" type="number" min="1" max="20" value="3" style="width:70px">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">🎨 Fond en-tête</label>
      <input class="form-input" id="tbl-hbg" type="color" value="#C4778E" style="padding:.2rem;height:38px;width:100%">
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">🔤 Texte en-tête</label>
      <input class="form-input" id="tbl-htxt" type="color" value="#ffffff" style="padding:.2rem;height:38px;width:100%">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">🎨 Fond cellules</label>
      <input class="form-input" id="tbl-cbg" type="color" value="#ffffff" style="padding:.2rem;height:38px;width:100%">
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">🔤 Texte cellules</label>
      <input class="form-input" id="tbl-ctxt" type="color" value="#1C0F1A" style="padding:.2rem;height:38px;width:100%">
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Taille du texte</label>
    <select class="setting-select" id="tbl-fsize" style="width:100%">
      <option value="12px">Petit (12px)</option>
      <option value="14px" selected>Normal (14px)</option>
      <option value="16px">Grand (16px)</option>
      <option value="18px">Très grand (18px)</option>
    </select>
  </div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="doInsertTable()">Insérer le tableau</button>
  </div>
</div>`, '⊞ Insérer un tableau');
}

function doInsertTable() {
  const rows  = Math.max(1, Math.min(20, parseInt(document.getElementById('tbl-rows')?.value)||3));
  const cols  = Math.max(1, Math.min(10, parseInt(document.getElementById('tbl-cols')?.value)||3));
  const hBg   = document.getElementById('tbl-hbg')?.value   || '#C4778E';
  const hTxt  = document.getElementById('tbl-htxt')?.value  || '#ffffff';
  const cBg   = document.getElementById('tbl-cbg')?.value   || '#ffffff';
  const cTxt  = document.getElementById('tbl-ctxt')?.value  || '#1C0F1A';
  const fsize = document.getElementById('tbl-fsize')?.value || '14px';

  // Styles inline complets — aucun override CSS possible
  const thStyle = `border:2px solid #bbb;padding:8px 12px;min-width:80px;font-size:${fsize};background-color:${hBg};color:${hTxt};font-weight:700;text-align:left;`;
  const tdStyle = `border:1.5px solid #ddd;padding:7px 12px;min-width:80px;font-size:${fsize};background-color:${cBg};color:${cTxt};`;

  let html = `<br><table style="border-collapse:collapse;width:100%;margin:8px 0;table-layout:fixed"><tbody>`;
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      html += r === 0
        ? `<th style="${thStyle}">En-tête</th>`
        : `<td style="${tdStyle}">Cellule</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table><br>';

  // Capturer le html AVANT de fermer la modale
  const tableHtml = html;
  _savedRange = null; // on n'utilise plus le range — trop instable
  closeModal();

  // Insérer après fermeture de la modale
  setTimeout(() => {
    const el = document.getElementById('e-content');
    if (!el) return;

    // Méthode directe et fiable : append dans innerHTML
    el.innerHTML += tableHtml;

    // Remettre le curseur à la fin
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    triggerEditorInput();
    el.scrollTop = el.scrollHeight;
  }, 200);
}

function insertImage() {
  document.getElementById('img-file-in').click();
}

function handleImageFile(input) {
  const f = input.files[0];
  if (!f) return;
  if (f.size > 3 * 1024 * 1024) { showToast('Image trop lourde (max 3 Mo)'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const html = `<img src="${e.target.result}" class="note-img" alt="image">`;
    document.getElementById('e-content').focus();
    document.execCommand('insertHTML', false, html);
    triggerEditorInput();
  };
  reader.readAsDataURL(f);
  input.value = '';
}

function triggerEditorInput() {
  document.getElementById('e-content').dispatchEvent(new Event('input'));
}

function exitEditor() {
  const ns  = LS.notes();
  const idx = ns.findIndex(n => n.id === _nid);
  if (idx >= 0) {
    ns[idx].title     = document.getElementById('e-title').value;
    ns[idx].content   = document.getElementById('e-content').innerHTML;
    ns[idx].tags      = _getEditorTags();
    ns[idx].updatedAt = Date.now();
    LS.s('pl_notes', ns);
  }
  document.removeEventListener('selectionchange', updateToolbarState);
  document.getElementById('editor-overlay').classList.remove('open');
  document.getElementById('nav').style.display = '';
  document.getElementById('fab').style.display = '';
  go('subject', {sid: _sid});
}

function newNote(sid) {
  _sid = sid; _nid = null;
  go('editor', {sid});
}

function delNote(id, fromEditor = false) {
  if (!confirm('Supprimer cette note ?')) return;
  LS.s('pl_notes', LS.notes().filter(n => n.id !== id));
  if (fromEditor) exitEditor();
  else go('subject', {sid: _sid});
}

function delSubject(id) {
  if (!confirm('Supprimer ce sujet et toutes ses notes ?')) return;
  LS.s('pl_subjects', LS.subjects().filter(s => s.id !== id));
  LS.s('pl_notes',    LS.notes().filter(n => n.subjectId !== id));
  go('notes');
}

// ═══════════════════════════════════════════════════════
//  Tags / Étiquettes
// ═══════════════════════════════════════════════════════
let _editorTags = [];

function _renderEditorTags(tags) {
  _editorTags = Array.isArray(tags) ? [...tags] : [];
  const listEl = document.getElementById('ed-tags-list');
  if (!listEl) return;
  listEl.innerHTML = _editorTags.map((t, i) => `
<span class="ed-tag-chip">
  ${esc(t)}
  <button onclick="removeEditorTag(${i})" class="ed-tag-del">×</button>
</span>`).join('');
}

function removeEditorTag(i) {
  _editorTags.splice(i, 1);
  _renderEditorTags(_editorTags);
  triggerEditorInput();
}

function handleTagInput(e) {
  const inp = e.target;
  if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
    e.preventDefault();
    const raw = inp.value.trim().replace(/^#/, '');
    if (raw.length > 0 && !_editorTags.includes('#'+raw)) {
      _editorTags.push('#'+raw);
      _renderEditorTags(_editorTags);
      triggerEditorInput();
    }
    inp.value = '';
  } else if (e.key === 'Backspace' && inp.value === '' && _editorTags.length > 0) {
    _editorTags.pop();
    _renderEditorTags(_editorTags);
    triggerEditorInput();
  }
}

function _getEditorTags() {
  // Flush input en cours
  const inp = document.getElementById('ed-tags-input');
  if (inp && inp.value.trim()) {
    const raw = inp.value.trim().replace(/^#/, '');
    if (raw && !_editorTags.includes('#'+raw)) _editorTags.push('#'+raw);
    inp.value = '';
  }
  return [..._editorTags];
}

// ═══════════════════════════════════════════════════════
//  Surlignage texte
// ═══════════════════════════════════════════════════════
function applyHighlight(color) {
  document.getElementById('e-content').focus();
  document.execCommand('hiliteColor', false, color);
  triggerEditorInput();
}

// ═══════════════════════════════════════════════════════
//  Export PDF (window.print)
// ═══════════════════════════════════════════════════════
function exportNotePDF() {
  const ns  = LS.notes();
  const note = ns.find(n => n.id === _nid);
  const title = document.getElementById('e-title')?.value || note?.title || 'Note';
  const content = document.getElementById('e-content')?.innerHTML || note?.content || '';
  const subs = LS.subjects();
  const sub  = subs.find(s => s.id === (note?.subjectId || _sid));
  const tags = (_editorTags || []).join(' ');

  const printWin = window.open('', '_blank');
  if (!printWin) { showToast('⚠️ Active les pop-ups pour exporter en PDF'); return; }

  printWin.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: #1C0F1A; padding: 2.5cm 2cm; max-width: 800px; margin: 0 auto; }
  .pdf-header { border-bottom: 2px solid #C4778E; margin-bottom: 1.5rem; padding-bottom: .75rem; }
  .pdf-app { font-size: .75rem; color: #B09AAB; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
  .pdf-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; color: #1C0F1A; margin: .25rem 0; }
  .pdf-meta { font-size: .78rem; color: #6B4D5E; margin-top: .3rem; }
  .pdf-tags { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .4rem; }
  .pdf-tag { background: #FAF0F3; color: #C4778E; border: 1px solid #C4778E40; border-radius: 99px; padding: .15rem .55rem; font-size: .72rem; font-weight: 600; }
  .pdf-content { margin-top: 1.5rem; }
  .pdf-content h2 { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: #8C3D58; margin: 1rem 0 .4rem; }
  .pdf-content p { margin-bottom: .5rem; }
  .pdf-content ul, .pdf-content ol { padding-left: 1.5rem; margin-bottom: .5rem; }
  .pdf-content table { border-collapse: collapse; width: 100%; margin: .75rem 0; }
  .pdf-content td, .pdf-content th { border: 1px solid #ddd; padding: 6px 10px; font-size: .85rem; }
  .pdf-content th { background: #C4778E; color: white; font-weight: 700; }
  .pdf-content blockquote { border-left: 3px solid #C4778E; padding-left: .75rem; color: #6B4D5E; font-style: italic; margin: .5rem 0; }
  .pdf-content img { max-width: 100%; border-radius: 6px; }
  .pdf-footer { margin-top: 2rem; padding-top: .75rem; border-top: 1px solid #eee; font-size: .72rem; color: #B09AAB; text-align: center; }
  @media print { body { padding: 1cm; } @page { margin: 1.5cm; } }
</style>
</head>
<body>
<div class="pdf-header">
  <div class="pdf-app">🌸 Planify${sub?' · '+sub.emoji+' '+sub.name:''}</div>
  <div class="pdf-title">${esc(title)}</div>
  <div class="pdf-meta">📅 ${new Date().toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
  ${tags?`<div class="pdf-tags">${_editorTags.map(t=>`<span class="pdf-tag">${esc(t)}</span>`).join('')}</div>`:''}
</div>
<div class="pdf-content">${content}</div>
<div class="pdf-footer">Généré par Planify · ${new Date().toLocaleDateString('fr-FR')}</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);
  printWin.document.close();
  showToast('📄 PDF en cours de génération…');
}
