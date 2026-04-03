// ═══════════════════════════════════════════════════════
//  Vue : Tâches (Listes + Todos)
// ═══════════════════════════════════════════════════════
let _showDone = false; // toggle affichage tâches faites

function viewTasks() {
  const lists = LS.lists();
  const todos = LS.todos();

  const shopCount = LS.shopping().filter(i => !i.checked).length;

  return `
<div class="ph">
  <span class="ph-title">Tâches</span>
  <button class="ph-action" onclick="openListModal()" aria-label="Nouvelle liste">+</button>
</div>
<div class="pg">

<!-- Liste de courses rapide -->
<button class="shop-link-btn" onclick="go('shopping')">
  <span class="shop-link-btn-ico">🛒</span>
  <div class="shop-link-btn-txt">
    <div class="shop-link-btn-title">Liste de courses</div>
    <div class="shop-link-btn-sub">${shopCount > 0 ? `${shopCount} article${shopCount>1?'s':''} à acheter` : 'Aucun article en attente'}</div>
  </div>
  <span class="shop-link-btn-arr">›</span>
</button>

${lists.length === 0
  ? `<div class="empty">
      <div class="empty-i">✅</div>
      <p>Crée ta première liste<br>pour organiser tes tâches</p>
      <button class="btn" onclick="openListModal()">+ Nouvelle liste</button>
    </div>`
  : `<div class="sub-grid">
      ${lists.map(l => {
        const cnt    = todos.filter(t => t.listId === l.id && !t.done).length;
        const total  = todos.filter(t => t.listId === l.id).length;
        return `
        <div class="sub-card" style="background:${l.color.bg};border-color:${l.color.dot}25"
          onclick="go('list',{lid:'${l.id}'})">
          <div class="sub-ico">${l.emoji}</div>
          <div class="sub-name" style="color:${l.color.dot}">${esc(l.name)}</div>
          <div class="sub-cnt" style="color:${l.color.dot}">${cnt} / ${total}</div>
        </div>`;
      }).join('')}
      <div class="sub-card sub-add" onclick="openListModal()">
        <div style="font-size:1.5rem">+</div>Nouvelle liste
      </div>
    </div>`
}

<!-- Tâches sans liste -->
${(() => {
  const loose = todos.filter(t => !t.listId);
  const pending = loose.filter(t => !t.done);
  if (!loose.length) return '';
  return `
<div class="st" style="margin-top:1.25rem">Sans liste</div>
<div class="card">
  ${renderTodoItems(loose, null)}
</div>`;
})()}

</div>`;
}

