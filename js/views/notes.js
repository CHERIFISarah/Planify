// ═══════════════════════════════════════════════════════
//  Vue : Notes — Premium v2
// ═══════════════════════════════════════════════════════
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
          return `
<div class="note-card-v2" onclick="go('editor',{nid:'${n.id}',sid:'${_sid}'})"
     style="--scolor:${s.color.dot}">
  <div class="ncv2-title">${esc(n.title)||'<em style="color:var(--ts)">Sans titre</em>'}</div>
  <div class="ncv2-preview">${esc(preview)||'…'}</div>
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
  const rows = 3, cols = 3;
  let html = '<table class="note-table"><tbody>';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      html += r===0 ? '<th contenteditable="true">En-tête</th>' : '<td contenteditable="true">Cellule</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table><p><br></p>';
  document.getElementById('e-content').focus();
  document.execCommand('insertHTML', false, html);
  triggerEditorInput();
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
