// =============================================================================
// app.js — Punto de entrada principal de la aplicación
// Cofradía Yggdrasil
//
// Este archivo inicializa todos los módulos en el orden correcto y arranca la app.
// =============================================================================

import { getSettings, setSetting, logAudit } from './supabase.js';
import { showToast, showLoading, hideLoading } from './render.js';
import { loadPlatforms, initPlatformControls } from './platforms.js';
import { navigateTo, initTreeControls, initBranchSave, initLeafSave, initDeleteConfirm } from './tree.js';
import { initSearch } from './search.js';
import { initImportExport } from './import-export.js';
import { initAudit } from './audit.js';
import { uploadFile, initUploadZone, showImagePreview } from './upload.js';

// =============================================================================
// LOGIN DUMMY
// =============================================================================

/**
 * Muestra la pantalla de login si no hay usuario en sessionStorage.
 * Si ya existe, salta directamente a la app.
 */
function initLogin() {
  const savedUser = sessionStorage.getItem('ygg_user');

  if (savedUser) {
    // Ya hay sesión → mostrar app directamente
    _enterApp(savedUser, false);
    return;
  }

  // Sin sesión → la pantalla de login ya es visible por defecto (no hidden)
  // Configurar listeners
  const btn      = document.getElementById('login-btn');
  const input    = document.getElementById('login-username');

  function handleEnter() {
    const name = input?.value.trim();
    if (!name) {
      // Shake animation si el campo está vacío
      input?.classList.add('shake');
      setTimeout(() => input?.classList.remove('shake'), 400);
      input?.focus();
      return;
    }
    sessionStorage.setItem('ygg_user', name);

    // Animar salida del login
    const loginScreen = document.getElementById('login-screen');
    loginScreen?.classList.add('login-exit');

    setTimeout(() => {
      _enterApp(name, true);
    }, 350);
  }

  btn?.addEventListener('click', handleEnter);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleEnter();
  });

  // Foco automático en el input
  setTimeout(() => input?.focus(), 100);
}

/**
 * Muestra la app y arranca la inicialización.
 * @param {string} userName  nombre del usuario logueado
 * @param {boolean} animate  si se debe hacer fade-in del app wrapper
 */
function _enterApp(userName, animate) {
  const loginScreen = document.getElementById('login-screen');
  const appEl       = document.getElementById('app');

  if (loginScreen) loginScreen.style.display = 'none';
  if (appEl) {
    appEl.classList.remove('hidden');
    if (animate) {
      appEl.style.opacity = '0';
      appEl.style.transition = 'opacity 0.3s ease';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { appEl.style.opacity = '1'; });
      });
    }
  }

  initApp(userName);
}

// =============================================================================
// ARRANQUE DE LA APP
// =============================================================================

async function initApp(userName = null) {
  showLoading('Iniciando Yggdrasil…');

  try {
    // 1. Cargar configuración global (logo, título)
    await loadSettings();

    // 2. Cargar plataformas al cache
    await loadPlatforms();

    // 3. Inicializar controles del árbol (FAB, navegación, modales)
    initTreeControls();
    initBranchSave();
    initLeafSave();
    initDeleteConfirm();

    // 4. Inicializar búsqueda
    initSearch();

    // 5. Inicializar importar/exportar
    initImportExport();

    // 6. Inicializar auditoría
    initAudit();

    // 7. Inicializar controles de plataformas
    initPlatformControls();

    // 8. Inicializar configuración global
    initSettingsModal();

    // 9. Inicializar menú dropdown del header
    initHeaderMenu();

    // 10. Mostrar saludo en el header
    _applyUserGreeting(userName || sessionStorage.getItem('ygg_user'));

    // 11. Pre-rellenar campos "Tu nombre" en modales con el nombre del usuario
    _prefillModifierFields(userName || sessionStorage.getItem('ygg_user'));

    // 12. Navegar al nodo indicado en la URL (o a la raíz)
    const urlParams  = new URLSearchParams(window.location.search);
    const nodeId     = urlParams.get('node') || null;
    await navigateTo(nodeId, false);

  } catch (err) {
    hideLoading();
    showToast(`Error al iniciar la aplicación: ${err.message}`, 'error');
    console.error('[Yggdrasil] Error de inicialización:', err);
  }
}

// =============================================================================
// CONFIGURACIÓN GLOBAL (Settings)
// =============================================================================

/** Carga los settings desde Supabase y los aplica a la UI */
async function loadSettings() {
  const { data: settings } = await getSettings();

  // Aplicar título
  const title = settings?.app_title || 'Cofradía Yggdrasil';
  applyTitle(title);

  // Aplicar logo (header + pantalla de login, por si vuelve a mostrarse)
  const logoUrl = settings?.logo_url || '';
  applyLogo(logoUrl, settings?.logo_alt || 'Logo');

  // Sincronizar logo en la pantalla de login
  if (logoUrl) {
    const loginLogoImg         = document.getElementById('login-logo-img');
    const loginLogoPlaceholder = document.getElementById('login-logo-placeholder');
    if (loginLogoImg) {
      loginLogoImg.src          = logoUrl;
      loginLogoImg.style.display = 'block';
    }
    if (loginLogoPlaceholder) loginLogoPlaceholder.style.display = 'none';
  }
}

function applyTitle(title) {
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) headerTitle.textContent = title;
  document.title = title;
}

function applyLogo(url, alt = 'Logo') {
  const logoContainer = document.getElementById('header-logo');
  const placeholder   = document.getElementById('header-logo-placeholder');

  if (!logoContainer) return;

  if (url) {
    // Reemplazar placeholder con imagen real
    if (placeholder) {
      const img = document.createElement('img');
      img.src   = url;
      img.alt   = alt;
      placeholder.replaceWith(img);
    }
  }
  // Si no hay URL, el emoji placeholder se mantiene
}

