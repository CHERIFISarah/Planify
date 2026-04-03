// ═══════════════════════════════════════════════════════
//  Vue : Liste de courses 🛒
// ═══════════════════════════════════════════════════════
const SHOP_CATS = [
  {id:'fruits',    label:'🥦 Fruits & Légumes'},
  {id:'dairy',     label:'🥛 Produits laitiers'},
  {id:'meat',      label:'🥩 Viande & Poisson'},
  {id:'grocery',   label:'🥫 Épicerie'},
  {id:'drinks',    label:'🧃 Boissons'},
  {id:'hygiene',   label:'🧴 Hygiène & Beauté'},
  {id:'bakery',    label:'🥖 Boulangerie'},
  {id:'frozen',    label:'🧊 Surgelés'},
  {id:'other',     label:'📦 Autre'},
];

let _shopCatFilter = 'all';

function viewShopping() {
  const items   = LS.shopping();
  const pending = items.filter(i => !i.checked);
  const done    = items.filter(i => i.checked);
  const totalItems = items.length;
  const checkedCnt = done.length;
  const pct        = totalItems ? Math.round(checkedCnt / totalItems * 100) : 0;

  // Grouper par catégorie
  const cats = SHOP_CATS.filter(c => items.some(i => i.category === c.id || (!i.category && c.id === 'other')));

  return `
<div class="ph">
  <button class="ph-back" onclick="go('tasks')">←</button>
  <span class="ph-title">🛒 Liste de courses</span>
  <button class="ph-action" onclick="openShopItemModal()" aria-label="Ajouter">+</button>
</div>
<div class="pg">

<!-- Progression -->
${totalItems > 0 ? `
<div class="habit-prog" style="margin-bottom:.75rem">
  <span style="font-size:1rem">🛒</span>
  <div class="habit-prog-bar"><div class="habit-prog-fill" style="width:${pct}%"></div></div>
  <span class="habit-prog-txt">${checkedCnt}/${totalItems} · ${pct}%</span>
</div>` : ''}

<!-- Ajout rapide -->
<div class="quick-add-row">
  <input id="shop-quick-in" class="quick-add-input" type="text"
    placeholder="Ajouter un article…"
    onkeydown="if(event.key==='Enter')quickAddShopItem()">
  <button class="btn btn-sm" onclick="quickAddShopItem()">+</button>
</div>

${items.length === 0 ? `
<div class="empty" style="padding:2rem 0">
  <div class="empty-i">🛒</div>
  <p>Ta liste est vide !<br>Ajoute tes articles à acheter.</p>
  <button class="btn" onclick="openShopItemModal()">+ Ajouter un article</button>
</div>` : `

<!-- Items en attente par catégorie -->
${(() => {
  const pendingByCat = SHOP_CATS.map(c => ({
    ...c,
    items: pending.filter(i => (i.category || 'other') === c.id)
  })).filter(c => c.items.length > 0);

  // Items sans catégorie connue
  const unknownItems = pending.filter(i => !SHOP_CATS.find(c => c.id === i.category));

  let html = '';

  pendingByCat.forEach(c => {
    html += `
<div class="st">${c.label}</div>
<div class="card" style="margin-bottom:.5rem">
  ${c.items.map(item => renderShopItem(item)).join('')}
</div>`;
  });

  if (unknownItems.length) {
    html += `
<div class="st">📦 Autre</div>
<div class="card" style="margin-bottom:.5rem">
  ${unknownItems.map(item => renderShopItem(item)).join('')}
</div>`;
  }

  return html;
})()}

<!-- Items cochés -->
${done.length > 0 ? `
<button class="btn btn-ghost btn-sm btn-full mt"
  onclick="_shopShowDone=!_shopShowDone;go('shopping')">
  ${window._shopShowDone ? '▾' : '▸'} ${done.length} article${done.length>1?'s':''} dans le panier
</button>
${window._shopShowDone ? `
<div class="card" style="opacity:.6;margin-top:.4rem">
  ${done.map(item => renderShopItem(item)).join('')}
</div>` : ''}
` : ''}

<!-- Actions -->
<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.75rem">
  ${done.length ? `<button class="btn btn-ghost btn-sm" onclick="clearCheckedShopItems()">🗑️ Vider le panier</button>` : ''}
  ${items.length ? `<button class="btn btn-danger btn-sm" onclick="clearAllShopItems()">🗑️ Tout effacer</button>` : ''}
</div>
`}

</div>`;
}

