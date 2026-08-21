// =============================================================================
// tree.js — Lógica del árbol: estado, navegación y modales CRUD
// Cofradía Yggdrasil
// =============================================================================

import {
  getNodes, getNodeById, getNodeAncestors, createNode, updateNode, deleteNode,
  getLeaves, createLeaf, updateLeaf, deleteLeaf, logAudit,
} from './supabase.js';

import {
  renderBranchCards, renderLeafCards, renderBreadcrumb, renderLevelHeader,
  showToast, showLoading, hideLoading, highlightCard,
} from './render.js';

import { uploadFile, initUploadZone, showImagePreview, clearUploadZone } from './upload.js';
import { getPlatformCache } from './platforms.js';

// =============================================================================
// ESTADO DE NAVEGACIÓN
// =============================================================================

/** ID del nodo actualmente visible (null = raíz) */
let currentNodeId = null;

/** Obtiene el nodo actual */
export function getCurrentNodeId() { return currentNodeId; }

// =============================================================================
// NAVEGACIÓN
// =============================================================================

/**
 * Navega al nodo dado y renderiza sus hijos.
 * @param {string|null} nodeId - null para ir a la raíz
 * @param {boolean} pushHistory - Si se debe agregar al historial del navegador
 */
export async function navigateTo(nodeId = null, pushHistory = true) {
  showLoading('Cargando…');

  currentNodeId = nodeId;

  // Actualizar URL (History API)
  if (pushHistory) {
    const url = nodeId ? `?node=${nodeId}` : '?';
    window.history.pushState({ nodeId }, '', url);
  }

  // Cargar nodo actual (para breadcrumb y header)
  let currentNode = null;
  if (nodeId) {
    const { data } = await getNodeById(nodeId);
    currentNode = data;
  }

  // Breadcrumb
  const { data: ancestors } = nodeId
    ? await getNodeAncestors(nodeId)
    : { data: [] };

  renderBreadcrumb(ancestors, navigateTo);
  renderLevelHeader(currentNode);

  // Cargar hijos y hojas en paralelo
  const [nodesResult, leavesResult] = await Promise.all([
    getNodes(nodeId),
    nodeId ? getLeaves(nodeId) : Promise.resolve({ data: [] }),
  ]);

  const container = document.getElementById('cards-container');
  if (container) {
    container.innerHTML = '';
    container.classList.remove('level-enter');
    void container.offsetWidth; // forzar reflow
    container.classList.add('level-enter');
  }

  // Renderizar ramas
  await renderBranchCards(
    nodesResult.data || [],
    navigateTo,
    openEditBranchModal,
    openDeleteModal
  );

  // Renderizar hojas (al final del mismo contenedor)
  if (container && leavesResult.data?.length > 0) {
    renderLeafCards(
      leavesResult.data,
      container,
      openEditLeafModal,
      openDeleteModal
    );
  }

  hideLoading();
}

// Manejar el botón "atrás" del navegador
window.addEventListener('popstate', event => {
  const nodeId = event.state?.nodeId ?? null;
  navigateTo(nodeId, false);
});

// =============================================================================
// INICIALIZACIÓN DE CONTROLES DEL ÁRBOL
// =============================================================================

export function initTreeControls() {
  // FAB: toggle menu
  const fab     = document.getElementById('fab-add');
  const fabMenu = document.getElementById('fab-menu');

  fab?.addEventListener('click', () => {
    const isOpen = fabMenu.classList.toggle('open');
    fab.setAttribute('aria-expanded', isOpen);
    fabMenu.setAttribute('aria-hidden', !isOpen);
  });

  // Cerrar FAB menu al hacer click fuera
  document.addEventListener('click', e => {
    if (!fab?.contains(e.target) && !fabMenu?.contains(e.target)) {
      fabMenu?.classList.remove('open');
      fab?.setAttribute('aria-expanded', 'false');
    }
  });

  // FAB → agregar rama
  document.getElementById('fab-add-branch')?.addEventListener('click', () => {
    fabMenu?.classList.remove('open');
    openCreateBranchModal();
  });

  // FAB → agregar hoja
  document.getElementById('fab-add-leaf')?.addEventListener('click', () => {
    fabMenu?.classList.remove('open');
    openCreateLeafModal();
  });

  // Botón "Inicio" en el breadcrumb (delegado en header-logo)
  document.getElementById('header-logo')?.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(null);
  });

  // Inicializar controles de modales
  initModalControls();
}

