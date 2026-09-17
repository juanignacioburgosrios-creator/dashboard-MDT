# Memoria de título

Coloca el PDF definitivo en esta carpeta con el nombre exacto `memoria-titulo.pdf`.
La ruta desde la raíz del repositorio debe ser:

```text
assets/memoria-titulo.pdf
```

El botón «Descargar memoria de título (PDF)» de `index.html` apunta a este archivo
mediante una ruta relativa, compatible con el sitio publicado bajo
`/dashboard-MDT/` en GitHub Pages y con otros servidores estáticos.

El PDF todavía no está incluido: hasta que se agregue y se publique junto al sitio,
el botón apuntará a un archivo inexistente (HTTP 404). No hace falta cambiar HTML
ni JavaScript al añadirlo. Respeta el nombre en minúsculas y sin tildes.

El atributo HTML `download` solicita la descarga con el nombre
`memoria-titulo.pdf`; el comportamiento final depende del navegador y del servidor.
