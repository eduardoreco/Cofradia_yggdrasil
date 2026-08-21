# Plan: Fix Bug Modales + Reorganización Header

## Contexto

Dos problemas reportados:

1. **Bug modales**: El "Historial de cambios" se reabre solo después de cerrarse. Al cerrarlo se ve el modal de "Import/Export" detrás. El problema es que `audit.js` y `import-export.js` llaman `modal.removeAttribute('hidden')` directamente en lugar de usar el helper global `openModal()` de `app.js`. Como resultado, esos modales no tienen el atributo `hidden` y cuando el backdrop detecta un click, `document.querySelector('.modal-backdrop:not([hidden])')` los encuentra y los muestra.

2. **UX del header**: El header tiene 4 botones de íconos (Import/Export, Historial, Plataformas, Configuración) que son funcionalidades secundarias y ocupan espacio visual prominente. La app es principalmente un directorio de ramas — estas funciones deben estar agrupadas en un menú discreto.

---

## Sub-Tarea 1 — Fix del bug: modales que se reabren

**Intent:** Los modales de `audit.js` e `import-export.js` tienen sus propias copias locales de `openModal`/`closeModal` que no son compatibles con el sistema de control de modales de `tree.js`. `tree.js` detecta modales abiertos buscando `.modal-backdrop:not([hidden])`, pero estos módulos abren modales quitando el atributo `hidden` sin coordinarse. El fix es unificar: todos los módulos deben exportar sus funciones de apertura y usar los mismos helpers.

La causa raíz específica del "reabre solo": cuando `audit.js` hace `modal.removeAttribute('hidden')` sin agregar la animación ni registrarlo correctamente, el listener de Escape en `tree.js` encuentra el modal como "abierto" y lo cierra, pero después el backdrop recibe el evento de click del Escape y lo vuelve a detectar como un click en el fondo — causando que otro modal se muestre.

**Fix exacto:** Exponer `openModal` y `closeModal` de `app.js` globalmente (en `window`) para que todos los módulos puedan usarlos, y reemplazar las copias locales en `audit.js`, `import-export.js` y `platforms.js`.

**Expected Outcomes:**
- El modal de Historial se abre, se cierra, y no se reabre solo
- No aparece ningún modal detrás al cerrar otro
- El comportamiento de Escape funciona correctamente en todos los modales

**Todo List:**
1. En `js/app.js`: exponer `openModal` y `closeModal` en `window` — `window.openModal = openModal` y `window.closeModal = closeModal` (al final del archivo, después de las definiciones)
2. En `js/audit.js`: reemplazar `modal.removeAttribute('hidden')` y `modal.classList.remove('closing')` por `window.openModal('modal-audit')`
3. En `js/import-export.js`: eliminar las funciones locales `openModal` y `closeModal` y usar `window.openModal` / `window.closeModal` en todos los lugares donde se usan
4. En `js/platforms.js`: verificar si también tiene sus propias copias locales y reemplazarlas de igual forma

**Relevant Context:**
- `js/tree.js` línea 154–175: `initModalControls()` — el sistema global de modales
- `js/app.js` línea 311–322: definiciones de `openModal` y `closeModal`
- `js/audit.js` línea 42–44: abre el modal directamente sin usar el helper
- `js/import-export.js` líneas 260–272: tiene sus propias copias locales
- `js/platforms.js` líneas 221+: tiene sus propias copias locales

**Status:** [ ] pending

---

## Sub-Tarea 2 — Reorganizar el header: agrupar funciones secundarias en un menú "⋮"

**Intent:** El header actualmente muestra 4 botones de íconos en fila (Import/Export, Historial, Plataformas, Configuración). Estas son funciones de administración/complemento — no deben competir visualmente con el contenido principal. Se reemplazan por un único botón discreto "⋮" (más opciones) que despliega un dropdown con las 4 opciones. El header queda más limpio y la pantalla principal se enfoca en las ramas.

**Expected Outcomes:**
- El header solo muestra: Logo | Título | Barra de búsqueda | Saludo usuario | Botón "⋮"
- Al hacer click en "⋮" aparece un dropdown con: Historial de cambios, Importar/Exportar, Plataformas, Configuración
- El dropdown se cierra al hacer click fuera o al seleccionar una opción
- El dropdown tiene el mismo estilo que el `#fab-menu` (pill con sombra, bordes redondeados)
- El botón "⋮" usa la misma clase `.header-btn` que los botones actuales

**Todo List:**
1. En `index.html`: reemplazar los 4 botones del header (`#btn-import-export`, `#btn-audit`, `#btn-platforms`, `#btn-settings`) por un único botón `#btn-more` con ícono "⋮" (tres puntos verticales)
2. En `index.html`: agregar un `<div id="header-menu">` dropdown con 4 items (uno por cada función), con el mismo estilo visual del `#fab-menu`
3. En `css/layout.css`: agregar estilos para `#header-menu` — posicionado absolutamente debajo del botón "⋮", mismo look que `#fab-menu` pero con fondo blanco y borde
4. En `js/app.js`: agregar `initHeaderMenu()` que:
   - Toggle del dropdown al hacer click en `#btn-more`
   - Cierra al hacer click fuera
   - Cada item del dropdown dispara el `click` del botón original (reutilizando la lógica existente de `audit.js`, `import-export.js`, etc.)
5. Llamar `initHeaderMenu()` dentro de `initApp()`

**Relevant Context:**
- `index.html` líneas 82–116: los 4 botones actuales en `.header-actions`
- `css/layout.css`: estilos de `.fab-menu-item`, `#fab-menu` que se reutilizan como referencia visual
- `js/app.js` función `initApp()`: donde se llaman los `init*` de cada módulo

**Status:** [ ] pending

---

## Notas

- La Sub-Tarea 1 (bug) es independiente y debe hacerse primero — es un fix crítico.
- La Sub-Tarea 2 es mejora de UX — no rompe nada existente, solo reorganiza el HTML del header y agrega lógica de dropdown.
- Los IDs de los botones originales (`#btn-audit`, `#btn-import-export`, etc.) se mantienen en el DOM para no romper los listeners existentes en cada módulo — simplemente se mueven adentro del dropdown o se usan como disparadores internos.
