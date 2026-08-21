// =============================================================================
// import-export.js — Importar y exportar el árbol como JSON texto plano
// Cofradía Yggdrasil
// =============================================================================

import { getFullTree, getNodes, createNode, createLeaf, getPlatforms, logAudit } from './supabase.js';
import { showToast, showLoading, hideLoading } from './render.js';
import { navigateTo, getCurrentNodeId } from './tree.js';

const APP_VERSION = '1.0';

// Archivo JSON cargado para importar
let _importJsonData = null;

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

export function initImportExport() {
  // Abrir modal
  document.getElementById('btn-import-export')?.addEventListener('click', () => {
    resetImportForm();
    window.openModal('modal-import-export');
  });

  // Exportar todo
  document.getElementById('btn-export-all')?.addEventListener('click', exportAll);

  // Exportar rama actual
  document.getElementById('btn-export-branch')?.addEventListener('click', exportCurrentBranch);

  // Selección de archivo JSON
  const importFile = document.getElementById('import-file');
  const importZone = document.getElementById('import-upload-zone');

  importZone?.addEventListener('click', () => importFile?.click());

  importZone?.addEventListener('dragover', e => {
    e.preventDefault();
    importZone.classList.add('drag-over');
  });

  importZone?.addEventListener('dragleave', () => importZone.classList.remove('drag-over'));

  importZone?.addEventListener('drop', e => {
    e.preventDefault();
    importZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
  });

  importFile?.addEventListener('change', () => {
    if (importFile.files[0]) handleImportFile(importFile.files[0]);
  });

  // Confirmar importación
  document.getElementById('btn-confirm-import')?.addEventListener('click', confirmImport);
}

// =============================================================================
// EXPORTAR
// =============================================================================

async function exportAll() {
  showLoading('Exportando árbol completo…');

  const { data: tree, error } = await getFullTree(null);
  hideLoading();

  if (error) { showToast('Error al exportar', 'error'); return; }

  const exportData = {
    exported_at:  new Date().toISOString(),
    app_version:  APP_VERSION,
    export_type:  'full',
    nodes:        tree,
  };

  downloadJson(exportData, 'yggdrasil-export-completo.json');
  showToast('Árbol exportado correctamente', 'success');
  window.closeModal('modal-import-export');
}

async function exportCurrentBranch() {
  const currentId = getCurrentNodeId();

  showLoading('Exportando rama…');
  const { data: tree, error } = await getFullTree(currentId);
  hideLoading();

  if (error) { showToast('Error al exportar', 'error'); return; }

  const exportData = {
    exported_at:  new Date().toISOString(),
    app_version:  APP_VERSION,
    export_type:  'branch',
    parent_id:    currentId,
    nodes:        tree,
  };

  const filename = currentId
    ? `yggdrasil-rama-${currentId.slice(0, 8)}.json`
    : 'yggdrasil-export.json';

  downloadJson(exportData, filename);
  showToast('Rama exportada correctamente', 'success');
  window.closeModal('modal-import-export');
}

function downloadJson(data, filename) {
  const json    = JSON.stringify(data, null, 2);
  const blob    = new Blob([json], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const anchor  = document.createElement('a');
  anchor.href     = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// IMPORTAR
// =============================================================================

function handleImportFile(file) {
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    showToast('Solo se aceptan archivos .json', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      _importJsonData = parsed;

      // Mostrar preview
      const preview  = document.getElementById('import-preview');
      const textarea = document.getElementById('import-json-preview');
      const nameField = document.getElementById('import-name-field');
      const confirmBtn = document.getElementById('btn-confirm-import');

      if (textarea) textarea.value = JSON.stringify(parsed, null, 2);
      if (preview)  preview.hidden = false;
      if (nameField) nameField.hidden = false;
      if (confirmBtn) confirmBtn.hidden = false;

      showToast(`Archivo cargado: ${parsed.nodes?.length ?? 0} ramas raíz`, 'info');
    } catch {
      showToast('El archivo no es un JSON válido', 'error');
      _importJsonData = null;
    }
  };

  reader.readAsText(file);
}

async function confirmImport() {
  if (!_importJsonData || !_importJsonData.nodes) {
    showToast('No hay datos para importar', 'error');
    return;
  }

  const modifiedBy  = document.getElementById('import-modified-by')?.value.trim() || null;
  const targetParentId = _importJsonData.parent_id ?? getCurrentNodeId() ?? null;

  showLoading('Importando…');

  // Cargar plataformas para resolver nombres → IDs
  const { data: platforms } = await getPlatforms(false);
  const platformMap = {};
  (platforms || []).forEach(p => { platformMap[p.name.toLowerCase()] = p.id; });

  let importedCount = 0;

  try {
    await importNodes(_importJsonData.nodes, targetParentId, platformMap, modifiedBy, count => {
      importedCount += count;
    });

    await logAudit('create', 'node', null, `Importación masiva (${importedCount} elementos)`, modifiedBy, {
      imported_count: importedCount,
      source_file: 'import',
    });

    hideLoading();
    window.closeModal('modal-import-export');
    showToast(`Importación completada: ${importedCount} elementos`, 'success');
    await navigateTo(targetParentId, false);

  } catch (err) {
    hideLoading();
    showToast(`Error durante la importación: ${err.message}`, 'error');
  }
}

/**
 * Inserta nodos recursivamente.
 */
async function importNodes(nodes, parentId, platformMap, modifiedBy, onCount) {
  for (const nodeData of nodes) {
    // Crear el nodo
    const { data: newNode, error } = await createNode({
      name:        nodeData.name,
      description: nodeData.description || null,
      image_url:   nodeData.image_url || null,
      order_index: nodeData.order_index ?? 0,
      parent_id:   parentId,
      modified_by: modifiedBy,
    });

    if (error) throw new Error(`No se pudo crear la rama "${nodeData.name}": ${error.message}`);
    onCount(1);

    // Crear hojas del nodo
    if (nodeData.leaves && nodeData.leaves.length > 0) {
      for (const leafData of nodeData.leaves) {
        const platformId = platformMap[leafData.platform?.toLowerCase()];
        await createLeaf({
          node_id:     newNode.id,
          url:         leafData.url,
          label:       leafData.label || null,
          platform_id: platformId || null,
          image_url:   leafData.image_url || null,
          order_index: leafData.order_index ?? 0,
          modified_by: modifiedBy,
        });
        onCount(1);
      }
    }

    // Recursivo para los hijos
    if (nodeData.children && nodeData.children.length > 0) {
      await importNodes(nodeData.children, newNode.id, platformMap, modifiedBy, onCount);
    }
  }
}

function resetImportForm() {
  _importJsonData = null;
  const fileInput  = document.getElementById('import-file');
  const preview    = document.getElementById('import-preview');
  const nameField  = document.getElementById('import-name-field');
  const confirmBtn = document.getElementById('btn-confirm-import');
  const textarea   = document.getElementById('import-json-preview');
  const nameInput  = document.getElementById('import-modified-by');

  if (fileInput)  fileInput.value = '';
  if (textarea)   textarea.value = '';
  if (nameInput)  nameInput.value = '';
  if (preview)    preview.hidden = true;
  if (nameField)  nameField.hidden = true;
  if (confirmBtn) confirmBtn.hidden = true;
}

