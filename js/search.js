// =============================================================================
// search.js — Motor de búsqueda con debounce
// Cofradía Yggdrasil
// =============================================================================

import { search, getNodeAncestors } from './supabase.js';
import { navigateTo } from './tree.js';
import { highlightCard, escapeHtml } from './render.js';

// Referencia al timer de debounce
let _debounceTimer = null;

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

export function initSearch() {
  const input   = document.getElementById('search-input');
  const overlay = document.getElementById('search-overlay');

  if (!input || !overlay) return;

  // Mostrar overlay al enfocar el input
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 3) {
      overlay.classList.add('active');
    }
  });

  // Búsqueda con debounce al escribir
  input.addEventListener('input', () => {
    const query = input.value.trim();

    clearTimeout(_debounceTimer);

    if (query.length < 3) {
      closeOverlay();
      return;
    }

    // Mostrar overlay con estado "buscando"
    overlay.classList.add('active');
    showSearchLoading();

    _debounceTimer = setTimeout(() => runSearch(query), 300);
  });

  // Cerrar overlay al hacer click fuera
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });

  // Cerrar con Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeOverlay();
      input.blur();
    }
  });
}

// =============================================================================
// BÚSQUEDA
// =============================================================================

async function runSearch(query) {
  const { data, error } = await search(query);

  if (error) {
    showSearchEmpty('Error al buscar. Intenta de nuevo.');
    return;
  }

  const { nodes, leaves } = data;
  const totalResults = nodes.length + leaves.length;

  // Actualizar contador
  const countEl = document.getElementById('search-count');
  if (countEl) {
    countEl.textContent = `${totalResults} resultado${totalResults !== 1 ? 's' : ''}`;
    countEl.hidden = false;
  }

  if (totalResults === 0) {
    showSearchEmpty(`Sin resultados para "${query}"`);
    return;
  }

  await renderSearchResults(nodes, leaves, query);
}

// =============================================================================
// RENDERIZADO DE RESULTADOS
// =============================================================================

async function renderSearchResults(nodes, leaves, query) {
  const list = document.getElementById('search-results-list');
  if (!list) return;

  list.innerHTML = '';

  // Construir rutas para nodos en paralelo
  const nodeItems = await Promise.all(
    nodes.map(async node => {
      const { data: ancestors } = await getNodeAncestors(node.id);
      return { ...node, ancestors };
    })
  );

  // Nodos
  nodeItems.forEach(node => {
    const item = createNodeResultItem(node, query);
    list.appendChild(item);
  });

  // Hojas
  leaves.forEach(leaf => {
    const item = createLeafResultItem(leaf, query);
    list.appendChild(item);
  });
}

function createNodeResultItem(node, query) {
  const item = document.createElement('div');
  item.className = 'search-result-item';
  item.setAttribute('role', 'option');

  const pathHtml = buildPathHtml(node.ancestors || []);
  const nameHtml = highlightMatch(escapeHtml(node.name), escapeHtml(query));

  item.innerHTML = `
    <div class="search-result-icon branch">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <div class="search-result-content">
      <div class="search-result-name">${nameHtml}</div>
      <div class="search-result-path">${pathHtml}</div>
    </div>
    <div class="search-result-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `;

  item.addEventListener('click', async () => {
    closeOverlay();
    // Navegar al padre del nodo y resaltar la card
    const parentId = node.parent_id ?? null;
    await navigateTo(parentId);
    setTimeout(() => highlightCard(node.id, false), 400);
  });

  return item;
}

function createLeafResultItem(leaf, query) {
  const item = document.createElement('div');
  item.className = 'search-result-item';
  item.setAttribute('role', 'option');

  const platform = leaf.platforms;
  const displayName = leaf.label || leaf.url;
  const nameHtml = highlightMatch(escapeHtml(displayName), escapeHtml(query));

  item.innerHTML = `
    <div class="search-result-icon leaf">
      ${platform?.icon_url
        ? `<img src="${escapeHtml(platform.icon_url)}" alt="${escapeHtml(platform.name)}" style="width:18px;height:18px;object-fit:contain" />`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
             <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
           </svg>`
      }
    </div>
    <div class="search-result-content">
      <div class="search-result-name">${nameHtml}</div>
      <div class="search-result-path">
        ${platform ? escapeHtml(platform.name) + ' · ' : ''}
        <span style="opacity:0.7">${escapeHtml(leaf.url)}</span>
      </div>
    </div>
    <div class="search-result-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `;

  item.addEventListener('click', async () => {
    closeOverlay();
    await navigateTo(leaf.node_id);
    setTimeout(() => highlightCard(leaf.id, true), 400);
  });

  return item;
}

// =============================================================================
// ESTADOS DEL OVERLAY
// =============================================================================

function showSearchLoading() {
  const list = document.getElementById('search-results-list');
  if (!list) return;
  list.innerHTML = `
    <div class="search-loading">
      <div class="spinner" style="width:20px;height:20px;border-width:2px"></div>
      <span>Buscando…</span>
    </div>
  `;
  const countEl = document.getElementById('search-count');
  if (countEl) countEl.hidden = true;
}

function showSearchEmpty(message = 'Sin resultados') {
  const list = document.getElementById('search-results-list');
  if (!list) return;
  list.innerHTML = `
    <div class="search-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function closeOverlay() {
  const overlay = document.getElementById('search-overlay');
  const countEl = document.getElementById('search-count');
  overlay?.classList.remove('active');
  if (countEl) countEl.hidden = true;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildPathHtml(ancestors) {
  if (!ancestors || ancestors.length === 0) return 'Raíz';
  return ancestors
    .map(a => `<span>${escapeHtml(a.name)}</span>`)
    .join('<span class="search-result-path-sep">›</span>');
}

/**
 * Resalta las ocurrencias del término buscado en el texto.
 */
function highlightMatch(text, query) {
  if (!query) return text;
  // Buscar de forma case-insensitive
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
