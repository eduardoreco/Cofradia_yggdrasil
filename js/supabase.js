// =============================================================================
// supabase.js — Cliente central de Supabase
// Cofradía Yggdrasil
//
// TODAS las operaciones de base de datos pasan por este módulo.
// Nunca llames al SDK de Supabase directamente desde otros módulos.
// Todas las funciones retornan { data, error }.
// =============================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY, STORAGE_BUCKET } from '../config/supabase-config.js';

// ---- Cliente singleton -------------------------------------------------------
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================================================
// NODES (Ramas del árbol)
// =============================================================================

/**
 * Obtiene los nodos hijos de un parent_id dado.
 * Si parentId es null, devuelve las ramas raíz.
 */
export async function getNodes(parentId = null) {
  const query = supabase
    .from('nodes')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (parentId === null) {
    query.is('parent_id', null);
  } else {
    query.eq('parent_id', parentId);
  }

  return await query;
}

/** Obtiene un nodo por su id. */
export async function getNodeById(id) {
  return await supabase
    .from('nodes')
    .select('*')
    .eq('id', id)
    .single();
}

/**
 * Obtiene la cadena de ancestros de un nodo (para construir el breadcrumb).
 * Retorna un array ordenado de raíz a nodo actual.
 */
export async function getNodeAncestors(nodeId) {
  const ancestors = [];
  let currentId = nodeId;

  while (currentId) {
    const { data, error } = await getNodeById(currentId);
    if (error || !data) break;
    ancestors.unshift(data);
    currentId = data.parent_id;
  }

  return { data: ancestors, error: null };
}

/** Crea un nuevo nodo. */
export async function createNode(nodeData) {
  return await supabase
    .from('nodes')
    .insert([nodeData])
    .select()
    .single();
}

