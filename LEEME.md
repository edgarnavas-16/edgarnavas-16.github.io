# edgarnavas-16.github.io

Sitio de la marca de Edgar Navas, consultorías de IA aplicada (de principiante a experto), y página
de inicio, privacidad y términos que exige Google para publicar la app OAuth de MBA OS
(proyecto `guia-audio-tts`, cliente `vigia-correo`, autopiloto de correo).

HTML y CSS estáticos, sin build. Tipografía Archivo + Azeret Mono subseteadas a woff2 desde
`brand-studio/assets/fonts` (commit pineado de google/fonts). Paleta y contrastes medidos al
tope de `estilos.css`. Se publica con GitHub Pages desde `main`.

Creado el 24-sep-2026. La v2 (24-sep) saca las guías de examen: la oferta es montar en el Mac del
cliente las cinco capas del setup de Edgar (notas, asistente, modelos locales, agentes, atajos), y
MBA OS queda solo como el proyecto de estudio. Las cifras de la portada salen de MBA OS y se
verifican así: hilos ordenados y archivados en 24 h, `resumen` de
`~/Library/Caches/mba-os-cc/vigia-correo.json`; los cuatro agentes, los `vigia-*.json` de esa
carpeta; 23.700 → 401 tokens, memoria `claude-p-llamada-magra`; 237×, memoria
`graphify-veredicto-numeros-reales`; el respaldo roto, memoria `macbook-backup-icloud-roto-23-ago`.

## La escena de la portada

`js/escena.src.js` es la fuente legible; el sitio sirve `js/escena.js`, que es esa fuente con
three.js 0.186.0 empaquetado adentro (licencia MIT en `js/LICENSE-three.txt`). No se carga nada
de un CDN, porque la política de privacidad promete que el sitio no llama a terceros. Para
regenerarlo, con three instalado en un `node_modules` cercano:

```bash
npx esbuild@0.25.10 js/escena.src.js --bundle --format=esm --minify --legal-comments=eof \
  --target=es2020 --outfile=js/escena.js
```

La textura es un grano de papel en SVG (`--grano` en `estilos.css`), sin imagen externa.
