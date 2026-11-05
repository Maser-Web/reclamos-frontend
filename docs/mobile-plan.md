# Plan móvil – coronel-reclamos (Fase 1: diagnóstico)

## Stack
- Angular 20.3 (standalone, signals, OnPush), `lucide-angular`, `sweetalert2`. Sin Material/Tailwind/Bootstrap.
- Estilos: `src/styles.scss` (tokens `:root` + overrides globales por selector de componente) y **CSS inline en el `styles` de cada componente `.ts`** (minificado en una sola línea). No hay `.scss` por componente.
- No hay lint configurado (sin ESLint en package.json). Verificación = `ng build` + `ng test`.
- Breakpoint de facto: `767/768px` (móvil vs. escritorio), más `480`, `390`, `359`, `600`, `1000`, `1150`. Todo hardcodeado; sin variables/mixins. Sin `BreakpointObserver`.
- Navegación: header móvil (`mobile-navbar`) + `app-bottom-navigation` flotante (≤767px); header de escritorio ≥768px.

## Problemas (por impacto)

### Alto
1. **`index.html`**: `<html lang="en">` (la app es es-AR); viewport sin `viewport-fit=cover` → `env(safe-area-inset-*)` no tiene efecto en iPhone con notch/barra inferior. Sin `theme-color`.
2. **Zoom de iOS por `font-size < 16px`** en inputs: base `--font-base` = 15px (`styles.scss`: regla de `input/select/textarea`), búsqueda de reclamos 14px en ≤480px (`reclamos.component.ts`), y posibles casos en login/registro.
3. **Hero móvil de `/reclamos`** (`reclamos.component.ts`): alto fijo 420px (357px ≤480), `h1` 55px, `p` 23px, tarjeta decorativa con `rotate`/`scale` y posiciones absolutas en px. Ocupa casi toda la pantalla de 360×640 antes del primer reclamo, y hay riesgo de overflow horizontal (`right:-5px/-15px`). Contenido decorativo que empuja el contenido útil.
4. **Tarjetas de reclamo móviles**: `min-height:264px`, `.m-actions` en `position:absolute` (puede solaparse con texto), tipografías 28px/19px en px fijos, sin `clamp()`. El `<button>` contiene `div`s (HTML inválido) y toda la fila se renderiza **dos veces** (versión escritorio + móvil, ocultas con `display:none`) → DOM duplicado y lectores de pantalla leen contenido oculto solo si falla el CSS; coste en listas.
5. **Botón flotante inferior** (`BottomNavigation`): alto 92px + `--bottom-nav-height:112px` fijo; `.mobile-layout` compensa con `env(safe-area...)` pero `/reclamos` usa 78px propio → inconsistencia, contenido final tapado. Etiquetas 9–11px (ilegibles) y sin `env(safe-area-inset-bottom)` en `bottom:10px` del nav.
6. **Áreas táctiles < 44px**: paginación 34×34 (`reclamos.component.ts`), botones del header móvil 38×38, logout escritorio 40×40, `.tabs` 55px OK pero `.badge`/chips pequeños; `.mobile-back`/`.mobile-logout` 38px.