// =============================================================================
// MODAL DE CONFIGURACIÓN
// =============================================================================

let _settingsPendingLogoFile = null;

function initSettingsModal() {
  const btnSettings = document.getElementById('btn-settings');
  btnSettings?.addEventListener('click', openSettingsModal);

  const btnSave = document.getElementById('btn-save-settings');
  btnSave?.addEventListener('click', saveSettings);

  // Upload zone del logo
  initUploadZone(
    'settings-upload-zone',
    'settings-logo-file',
    'settings-logo-preview-wrap',
    'settings-logo-preview',
    file => { _settingsPendingLogoFile = file; }
  );

  // Preview en vivo por URL
  const urlInput = document.getElementById('settings-logo-url');
  urlInput?.addEventListener('input', () => {
    showImagePreview('settings-logo-preview-wrap', 'settings-logo-preview', urlInput.value.trim());
  });
}

async function openSettingsModal() {
  _settingsPendingLogoFile = null;

  // Pre-cargar valores actuales
  const { data: settings } = await getSettings();

  const titleInput = document.getElementById('settings-app-title');
  const urlInput   = document.getElementById('settings-logo-url');

  if (titleInput) titleInput.value = settings?.app_title || '';
  if (urlInput)   urlInput.value   = settings?.logo_url  || '';

  if (settings?.logo_url) {
    showImagePreview('settings-logo-preview-wrap', 'settings-logo-preview', settings.logo_url);
  }

  openModal('modal-settings');
}

async function saveSettings() {
  const title      = document.getElementById('settings-app-title')?.value.trim();
  const logoUrlVal = document.getElementById('settings-logo-url')?.value.trim();

  showLoading('Guardando configuración…');

  let logoUrl = logoUrlVal || null;

  // Subir logo si hay archivo pendiente
  if (_settingsPendingLogoFile) {
    const { url, error } = await uploadFile(_settingsPendingLogoFile, 'logos');
    if (error) {
      hideLoading();
      showToast(`Error al subir logo: ${error.message}`, 'error');
      return;
    }
    logoUrl = url;
  }

  // Guardar cada setting
  const saves = [];
  if (title)   saves.push(setSetting('app_title', title));
  if (logoUrl) saves.push(setSetting('logo_url', logoUrl));

  const results = await Promise.all(saves);
  const firstError = results.find(r => r.error);

  hideLoading();

  if (firstError) {
    showToast(`Error al guardar: ${firstError.error.message}`, 'error');
    return;
  }

  // Aplicar cambios en tiempo real
  if (title)   applyTitle(title);
  if (logoUrl) applyLogoLive(logoUrl);

  await logAudit('update', 'setting', null, 'Configuración global', null, { title, logoUrl });

  closeModal('modal-settings');
  showToast('Configuración guardada', 'success');
}

function applyLogoLive(url) {
  const logoContainer = document.getElementById('header-logo');
  if (!logoContainer) return;

  let img = logoContainer.querySelector('img');
  if (!img) {
    // Reemplazar el placeholder
    const placeholder = document.getElementById('header-logo-placeholder');
    if (placeholder) {
      img = document.createElement('img');
      img.alt = 'Logo';
      placeholder.replaceWith(img);
    } else {
      return;
    }
  }
  img.src = url;
}

// =============================================================================
// HELPERS GLOBALES DE MODAL
// =============================================================================

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.removeAttribute('hidden');
  el.classList.remove('closing');
  const firstInput = el.querySelector('input:not([type="hidden"]), textarea');
  setTimeout(() => firstInput?.focus(), 50);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('closing');
  setTimeout(() => { el.setAttribute('hidden', ''); el.classList.remove('closing'); }, 300);
}

// =============================================================================
// HEADER DROPDOWN MENU
// =============================================================================

function initHeaderMenu() {
  const btnMore  = document.getElementById('btn-more');
  const menuWrap = document.getElementById('header-menu-wrap');
  const menu     = document.getElementById('header-menu');

  if (!btnMore || !menu) return;

  // Toggle al hacer click en ⋮
  btnMore.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !menu.hidden;
    if (isOpen) {
      _closeHeaderMenu(btnMore, menu);
    } else {
      menu.hidden = false;
      btnMore.setAttribute('aria-expanded', 'true');
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', e => {
    if (!menuWrap?.contains(e.target)) {
      _closeHeaderMenu(btnMore, menu);
    }
  });

  // Cerrar al seleccionar cualquier item del menú
  menu.addEventListener('click', () => {
    _closeHeaderMenu(btnMore, menu);
  });
}

function _closeHeaderMenu(btn, menu) {
  menu.hidden = true;
  btn?.setAttribute('aria-expanded', 'false');
}

// =============================================================================
// HELPERS DE USUARIO
// =============================================================================

/** Muestra el saludo del usuario en el header */
function _applyUserGreeting(name) {
  const el = document.getElementById('header-user-greeting');
  if (!el || !name) return;
  el.textContent = `👤 ${name}`;
  el.style.display = 'flex';
}

/** Pre-rellena todos los campos "Tu nombre" con el nombre guardado */
function _prefillModifierFields(name) {
  if (!name) return;
  const fields = [
    'branch-modified-by',
    'leaf-modified-by',
    'delete-modified-by',
    'import-modified-by',
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = name;
  });
}

// =============================================================================
// EXPONER HELPERS GLOBALES (para módulos que no pueden importar desde app.js)
// =============================================================================

window.openModal  = openModal;
window.closeModal = closeModal;

// =============================================================================
// ARRANCAR
// =============================================================================
document.addEventListener('DOMContentLoaded', initLogin);
