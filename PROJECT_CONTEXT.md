# PROJECT_CONTEXT.md — Cofradía Yggdrasil

> **Instrucciones para Bob:** Lee este archivo completo antes de responder cualquier pregunta sobre este proyecto. Contiene todas las decisiones de diseño, credenciales, arquitectura y estado actual de implementación.

---

## ¿Qué es este proyecto?

**Cofradía Yggdrasil** es una aplicación web SPA (Single Page Application) que funciona como un **directorio temático en forma de árbol navegable**. Está construida con tecnología web pura (HTML5 + CSS + JavaScript vanilla) y usa **Supabase** como backend (base de datos PostgreSQL + Storage de archivos).

El nombre hace referencia al árbol mítico Yggdrasil de la mitología nórdica — un árbol cósmico con ramas y raíces que conectan todos los mundos — analogía perfecta para un directorio temático jerárquico.

---

## Credenciales Supabase

| Dato | Valor |
|---|---|
| Project Name | `Cofradia_yggdrasil` |
| Project URL | `https://rpyncgrqugtcbwheiaux.supabase.co` |
| Publishable (anon) key | `sb_publishable_6JBuaT8aZEw-TZs8s2TAFA_69uhiRfn` |
| Storage bucket | `yggdrasil-images` |
| SDK versión | Supabase JS v2 via CDN ESM |

> **Nota:** Se usa la "publishable key" (equivalente a anon key) porque la app no tiene autenticación en v1. RLS está habilitado con políticas abiertas, preparado para restringirse en versiones futuras.

---

## Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript ES6 (módulos nativos, sin framework)
- **Backend:** Supabase (PostgreSQL + Storage)
- **Sin bundler:** La app corre directamente en el navegador, archivos servidos estáticamente
- **Supabase SDK:** `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` via CDN ESM
- **Fuentes:** Google Fonts (Inter o Poppins)
- **Sin librerías externas de UI** — todo CSS propio

---

## Principios de Diseño del Código

1. **Máxima modularidad:** cada funcionalidad en su propio archivo JS. Si algo falla, se aísla fácilmente.
2. **Un solo punto de acceso a Supabase:** todo CRUD pasa por `js/supabase.js`. Nunca se llama al SDK directamente desde otros módulos.
3. **CSS con variables globales:** todos los colores, espaciados y radios se definen en `css/theme.css` como variables CSS. Cambiar el tema = cambiar un solo archivo.
4. **Escalabilidad futura:** la estructura está preparada para agregar login, Google Auth y ramas protegidas sin refactorizar desde cero.
5. **Sin dependencias pesadas:** la app debe funcionar cargando los archivos directamente en el navegador.

---

## Paleta de Colores

| Variable CSS | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1A3A6B` | Azul oscuro — autoridad, header |
| `--color-primary-light` | `#2E6DB4` | Azul claro — interactivo, hover |
| `--color-accent-red` | `#C0392B` | Rojo — botones de acción, alertas |
| `--color-accent-yellow` | `#F0A500` | Amarillo dorado — badges, destacados |
| `--color-bg` | `#F4F6FA` | Fondo general (gris muy claro) |
| `--color-surface` | `#FFFFFF` | Superficies de cards y modales |
| `--color-text` | `#1C1C2E` | Texto principal |
| `--color-muted` | `#6B7280` | Texto secundario |
| `--color-border` | `#E5E7EB` | Bordes y separadores |

---

## Estructura de Carpetas del Proyecto

