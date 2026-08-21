# Plan: Cofradía Yggdrasil — Directorio Temático Web

## Credenciales Supabase
- **Project URL:** `https://rpyncgrqugtcbwheiaux.supabase.co`
- **Publishable (anon) key:** `sb_publishable_6JBuaT8aZEw-TZs8s2TAFA_69uhiRfn`
- **Storage bucket a crear:** `yggdrasil-images`

## Top-Level Overview

Aplicación web SPA (Single Page Application) construida con **HTML5 + CSS + JavaScript vanilla** y **Supabase** como backend (base de datos PostgreSQL + Storage). El objetivo es crear un árbol de directorios temático navegable, donde cada nodo (rama o hoja) representa un tema, sub-tema o link a una plataforma externa. La interfaz es moderna, modular, con colores azul/rojo/amarillo armoniosos y completamente responsiva.

El proyecto se llamará **Cofradia_yggdrasil** en Supabase.

### Principios de diseño
- **Modularidad máxima**: cada funcionalidad en su propio archivo JS/CSS independiente
- **Sin framework pesado**: JS vanilla + módulos ES6 (import/export)
- **Escalabilidad futura**: estructura preparada para login, Google Auth y ramas protegidas
- **Texto plano friendly**: importación/exportación en JSON legible (editable en bloc de notas)

---

## Arquitectura de la Aplicación

```
Cofradia_yggdrasil/
├── index.html               ← SPA principal
├── css/
│   ├── main.css             ← Variables globales, reset, tipografía
│   ├── layout.css           ← Estructura de página, header, sidebar
│   ├── cards.css            ← Estilos de tarjetas/cards del árbol
│   ├── modal.css            ← Modales de edición/creación
│   ├── search.css           ← Barra y resultados de búsqueda
│   └── theme.css            ← Paleta de colores (azul/rojo/amarillo)
├── js/
│   ├── app.js               ← Punto de entrada, inicialización
│   ├── supabase.js          ← Cliente Supabase y queries (módulo)
│   ├── tree.js              ← Lógica del árbol (CRUD de nodos)
│   ├── render.js            ← Renderizado de cards y vistas
│   ├── search.js            ← Motor de búsqueda
│   ├── platforms.js         ← Catálogo de plataformas configurable
│   ├── import-export.js     ← Importar/exportar JSON texto plano
│   ├── upload.js            ← Subida de imágenes a Supabase Storage
│   └── audit.js             ← Registro de modificaciones (quién/cuándo)
├── assets/
│   ├── logo/                ← Logo institucional global
│   └── icons/               ← Íconos de plataformas (default set)
└── config/
    └── platforms-default.json  ← Plataformas predefinidas (YouTube, etc.)
```

---

## Modelo de Datos (Supabase / PostgreSQL)

### Tabla: `nodes`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador único |
| parent_id | uuid FK → nodes.id | NULL si es rama principal |
| name | text | Nombre del nodo |
| description | text | Descripción opcional |
| type | text | `'branch'` o `'leaf'` |
| image_url | text | URL de imagen (Storage o externa) |
| order_index | integer | Orden entre hermanos |
| is_protected | boolean | Para escalar a protección futura |
| created_at | timestamp | Auto |
| updated_at | timestamp | Auto |
| modified_by | text | Nombre libre (opcional) |

### Tabla: `leaves` (hojas/links)
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador único |
| node_id | uuid FK → nodes.id | Nodo padre (rama) |
| platform_id | uuid FK → platforms.id | Plataforma asociada |
| url | text | URL del link |
| label | text | Etiqueta personalizada |
| image_url | text | Imagen personalizada del link |
| order_index | integer | Orden |
| created_at | timestamp | Auto |
| modified_by | text | Nombre libre (opcional) |

### Tabla: `platforms`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador único |
| name | text | Nombre (YouTube, TikTok...) |
| icon_url | text | URL del ícono |
| base_url | text | URL base de la plataforma |
| color | text | Color representativo hex |
| is_active | boolean | Visible en el catálogo |

### Tabla: `app_settings`
| Campo | Tipo | Descripción |
|---|---|---|
| key | text PK | Clave de configuración |
| value | text | Valor (JSON string si es complejo) |

> Ejemplos de keys: `logo_url`, `app_title`, `primary_color`

### Tabla: `audit_log`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| action | text | `'create'`, `'update'`, `'delete'` |
| entity_type | text | `'node'`, `'leaf'`, `'platform'` |
| entity_id | uuid | ID del elemento modificado |
| modified_by | text | Nombre libre (puede ser null) |
| changes | jsonb | Snapshot de los cambios |
| created_at | timestamp | Auto |

