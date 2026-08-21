// =============================================================================
// audit.js — Historial de cambios (audit log)
// Cofradía Yggdrasil
// =============================================================================

import { getAuditLog } from './supabase.js';
import { showToast, escapeHtml } from './render.js';

// Cache de los últimos registros cargados (para filtro client-side)
let _auditCache = [];

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

export function initAudit() {
  // Abrir panel desde el header
  document.getElementById('btn-audit')?.addEventListener('click', openAuditModal);

  // Filtro por nombre (client-side sobre los 50 registros en cache)
  document.getElementById('audit-filter-name')?.addEventListener('input', e => {
    renderAuditList(_auditCache, e.target.value.trim());
  });
}

// =============================================================================
// MODAL
// =============================================================================

async function openAuditModal() {
  const modal = document.getElementById('modal-audit');
  if (!modal) return;

  // Limpiar filtro
  const filterInput = document.getElementById('audit-filter-name');
  if (filterInput) filterInput.value = '';

  // Mostrar modal con estado de carga
  const list = document.getElementById('audit-list');
  if (list) list.innerHTML = loadingHTML();

  modal.removeAttribute('hidden');
  modal.classList.remove('closing');

  // Cargar datos
  const { data, error } = await getAuditLog(50);

  if (error) {
    if (list) list.innerHTML = `<p class="text-sm text-muted" style="padding:2rem;text-align:center">Error al cargar el historial.</p>`;
    showToast('Error al cargar historial', 'error');
    return;
  }

  _auditCache = data || [];
  renderAuditList(_auditCache, '');
}

// =============================================================================
// RENDERIZADO
// =============================================================================

function renderAuditList(entries, filter = '') {
  const list = document.getElementById('audit-list');
  if (!list) return;

  const filtered = filter
    ? entries.filter(e => e.modified_by?.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--color-muted)">
        <p>${filter ? `Sin resultados para "${escapeHtml(filter)}"` : 'Sin registros aún.'}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:var(--font-size-sm)">
      <thead>
        <tr style="border-bottom:2px solid var(--color-border)">
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Fecha</th>
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Acción</th>
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Elemento</th>
          <th style="text-align:left;padding:var(--space-2) var(--space-3);color:var(--color-muted);font-weight:var(--font-weight-medium)">Quién</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(entry => auditRowHTML(entry)).join('')}
      </tbody>
    </table>
  `;
}

function auditRowHTML(entry) {
  const date     = new Date(entry.created_at);
  const dateStr  = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr  = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const actionLabel = {
    create: { text: 'Creó',     color: 'var(--color-success)' },
    update: { text: 'Editó',    color: 'var(--color-info)' },
    delete: { text: 'Eliminó',  color: 'var(--color-error)' },
  }[entry.action] || { text: entry.action, color: 'var(--color-muted)' };

  const typeLabel = {
    node:     'Rama',
    leaf:     'Link',
    platform: 'Plataforma',
    setting:  'Configuración',
  }[entry.entity_type] || entry.entity_type;

  return `
    <tr style="border-bottom:1px solid var(--color-border)">
      <td style="padding:var(--space-2) var(--space-3);color:var(--color-text-secondary);white-space:nowrap">
        <div>${escapeHtml(dateStr)}</div>
        <div style="font-size:11px;color:var(--color-muted)">${escapeHtml(timeStr)}</div>
      </td>
      <td style="padding:var(--space-2) var(--space-3)">
        <span style="color:${actionLabel.color};font-weight:var(--font-weight-medium)">
          ${actionLabel.text}
        </span>
        <span style="color:var(--color-muted);font-size:11px;margin-left:4px">${escapeHtml(typeLabel)}</span>
      </td>
      <td style="padding:var(--space-2) var(--space-3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        ${escapeHtml(entry.entity_name || '—')}
      </td>
      <td style="padding:var(--space-2) var(--space-3)">
        <span style="color:${entry.modified_by ? 'var(--color-text)' : 'var(--color-muted)'}">
          ${escapeHtml(entry.modified_by || 'Anónimo')}
        </span>
      </td>
    </tr>
  `;
}

function loadingHTML() {
  return `
    <div style="display:flex;align-items:center;justify-content:center;gap:1rem;padding:3rem;color:var(--color-muted)">
      <div class="spinner" style="width:20px;height:20px;border-width:2px"></div>
      <span>Cargando historial…</span>
    </div>
  `;
}
