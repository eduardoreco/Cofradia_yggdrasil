# Plan: Pantalla de Login Dummy + Modernización Visual

## Objetivo

Dos cambios principales:
1. **Modernizar el look** de la app existente — mejorar cards, fondo, botones, header y detalles visuales para que se sienta una app premium de 2024/2025.
2. **Agregar pantalla de login dummy** — solo pide nombre de usuario, acepta cualquier valor, muestra saludo personalizado en el header.

---

## Sub-Tarea 1 — Modernizar el tema visual (`css/theme.css` + `css/main.css` + `css/layout.css` + `css/cards.css`)

**Intent:** Elevar el aspecto visual de la app sin romper la estructura existente. El objetivo es que se vea como una app SaaS moderna de 2024: fondos con textura sutil, gradientes refinados, micro-sombras con color, botones con gradiente, y detalles visuales que den sensación premium. Se mantiene la paleta azul marino + dorado.

**Expected Outcomes:**
- El fondo de la app tiene un patrón o gradiente sutil (no gris liso)
- Las cards de ramas tienen un glassmorphism muy sutil o gradiente interno suave
- Los botones `.btn-primary` y `.btn-danger` tienen gradiente en lugar de color sólido plano
- El header tiene un gradiente más rico y refinado (añadir noise o multi-stop)
- Las sombras de cards y modales tienen color tintado (no solo negro transparente)
- El FAB (+) tiene un glow de color al hacer hover
- Los inputs tienen un fondo levemente tintado en focus
- El breadcrumb tiene un fondo diferenciado (glass o surface sutil)
- Los `section-label` se ven más elegantes (sin el look de "panel admin")
- Las transiciones de hover en cards son más suaves y expresivas

**Todo List:**
1. En `css/theme.css`: refinar las sombras para que tengan color tintado (sombras azuladas en lugar de solo negro)
2. En `css/main.css`: actualizar `.btn-primary` para usar gradiente azul (`#2E6DB4 → #1A3A6B`)
3. En `css/main.css`: actualizar `.btn-danger` para usar gradiente rojo
4. En `css/layout.css`: reemplazar el fondo `#F4F6FA` del body por un fondo con patrón de puntos o gradiente radial muy sutil (usando `background-image` con CSS)
5. En `css/layout.css`: enriquecer el gradiente del header (multi-stop, más profundo)
6. En `css/layout.css`: agregar `box-shadow` con color dorado sutil al `border-bottom` del header
7. En `css/layout.css`: el breadcrumb obtiene un fondo semitransparente/blur sutil
8. En `css/layout.css`: el FAB obtiene `box-shadow` con color en hover (glow rojo)
9. En `css/cards.css`: las cards obtienen `background` con gradiente lineal muy sutil (blanco a gris 0.5%)
10. En `css/cards.css`: el hover de cards tiene una sombra con tinte azul en lugar de sombra negra
11. En `css/cards.css`: la barra accent superior (3px) se hace de 4px y más visible
12. En `css/layout.css`: los `section-label` se reemplazan por un estilo más elegante (línea de color con punto)

**Relevant Context:**
- `css/theme.css` — variables actuales de sombra: `rgba(0,0,0, 0.06/0.08/0.12/0.16)` → cambiar a tinte azul
- `css/main.css` — `.btn-primary { background-color: var(--color-primary-light) }` (actualmente sólido)
- `css/layout.css` — `body { background-color: var(--color-bg) }` → agregar patrón
- `css/layout.css` — `#header { background: linear-gradient(135deg, #1A3A6B 0%, #1e4a8a 100%) }` → enriquecer
- `css/cards.css` — `.card:hover { box-shadow: var(--shadow-lg) }` → agregar tinte de color

**Status:** [ ] pending

---

## Sub-Tarea 2 — Crear `css/login.css`

**Intent:** Definir los estilos de la pantalla de login en un archivo CSS dedicado, coherente con el design system mejorado de la Sub-Tarea 1. La pantalla debe verse moderna y premium: centrada, limpia, con el logo grande, un campo de texto prominente y un botón de acción principal con gradiente.