### Medio
7. **Tipografía < 12px** repartida: `10px` en resúmenes (`styles.scss .summary span`), nav 9–11px, badge notificaciones 9px, `.file-picker small` 11px. Falta escala fluida.
8. **Colores/valores mágicos** duplicados (`#071538`, `#ffdb1d`, `#f33445`…) en vez de tokens `--color-*`; `reclamos.component.ts` redefine `--navy`, `--line`. Tokens `--shadow`, `--color-muted` usados en `ui.ts` pero **no definidos** en `:root`.
9. **`app-confirm-dialog`** (`ui.ts`): sin `aria-modal`, sin foco atrapado, sin Escape, `max-width:300px`, botones sin tamaño táctil, no respeta safe area.
10. **Header móvil**: `box-sizing:content-box` + padding de safe-area OK, pero necesita `viewport-fit=cover` para funcionar; título sin `clamp`. Menú: no hay menú desplegable (solo logout/volver), así que no aplica `aria-expanded`; la navegación principal es el bottom nav.
11. **Tabs de estado** (`.tabs` móvil): 4 columnas fijas con `font 12px` en ≤480px; "Finalizados" puede truncar en 360px.
12. **Foco**: outline global definido (bueno) pero varios componentes usan `outline:0` (`.tools input`) sin alternativa visible.
13. **Sin `prefers-reduced-motion`** en ningún lado; transiciones/`transform` en tarjetas y botones.
14. **Imágenes**: `<img src="assets/logo.png">` sin `width/height` (layout shift en header); no usan `NgOptimizedImage`.
15. **Teclado en pantalla**: formularios (`reclamo-nuevo`, `reclamo-cerrar`, derivar, comentario) sin `inputmode`/`autocomplete`/`enterkeyhint`; acciones primarias no sticky ni protegidas ante el teclado. `registro`/`login` ya tienen algo de `autocomplete` (revisar).

### Bajo
16. `login`/`registro`: 6–9 media queries propias con `max-height` hardcodeados; revisar `100dvh`/scroll con teclado abierto.
17. `app-file-upload` (ui.ts) sin uso aparente; `.file-input` oculto con `position:absolute` sin contenedor `relative` (posible scroll fantasma).
18. Sin `ng-deep` (bien). Estilos globales apuntan a internos de componentes (`app-button .app-button`) — frágil pero funcional.

> Pendiente de verificación visual: no se midió en navegador real (360/390/768). Los puntos 3, 4, 5, 11 y 16 conviene confirmarlos con capturas al implementar.

## Plan de cambios (commits pequeños)
1. **Base**: `index.html` (`lang="es"`, `viewport-fit=cover`, `theme-color`) + tokens en `styles.scss` (breakpoints documentados, escala tipográfica fluida con `clamp`, `--tap-min:44px`, `--shadow`, `--color-muted`, `--safe-bottom`), `prefers-reduced-motion`, inputs ≥16px en móvil, `-webkit-text-size-adjust`.
2. **Mixins SCSS**: `src/styles/_breakpoints.scss` (`$bp-sm:480`, `$bp-md:768`, `$bp-lg:1150`) para usar en `styles.scss`; los componentes con CSS inline se migrarán a `styleUrl` `.scss` solo cuando se toquen.
3. **Bottom nav + layout**: safe-area, alto/offset unificado (`--bottom-nav-height`), etiquetas ≥11px, áreas táctiles.
4. **`/reclamos` (flujo crítico)**: hero compacto (altura por contenido, sin posiciones absolutas fijas), tarjetas móviles fluidas sin `.m-actions` absoluto, tabs con scroll horizontal contenido, búsqueda ≥16px, paginación 44px.
5. **Header/navbar**: targets 44px, logo con `width/height`.
6. **Formularios** (nuevo, cerrar, derivar, comentario, filtros): `inputmode/autocomplete/enterkeyhint`, acción primaria sticky con safe-area, `scroll-margin` ante teclado.
7. **Detalle/seguimiento/notificaciones**: overflow, tipografía, targets.
8. **Login/registro**: `100dvh`, reducción de media queries.
9. **Confirm dialog**: a11y (aria-modal, Escape, foco, bloqueo scroll).
10. **Verificación**: `ng build`, `ng test`, revisión a 1280px+.

## Preguntas abiertas
- ¿Querés conservar el hero amarillo grande de `/reclamos` en móvil (decorativo) o lo compacto?
- ¿Agrego ESLint (`ng add angular-eslint`) para la Fase 3, o solo build/test?
- ¿Los cambios del working tree actuales (angular.json, Dockerfile, nginx.conf, environment.production.ts) son tuyos y los dejo fuera de mis commits? (asumo que sí)