```
Cofradia_yggdrasil/
├── index.html                  ← SPA principal (punto de entrada único)
├── PROJECT_CONTEXT.md          ← Este archivo (contexto para Bob)
├── cofradia-yggdrasil-plan.md  ← Plan detallado de implementación
├── README.md                   ← Instrucciones de instalación y setup
│
├── config/
│   ├── supabase-config.js      ← URL y key de Supabase (NO subir a git público)
│   └── platforms-default.json ← Plataformas por defecto para seed inicial
│
├── css/
│   ├── theme.css               ← Variables CSS globales (colores, espaciado, tipografía)
│   ├── main.css                ← Reset CSS y estilos base
│   ├── layout.css              ← Header, breadcrumb, layout general responsive
│   ├── cards.css               ← Tarjetas de ramas y hojas
│   ├── modal.css               ← Modales de edición/creación
│   └── search.css              ← Overlay y resultados de búsqueda
│
├── js/
│   ├── app.js                  ← Punto de entrada: inicializa toda la app
│   ├── supabase.js             ← Cliente Supabase: TODO el CRUD pasa por aquí
│   ├── tree.js                 ← Lógica del árbol, estado de navegación, modales CRUD
│   ├── render.js               ← Renderizado de cards, breadcrumb, estados vacíos
│   ├── search.js               ← Motor de búsqueda con debounce
│   ├── platforms.js            ← Catálogo configurable de plataformas
│   ├── import-export.js        ← Importar/exportar árbol como JSON texto plano
│   ├── upload.js               ← Subida de imágenes a Supabase Storage
│   └── audit.js                ← Registro y visualización de historial de cambios
│
├── assets/
│   ├── logo/                   ← Logo institucional (configurable desde la app)
│   └── icons/                  ← Íconos SVG de plataformas (YouTube, TikTok, etc.)
│
└── supabase/
    ├── schema.sql              ← CREATE TABLE de todas las tablas
    ├── rls.sql                 ← Políticas Row Level Security (abiertas en v1)
    └── seed.sql                ← Datos iniciales: plataformas por defecto
```

---

## Modelo de Datos (Supabase / PostgreSQL)

### Tabla `nodes` — Ramas del árbol
```sql
id          uuid PRIMARY KEY
parent_id   uuid REFERENCES nodes(id) ON DELETE CASCADE  -- NULL = rama raíz
name        text NOT NULL
description text
type        text DEFAULT 'branch'  -- 'branch' | 'leaf' (leaf = nodo terminal con links)
image_url   text                   -- URL de Storage o URL externa
order_index integer DEFAULT 0
is_protected boolean DEFAULT false -- Para escalar a protección futura
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
modified_by text                   -- Nombre libre, opcional (puede ser null)
```

### Tabla `leaves` — Hojas/links del árbol
```sql
id          uuid PRIMARY KEY
node_id     uuid REFERENCES nodes(id) ON DELETE CASCADE
platform_id uuid REFERENCES platforms(id)
url         text NOT NULL
label       text
image_url   text
order_index integer DEFAULT 0
created_at  timestamptz DEFAULT now()
modified_by text
```

### Tabla `platforms` — Catálogo de plataformas
```sql
id        uuid PRIMARY KEY
name      text NOT NULL
icon_url  text
base_url  text
color     text  -- hex, ej: '#FF0000'
is_active boolean DEFAULT true
```

### Tabla `app_settings` — Configuración global
```sql
key   text PRIMARY KEY  -- ej: 'logo_url', 'app_title'
value text              -- JSON string si es complejo
```

### Tabla `audit_log` — Historial de cambios
```sql
id          uuid PRIMARY KEY
action      text  -- 'create' | 'update' | 'delete'
entity_type text  -- 'node' | 'leaf' | 'platform'
entity_id   uuid
modified_by text  -- puede ser null si no se proporcionó nombre
changes     jsonb -- snapshot de los cambios
created_at  timestamptz DEFAULT now()
```

---

## Funcionalidades de la App

### Navegación por Cards
- Vista inicial: grid de cards con las **ramas principales** (parent_id = null)
- Click en una rama → navega al siguiente nivel mostrando sus hijos como cards
- **Breadcrumb** siempre visible en la parte superior para saber en qué nivel se está
- El botón "atrás" del navegador funciona (se usa la History API)
- Cards de ramas muestran: imagen, nombre, descripción, contador de hijos
- Cards de hojas muestran: ícono de plataforma, label, botón para abrir el link

### Creación y Edición
- Botón "+" flotante (esquina inferior derecha) para agregar al nivel actual
- Cada card tiene íconos de editar y eliminar (pequeños, no invasivos)
- Modal de rama: nombre, descripción, imagen (subir archivo O URL externa), orden
- Modal de hoja: seleccionar plataforma, URL, label, imagen opcional, orden
- Campo **"Tu nombre (opcional)"** en todos los modales — se guarda en `modified_by`
- Confirmación de eliminación antes de borrar

