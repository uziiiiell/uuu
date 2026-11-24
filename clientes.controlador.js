const pool = require('../db');
const { ErrorHttp } = require('../middlewares/errores');
const {
  patronLike, direccionSql, respuestaListado, conflictoDuplicado, conflictoReferencia,
} = require('../utilidades/listado');

async function buscarPorId(id) {
  const [filas] = await pool.execute(
    'SELECT id, identidad, nombre, telefono, correo, creado_en FROM clientes WHERE id = ?',
    [id]
  );
  return filas[0] || null;
}

// GET /api/clientes?buscar=mejía (busca en nombre e identidad)
async function listar(req, res) {
  const { pagina, limite, orden, dir, buscar } = req.filtros;
  const patron = patronLike(buscar);
  const offset = (pagina - 1) * limite;

  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM clientes ' +
    'WHERE (? IS NULL OR nombre LIKE ? OR identidad LIKE ?)',
    [patron, patron, patron]
  );
  const [filas] = await pool.query(
    'SELECT id, identidad, nombre, telefono, correo, creado_en FROM clientes ' +
    'WHERE (? IS NULL OR nombre LIKE ? OR identidad LIKE ?) ' +
    'ORDER BY ?? ' + direccionSql(dir) + ' LIMIT ? OFFSET ?',
    [patron, patron, patron, orden, limite, offset]
  );
  res.json(respuestaListado(filas, pagina, limite, total));
}

// GET /api/clientes/:id
async function obtener(req, res) {
  const cliente = await buscarPorId(Number(req.params.id));
  if (!cliente) throw new ErrorHttp(404, 'Cliente no encontrado');
  res.json(cliente);
}

// POST /api/clientes
async function crear(req, res) {
  const { identidad, nombre, telefono, correo } = req.datos;
  try {
    const [r] = await pool.execute(
      'INSERT INTO clientes (identidad, nombre, telefono, correo) VALUES (?, ?, ?, ?)',
      [identidad, nombre, telefono, correo]
    );
    res.status(201).json(await buscarPorId(r.insertId));
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe un cliente con esa identidad');
  }
}

// PUT /api/clientes/:id
async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!(await buscarPorId(id))) throw new ErrorHttp(404, 'Cliente no encontrado');
  const { identidad, nombre, telefono, correo } = req.datos;
  try {
    await pool.execute(
      'UPDATE clientes SET identidad = ?, nombre = ?, telefono = ?, correo = ? WHERE id = ?',
      [identidad, nombre, telefono, correo, id]
    );
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe un cliente con esa identidad');
  }
  res.json(await buscarPorId(id));
}

// DELETE /api/clientes/:id (admin)
async function eliminar(req, res) {
  try {
    const [r] = await pool.execute('DELETE FROM clientes WHERE id = ?', [Number(req.params.id)]);
    if (r.affectedRows === 0) throw new ErrorHttp(404, 'Cliente no encontrado');
  } catch (err) {
    throw conflictoReferencia(err, 'No se puede eliminar: el cliente tiene prendas o pedidos registrados');
  }
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