**Expected Outcomes:**
- Existe `css/login.css` con estilos para `.login-screen`, `.login-card`, `.login-logo`, `.login-title`, `.login-input`, `.login-btn`
- La pantalla ocupa toda la ventana (`100vw × 100vh`)
- Fondo igual al de la app (patrón sutil azul marino) para coherencia visual
- Tarjeta central: blanca, redondeada (`radius-xl`), sombra grande con tinte azul, máx 400px de ancho
- Logo centrado arriba (80px), con sombra de color suave
- Input de texto full-width, alto (48px), estilo limpio, focus ring azul
- Botón "Entrar" full-width, gradiente azul marino, hover más saturado
- Texto decorativo abajo: versión o tagline mínimo
- Animación de entrada: fade-in + slide-up suave
- Responsive: funciona en móvil

**Todo List:**
1. Crear `css/login.css`
2. Definir `.login-screen` (full viewport, centrado flex, mismo fondo de la app)
3. Definir `.login-card` (panel blanco centrado, padding 40px, border-radius xl, sombra con tinte)
4. Definir `.login-logo` (imagen centrada, 80px, shadow sutil)
5. Definir `.login-title` (tipografía 2xl bold, color primary, margin bottom pequeño)
6. Definir `.login-subtitle` (texto sm, color muted, margin bottom grande)
7. Definir `.login-input` (input full-width, 48px de alto, border suave, focus ring azul marino)
8. Definir `.login-btn` (botón full-width, 48px, gradiente azul, texto blanco, hover lift + glow)
9. Definir `.login-footer-text` (texto xs, color muted, centrado, debajo del botón)
10. Definir animación `@keyframes loginFadeIn` (opacity 0→1, translateY 24px→0, 400ms)
11. Añadir media queries para móvil (padding reducido, tarjeta sin bordes redondeados en pantalla muy pequeña)

**Relevant Context:**
- Variables de color en `css/theme.css`
- El fondo de la app se define/modifica en Sub-Tarea 1 → debe ser el mismo fondo aquí
- Estilo de botones mejorado en Sub-Tarea 1

**Status:** [ ] pending

---

## Sub-Tarea 3 — Agregar el HTML de la pantalla de login en `index.html`

**Intent:** Insertar el bloque HTML de la pantalla de login como primer elemento visible en el `<body>`, antes del contenido principal de la app. El contenido principal se envuelve en `#app-wrapper` y se oculta hasta que el usuario ingresa su nombre.

**Expected Outcomes:**
- Existe un `<div id="login-screen" class="login-screen">` en `index.html`
- Contiene: logo, título "Cofradía Yggdrasil", subtítulo, input de username, botón "Entrar", texto de pie pequeño
- El link a `css/login.css` está en el `<head>` (después de `search.css`)
- El contenido principal `#app` tiene clase `hidden` inicialmente
- El `#loading-overlay` también está dentro de `#app-wrapper` (para no aparecer durante el login)

**Todo List:**
1. En `index.html`, agregar `<link rel="stylesheet" href="css/login.css" />` en el `<head>` como última hoja de estilos
2. Agregar clase `hidden` al `<div id="app">` (el wrapper principal de la app)
3. Insertar **antes** de `<div id="app">` el bloque HTML del login:
   ```html
   <div id="login-screen" class="login-screen">
     <div class="login-card">
       <img class="login-logo" id="login-logo-img" src="" alt="Yggdrasil" style="display:none">
       <div class="login-logo-placeholder" id="login-logo-placeholder">🌳</div>
       <h1 class="login-title">Cofradía Yggdrasil</h1>
       <p class="login-subtitle">Ingresa tu nombre para continuar</p>
       <input type="text" id="login-username" class="login-input"
              placeholder="Tu nombre..." autocomplete="off" maxlength="50" />
       <button id="login-btn" class="login-btn">Entrar</button>
       <p class="login-footer-text">Directorio temático navegable</p>
     </div>
   </div>
   ```