---

## Sub-Tareas

---

### ST-01 — Configuración del Proyecto Supabase
**Status:** `[ ] pending`

**Intent:**
Crear el proyecto `Cofradia_yggdrasil` en Supabase, definir todas las tablas, políticas de seguridad RLS (Row Level Security abierto por ahora, preparado para escalar), y el bucket de Storage para imágenes.

**Expected Outcomes:**
- Proyecto Supabase creado con URL y anon key disponibles
- Todas las tablas creadas con sus relaciones
- Bucket `yggdrasil-images` en Storage con acceso público de lectura
- RLS habilitado pero con políticas abiertas (preparado para restricción futura)

**Todo List:**
1. El usuario crea el proyecto `Cofradia_yggdrasil` en su cuenta Supabase y nos comparte la `Project URL` y la `anon public key`
2. Crear el archivo `supabase/schema.sql` con todos los `CREATE TABLE`, índices y relaciones
3. Crear el archivo `supabase/rls.sql` con políticas RLS abiertas (allow all) pero con estructura lista para protección
4. Crear el archivo `supabase/seed.sql` con las plataformas por defecto (YouTube, TikTok, Patreon, Instagram, Facebook, X/Twitter, Twitch, LinkedIn)
5. Crear el bucket `yggdrasil-images` con política de acceso público de lectura
6. Documentar en `README.md` cómo ejecutar los scripts en el SQL Editor de Supabase

**Relevant Context:**
- Escalabilidad futura: campo `is_protected` en `nodes`, estructura de `audit_log`
- RLS debe quedar comentado con `-- TODO: restrict when auth is enabled`

---

### ST-02 — Estructura Base HTML + CSS (Tema Visual)
**Status:** `[ ] pending`

**Intent:**
Crear la estructura HTML del SPA y el sistema de estilos modular con la paleta azul/rojo/amarillo. Establecer las variables CSS globales que usarán todos los demás módulos.

**Expected Outcomes:**
- `index.html` con estructura semántica completa (header, nav, main, modales placeholders)
- Variables CSS definidas en `theme.css` con paleta armoniosa
- Header con logo institucional, título y barra de búsqueda
- Responsivo (mobile-first)
- Fuentes modernas (Google Fonts: recomendado Inter o Poppins)

**Paleta de colores propuesta:**
- Azul primario: `#1A3A6B` (oscuro, autoridad)
- Azul claro: `#2E6DB4` (interactivo, hover)
- Rojo acento: `#C0392B` (alertas, botones de acción)
- Amarillo dorado: `#F0A500` (destacados, badges)
- Fondo: `#F4F6FA` (gris muy claro, no blanco puro)
- Texto: `#1C1C2E` (casi negro, mejor legibilidad)

**Todo List:**
1. Crear `index.html` con secciones: `#header`, `#breadcrumb`, `#tree-view`, `#search-overlay`, y contenedores de modales vacíos
2. Crear `css/theme.css` con todas las variables CSS (`--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`)
3. Crear `css/main.css` con reset CSS moderno y tipografía
4. Crear `css/layout.css` con el layout general responsive (flexbox/grid)
5. Crear `css/cards.css` con el diseño de las tarjetas de ramas y hojas
6. Crear `css/modal.css` con estilos de modales de edición
7. Crear `css/search.css` con estilos del overlay de búsqueda
8. Agregar placeholder de logo en el header (configurable desde `app_settings`)

**Relevant Context:**
- Diseño de cards: click en rama → muestra sub-ramas como grid de cards
- Breadcrumb de navegación siempre visible para saber en qué nivel se está

---

### ST-03 — Módulo Supabase Client (`supabase.js`)
**Status:** `[ ] pending`

**Intent:**
Crear el módulo central de comunicación con Supabase. Todas las operaciones de base de datos pasan por aquí. Esto aísla la dependencia de Supabase del resto de la app.

**Expected Outcomes:**
- Un solo archivo con todas las funciones CRUD para `nodes`, `leaves`, `platforms`, `app_settings` y `audit_log`
- Configuración via variables de entorno o archivo `config.js` (no hardcodeado en HTML)
- Fácil de sustituir si se cambia de backend