// ── Vue : Détail d'une liste ───────────────────────────
function viewList() {
  const lists = LS.lists();
  const l = lists.find(x => x.id === _lid);
  if (!l) return viewTasks();

  const todos = LS.todos().filter(t => t.listId === _lid);
  const pending = todos.filter(t => !t.done);
  const done    = todos.filter(t => t.done);
  const pct = todos.length ? Math.round(done.length / todos.length * 100) : 0;

  return `
<div class="ph">
  <button class="ph-back" onclick="go('tasks')">←</button>
  <span class="ph-title">${l.emoji} ${esc(l.name)}</span>
  <button class="ph-action" onclick="openTaskModal('${_lid}')" aria-label="Nouvelle tâche">+</button>
</div>
<div class="pg">

<!-- Barre de progression -->
${todos.length ? `
<div class="habit-prog" style="margin-bottom:1rem">
  <span style="font-size:1rem">${l.emoji}</span>
  <div class="habit-prog-bar"><div class="habit-prog-fill" style="width:${pct}%;background:${l.color.dot}"></div></div>
  <span class="habit-prog-txt">${done.length}/${todos.length} · ${pct}%</span>
</div>` : ''}

<!-- Ajout rapide -->
<div class="quick-add-row">
  <input id="quick-task-in" class="quick-add-input" type="text" placeholder="Ajouter une tâche…"
    onkeydown="if(event.key==='Enter')quickAddTask('${_lid}')">
  <button class="btn btn-sm" style="background:${l.color.dot}" onclick="quickAddTask('${_lid}')">+</button>
</div>

<!-- Tâches en cours -->
${pending.length === 0 && done.length === 0
  ? `<div class="empty" style="padding:2rem 0">
      <div class="empty-i">${l.emoji}</div>
      <p>Aucune tâche pour l'instant</p>
    </div>`
  : `<div class="card">${renderTodoItems(pending, l)}</div>`
}

<!-- Tâches terminées (collapsible) -->
${done.length ? `
<button class="btn btn-ghost btn-sm btn-full mt" onclick="_showDone=!_showDone;go('list',{lid:'${_lid}'})">
  ${_showDone ? '▾' : '▸'} ${done.length} terminée${done.length>1?'s':''}
</button>
${_showDone ? `<div class="card" style="opacity:.65;margin-top:.4rem">${renderTodoItems(done, l)}</div>` : ''}
` : ''}

<!-- Actions liste -->
<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.75rem">
  <button class="btn btn-ghost btn-sm" onclick="openListModal('${_lid}')">✏️ Modifier</button>
  <button class="btn btn-ghost btn-sm" onclick="clearDoneTasks('${_lid}')">🗑️ Effacer terminées</button>
  <button class="btn btn-danger btn-sm" onclick="delList('${_lid}')">🗑️ Supprimer la liste</button>
</div>

</div>`;
}

// ── Rendu items ────────────────────────────────────────
function renderTodoItems(items, list) {
  if (!items.length) return '';
  return items.map(t => {
    const dotColor = list ? list.color.dot : 'var(--p)';
    return `
    <div class="todo-row${t.done?' done':''}">
      <div class="todo-check${t.done?' checked':''}"
        style="${t.done?`background:${dotColor};border-color:${dotColor}`:''}"
        onclick="toggleTodo('${t.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="todo-body" onclick="openTaskModal('${t.listId||''}','${t.id}')">
        <div class="todo-title">${esc(t.text)}</div>
        ${t.due  ? `<div class="todo-meta">📅 ${dmy(t.due)}</div>` : ''}
        ${t.note ? `<div class="todo-meta">📝 ${esc(t.note.slice(0,60))}</div>` : ''}
        ${t.priority === 'high' ? `<div class="todo-meta" style="color:#E53E5A">🔴 Priorité haute</div>` : ''}
      </div>
      <button class="todo-del" onclick="delTodo('${t.id}')">×</button>
    </div>`;
  }).join('');
}

// ── Actions ────────────────────────────────────────────
function quickAddTask(listId) {
  const inp = document.getElementById('quick-task-in');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  const todos = LS.todos();
  todos.push({id:uid(), listId, text, done:false, createdAt:Date.now(), due:null, note:'', priority:'normal'});
  LS.s('pl_todos', todos);
  inp.value = '';
  go('list', {lid: listId});
}

function toggleTodo(id) {
  const todos = LS.todos();
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  LS.s('pl_todos', todos);
  if (_lid) go('list', {lid: _lid});
  else go('tasks');
}

function delTodo(id) {
  LS.s('pl_todos', LS.todos().filter(t => t.id !== id));
  if (_lid) go('list', {lid: _lid});
  else go('tasks');
}

function clearDoneTasks(listId) {
  if (!confirm('Effacer toutes les tâches terminées ?')) return;
  LS.s('pl_todos', LS.todos().filter(t => !(t.listId === listId && t.done)));
  go('list', {lid: listId});
}

function delList(id) {
  if (!confirm('Supprimer cette liste et toutes ses tâches ?')) return;
  LS.s('pl_lists', LS.lists().filter(l => l.id !== id));
  LS.s('pl_todos',  LS.todos().filter(t => t.listId !== id));
  go('tasks');
}
