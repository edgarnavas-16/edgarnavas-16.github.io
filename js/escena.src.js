// Escena de la portada: el Mac como cinco cúmulos de nodos, uno por capa del sistema.
// Fuente legible; el sitio sirve js/escena.js, que sale de este archivo con esbuild
// (ver LEEME.md). three.js va empaquetado adentro: el sitio no llama a ningún CDN.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, BufferGeometry, Float32BufferAttribute,
  Points, ShaderMaterial, LineSegments, LineBasicMaterial, Color, Vector3, NormalBlending,
} from "three";

const TINTA = new Color("#14171B");
const GRIS = new Color("#8A8E94");
const SENAL = new Color("#E5532D");

const CUMULOS = [
  { id: "notas", centro: [-2.3, 1.0, 0.4], n: 90, radio: 0.95 },
  { id: "asistente", centro: [0.4, 1.7, -0.9], n: 80, radio: 0.85 },
  { id: "local", centro: [2.4, 0.3, 0.2], n: 95, radio: 0.95 },
  { id: "agentes", centro: [1.0, -1.7, 0.9], n: 75, radio: 0.8 },
  { id: "atajos", centro: [-1.5, -1.4, -0.6], n: 60, radio: 0.7 },
];

// Semilla fija: la misma nube en cada visita.
let semilla = 20260924;
const azar = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296);
const gauss = () => {
  const u = Math.max(azar(), 1e-6), v = azar();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export function iniciar(lienzo, rotulos) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    lienzo.closest(".escena")?.classList.add("sin-webgl");
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const escena = new Scene();
  const camara = new PerspectiveCamera(38, 1, 0.1, 100);
  camara.position.set(0, 0, 11);

  const mundo = new Group();
  escena.add(mundo);

  const posiciones = [], colores = [], tamanos = [], esGris = [];
  const hubs = [];
  CUMULOS.forEach((c, k) => {
    const centro = new Vector3(...c.centro);
    hubs.push(centro);
    posiciones.push(...c.centro); colores.push(TINTA.r, TINTA.g, TINTA.b); tamanos.push(15); esGris.push(false);
    for (let i = 0; i < c.n; i++) {
      const r = c.radio * (0.35 + Math.abs(gauss()) * 0.55);
      const t = azar() * Math.PI * 2, f = Math.acos(2 * azar() - 1);
      posiciones.push(
        c.centro[0] + r * Math.sin(f) * Math.cos(t),
        c.centro[1] + r * Math.sin(f) * Math.sin(t) * 0.85,
        c.centro[2] + r * Math.cos(f),
      );
      const gris = azar() < 0.35;
      const col = gris ? GRIS : TINTA;
      colores.push(col.r, col.g, col.b);
      tamanos.push(3.2 + azar() * 3.4);
      esGris.push(gris);
    }
  });

  // Aristas: cada nodo con sus dos vecinos más cercanos dentro del cúmulo, más el hub.
  const aristas = [];
  const inicio = [];
  let cursor = 0;
  CUMULOS.forEach((c) => { inicio.push(cursor); cursor += c.n + 1; });
  const P = (i) => [posiciones[3 * i], posiciones[3 * i + 1], posiciones[3 * i + 2]];
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  CUMULOS.forEach((c, k) => {
    const h = inicio[k];
    for (let i = h + 1; i <= h + c.n; i++) {
      const pi = P(i);
      const cerca = [];
      for (let j = h + 1; j <= h + c.n; j++) if (j !== i) cerca.push([d2(pi, P(j)), j]);
      cerca.sort((a, b) => a[0] - b[0]);
      for (const [, j] of cerca.slice(0, 2)) if (i < j) aristas.push(...pi, ...P(j));
      if (azar() < 0.18) aristas.push(...P(h), ...pi);
    }
  });
  // Entre cúmulos: el sistema es uno solo.
  const puentes = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3]];
  const lineasPuente = [];
  for (const [a, b] of puentes) lineasPuente.push(...P(inicio[a]), ...P(inicio[b]));

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(posiciones, 3));
  geo.setAttribute("color", new Float32BufferAttribute(colores, 3));
  geo.setAttribute("tamano", new Float32BufferAttribute(tamanos, 1));
  const base = new Float32Array(colores);

  const dpr = renderer.getPixelRatio();
  const matPuntos = new ShaderMaterial({
    uniforms: { escala: { value: dpr } },
    vertexShader: `
      attribute float tamano; attribute vec3 color; varying vec3 vColor; uniform float escala;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = tamano * escala * (9.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.42, d));
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: NormalBlending,
  });
  mundo.add(new Points(geo, matPuntos));

  const geoAristas = new BufferGeometry();
  geoAristas.setAttribute("position", new Float32BufferAttribute(aristas, 3));
  mundo.add(new LineSegments(geoAristas, new LineBasicMaterial({ color: TINTA, transparent: true, opacity: 0.16 })));

  const geoPuentes = new BufferGeometry();
  geoPuentes.setAttribute("position", new Float32BufferAttribute(lineasPuente, 3));
  const matPuentes = new LineBasicMaterial({ color: SENAL, transparent: true, opacity: 0.45 });
  mundo.add(new LineSegments(geoPuentes, matPuentes));

  // Cúmulo activo: se pinta de señal, y su rótulo también.
  let activo = -1;
  function activar(k) {
    if (k === activo) return;
    activo = k;
    const col = geo.getAttribute("color");
    col.array.set(base);
    if (k >= 0) {
      const h = inicio[k];
      for (let i = h; i <= h + CUMULOS[k].n; i++) {
        if (esGris[i]) continue; // los grises quedan grises
        col.array[3 * i] = SENAL.r; col.array[3 * i + 1] = SENAL.g; col.array[3 * i + 2] = SENAL.b;
      }
    }
    col.needsUpdate = true;
    rotulos.forEach((r, i) => r.classList.toggle("activo", i === k));
  }

  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let objetivoX = 0, objetivoY = 0, fijado = -1;
  const caja = lienzo.closest(".escena");
  caja.addEventListener("pointermove", (e) => {
    const r = caja.getBoundingClientRect();
    objetivoY = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    objetivoX = ((e.clientY - r.top) / r.height - 0.5) * 0.3;
  });
  caja.addEventListener("pointerleave", () => { objetivoX = objetivoY = 0; });
  rotulos.forEach((r, i) => {
    r.addEventListener("pointerenter", () => { fijado = i; activar(i); });
    r.addEventListener("focus", () => { fijado = i; activar(i); });
    r.addEventListener("pointerleave", () => { fijado = -1; });
    r.addEventListener("blur", () => { fijado = -1; });
  });

  function medir() {
    const w = caja.clientWidth, h = caja.clientHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.position.z = w / h < 0.9 ? 10.5 : w / h > 1.1 ? 9.8 : 9.2;
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(medir).observe(caja);
  medir();

  const v = new Vector3();
  function ubicarRotulos() {
    const w = caja.clientWidth, h = caja.clientHeight;
    hubs.forEach((c, i) => {
      v.copy(c).applyMatrix4(mundo.matrixWorld).project(camara);
      const x = ((v.x + 1) / 2) * w, y = ((1 - v.y) / 2) * h;
      const ancho = rotulos[i].offsetWidth;
      // Si el rótulo no cabe a la derecha del nodo, va a la izquierda.
      const izq = x + 14 + ancho > w - 2 ? x - 14 - ancho : x + 14;
      rotulos[i].style.transform = `translate(${Math.max(2, izq)}px, ${y - 34}px)`;
    });
  }

  let visible = true, t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir(); }).observe(caja);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pedir(); });

  let pendiente = false;
  function pedir() { if (!pendiente && !quieto) { pendiente = true; requestAnimationFrame(cuadro); } }
  function cuadro(ahora) {
    pendiente = false;
    const t = (ahora - t0) / 1000;
    mundo.rotation.y += (t * 0.07 + objetivoY - mundo.rotation.y) * 0.05;
    mundo.rotation.x += (objetivoX - 0.12 - mundo.rotation.x) * 0.05;
    if (fijado < 0) activar(Math.floor(t / 3.2) % CUMULOS.length);
    matPuentes.opacity = 0.3 + 0.2 * Math.sin(t * 1.3);
    mundo.updateMatrixWorld();
    renderer.render(escena, camara);
    ubicarRotulos();
    if (visible && !document.hidden) pedir();
  }

  if (quieto) {
    mundo.rotation.set(-0.12, 0.35, 0);
    activar(0);
    mundo.updateMatrixWorld();
    const fijo = () => { renderer.render(escena, camara); ubicarRotulos(); };
    new ResizeObserver(fijo).observe(caja);
    fijo();
  } else {
    pedir();
  }
}
