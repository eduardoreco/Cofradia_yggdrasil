// =============================================================================
// upload.js — Subida de imágenes a Supabase Storage
// Cofradía Yggdrasil
// =============================================================================

import { uploadImage } from './supabase.js';

/**
 * Genera un path único para almacenar una imagen.
 * @param {string} folder - Carpeta dentro del bucket (ej: 'nodes', 'logos')
 * @param {string} ext    - Extensión del archivo (ej: 'jpg')
 */
function generatePath(folder, ext) {
  const timestamp = Date.now();
  const random    = Math.random().toString(36).slice(2, 8);
  return `${folder}/${timestamp}_${random}.${ext}`;
}

/**
 * Sube un File al Storage y retorna la URL pública.
 * @param {File}   file   - Objeto File del input
 * @param {string} folder - Carpeta destino ('nodes' | 'leaves' | 'logos' | 'platforms')
 * @returns {Promise<{url: string|null, error: Error|null}>}
 */
export async function uploadFile(file, folder = 'misc') {
  if (!file) return { url: null, error: new Error('No se proporcionó archivo') };

  // Validar tamaño (máx 5 MB)
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) {
    return { url: null, error: new Error(`El archivo excede los ${MAX_MB} MB`) };
  }

  // Validar tipo
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return { url: null, error: new Error('Tipo de archivo no permitido') };
  }

  const ext  = file.name.split('.').pop().toLowerCase();
  const path = generatePath(folder, ext);

  const { data: url, error } = await uploadImage(file, path);
  return { url, error };
}

// =============================================================================
// Helpers para los upload zones del HTML
// =============================================================================

/**
 * Inicializa una zona de subida (drag & drop + click).
 * @param {string}   zoneId       - ID del elemento .upload-zone
 * @param {string}   fileInputId  - ID del <input type="file">
 * @param {string}   previewWrapId- ID del contenedor de preview
 * @param {string}   previewImgId - ID del <img> de preview
 * @param {Function} onFileSelect - Callback(file) cuando se selecciona un archivo
 */
export function initUploadZone(zoneId, fileInputId, previewWrapId, previewImgId, onFileSelect) {
  const zone      = document.getElementById(zoneId);
  const fileInput = document.getElementById(fileInputId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg  = document.getElementById(previewImgId);

  if (!zone || !fileInput) return;

  // Click en la zona → abre el selector de archivos
  zone.addEventListener('click', () => fileInput.click());

  // Drag & drop
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Selección via input
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    // Mostrar preview
    if (previewWrap && previewImg) {
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewWrap.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
    onFileSelect(file);
  }
}

/**
 * Muestra un preview de imagen a partir de una URL.
 */
export function showImagePreview(previewWrapId, previewImgId, url) {
  const wrap = document.getElementById(previewWrapId);
  const img  = document.getElementById(previewImgId);
  if (!wrap || !img) return;

  if (url) {
    img.src = url;
    wrap.classList.remove('hidden');
  } else {
    img.src = '';
    wrap.classList.add('hidden');
  }
}

/**
 * Limpia la zona de upload y el preview.
 */
export function clearUploadZone(fileInputId, previewWrapId, previewImgId) {
  const fileInput  = document.getElementById(fileInputId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg  = document.getElementById(previewImgId);
  if (fileInput)   fileInput.value = '';
  if (previewImg)  previewImg.src = '';
  if (previewWrap) previewWrap.classList.add('hidden');
}