// =============================================================================
// CONTROLES GENERALES DE MODALES
// =============================================================================

function initModalControls() {
  // Cerrar modal al hacer click en el backdrop o en botones [data-close-modal]
  document.addEventListener('click', e => {
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      closeModal(closeBtn.dataset.closeModal);
      return;
    }
    // Click en el backdrop (fuera del .modal)
    if (e.target.classList.contains('modal-backdrop')) {
      const modal = e.target;
      closeModal(modal.id);
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-backdrop:not([hidden])');
      if (openModal) closeModal(openModal.id);
    }
  });

  // Tabs de imagen (subir / URL) — delegado
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;

    const modal   = tab.dataset.modal;
    const tabName = tab.dataset.tab;

    // Activar el tab clickeado
    document.querySelectorAll(`[data-tab][data-modal="${modal}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Mostrar el contenido correcto
    document.querySelectorAll(`[data-content][data-modal="${modal}"]`).forEach(content => {
      content.classList.toggle('active', content.dataset.content === tabName);
    });
  });

  // Sync color picker ↔ hex input en plataformas
  const colorPicker = document.getElementById('platform-edit-color');
  const colorHex    = document.getElementById('platform-edit-color-hex');

  colorPicker?.addEventListener('input', () => {
    if (colorHex) colorHex.value = colorPicker.value;
  });

  colorHex?.addEventListener('input', () => {
    const val = colorHex.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val) && colorPicker) {
      colorPicker.value = val;
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.removeAttribute('hidden');
  modal.classList.remove('closing');
  // Foco accesible
  const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
  firstInput?.focus();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('closing');
  setTimeout(() => {
    modal.setAttribute('hidden', '');
    modal.classList.remove('closing');
  }, 300);
}

// =============================================================================
// MODAL: CREAR / EDITAR RAMA
// =============================================================================

// Archivo pendiente de subida para la rama
let _branchPendingFile = null;

export function openCreateBranchModal(parentId = null) {
  _branchPendingFile = null;
  resetBranchForm();
  document.getElementById('branch-id').value = '';

  const title = document.getElementById('modal-branch-title');
  if (title) title.innerHTML = `${folderIconSVG()} Nueva Rama`;

  // Guardar parentId en un data attribute del modal
  const modal = document.getElementById('modal-branch');
  if (modal) modal.dataset.parentId = parentId ?? currentNodeId ?? '';

  setupBranchUpload();
  openModal('modal-branch');
}

export async function openEditBranchModal(nodeId) {
  _branchPendingFile = null;
  resetBranchForm();

  const { data: node, error } = await getNodeById(nodeId);
  if (error || !node) { showToast('No se pudo cargar la rama', 'error'); return; }

  const title = document.getElementById('modal-branch-title');
  if (title) title.innerHTML = `${folderIconSVG()} Editar Rama`;

  document.getElementById('branch-id').value          = node.id;
  document.getElementById('branch-name').value        = node.name || '';
  document.getElementById('branch-description').value = node.description || '';
  document.getElementById('branch-order').value       = node.order_index ?? 0;

  if (node.image_url) {
    showImagePreview('branch-image-preview-wrap', 'branch-image-preview', node.image_url);
    document.getElementById('branch-image-url').value = node.image_url;
    // Activar tab URL
    activateImageTab('branch', 'url');
  }

  setupBranchUpload();
  openModal('modal-branch');
}

function setupBranchUpload() {
  initUploadZone(
    'branch-upload-zone',
    'branch-image-file',
    'branch-image-preview-wrap',
    'branch-image-preview',
    file => { _branchPendingFile = file; }
  );

  // Preview en vivo al escribir URL
  const urlInput = document.getElementById('branch-image-url');
  urlInput?.addEventListener('input', () => {
    showImagePreview('branch-image-preview-wrap', 'branch-image-preview', urlInput.value.trim());
  });
}

function resetBranchForm() {
  ['branch-name', 'branch-description', 'branch-image-url', 'branch-modified-by'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const order = document.getElementById('branch-order');
  if (order) order.value = '0';
  clearUploadZone('branch-image-file', 'branch-image-preview-wrap', 'branch-image-preview');
  activateImageTab('branch', 'upload');
}

// Guardar rama
export function initBranchSave() {
  document.getElementById('btn-save-branch')?.addEventListener('click', saveBranch);
}

async function saveBranch() {
  const id          = document.getElementById('branch-id').value.trim();
  const name        = document.getElementById('branch-name').value.trim();
  const description = document.getElementById('branch-description').value.trim();
  const orderVal    = parseInt(document.getElementById('branch-order').value) || 0;
  const modifiedBy  = document.getElementById('branch-modified-by').value.trim() || null;
  const urlInput    = document.getElementById('branch-image-url').value.trim();
  const modal       = document.getElementById('modal-branch');
  const parentId    = modal?.dataset.parentId || currentNodeId || null;

  if (!name) {
    showToast('El nombre de la rama es obligatorio', 'error');
    document.getElementById('branch-name')?.focus();
    return;
  }

  showLoading('Guardando…');

  // Subir imagen si hay archivo pendiente
  let imageUrl = urlInput || null;
  if (_branchPendingFile) {
    const { url, error } = await uploadFile(_branchPendingFile, 'nodes');
    if (error) { hideLoading(); showToast(`Error al subir imagen: ${error.message}`, 'error'); return; }
    imageUrl = url;
  }

  const payload = {
    name,
    description: description || null,
    image_url:   imageUrl,
    order_index: orderVal,
    modified_by: modifiedBy,
    parent_id:   parentId || null,
  };

  let result;
  if (id) {
    result = await updateNode(id, payload);
  } else {
    result = await createNode(payload);
  }

  hideLoading();

  if (result.error) {
    showToast(`Error: ${result.error.message}`, 'error');
    return;
  }

  // Auditoría
  await logAudit(
    id ? 'update' : 'create',
    'node',
    result.data.id,
    name,
    modifiedBy,
    payload
  );

  closeModal('modal-branch');
  showToast(id ? 'Rama actualizada' : 'Rama creada', 'success');
  await navigateTo(currentNodeId, false);
}

// =============================================================================
// MODAL: CREAR / EDITAR HOJA (LINK)
// =============================================================================

let _leafPendingFile = null;

export function openCreateLeafModal(nodeId = null) {
  _leafPendingFile = null;
  resetLeafForm();
  document.getElementById('leaf-id').value = '';

  const title = document.getElementById('modal-leaf-title');
  if (title) title.innerHTML = `${linkIconSVG()} Nuevo Link`;

  const modal = document.getElementById('modal-leaf');
  if (modal) modal.dataset.nodeId = nodeId ?? currentNodeId ?? '';

  loadPlatformGrid();
  setupLeafUpload();
  openModal('modal-leaf');
}

export async function openEditLeafModal(leafId) {
  _leafPendingFile = null;
  resetLeafForm();

  const { data: leaf, error } = await (await import('./supabase.js')).getLeafById(leafId);
  if (error || !leaf) { showToast('No se pudo cargar el link', 'error'); return; }

  const title = document.getElementById('modal-leaf-title');
  if (title) title.innerHTML = `${linkIconSVG()} Editar Link`;

  document.getElementById('leaf-id').value          = leaf.id;
  document.getElementById('leaf-url').value         = leaf.url || '';
  document.getElementById('leaf-label').value       = leaf.label || '';
  document.getElementById('leaf-order').value       = leaf.order_index ?? 0;
  document.getElementById('leaf-platform-id').value = leaf.platform_id || '';

  if (leaf.image_url) {
    showImagePreview('leaf-image-preview-wrap', 'leaf-image-preview', leaf.image_url);
    document.getElementById('leaf-image-url').value = leaf.image_url;
    activateImageTab('leaf', 'url');
  }

  loadPlatformGrid(leaf.platform_id);
  setupLeafUpload();
  openModal('modal-leaf');
}

function setupLeafUpload() {
  initUploadZone(
    'leaf-upload-zone',
    'leaf-image-file',
    'leaf-image-preview-wrap',
    'leaf-image-preview',
    file => { _leafPendingFile = file; }
  );

  const urlInput = document.getElementById('leaf-image-url');
  urlInput?.addEventListener('input', () => {
    showImagePreview('leaf-image-preview-wrap', 'leaf-image-preview', urlInput.value.trim());
  });
}

function resetLeafForm() {
  ['leaf-url', 'leaf-label', 'leaf-image-url', 'leaf-modified-by', 'leaf-platform-id'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const order = document.getElementById('leaf-order');
  if (order) order.value = '0';
  clearUploadZone('leaf-image-file', 'leaf-image-preview-wrap', 'leaf-image-preview');
  activateImageTab('leaf', 'upload');
}

function loadPlatformGrid(selectedId = null) {
  const grid = document.getElementById('platform-grid');
  if (!grid) return;

  const platforms = getPlatformCache();
  grid.innerHTML = '';

  platforms.forEach(p => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'platform-option' + (p.id === selectedId ? ' selected' : '');
    btn.dataset.platformId = p.id;

    btn.innerHTML = `
      ${p.icon_url ? `<img src="${p.icon_url}" alt="${p.name}" loading="lazy" />` : ''}
      <span>${p.name}</span>
    `;

    btn.addEventListener('click', () => {
      grid.querySelectorAll('.platform-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('leaf-platform-id').value = p.id;
    });

    grid.appendChild(btn);
  });
}

export function initLeafSave() {
  document.getElementById('btn-save-leaf')?.addEventListener('click', saveLeaf);
}

async function saveLeaf() {
  const id         = document.getElementById('leaf-id').value.trim();
  const url        = document.getElementById('leaf-url').value.trim();
  const label      = document.getElementById('leaf-label').value.trim();
  const platformId = document.getElementById('leaf-platform-id').value.trim();
  const orderVal   = parseInt(document.getElementById('leaf-order').value) || 0;
  const modifiedBy = document.getElementById('leaf-modified-by').value.trim() || null;
  const urlImg     = document.getElementById('leaf-image-url').value.trim();
  const modal      = document.getElementById('modal-leaf');
  const nodeId     = modal?.dataset.nodeId || currentNodeId;

  if (!url) { showToast('La URL del link es obligatoria', 'error'); return; }
  if (!platformId) { showToast('Selecciona una plataforma', 'error'); return; }

  showLoading('Guardando…');

  let imageUrl = urlImg || null;
  if (_leafPendingFile) {
    const { url: imgUrl, error } = await uploadFile(_leafPendingFile, 'leaves');
    if (error) { hideLoading(); showToast(`Error al subir imagen: ${error.message}`, 'error'); return; }
    imageUrl = imgUrl;
  }

  const payload = {
    url,
    label:       label || null,
    platform_id: platformId,
    node_id:     nodeId,
    image_url:   imageUrl,
    order_index: orderVal,
    modified_by: modifiedBy,
  };

  let result;
  if (id) {
    result = await updateLeaf(id, payload);
  } else {
    result = await createLeaf(payload);
  }

  hideLoading();

  if (result.error) {
    showToast(`Error: ${result.error.message}`, 'error');
    return;
  }

  await logAudit(id ? 'update' : 'create', 'leaf', result.data.id, label || url, modifiedBy, payload);

  closeModal('modal-leaf');
  showToast(id ? 'Link actualizado' : 'Link creado', 'success');
  await navigateTo(currentNodeId, false);
}

// =============================================================================
// MODAL: CONFIRMAR ELIMINACIÓN
// =============================================================================

export function openDeleteModal(entityId, entityName, entityType) {
  document.getElementById('delete-item-name').textContent = entityName;
  document.getElementById('delete-entity-id').value       = entityId;
  document.getElementById('delete-entity-type').value     = entityType;
  document.getElementById('delete-modified-by').value     = '';
  openModal('modal-delete');
}

export function initDeleteConfirm() {
  document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
    const entityId   = document.getElementById('delete-entity-id').value;
    const entityType = document.getElementById('delete-entity-type').value;
    const entityName = document.getElementById('delete-item-name').textContent;
    const modifiedBy = document.getElementById('delete-modified-by').value.trim() || null;

    showLoading('Eliminando…');

    let result;
    if (entityType === 'node') {
      result = await deleteNode(entityId);
    } else {
      result = await deleteLeaf(entityId);
    }

    hideLoading();

    if (result.error) {
      showToast(`Error: ${result.error.message}`, 'error');
      return;
    }

    await logAudit('delete', entityType, entityId, entityName, modifiedBy, {});

    closeModal('modal-delete');
    showToast('Eliminado correctamente', 'success');
    await navigateTo(currentNodeId, false);
  });
}

// =============================================================================
// HELPERS INTERNOS
// =============================================================================

function activateImageTab(modal, tabName) {
  document.querySelectorAll(`[data-tab][data-modal="${modal}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll(`[data-content][data-modal="${modal}"]`).forEach(content => {
    content.classList.toggle('active', content.dataset.content === tabName);
  });
}

function folderIconSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function linkIconSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
}
