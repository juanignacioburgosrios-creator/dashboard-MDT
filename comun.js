"use strict";

function filas(col) {
  const claves = Object.keys(col || {});
  if (!claves.length) return [];
  const n = col[claves[0]].length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = {};
    for (const k of claves) o[k] = col[k][i];
    out[i] = o;
  }
  return out;
}

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const num = (x, d) => (x == null || Number.isNaN(x) ? "—" : Number(x).toFixed(d === undefined ? 2 : d));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const miles = (x) => (x == null ? "—" : Number(x).toLocaleString("es"));
const unicos = (a) => Array.from(new Set(a)).sort();

function pintarTabla(id, datos, columnas, opciones) {
  const o = opciones || {};
  const t = document.getElementById(id);
  if (!t) return;
  if (!datos.length) {
    t.innerHTML = '<tbody><tr><td class="vacio">Sin filas</td></tr></tbody>';
    return;
  }
  t.innerHTML =
    "<thead><tr>" + columnas.map((c) =>
      '<th class="' + (c.num ? "num" : "") + '">' + esc(c.t) + "</th>").join("") + "</tr></thead>" +
    "<tbody>" + datos.map((f, i) =>
      '<tr data-i="' + i + '" class="' + (o.clic ? "clic" : "") + '">' +
      columnas.map((c) =>
        '<td class="' + (c.num ? "num" : "") + '">' +
        (c.f ? c.f(f) : esc(f[c.k])) + "</td>").join("") + "</tr>").join("") +
    "</tbody>";
  if (o.clic) {
    t.querySelectorAll("tbody tr").forEach((tr) => {
      tr.onclick = () => {
        t.querySelectorAll("tbody tr").forEach((x) => x.classList.remove("sel"));
        tr.classList.add("sel");
        o.clic(datos[Number(tr.dataset.i)]);
      };
    });
  }
}

function opciones(sel, valores, vacio, texto) {
  const e = document.getElementById(sel);
  if (!e) return;
  e.innerHTML = '<option value="">' + vacio + "</option>" +
    valores.map((v) => '<option value="' + esc(v) + '">' +
      esc(texto ? texto(v) : v) + "</option>").join("");
}

function pintarKpis(id, pares) {
  document.getElementById(id).innerHTML = pares.map(([n, t]) =>
    '<div class="kpi"><div class="n">' + n + '</div><div class="t">' + t + "</div></div>").join("");
}

function pestanias() {
  document.querySelectorAll("nav button").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll("nav button").forEach((x) => x.classList.remove("activa"));
      b.classList.add("activa");
      document.querySelectorAll("main > section").forEach((s) => s.classList.add("oculta"));
      document.getElementById("panel-" + b.dataset.panel).classList.remove("oculta");
    };
  });
}

