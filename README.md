# Cofradía Yggdrasil

Directorio temático navegable en forma de árbol. Construido con HTML5 + CSS + JavaScript vanilla y Supabase como backend.

---

## Setup Inicial (Una sola vez)

### 1. Configurar Supabase

#### 1.1 Ejecutar el Schema (tablas)

1. Ve a [app.supabase.com](https://app.supabase.com) → tu proyecto `Cofradia_yggdrasil`
2. En el menú lateral: **SQL Editor** → **New query**
3. Copia y pega el contenido de [`supabase/schema.sql`](supabase/schema.sql)
4. Haz click en **Run**
5. Verifica que aparezcan las tablas en **Table Editor**: `nodes`, `leaves`, `platforms`, `app_settings`, `audit_log`

#### 1.2 Ejecutar las Políticas RLS

1. En **SQL Editor** → **New query**
2. Copia y pega el contenido de [`supabase/rls.sql`](supabase/rls.sql)
3. Haz click en **Run**

#### 1.3 Ejecutar el Seed (plataformas por defecto)

1. En **SQL Editor** → **New query**
2. Copia y pega el contenido de [`supabase/seed.sql`](supabase/seed.sql)
3. Haz click en **Run**
4. Verifica en **Table Editor** → `platforms` que aparecen YouTube, TikTok, etc.

#### 1.4 Crear el bucket de Storage

1. En el menú lateral: **Storage** → **New bucket**
2. Nombre: `yggdrasil-images`
3. Marcar como **Public bucket** (permite lectura pública de imágenes)
4. Haz click en **Save**
5. En el bucket creado → **Policies** → agregar política:
   - **For SELECT:** `true` (lectura pública)
   - **For INSERT:** `true` (escritura abierta en v1)

---

### 2. Configurar la App

Edita el archivo [`config/supabase-config.js`](config/supabase-config.js) con tus credenciales:

```js
// config/supabase-config.js
export const SUPABASE_URL  = 'https://rpyncgrqugtcbwheiaux.supabase.co';
export const SUPABASE_KEY  = 'sb_publishable_6JBuaT8aZEw-TZs8s2TAFA_69uhiRfn';
export const STORAGE_BUCKET = 'yggdrasil-images';
```

---

### 3. Abrir la App

La app no requiere build ni servidor especial. Abre `index.html` directamente en tu navegador, o usa un servidor estático simple:

**Opción A — Directamente en el navegador:**
Doble click en `index.html`

> ⚠️ Nota: Los módulos ES6 (`import/export`) requieren que el archivo sea servido por un servidor HTTP. Si la app no carga, usa la Opción B.

**Opción B — Con VS Code (recomendado):**
Instala la extensión **Live Server** → click derecho en `index.html` → **Open with Live Server**

**Opción C — Con Python:**
```bash
python -m http.server 8080
# Luego abre http://localhost:8080
```

**Opción D — Con Node.js:**
```bash
npx serve .
```

---

## Estructura del Proyecto

```
Cofradia_yggdrasil/
├── index.html              ← Punto de entrada único
├── config/
│   └── supabase-config.js  ← Credenciales (no compartir públicamente)
├── css/
│   ├── theme.css           ← Variables de color y tipografía
│   ├── main.css            ← Reset y estilos base
│   ├── layout.css          ← Header, breadcrumb, layout
│   ├── cards.css           ← Tarjetas de ramas y hojas
│   ├── modal.css           ← Modales de edición
│   └── search.css          ← Búsqueda
├── js/
│   ├── app.js              ← Inicialización
│   ├── supabase.js         ← Cliente de base de datos
│   ├── tree.js             ← Lógica del árbol y navegación
│   ├── render.js           ← Renderizado de UI
│   ├── search.js           ← Motor de búsqueda
│   ├── platforms.js        ← Catálogo de plataformas
│   ├── import-export.js    ← Importar/exportar JSON
│   ├── upload.js           ← Subida de imágenes
│   └── audit.js            ← Historial de cambios
├── assets/
│   ├── logo/               ← Logo institucional
│   └── icons/              ← Íconos de plataformas
└── supabase/
    ├── schema.sql          ← Tablas de la base de datos
    ├── rls.sql             ← Políticas de seguridad
    └── seed.sql            ← Datos iniciales
```

---

## Retomar el Proyecto con Bob (IA)

Si abres una nueva sesión de Bob en otra computadora:

```
Lee @PROJECT_CONTEXT.md y @cofradia-yggdrasil-plan.md 
y continuemos con la siguiente sub-tarea pendiente.
```

---

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript ES6 (módulos nativos)
- **Backend:** [Supabase](https://supabase.com) (PostgreSQL + Storage)
- **SDK:** `@supabase/supabase-js v2` via CDN
- **Sin frameworks, sin bundler**

---

## Notas de Seguridad

- La `publishable key` de Supabase es segura para usarse en el navegador siempre que RLS esté habilitado en todas las tablas.
- No subas `config/supabase-config.js` a repositorios públicos si en el futuro agregas una `service_role` key.
- En v1 cualquier persona con acceso a la URL puede editar el contenido. En versiones futuras se implementará autenticación.