function renderShopItem(item) {
  return `
<div class="shop-item-row${item.checked ? ' shop-done' : ''}">
  <div class="shop-check${item.checked ? ' checked' : ''}" onclick="toggleShopItem('${item.id}')">
    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  </div>
  <div class="shop-body" onclick="openShopItemModal('${item.id}')">
    <span class="shop-name">${esc(item.name)}</span>
    ${item.qty ? `<span class="shop-qty">${esc(item.qty)}${item.unit ? ' ' + esc(item.unit) : ''}</span>` : ''}
  </div>
  <button class="todo-del" onclick="delShopItem('${item.id}')">×</button>
</div>`;
}

// ── Ajout rapide ───────────────────────────────────────
window._shopShowDone = false;

function quickAddShopItem() {
  const inp  = document.getElementById('shop-quick-in');
  if (!inp) return;
  const name = inp.value.trim();
  if (!name) return;
  const list = LS.shopping();
  list.push({ id: uid(), name, qty: '', unit: '', category: 'other', checked: false, createdAt: Date.now() });
  LS.s('pl_shopping', list);
  inp.value = '';
  go('shopping');
}

// ── Toggle ─────────────────────────────────────────────
function toggleShopItem(id) {
  const list = LS.shopping();
  const item = list.find(x => x.id === id);
  if (!item) return;
  item.checked = !item.checked;
  LS.s('pl_shopping', list);
  go('shopping');
}

function delShopItem(id) {
  LS.s('pl_shopping', LS.shopping().filter(x => x.id !== id));
  go('shopping');
}

function clearCheckedShopItems() {
  if (!confirm('Vider le panier (articles cochés) ?')) return;
  LS.s('pl_shopping', LS.shopping().filter(x => !x.checked));
  go('shopping');
}

function clearAllShopItems() {
  if (!confirm('Effacer toute la liste de courses ?')) return;
  LS.s('pl_shopping', []);
  go('shopping');
}

// ═══════════════════════════════════════════════════════
//  MODAL : Ajouter / modifier un article
// ═══════════════════════════════════════════════════════
function openShopItemModal(id) {
  const item = id ? LS.shopping().find(x => x.id === id) : null;

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Article</label>
    <input class="form-input" id="shop-item-name" type="text"
      value="${esc(item?.name||'')}" placeholder="Ex: Yaourts, Pain…" maxlength="60">
  </div>
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">Quantité</label>
      <input class="form-input" id="shop-item-qty" type="text"
        value="${esc(item?.qty||'')}" placeholder="Ex: 2, 500…" maxlength="10">
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">Unité</label>
      <input class="form-input" id="shop-item-unit" type="text"
        value="${esc(item?.unit||'')}" placeholder="pcs, g, kg, L…" maxlength="10">
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Catégorie</label>
    <select class="setting-select" id="shop-item-cat" style="width:100%">
      ${SHOP_CATS.map(c => `<option value="${c.id}" ${(item?.category||'other')===c.id?'selected':''}>${c.label}</option>`).join('')}
    </select>
  </div>
  <div class="modal-actions">
    ${item ? `<button class="btn btn-danger btn-sm" onclick="delShopItem('${item.id}');closeModal()">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveShopItem('${id||''}')">Enregistrer</button>
  </div>
</div>`, item ? 'Modifier l\'article' : 'Nouvel article');
}

function saveShopItem(id) {
  const name = document.getElementById('shop-item-name')?.value?.trim();
  if (!name) { showToast('Entre un nom d\'article'); return; }
  const qty  = document.getElementById('shop-item-qty')?.value?.trim()  || '';
  const unit = document.getElementById('shop-item-unit')?.value?.trim() || '';
  const cat  = document.getElementById('shop-item-cat')?.value || 'other';
  const list = LS.shopping();
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) Object.assign(list[idx], { name, qty, unit, category: cat });
  } else {
    list.push({ id: uid(), name, qty, unit, category: cat, checked: false, createdAt: Date.now() });
  }
  LS.s('pl_shopping', list);
  closeModal();
  go('shopping');
}