const PERFIL = (function () {
  const donde = (location.search || "") + (location.hash || "");
  const m = /[?&#]perfil=([a-z0-9_]*)/.exec(donde);
  return m ? m[1] : "";
})();
const SUFIJO = PERFIL ? "_" + PERFIL : "";
const rutaDatos = (archivo) => "datos" + SUFIJO + "/" + archivo;
const rutaSalidas = (resto) => "../salidas" + SUFIJO + "/" + resto;

function marcarPerfil() {
  if (!PERFIL) return;
  const h = document.querySelector("header h1");
  if (h) {
    h.insertAdjacentHTML("beforeend",
      ' <span class="pill no" style="vertical-align:middle;font-size:12px">perfil: ' +
      esc(PERFIL) + "</span>");
  }
  document.title = document.title + " · " + PERFIL;
}

function cargarDatos(archivos, cb) {
  let pendientes = archivos.length;
  const fallidos = [];
  archivos.forEach((a) => {
    const s = document.createElement("script");
    s.src = rutaDatos(a);
    s.onload = s.onerror = function (ev) {
      if (ev.type === "error") fallidos.push(a);
      if (--pendientes === 0) {
        if (fallidos.length) {
          document.body.insertAdjacentHTML("afterbegin",
            '<div class="vacio">No se encontraron los datos' +
            (PERFIL ? " del perfil <strong>" + esc(PERFIL) + "</strong>" : "") +
            ": " + fallidos.map(esc).join(", ") +
            ". Ejecute <code>Rscript analisis/ejecutar.R" +
            (PERFIL ? " perfil=" + esc(PERFIL) : "") + "</code>.</div>");
          return;
        }
        marcarPerfil();
        cb();
      }
    };
    document.head.appendChild(s);
  });
}

function cargador(cache, prefijo) {
  const pedidos = {};
  return function (clave, cb) {
    if (cache[clave]) { cb(cache[clave]); return; }
    if (pedidos[clave]) { pedidos[clave].push(cb); return; }
    pedidos[clave] = [cb];
    const s = document.createElement("script");
    s.src = rutaDatos(prefijo + clave.replace("|", "_").replace(/[^A-Za-z0-9_]/g, "_") + ".js");
    s.onload = () => { pedidos[clave].forEach((f) => f(cache[clave])); delete pedidos[clave]; };
    s.onerror = () => { pedidos[clave].forEach((f) => f(null)); delete pedidos[clave]; };
    document.head.appendChild(s);
  };
}

const DIA = 86400000;
const fechaDesde = (inicio, i) => new Date(Date.parse(inicio + "T00:00:00Z") + i * DIA);
const iso = (d) => d.toISOString().slice(0, 10);

function trazo(valores, i0, i1, x, y, color, grosor, opacidad) {
  let d = "", abierto = false, sueltos = "";
  for (let i = i0; i <= i1; i++) {
    const v = valores[i];
    if (v == null || !isFinite(v)) { abierto = false; continue; }
    d += (abierto ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1) + " ";
    const antes = valores[i - 1], despues = valores[i + 1];
    if ((antes == null || !isFinite(antes)) && (despues == null || !isFinite(despues))) {
      sueltos += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) +
                 '" r="1.8" fill="' + color + '"/>';
    }
    abierto = true;
  }
  return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + grosor +
    '" stroke-linejoin="round" opacity="' + (opacidad == null ? 1 : opacidad) + '"/>' + sueltos;
}

function rangoDe(valores, i0, i1) {
  let lo = Infinity, hi = -Infinity;
  for (let i = i0; i <= i1; i++) {
    const v = valores[i];
    if (v == null || !isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!isFinite(lo)) return [0, 1];
  if (lo === hi) return [lo - 0.5, hi + 0.5];
  return [lo, hi];
}

function ejeFechas(inicio, i0, i1, x, geo) {
  const largo = i1 - i0;
  const paso = largo > 7300 ? 1826 : largo > 1825 ? 365 : largo > 400 ? 91
             : largo > 90 ? 30 : largo > 30 ? 7 : 2;
  let out = "";
  for (let i = Math.ceil(i0 / paso) * paso; i <= i1; i += paso) {
    const f = iso(fechaDesde(inicio, i));
    const etiqueta = largo > 1825 ? f.slice(0, 4) : largo > 90 ? f.slice(0, 7) : f.slice(5);
    out += '<line x1="' + x(i) + '" y1="' + geo.MT + '" x2="' + x(i) + '" y2="' + (geo.H - geo.MB) +
           '" stroke="#f2efeb"/>' +
           '<text x="' + x(i) + '" y="' + (geo.H - geo.MB + 14) +
           '" font-size="10" fill="#6b665e" text-anchor="middle">' + esc(etiqueta) + "</text>";
  }
  return out;
}

function ejeY(lo, hi, y, geo, decimales) {
  let out = "";
  for (let k = 0; k <= 4; k++) {
    const v = lo + (k / 4) * (hi - lo);
    out += '<line x1="' + geo.ML + '" y1="' + y(v) + '" x2="' + (geo.W - geo.MR) + '" y2="' + y(v) +
           '" stroke="#f2efeb"/>' +
           '<text x="' + (geo.ML - 6) + '" y="' + (y(v) + 3) +
           '" font-size="10" fill="#6b665e" text-anchor="end">' + num(v, decimales) + "</text>";
  }
  return out;
}

(function () {
  const h = document.querySelector("header");
  if (!h) return;
  h.insertAdjacentHTML("beforeend",
    '<a class="volver-inicio" href="index.html" title="Volver al inicio">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/></svg></a>');
})();