**Todo List:**
1. Crear `config/supabase-config.js` con `SUPABASE_URL` y `SUPABASE_ANON_KEY` (el usuario llena sus credenciales aquí)
2. Crear `js/supabase.js` importando el SDK de Supabase via CDN ESM
3. Implementar funciones: `getNodes(parentId)`, `getNodeById(id)`, `createNode(data)`, `updateNode(id, data)`, `deleteNode(id)`
4. Implementar funciones: `getLeaves(nodeId)`, `createLeaf(data)`, `updateLeaf(id, data)`, `deleteLeaf(id)`
5. Implementar funciones: `getPlatforms()`, `createPlatform(data)`, `updatePlatform(id, data)`
6. Implementar funciones: `getSettings()`, `setSetting(key, value)`
7. Implementar función: `logAudit(action, entityType, entityId, modifiedBy, changes)`
8. Todas las funciones retornan `{ data, error }` — manejo de errores centralizado

**Relevant Context:**
- Usar Supabase JS SDK v2 via CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `config/supabase-config.js` debe estar en `.gitignore` si se usa git

---

### ST-04 — Módulo del Árbol y Navegación por Cards (`tree.js` + `render.js`)
**Status:** `[ ] pending`

**Intent:**
Implementar la navegación principal de la app: vista de cards por nivel. Click en una rama muestra sus hijos como un grid de cards. Breadcrumb siempre visible. Es el corazón de la experiencia de usuario.

**Expected Outcomes:**
- Vista inicial: cards de ramas principales (parent_id = null)
- Click en rama → navega al nivel siguiente mostrando sus hijos
- Breadcrumb actualizado en cada navegación
- Cards de ramas muestran: imagen, nombre, descripción, contador de hijos
- Cards de hojas muestran: ícono de plataforma, label, botón de ir al link
- Botón "+" siempre visible para agregar nueva rama/hoja al nivel actual
- Botón de editar/eliminar en cada card (ícono pequeño, no invasivo)

**Todo List:**
1. Crear `js/tree.js` con la lógica de estado: `currentNodeId`, `breadcrumbPath[]`, funciones `navigateTo(nodeId)`, `navigateBack()`
2. Crear `js/render.js` con funciones: `renderBranchCards(nodes)`, `renderLeafCards(leaves)`, `renderBreadcrumb(path)`, `renderEmptyState()`
3. Implementar animación de transición entre niveles (CSS transition, no librería)
4. Agregar indicador visual de tipo de nodo (ícono de carpeta para ramas, ícono de link para hojas)
5. Botón flotante "+" fijo en esquina inferior derecha para agregar al nivel actual
6. Al llegar a un nodo que tiene hojas, mostrar las hojas debajo de las sub-ramas

**Relevant Context:**
- Estado de navegación: guardar en `history` del navegador para que el botón "atrás" funcione
- Orden de cards: por `order_index` ASC

---

### ST-05 — Modales de Creación y Edición (`tree.js` modales)
**Status:** `[ ] pending`

**Intent:**
Implementar los formularios modales para crear/editar ramas y hojas. Incluye el campo opcional "modificado por", subida de imagen o URL externa, y selección de plataforma para hojas.

**Expected Outcomes:**
- Modal para crear/editar **rama**: nombre, descripción, imagen (subir archivo O URL externa), orden
- Modal para crear/editar **hoja/link**: seleccionar plataforma del catálogo, URL, label, imagen opcional, orden
- Campo "Tu nombre (opcional)" presente en ambos modales
- Confirmación de eliminación con nombre de quién elimina
- Registro automático en `audit_log` en cada operación

**Todo List:**
1. Crear HTML de modales en `index.html`: `#modal-branch`, `#modal-leaf`, `#modal-confirm-delete`
2. En `js/tree.js` implementar: `openCreateBranchModal(parentId)`, `openEditBranchModal(nodeId)`, `openCreateLeafModal(nodeId)`, `openEditLeafModal(leafId)`
3. Implementar lógica de imagen: toggle entre "Subir archivo" y "URL externa" dentro del modal
4. Conectar con `js/upload.js` para subida a Supabase Storage
5. Conectar con `js/platforms.js` para el selector de plataforma en modal de hoja
6. Implementar validación mínima: solo `name` es requerido en rama; `url` y `platform` requeridos en hoja
7. Al guardar: llamar `logAudit()` con los datos del cambio y el nombre capturado

**Relevant Context:**
- Campo `modified_by` es opcional — si está vacío, guardar como `null` o `'Anónimo'`
- Preparar estructura del modal para que en el futuro se pueda agregar campo de contraseña de protección

---

### ST-06 — Módulo de Plataformas (`platforms.js`)
**Status:** `[ ] pending`

