// Ayudas compartidas por los listados paginados.
const { ErrorHttp } = require('../middlewares/errores');

// Reglas de consulta comunes: pagina, limite, orden, dir y buscar (RF-07, RF-08, RF-09)
function reglasListado(camposOrden) {
  return {
    pagina: { tipo: 'entero', min: 1, max: 1000000, defecto: 1 },
    limite: { tipo: 'entero', min: 1, max: 50, defecto: 10 },
    orden: { tipo: 'enum', valores: camposOrden, defecto: camposOrden[0] },
    dir: { tipo: 'enum', valores: ['asc', 'desc'], defecto: 'asc' },
    buscar: { tipo: 'texto', max: 100 },
  };
}

// Convierte el texto de búsqueda en patrón LIKE, escapando % _ y \ para que
// el usuario no pueda usarlos como comodines. Sin texto devuelve null.
function patronLike(texto) {
  if (!texto) return null;
  return '%' + texto.replace(/[\\%_]/g, '\\$&') + '%';
}

// Dirección del ORDER BY: solo puede salir de esta lista blanca.
function direccionSql(dir) {
  return dir === 'desc' ? 'DESC' : 'ASC';
}

function respuestaListado(datos, pagina, limite, total) {
  return {
    datos,
    paginacion: { pagina, limite, total, paginas: Math.ceil(total / limite) },
  };
}

// Convierte un error de clave duplicada en un 409 con mensaje propio del recurso
function conflictoDuplicado(err, mensaje) {
  return err.code === 'ER_DUP_ENTRY' ? new ErrorHttp(409, mensaje) : err;
}

// Convierte un error de clave foránea (borrar con historial) en un 409 claro
function conflictoReferencia(err, mensaje) {
  return err.code === 'ER_ROW_IS_REFERENCED_2' ? new ErrorHttp(409, mensaje) : err;
}

module.exports = {
  reglasListado,
  patronLike,
  direccionSql,
  respuestaListado,
  conflictoDuplicado,
  conflictoReferencia,
};
