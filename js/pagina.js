// Comportamiento de la portada: la escena, el scroll de «Qué se monta», las cifras y la
// aparición de las secciones. Si este archivo no carga, la página se lee completa igual.
import { iniciar } from "/js/escena.js";

const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

// 1. La escena de la portada, que recorre sola los cinco cúmulos.
const portada = document.querySelector(".portada .escena");
if (portada) iniciar(portada.querySelector("canvas"), [...portada.querySelectorAll(".rotulo")]);

// 2. «Qué se monta»: la escena queda fija al costado y resalta la capa que se está leyendo.
//    Solo en pantallas anchas; en tableta vertical y teléfono las capas se leen sin escena.
const fija = document.querySelector(".montaje-escena");
const anchas = window.matchMedia("(min-width: 961px)");
let control = null;
function montarFija() {
  if (control || !fija || !anchas.matches) return;
  control = iniciar(fija.querySelector("canvas"), [...fija.querySelectorAll(".rotulo")], { auto: false });
  const capas = [...document.querySelectorAll(".capa[data-cumulo]")];
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) {
        const k = Number(e.target.dataset.cumulo);
        control.elegir(k);
        capas.forEach((c) => c.classList.toggle("en-foco", c === e.target));
      }
    }
  }, { rootMargin: "-45% 0px -45% 0px" });
  capas.forEach((c) => obs.observe(c));
}
montarFija();
anchas.addEventListener?.("change", montarFija);

// 3. Las cifras cuentan hasta su valor la primera vez que aparecen.
const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '<span class="sep">.</span>');
const cifras = document.querySelectorAll("[data-hasta]");
if (!quieto) {
  const obs = new IntersectionObserver((entradas, o) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      o.unobserve(e.target);
      const el = e.target, hasta = Number(el.dataset.hasta), sufijo = el.dataset.sufijo || "";
      const t0 = performance.now(), dur = 1100;
      const paso = (ahora) => {
        const x = Math.min(1, (ahora - t0) / dur), suave = 1 - Math.pow(1 - x, 3);
        el.innerHTML = miles(Math.round(hasta * suave)) + sufijo;
        if (x < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
  }, { threshold: 0.6 });
  cifras.forEach((c) => obs.observe(c));
}

// 4. Las secciones aparecen al entrar en pantalla.
const revelar = document.querySelectorAll(".bloque h2, .bloque .intro, .cifra, .capa, .nivel, .paso, .ficha");
if (!quieto && "IntersectionObserver" in window) {
  revelar.forEach((el) => el.classList.add("revela"));
  const obs = new IntersectionObserver((entradas, o) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add("visto"); o.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  revelar.forEach((el) => obs.observe(el));
}