### Motor de Búsqueda
- Barra de búsqueda en el header, siempre visible
- Al escribir 3+ caracteres: overlay con resultados en tiempo real (debounce 300ms)
- Cada resultado muestra tipo, nombre y **ruta completa** (dónde está en el árbol)
- Click en resultado → navega directamente a ese nodo

### Importar / Exportar
- Formato: **JSON con indentación de 2 espacios** (editable en bloc de notas)
- Exportar árbol completo o una sola rama con sus descendientes
- Importar: detecta conflictos y pregunta si sobreescribir, saltar o agregar como nuevo
- Las plataformas en el JSON se identifican por **nombre** (no UUID) para portabilidad

### Plataformas (Catálogo Configurable)
- Plataformas predefinidas: YouTube, TikTok, Patreon, Instagram, Facebook, X/Twitter, Twitch, LinkedIn
- Agregar nuevas plataformas desde la app: nombre, ícono (subir/URL), color, URL base
- Las plataformas inactivas no aparecen en el selector al crear hojas

### Configuración Global
- Logo institucional configurable (subir imagen o URL externa)
- Título de la app configurable
- Accesible desde ícono de engranaje en el header

### Auditoría
- Panel "Historial de cambios" con los últimos 50 cambios
- Muestra: fecha, acción, elemento modificado, quién modificó
- Filtro básico por nombre de modificador

---

## Decisiones de Diseño Tomadas

| Decisión | Elección | Razón |
|---|---|---|
| Framework JS | Ninguno (vanilla) | Máxima modularidad, sin dependencias |
| Bundler/build | Ninguno | Archivos directamente en el navegador |
| Vista principal | Cards por nivel | Más moderno, mejor en móvil |
| Importar/exportar | JSON texto plano | Editable en bloc de notas, legible |
| Autenticación v1 | Sin login | Cualquiera puede ver/editar |
| Identificación | Nombre libre opcional | No obligatorio, preparado para escalar |
| Imágenes | Supabase Storage + URLs externas | Flexibilidad |
| Plataformas | Catálogo configurable desde la app | Extensible sin tocar código |
| Búsqueda | `ilike` en Supabase | Suficiente para v1, escalable a full-text |

---

## Escalabilidad Futura (NO implementar en v1)

- **Login con email/password** — Supabase Auth ya está disponible
- **Login con Google** — OAuth via Supabase Auth
- **Ramas protegidas** — campo `is_protected` ya existe en `nodes`
- **Drag & drop** para reordenar cards
- **Vista árbol jerárquico** (además de cards)
- **Tags/etiquetas** en nodos para búsqueda cruzada
- **Modo oscuro** (variables CSS ya preparadas)
- **PWA** — manifest.json + Service Worker
- **Supabase Realtime** — actualizaciones en tiempo real para múltiples editores
- **Backup automático** — exportación periódica a Storage

---

## Estado de Implementación

| Sub-tarea | Descripción | Estado |
|---|---|---|
| ST-01 | Configuración Supabase (schema, RLS, seed, Storage) | ✅ Completo |
| ST-02 | HTML + CSS base (tema visual, layout) | ✅ Completo |
| ST-03 | `supabase.js` cliente central | ✅ Completo |
| ST-04 | `tree.js` + `render.js` navegación por cards | ✅ Completo |
| ST-05 | Modales de creación y edición | ✅ Completo |
| ST-06 | `platforms.js` catálogo de plataformas | ✅ Completo |
| ST-07 | `search.js` motor de búsqueda | ✅ Completo |
| ST-08 | `import-export.js` JSON texto plano | ✅ Completo |
| ST-09 | `app.js` + settings (logo, título) | ✅ Completo |
| ST-10 | `audit.js` historial de cambios | ✅ Completo |

---

## Cómo Retomar el Proyecto con Bob

Si cambias de computadora o abres una nueva sesión de Bob:

1. Abre Bob en la carpeta del proyecto
2. Escribe: *"Lee @PROJECT_CONTEXT.md y @cofradia-yggdrasil-plan.md y continuemos con la siguiente sub-tarea pendiente"*
3. Bob tendrá todo el contexto necesario para continuar sin repetir preguntas

---

*Última actualización: inicio del proyecto — ST-01 por comenzar*
