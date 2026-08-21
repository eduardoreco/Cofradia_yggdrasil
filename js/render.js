// =============================================================================
// render.js — Renderizado de cards, breadcrumb y estados de UI
// Cofradía Yggdrasil
// =============================================================================

import { countChildren } from './supabase.js';

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================

/**
 * Muestra una notificación toast.
 * @param {string} message - Texto del mensaje
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - Milisegundos antes de desaparecer (0 = permanente)
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  return toast;
}

// =============================================================================
// LOADING
// =============================================================================

export function showLoading(message = 'Cargando…') {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  const p = overlay.querySelector('p');
  if (p) p.textContent = message;
  overlay.classList.remove('hidden');
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// =============================================================================
// BREADCRUMB
// =============================================================================

/**
 * Renderiza el breadcrumb.
 * @param {Array<{id: string|null, name: string}>} path - Array desde raíz al nodo actual
 * @param {Function} onNavigate - Callback(nodeId) al hacer click en un item
 */
export function renderBreadcrumb(path, onNavigate) {
  const bar = document.getElementById('breadcrumb-bar');
  if (!bar) return;

  bar.innerHTML = '';

  // Siempre incluir "Inicio" como primer item
  const homeItem = createBreadcrumbItem({ id: null, name: '🌳 Inicio' }, false, onNavigate);
  bar.appendChild(homeItem);

  path.forEach((item, index) => {
    // Separador
    const sep = document.createElement('span');
    sep.className = 'breadcrumb-separator';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '›';
    bar.appendChild(sep);

    const isLast = index === path.length - 1;
    const el = createBreadcrumbItem(item, isLast, onNavigate);
    bar.appendChild(el);
  });
}

function createBreadcrumbItem(item, isCurrent, onNavigate) {
  const div = document.createElement('div');
  div.className = 'breadcrumb-item';

  if (isCurrent) {
    const span = document.createElement('span');
    span.className = 'breadcrumb-current';
    span.textContent = item.name;
    div.appendChild(span);
  } else {
    const btn = document.createElement('span');
    btn.className = 'breadcrumb-link';
    btn.textContent = item.name;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('click', () => onNavigate(item.id));
    btn.addEventListener('keydown', e => { if (e.key === 'Enter') onNavigate(item.id); });
    div.appendChild(btn);
  }

  return div;
}

// =============================================================================
// LEVEL HEADER
// =============================================================================

export function renderLevelHeader(node) {
  const titleEl = document.getElementById('level-title');
  const descEl  = document.getElementById('level-description');

  if (titleEl) {
    titleEl.textContent = node ? node.name : 'Directorio Temático';
  }

  if (descEl) {
    descEl.textContent = node?.description || '';
  }
}

// =============================================================================
// CARDS DE RAMAS (BRANCHES)
// =============================================================================

/**
 * Renderiza el grid de ramas como cards.
 * @param {Array}    nodes       - Array de nodos
 * @param {Function} onNavigate  - Callback(nodeId) al hacer click en una rama
 * @param {Function} onEdit      - Callback(nodeId)
 * @param {Function} onDelete    - Callback(nodeId, nodeName)
 */
export async function renderBranchCards(nodes, onNavigate, onEdit, onDelete) {
  const container = document.getElementById('cards-container');
  if (!container) return;

  if (!nodes || nodes.length === 0) {
    container.innerHTML = renderEmptyStateHTML('ramas');
    return;
  }

  // Construir cards con datos de conteo
  const cardElements = await Promise.all(
    nodes.map(node => createBranchCard(node, onNavigate, onEdit, onDelete))
  );

  container.innerHTML = '';
  cardElements.forEach((el, i) => {
    el.style.animationDelay = `${i * 40}ms`;
    el.classList.add('card-enter');
    container.appendChild(el);
  });
}