**Relevant Context:**
- `index.html` — estructura actual: `#loading-overlay` seguido de `<div id="app">`
- El logo del login (`#login-logo-img`) se sincroniza en Sub-Tarea 4 con el logo desde Supabase

**Status:** [ ] pending

---

## Sub-Tarea 4 — Lógica JS del login en `js/app.js`

**Intent:** Implementar la lógica de la pantalla de login: mostrar/ocultar pantallas, guardar el nombre en `sessionStorage`, personalizar el saludo en el header, y sincronizar el logo del login con el de la app.

**Expected Outcomes:**
- Al cargar la página, si NO hay nombre en `sessionStorage`, se muestra `#login-screen` y `#app` permanece oculto
- Al hacer click en "Entrar" (o presionar Enter) con un nombre no vacío: nombre se guarda en `sessionStorage`, se anima la salida del login y aparece la app
- Si ya hay nombre en `sessionStorage` (recarga de página): salta directamente a la app sin mostrar el login
- El nombre del usuario aparece en el header como `"👤 {nombre}"` — elemento `#header-user-greeting`
- El campo "Tu nombre" en los modales de edición se pre-rellena automáticamente con el nombre del login
- El logo del login se sincroniza con el logo configurado en Supabase

**Todo List:**
1. En `js/app.js`, al inicio (antes de `initApp()`), agregar función `initLogin()`
2. `initLogin()` verifica `sessionStorage.getItem('ygg_user')`:
   - Si existe: quita clase `hidden` de `#app`, oculta `#login-screen`, llama `initApp()`
   - Si no existe: muestra `#login-screen` (ya visible por defecto), mantiene `#app` oculto
3. Agregar listener al botón `#login-btn` (click) y al `#login-username` (keydown Enter)
4. Handler de entrada:
   - Si `username.trim()` está vacío: shake animation en el input (agregar clase `shake`, quitar después de 400ms)
   - Si válido: `sessionStorage.setItem('ygg_user', nombre)`, agregar clase `login-exit` a `#login-screen`, después de 350ms → quitar `hidden` de `#app`, ocultar `#login-screen`, llamar `initApp()`
5. En `loadSettings()` (dentro de `initApp`): después de setear `#header-logo img`, también actualizar `#login-logo-img` (para si el usuario borra sessionStorage y vuelve al login, ya tendrá logo)
6. En `initApp()` → después de inicializar todo: buscar `#header-user-greeting` y setear el nombre desde `sessionStorage`
7. En `initApp()` → pre-rellenar todos los inputs `.modifier-field input` con el nombre del usuario
8. Agregar en `index.html` el elemento `<span id="header-user-greeting">` en `.header-actions` (al inicio, antes de los botones)
9. Agregar estilos del saludo en `css/layout.css`: texto blanco semitransparente, ícono de persona, tamaño sm

**Relevant Context:**
- `js/app.js` — función `initApp()` y `loadSettings()`
- `index.html` — `.header-actions` div donde va el saludo
- `css/layout.css` — estilos del header
- Los campos "Tu nombre" existen en: `#branch-modified-by`, `#leaf-modified-by`, `#delete-modified-by`, `#import-modified-by`

**Status:** [ ] pending

---

## Notas de Implementación

- **Sin backend real**: el login es completamente del lado del cliente con `sessionStorage`. No conecta con Supabase.
- **Cualquier nombre es válido**: solo se rechaza el campo vacío (shake animation como feedback).
- **Persistencia**: `sessionStorage` — dura mientras la pestaña esté abierta. Al cerrar la pestaña, vuelve a pedir nombre.
- **Sin logout en esta versión**.
- **Orden de sub-tareas**: Sub-Tarea 1 primero (mejora visual base), luego 2→3→4 (login). Las Sub-Tareas 3 y 4 dependen de los estilos de la 2.
- **La modernización visual (ST1) es quirúrgica**: se editan selectores específicos en los CSS existentes, sin reestructurar los archivos.