**Intent:**
Implementar el catálogo configurable de plataformas (YouTube, TikTok, etc.) con su panel de administración. Las plataformas son independientes y reutilizables como ícono+nombre en cualquier hoja.

**Expected Outcomes:**
- Panel de administración de plataformas accesible desde el header (ícono de configuración)
- Lista de plataformas con ícono, nombre, color representativo
- Agregar nueva plataforma: nombre, ícono (subir o URL), color, URL base
- Editar/desactivar plataforma existente
- Las plataformas inactivas no aparecen en el selector de hojas

**Todo List:**
1. Crear `js/platforms.js` con funciones: `loadPlatforms()`, `renderPlatformCatalog()`, `openAddPlatformModal()`, `savePlatform(data)`
2. Crear el modal `#modal-platform` en `index.html`
3. Implementar el panel lateral o modal de gestión de plataformas
4. Agregar el set de íconos por defecto en `assets/icons/` (SVG simples de YouTube, TikTok, Patreon, Instagram, Facebook, X, Twitch, LinkedIn)
5. Cargar plataformas al inicio de la app y cachearlas en memoria para no re-consultar

**Relevant Context:**
- `config/platforms-default.json` se usa solo para el seed inicial en ST-01
- Los íconos SVG deben ser monochrome para poder colorearlos con CSS `fill`

---

### ST-07 — Motor de Búsqueda (`search.js`)
**Status:** `[ ] pending`

**Intent:**
Implementar un motor de búsqueda que permita encontrar cualquier rama, sub-rama o hoja sin navegar nivel por nivel. Los resultados muestran la ruta completa del nodo encontrado.

**Expected Outcomes:**
- Barra de búsqueda siempre visible en el header
- Al escribir 3+ caracteres: overlay con resultados en tiempo real (debounce 300ms)
- Cada resultado muestra: ícono de tipo, nombre, ruta completa (breadcrumb del resultado)
- Click en resultado: navega directamente a ese nodo y lo resalta
- Búsqueda sobre: `nodes.name`, `nodes.description`, `leaves.label`, `leaves.url`

**Todo List:**
1. Crear `js/search.js` con función `search(query)` que consulta Supabase con `ilike` en múltiples campos
2. Implementar debounce de 300ms en el input de búsqueda
3. Implementar `renderSearchResults(results)` que muestra overlay con resultados
4. Para cada resultado: construir la ruta completa consultando los ancestros (`parent_id` recursivo)
5. Al hacer click en un resultado: cerrar overlay, navegar al nivel del nodo padre y resaltar la card del nodo encontrado
6. Agregar estado de "sin resultados" y "buscando..."

**Relevant Context:**
- Supabase soporta `textSearch` con `to_tsvector` para búsqueda full-text — evaluar si se necesita vs simple `ilike`
- La ruta completa puede requerir múltiples queries o una función RPC en Supabase

---

### ST-08 — Importación / Exportación JSON (`import-export.js`)
**Status:** `[ ] pending`

**Intent:**
Permitir importar y exportar el árbol completo (o una rama y sus descendientes) como un archivo JSON legible y editable en bloc de notas. Esto permite modificaciones masivas sin usar la interfaz.

**Expected Outcomes:**
- Botón "Exportar" en el header: descarga el árbol completo como `yggdrasil-export.json`
- Botón "Exportar rama" en cada card de rama: descarga solo esa rama y sus descendientes
- Botón "Importar" en el header: permite cargar un `.json` y lo inserta en la base de datos
- Importación inteligente: detecta si el nodo ya existe (por nombre+padre) y pregunta si sobreescribir o agregar
- Formato JSON legible con indentación de 2 espacios

**Formato JSON de exportación:**
```json
{
  "exported_at": "2024-01-01T00:00:00Z",
  "app_version": "1.0",
  "nodes": [
    {
      "name": "Rama Principal",
      "description": "...",
      "image_url": null,
      "order_index": 0,
      "children": [
        {
          "name": "Sub-tema 1",
          "children": [],
          "leaves": [
            {
              "platform": "YouTube",
              "url": "https://...",
              "label": "Video del tema"
            }
          ]
        }
      ],
      "leaves": []
    }
  ]
}
```

**Todo List:**
1. Crear `js/import-export.js` con función `exportTree(rootNodeId = null)` que construye el JSON recursivamente
2. Implementar `downloadJson(data, filename)` para descargar el archivo
3. Implementar `importFromJson(jsonData, parentId = null)` que inserta recursivamente los nodos
4. Crear modal `#modal-import` con: selector de archivo, campo "nombre del importador", previsualización del JSON, botón confirmar
5. Manejar conflictos: si existe nodo con mismo nombre en mismo padre, ofrecer: Saltar / Sobreescribir / Agregar como nuevo
6. Registrar la importación en `audit_log` con el nombre del importador

