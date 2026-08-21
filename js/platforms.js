// =============================================================================
// platforms.js — Catálogo configurable de plataformas
// Cofradía Yggdrasil
// =============================================================================

import {
  getPlatforms, getAllPlatforms, createPlatform, updatePlatform, togglePlatform,
} from './supabase.js';
import { showToast, showLoading, hideLoading, escapeHtml, escapeAttr } from './render.js';
import { uploadFile } from './upload.js';

// Cache en memoria para evitar consultas repetidas
let _platformCache = [];

/** Retorna el cache de plataformas activas (cargado al inicio) */
export function getPlatformCache() {
  return _platformCache;
}

/** Carga las plataformas activas y las guarda en cache */
export async function loadPlatforms() {
  const { data, error } = await getPlatforms(true);
  if (error) {
    showToast('No se pudieron cargar las plataformas', 'error');
    return;
  }
  _platformCache = data || [];
}

// =============================================================================
// PANEL DE GESTIÓN DE PLATAFORMAS
// =============================================================================

/** Abre el modal de gestión y renderiza la lista */
export async function openPlatformsModal() {
  await renderPlatformsList();
  openModal('modal-platforms');
}

async function renderPlatformsList() {
  const list = document.getElementById('platforms-list');
  if (!list) return;

  const { data: platforms, error } = await getAllPlatforms();
  if (error) { showToast('Error al cargar plataformas', 'error'); return; }

  if (!platforms || platforms.length === 0) {
    list.innerHTML = '<p class="text-sm text-muted" style="text-align:center;padding:2rem">Sin plataformas. Agrega la primera.</p>';
    return;
  }

  list.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:var(--font-size-sm)">
      <thead>
        <tr style="border-bottom:1px solid var(--color-border)">
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Ícono</th>
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Nombre</th>
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">URL base</th>
          <th style="text-align:center;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Activa</th>
          <th style="padding:var(--space-2) var(--space-3)"></th>
        </tr>
      </thead>
      <tbody id="platforms-table-body">
        ${platforms.map(p => platformRowHTML(p)).join('')}
      </tbody>
    </table>
  `;

  // Delegación de eventos
  list.addEventListener('click', async e => {
    const editBtn   = e.target.closest('[data-action="edit-platform"]');
    const toggleBtn = e.target.closest('[data-action="toggle-platform"]');

    if (editBtn) {
      const id = editBtn.dataset.platformId;
      const platform = platforms.find(p => p.id === id);
      if (platform) openEditPlatformModal(platform);
    }

    if (toggleBtn) {
      const id       = toggleBtn.dataset.platformId;
      const isActive = toggleBtn.dataset.active === 'true';
      showLoading('Actualizando…');
      const { error } = await togglePlatform(id, !isActive);
      hideLoading();
      if (error) { showToast('Error al actualizar', 'error'); return; }
      await loadPlatforms();
      await renderPlatformsList();
    }
  });
}

function platformRowHTML(p) {
  return `
    <tr style="border-bottom:1px solid var(--color-border)">
      <td style="padding:var(--space-2) var(--space-3)">
        ${p.icon_url
          ? `<img src="${escapeAttr(p.icon_url)}" alt="${escapeAttr(p.name)}" style="width:24px;height:24px;object-fit:contain" />`
          : `<span style="display:inline-block;width:24px;height:24px;border-radius:4px;background:${escapeAttr(p.color || '#ccc')}"></span>`
        }
      </td>
      <td style="padding:var(--space-2) var(--space-3);font-weight:var(--font-weight-medium)">${escapeHtml(p.name)}</td>
      <td style="padding:var(--space-2) var(--space-3);color:var(--color-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        ${escapeHtml(p.base_url || '—')}
      </td>
      <td style="padding:var(--space-2) var(--space-3);text-align:center">
        <button
          class="btn btn-ghost"
          style="padding:2px 10px;font-size:12px"
          data-action="toggle-platform"
          data-platform-id="${p.id}"
          data-active="${p.is_active}"
        >
          ${p.is_active ? '✓ Activa' : '✗ Inactiva'}
        </button>
      </td>
      <td style="padding:var(--space-2) var(--space-3)">
        <button class="btn-icon" data-action="edit-platform" data-platform-id="${p.id}" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </td>
    </tr>
  `;
}

// =============================================================================
// MODAL: CREAR / EDITAR PLATAFORMA
// =============================================================================

let _editingPlatformId = null;

export function openAddPlatformModal() {
  _editingPlatformId = null;
  resetPlatformForm();
  const title = document.getElementById('modal-platform-edit-title');
  if (title) title.textContent = 'Nueva Plataforma';
  openModal('modal-platform-edit');
}

function openEditPlatformModal(platform) {
  _editingPlatformId = platform.id;
  resetPlatformForm();

  const title = document.getElementById('modal-platform-edit-title');
  if (title) title.textContent = `Editar: ${platform.name}`;

  document.getElementById('platform-edit-name').value     = platform.name || '';
  document.getElementById('platform-edit-icon').value     = platform.icon_url || '';
  document.getElementById('platform-edit-base-url').value = platform.base_url || '';

  const color = platform.color || '#6B7280';
  document.getElementById('platform-edit-color').value     = color;
  document.getElementById('platform-edit-color-hex').value = color;

  openModal('modal-platform-edit');
}

function resetPlatformForm() {
  ['platform-edit-name', 'platform-edit-icon', 'platform-edit-base-url', 'platform-edit-color-hex'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'platform-edit-color-hex' ? '#6B7280' : '';
  });
  const colorPicker = document.getElementById('platform-edit-color');
  if (colorPicker) colorPicker.value = '#6B7280';
}

export function initPlatformControls() {
  // Botón de gestión en header
  document.getElementById('btn-platforms')?.addEventListener('click', openPlatformsModal);

  // Botón "Nueva plataforma" dentro del modal de gestión
  document.getElementById('btn-add-platform')?.addEventListener('click', openAddPlatformModal);

  // Guardar plataforma
  document.getElementById('btn-save-platform')?.addEventListener('click', savePlatform);
}

async function savePlatform() {
  const name    = document.getElementById('platform-edit-name').value.trim();
  const iconUrl = document.getElementById('platform-edit-icon').value.trim();
  const baseUrl = document.getElementById('platform-edit-base-url').value.trim();
  const color   = document.getElementById('platform-edit-color-hex').value.trim() || '#6B7280';

  if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

  showLoading('Guardando…');

  const payload = { name, icon_url: iconUrl || null, base_url: baseUrl || null, color, is_active: true };

  let result;
  if (_editingPlatformId) {
    result = await updatePlatform(_editingPlatformId, payload);
  } else {
    result = await createPlatform(payload);
  }

  hideLoading();

  if (result.error) { showToast(`Error: ${result.error.message}`, 'error'); return; }

  await loadPlatforms();
  closeModal('modal-platform-edit');
  await renderPlatformsList();
  showToast(_editingPlatformId ? 'Plataforma actualizada' : 'Plataforma creada', 'success');
}

// =============================================================================
// HELPERS
// =============================================================================

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.removeAttribute('hidden');
  el.classList.remove('closing');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('closing');
  setTimeout(() => { el.setAttribute('hidden', ''); el.classList.remove('closing'); }, 300);
}