/** Actualiza un nodo existente. */
export async function updateNode(id, updates) {
  return await supabase
    .from('nodes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

/** Elimina un nodo (y sus hijos por CASCADE en la BD). */
export async function deleteNode(id) {
  return await supabase
    .from('nodes')
    .delete()
    .eq('id', id);
}

/** Cuenta los hijos directos de un nodo. */
export async function countChildren(parentId) {
  const { count, error } = await supabase
    .from('nodes')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', parentId);
  return { data: count ?? 0, error };
}

// =============================================================================
// LEAVES (Hojas / links)
// =============================================================================

/** Obtiene todas las hojas de un nodo. */
export async function getLeaves(nodeId) {
  return await supabase
    .from('leaves')
    .select('*, platforms(id, name, icon_url, color)')
    .eq('node_id', nodeId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
}

/** Obtiene una hoja por su id. */
export async function getLeafById(id) {
  return await supabase
    .from('leaves')
    .select('*, platforms(id, name, icon_url, color)')
    .eq('id', id)
    .single();
}

/** Crea una nueva hoja. */
export async function createLeaf(leafData) {
  return await supabase
    .from('leaves')
    .insert([leafData])
    .select('*, platforms(id, name, icon_url, color)')
    .single();
}

/** Actualiza una hoja existente. */
export async function updateLeaf(id, updates) {
  return await supabase
    .from('leaves')
    .update(updates)
    .eq('id', id)
    .select('*, platforms(id, name, icon_url, color)')
    .single();
}

/** Elimina una hoja. */
export async function deleteLeaf(id) {
  return await supabase
    .from('leaves')
    .delete()
    .eq('id', id);
}

// =============================================================================
// PLATFORMS (Catálogo de plataformas)
// =============================================================================

/** Obtiene todas las plataformas activas. */
export async function getPlatforms(onlyActive = true) {
  const query = supabase
    .from('platforms')
    .select('*')
    .order('name', { ascending: true });

  if (onlyActive) {
    query.eq('is_active', true);
  }

  return await query;
}

/** Obtiene todas las plataformas (activas e inactivas) para el panel de gestión. */
export async function getAllPlatforms() {
  return getPlatforms(false);
}

/** Crea una nueva plataforma. */
export async function createPlatform(platformData) {
  return await supabase
    .from('platforms')
    .insert([platformData])
    .select()
    .single();
}

/** Actualiza una plataforma. */
export async function updatePlatform(id, updates) {
  return await supabase
    .from('platforms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

/** Activa o desactiva una plataforma. */
export async function togglePlatform(id, isActive) {
  return updatePlatform(id, { is_active: isActive });
}

// =============================================================================
// APP SETTINGS (Configuración global)
// =============================================================================

/** Obtiene todos los settings como un objeto clave→valor. */
export async function getSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value');

  if (error) return { data: {}, error };

  const settings = {};
  (data || []).forEach(row => { settings[row.key] = row.value; });
  return { data: settings, error: null };
}

/** Guarda un setting. Hace upsert (inserta o actualiza). */
export async function setSetting(key, value) {
  return await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();
}

// =============================================================================
// AUDIT LOG (Historial de cambios)
// =============================================================================

/**
 * Registra una acción en el historial.
 * @param {string} action        - 'create' | 'update' | 'delete'
 * @param {string} entityType    - 'node' | 'leaf' | 'platform' | 'setting'
 * @param {string} entityId      - UUID del elemento afectado
 * @param {string} entityName    - Nombre legible del elemento
 * @param {string|null} modifiedBy - Nombre del modificador (puede ser null)
 * @param {object} changes       - Snapshot de los cambios
 */
export async function logAudit(action, entityType, entityId, entityName, modifiedBy, changes = {}) {
  return await supabase
    .from('audit_log')
    .insert([{
      action,
      entity_type: entityType,
      entity_id:   entityId,
      entity_name: entityName,
      modified_by: modifiedBy || null,
      changes,
    }]);
}

/** Obtiene los últimos N registros del historial. */
export async function getAuditLog(limit = 50) {
  return await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
}

// =============================================================================
// SEARCH (Búsqueda)
// =============================================================================

/**
 * Busca en nodos y hojas usando ILIKE (case-insensitive).
 * Retorna { nodes: [], leaves: [] }
 */
export async function search(query) {
  const pattern = `%${query}%`;

  const [nodesResult, leavesResult] = await Promise.all([
    supabase
      .from('nodes')
      .select('id, name, description, type, parent_id, image_url')
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order('name')
      .limit(20),

    supabase
      .from('leaves')
      .select('id, label, url, node_id, platforms(name, icon_url)')
      .or(`label.ilike.${pattern},url.ilike.${pattern}`)
      .order('label')
      .limit(20),
  ]);

  return {
    data: {
      nodes:  nodesResult.data  || [],
      leaves: leavesResult.data || [],
    },
    error: nodesResult.error || leavesResult.error,
  };
}

// =============================================================================
// STORAGE (Subida de imágenes)
// =============================================================================

/**
 * Sube un archivo a Supabase Storage y retorna la URL pública.
 * @param {File} file   - Archivo a subir
 * @param {string} path - Ruta dentro del bucket (ej: 'nodes/uuid.jpg')
 */
export async function uploadImage(file, path) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) return { data: null, error };

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return { data: urlData.publicUrl, error: null };
}

/** Elimina un archivo del Storage por su path. */
export async function deleteImage(path) {
  return await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);
}

// =============================================================================
// EXPORT TREE (para importar/exportar)
// =============================================================================

/**
 * Obtiene el árbol completo (o a partir de un nodo) de forma recursiva.
 * Para exportación — no usar para renderizado (usar getNodes en su lugar).
 */
export async function getFullTree(parentId = null) {
  const { data: nodes, error } = await getNodes(parentId);
  if (error) return { data: [], error };

  const result = [];

  for (const node of nodes) {
    const [childrenResult, leavesResult] = await Promise.all([
      getFullTree(node.id),
      getLeaves(node.id),
    ]);

    result.push({
      ...node,
      children: childrenResult.data || [],
      leaves:   leavesResult.data   || [],
    });
  }

  return { data: result, error: null };
}