**Relevant Context:**
- Las URLs de imágenes externas se exportan tal cual; las de Storage se exportan como URL pública
- Las plataformas en las hojas se exportan por nombre (no por UUID) para portabilidad

---

### ST-09 — Configuración Global y Logo (`app.js` + settings)
**Status:** `[ ] pending`

**Intent:**
Implementar el panel de configuración global de la app: logo institucional, título, y ajustes visuales. Es el punto de entrada principal de la aplicación.

**Expected Outcomes:**
- `app.js` inicializa la app: carga settings, logo, plataformas, y renderiza las ramas raíz
- Panel de configuración accesible solo desde un ícono de engranaje en el header
- Configuraciones: logo (subir o URL), título de la app, colores (opcional override)
- Logo visible en el header siempre

**Todo List:**
1. Crear `js/app.js` como punto de entrada: importa todos los módulos e inicializa la app
2. Cargar `app_settings` al inicio y aplicar logo y título al header
3. Crear modal `#modal-settings` con: campo logo (subir/URL), campo título de app
4. Guardar cambios de settings en tabla `app_settings` via `supabase.js`
5. Aplicar logo y título en tiempo real sin recargar la página

---

### ST-10 — Módulo de Auditoría y Panel de Historial (`audit.js`)
**Status:** `[ ] pending`

**Intent:**
Mostrar un historial de cambios recientes para saber quién modificó qué y cuándo. Preparado para evolucionar a sistema de control de versiones.

**Expected Outcomes:**
- Panel lateral o modal "Historial de cambios" accesible desde el header
- Lista de últimos 50 cambios: fecha, acción, elemento modificado, nombre de quien modificó
- Filtro básico: por fecha o por nombre de modificador

**Todo List:**
1. Crear `js/audit.js` con función `getRecentAuditLog(limit = 50)` y `renderAuditLog(entries)`
2. Crear modal/panel `#modal-audit` con la lista de cambios
3. Implementar filtro básico por nombre de modificador (client-side sobre los 50 resultados)
4. Agregar ícono de historial en el header

---

## Recomendaciones Adicionales

Estas son funcionalidades que no pediste explícitamente pero que son muy recomendables para un proyecto de este tipo:

1. **PWA (Progressive Web App)**: Agregar un `manifest.json` y Service Worker básico para que la app sea instalable en móvil y funcione offline en modo lectura.

2. **Drag & Drop para reordenar**: Permitir arrastrar cards para cambiar el `order_index` de ramas y hojas. Sugerido para v1.1.

3. **Vista árbol jerárquico clásico**: Además de la vista de cards, ofrecer una vista de árbol colapsable (tipo explorador de archivos) para tener el panorama completo en una sola pantalla.

4. **Tags/Etiquetas en nodos**: Agregar campo `tags` (array) a los nodos para categorización cruzada — muy útil para el motor de búsqueda.

5. **Modo oscuro**: Con las variables CSS ya definidas, es trivial agregar un toggle de dark mode.

6. **Confirmación antes de eliminar con nombre del elemento**: Mostrar el nombre del nodo a eliminar en el modal de confirmación para evitar borrados accidentales.

7. **Backup automático**: Exportar automáticamente el árbol completo cada semana y guardarlo en Supabase Storage como versión de respaldo.

8. **Supabase Realtime**: Con pocas líneas de código, habilitar actualizaciones en tiempo real para que múltiples editores vean los cambios de otros sin recargar.

---

## Pasos para el Usuario (Pre-implementación)

- [x] Proyecto `Cofradia_yggdrasil` creado en Supabase
- [x] Credenciales obtenidas y registradas en el plan
- [ ] Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase (ST-01)
- [ ] Ejecutar `supabase/rls.sql` en el SQL Editor de Supabase (ST-01)
- [ ] Ejecutar `supabase/seed.sql` en el SQL Editor de Supabase (ST-01)
- [ ] Crear bucket `yggdrasil-images` en Supabase Storage (ST-01)

---

## Orden de Implementación

```
ST-01 → ST-02 → ST-03 → ST-04 → ST-05 → ST-06 → ST-07 → ST-08 → ST-09 → ST-10
```

Cada sub-tarea es independiente una vez que ST-01 (Supabase) y ST-03 (cliente) estén listos.