async function createBranchCard(node, onNavigate, onEdit, onDelete) {
  const { data: childCount } = await countChildren(node.id);

  const card = document.createElement('article');
  card.className = 'card card-branch';
  card.dataset.nodeId = node.id;

  // Imagen
  const imgSection = node.image_url
    ? `<img class="card-image" src="${escapeAttr(node.image_url)}" alt="${escapeAttr(node.name)}" loading="lazy" />`
    : `<div class="card-image-placeholder">
         ${folderSVG()}
       </div>`;

  card.innerHTML = `
    ${imgSection}
    <div class="card-body">
      <h3 class="card-title">${escapeHtml(node.name)}</h3>
      ${node.description ? `<p class="card-description">${escapeHtml(node.description)}</p>` : ''}
      <div class="card-meta">
        <span class="card-counter">
          ${folderSmallSVG()}
          ${childCount} sub-tema${childCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
    <div class="card-footer">
      <span class="text-xs text-muted">Rama</span>
      <div class="card-actions">
        <button class="btn-icon" data-action="edit" title="Editar rama" aria-label="Editar ${escapeAttr(node.name)}">
          ${editSVG()}
        </button>
        <button class="btn-icon danger" data-action="delete" title="Eliminar rama" aria-label="Eliminar ${escapeAttr(node.name)}">
          ${trashSVG()}
        </button>
      </div>
    </div>
  `;

  // Navegar al hacer click en la card (excepto en botones)
  card.addEventListener('click', e => {
    if (e.target.closest('[data-action]')) return;
    onNavigate(node.id);
  });

  card.querySelector('[data-action="edit"]').addEventListener('click', e => {
    e.stopPropagation();
    onEdit(node.id);
  });

  card.querySelector('[data-action="delete"]').addEventListener('click', e => {
    e.stopPropagation();
    onDelete(node.id, node.name, 'node');
  });

  return card;
}

// =============================================================================
// CARDS DE HOJAS (LEAVES)
// =============================================================================

/**
 * Renderiza las hojas/links al final del grid.
 */
export function renderLeafCards(leaves, container, onEdit, onDelete) {
  if (!leaves || leaves.length === 0) return;

  // Separador de sección
  const label = document.createElement('div');
  label.className = 'section-label';
  label.innerHTML = `${linkSVG()} Links`;
  container.appendChild(label);

  leaves.forEach((leaf, i) => {
    const card = createLeafCard(leaf, onEdit, onDelete);
    card.style.animationDelay = `${i * 40}ms`;
    card.classList.add('card-enter');
    container.appendChild(card);
  });
}

function createLeafCard(leaf, onEdit, onDelete) {
  const platform = leaf.platforms;
  const card = document.createElement('article');
  card.className = 'card card-leaf';
  card.dataset.leafId = leaf.id;

  const iconHtml = platform?.icon_url
    ? `<img src="${escapeAttr(platform.icon_url)}" alt="${escapeAttr(platform.name)}" loading="lazy" />`
    : `<svg class="card-leaf-icon-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

  card.innerHTML = `
    <div class="card-body">
      <div class="card-leaf-icon">${iconHtml}</div>
      <div class="card-leaf-info">
        ${platform ? `<div class="card-leaf-platform">${escapeHtml(platform.name)}</div>` : ''}
        <div class="card-leaf-label">${escapeHtml(leaf.label || leaf.url)}</div>
        <div class="card-leaf-url">${escapeHtml(leaf.url)}</div>
      </div>
    </div>
    <div class="card-footer">
      <a href="${escapeAttr(leaf.url)}" target="_blank" rel="noopener noreferrer"
         class="btn-open-link">
        ${externalLinkSVG()} Abrir
      </a>
      <div class="card-actions">
        <button class="btn-icon" data-action="edit" title="Editar link" aria-label="Editar link">
          ${editSVG()}
        </button>
        <button class="btn-icon danger" data-action="delete" title="Eliminar link" aria-label="Eliminar link">
          ${trashSVG()}
        </button>
      </div>
    </div>
  `;

  card.querySelector('[data-action="edit"]').addEventListener('click', e => {
    e.stopPropagation();
    onEdit(leaf.id);
  });

  card.querySelector('[data-action="delete"]').addEventListener('click', e => {
    e.stopPropagation();
    onDelete(leaf.id, leaf.label || leaf.url, 'leaf');
  });

  return card;
}

// =============================================================================
// ESTADO VACÍO
// =============================================================================

function renderEmptyStateHTML(tipo = 'elementos') {
  return `
    <div class="empty-state">
      ${folderSVG(48)}
      <h3>Sin ${tipo} todavía</h3>
      <p>Haz click en el botón <strong>+</strong> para agregar el primero.</p>
    </div>
  `;
}

// =============================================================================
// RESALTAR CARD (resultado de búsqueda)
// =============================================================================

export function highlightCard(nodeId, isLeaf = false) {
  const attr = isLeaf ? 'data-leaf-id' : 'data-node-id';
  const card = document.querySelector(`[${attr}="${nodeId}"]`);
  if (!card) return;

  card.classList.remove('highlighted');
  // forzar reflow para reiniciar la animación
  void card.offsetWidth;
  card.classList.add('highlighted');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// =============================================================================
// SVG HELPERS (inline para no depender de archivos externos)
// =============================================================================

function folderSVG(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function folderSmallSVG() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function linkSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
}

function editSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
}

function trashSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
}

function externalLinkSVG() {
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
}

// =============================================================================
// ESCAPE HELPERS (seguridad XSS)
// =============================================================================

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
