---
name: brand-palette
description: Paleta de colores y logo de este proyecto, extraídos del isotipo (cruz dentro de un círculo abierto). Úsala siempre que se cree o modifique cualquier UI, página, componente o pieza visual dentro de este proyecto (frontend o cualquier futuro sitio/panel), para que todo mantenga la misma identidad de marca.
---

# Identidad visual del proyecto

Colores extraídos por muestreo real de píxeles del logo
(`frontend/src/assets/logo.png`), no aproximados a ojo.

## Paleta

| Uso | Color | Hex |
|---|---|---|
| Azul (extremo izquierdo del degradado del logo) | ![#0d3060](#) | `#0d3060` |
| Violeta (punto medio del degradado) | ![#5a1f4d](#) | `#5a1f4d` |
| Rojo / vino (extremo derecho del degradado) | ![#99122f](#) | `#99122f` |
| Fondo crema (fondo del logo) | ![#f7f5f4](#) | `#f7f5f4` |
| Texto principal | | `#1a1420` |
| Texto secundario | | `#4a4550` |
| Bordes / líneas sutiles | | `#e5dfe0` |

Degradado de marca (el mismo que cruza el logo, azul → violeta → rojo):

```css
--gradiente: linear-gradient(90deg, #0d3060 0%, #5a1f4d 50%, #99122f 100%);
```

## Cómo aplicarla

- **Cualquier página, componente o mockup nuevo en este proyecto** debe
  partir de esta paleta como fuente de verdad, no inventar colores nuevos.
- Usa el degradado para acentos de marca: botones primarios/CTA, enlaces
  activos, subrayados, iconos de estado, texto destacado (eyebrow).
- Usa el fondo crema `#f7f5f4` como base de página; blanco puro (`#fff`)
  para tarjetas/superficies elevadas sobre ese fondo.
- Azul y rojo también sirven como colores sólidos (no solo en degradado)
  para estados, badges o secciones alternas — evita mezclarlos con colores
  fuera de esta tabla.
- El logo real está en `frontend/src/assets/logo.png`. Úsalo en vez de
  placeholders (favicon, header, hero, etc.) salvo que se indique lo
  contrario.
- El logo **no incluye tipografía de marca** (solo el símbolo). Mientras
  no se defina una tipografía oficial, usa una sans-serif del sistema
  (`system-ui`, `Segoe UI`, `Roboto`) — ya configurada en
  `frontend/src/index.css` vía `--sans`.
- El nombre real del proyecto/ministerio aún no está definido — en el
  código actual aparece como marcador `"Nombre del Ministerio"`
  (`frontend/src/App.tsx`). Reemplázalo cuando el usuario dé el nombre
  real, y actualiza este archivo si cambia algo de la identidad.

## Ya implementado

Estas variables ya están cargadas en `frontend/src/index.css` como
`:root { --azul, --violeta, --rojo, --crema, --gradiente, ... }` — reutilízalas
en vez de declarar hex nuevos sueltos en los componentes.
