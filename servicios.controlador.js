const pool = require('../db');
const { ErrorHttp } = require('../middlewares/errores');
const {
  patronLike, direccionSql, respuestaListado, conflictoDuplicado, conflictoReferencia,
} = require('../utilidades/listado');

const aServicio = (f) => ({
  id: f.id,
  nombre: f.nombre,
  descripcion: f.descripcion,
  tipo_cobro: f.tipo_cobro,
  precio: Number(f.precio),
  creado_en: f.creado_en,
});

async function buscarPorId(id) {
  const [filas] = await pool.execute(
    'SELECT id, nombre, descripcion, tipo_cobro, precio, creado_en FROM servicios WHERE id = ?',
    [id]
  );
  return filas[0] ? aServicio(filas[0]) : null;
}

// GET /api/servicios
async function listar(req, res) {
  const { pagina, limite, orden, dir, buscar, tipo_cobro } = req.filtros;
  const patron = patronLike(buscar);
  const offset = (pagina - 1) * limite;

  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM servicios ' +
    'WHERE (? IS NULL OR nombre LIKE ?) AND (? IS NULL OR tipo_cobro = ?)',
    [patron, patron, tipo_cobro, tipo_cobro]
  );
  // La columna va con ?? (identificador escapado, validada contra lista blanca);
  // la dirección sale de direccionSql, que solo devuelve ASC o DESC.
  const [filas] = await pool.query(
    'SELECT id, nombre, descripcion, tipo_cobro, precio, creado_en FROM servicios ' +
    'WHERE (? IS NULL OR nombre LIKE ?) AND (? IS NULL OR tipo_cobro = ?) ' +
    'ORDER BY ?? ' + direccionSql(dir) + ' LIMIT ? OFFSET ?',
    [patron, patron, tipo_cobro, tipo_cobro, orden, limite, offset]
  );
  res.json(respuestaListado(filas.map(aServicio), pagina, limite, total));
}

// GET /api/servicios/:id
async function obtener(req, res) {
  const servicio = await buscarPorId(Number(req.params.id));
  if (!servicio) throw new ErrorHttp(404, 'Servicio no encontrado');
  res.json(servicio);
}

// POST /api/servicios (admin)
async function crear(req, res) {
  const { nombre, descripcion, tipo_cobro, precio } = req.datos;
  try {
    const [r] = await pool.execute(
      'INSERT INTO servicios (nombre, descripcion, tipo_cobro, precio) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, tipo_cobro, precio]
    );
    res.status(201).json(await buscarPorId(r.insertId));
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe un servicio con ese nombre');
  }
}

// PUT /api/servicios/:id (admin)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!(await buscarPorId(id))) throw new ErrorHttp(404, 'Servicio no encontrado');
  const { nombre, descripcion, tipo_cobro, precio } = req.datos;
  try {
    await pool.execute(
      'UPDATE servicios SET nombre = ?, descripcion = ?, tipo_cobro = ?, precio = ? WHERE id = ?',
      [nombre, descripcion, tipo_cobro, precio, id]
    );
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe un servicio con ese nombre');
  }
  res.json(await buscarPorId(id));
}

// DELETE /api/servicios/:id (admin)
async function eliminar(req, res) {
  try {
    const [r] = await pool.execute('DELETE FROM servicios WHERE id = ?', [Number(req.params.id)]);
    if (r.affectedRows === 0) throw new ErrorHttp(404, 'Servicio no encontrado');
  } catch (err) {
    throw conflictoReferencia(err, 'No se puede eliminar: el servicio tiene pedidos registrados');
  }
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
