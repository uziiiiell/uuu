const pool = require('../db');
const { ErrorHttp } = require('../middlewares/errores');
const {
  patronLike, direccionSql, respuestaListado, conflictoDuplicado, conflictoReferencia,
} = require('../utilidades/listado');

// Columnas por las que se puede ordenar -> columna real (lista blanca)
const COLUMNAS_ORDEN = {
  id: 'p.id',
  codigo_etiqueta: 'p.codigo_etiqueta',
  descripcion: 'p.descripcion',
  creado_en: 'p.creado_en',
};

const SELECT_PRENDA =
  'SELECT p.id, p.cliente_id, p.codigo_etiqueta, p.descripcion, p.tipo, p.color, p.estado, p.creado_en, ' +
  'c.identidad AS cliente_identidad, c.nombre AS cliente_nombre ' +
  'FROM prendas p JOIN clientes c ON c.id = p.cliente_id ';

const aPrenda = (f) => ({
  id: f.id,
  codigo_etiqueta: f.codigo_etiqueta,
  descripcion: f.descripcion,
  tipo: f.tipo,
  color: f.color,
  estado: f.estado,
  creado_en: f.creado_en,
  cliente: { id: f.cliente_id, identidad: f.cliente_identidad, nombre: f.cliente_nombre },
});

async function buscarPorId(id) {
  const [filas] = await pool.execute(SELECT_PRENDA + 'WHERE p.id = ?', [id]);
  return filas[0] ? aPrenda(filas[0]) : null;
}

// La FK debe apuntar a un cliente que exista; si no, es un 400 de validación
async function exigirCliente(clienteId) {
  const [filas] = await pool.execute('SELECT id FROM clientes WHERE id = ?', [clienteId]);
  if (!filas[0]) {
    throw new ErrorHttp(400, 'Datos inválidos', [{ campo: 'cliente_id', mensaje: 'El cliente no existe' }]);
  }
}

// GET /api/prendas?cliente_id=1&estado=recibida&buscar=camisa
async function listar(req, res) {
  const { pagina, limite, orden, dir, buscar, cliente_id, estado } = req.filtros;
  const patron = patronLike(buscar);
  const offset = (pagina - 1) * limite;
  const donde =
    'WHERE (? IS NULL OR p.cliente_id = ?) AND (? IS NULL OR p.estado = ?) ' +
    'AND (? IS NULL OR p.descripcion LIKE ? OR p.codigo_etiqueta LIKE ?) ';
  const filtros = [cliente_id, cliente_id, estado, estado, patron, patron, patron];

  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM prendas p ' + donde,
    filtros
  );
  const [filas] = await pool.query(
    SELECT_PRENDA + donde + 'ORDER BY ?? ' + direccionSql(dir) + ' LIMIT ? OFFSET ?',
    [...filtros, COLUMNAS_ORDEN[orden], limite, offset]
  );
  res.json(respuestaListado(filas.map(aPrenda), pagina, limite, total));
}

// GET /api/prendas/:id
async function obtener(req, res) {
  const prenda = await buscarPorId(Number(req.params.id));
  if (!prenda) throw new ErrorHttp(404, 'Prenda no encontrada');
  res.json(prenda);
}

// POST /api/prendas: el estado inicial siempre es "recibida"
async function crear(req, res) {
  const { cliente_id, codigo_etiqueta, descripcion, tipo, color } = req.datos;
  await exigirCliente(cliente_id);
  try {
    const [r] = await pool.execute(
      'INSERT INTO prendas (cliente_id, codigo_etiqueta, descripcion, tipo, color) VALUES (?, ?, ?, ?, ?)',
      [cliente_id, codigo_etiqueta, descripcion, tipo, color]
    );
    res.status(201).json(await buscarPorId(r.insertId));
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe una prenda con ese código de etiqueta');
  }
}

// PUT /api/prendas/:id: no cambia el estado (eso lo hacen los pedidos)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const existente = await buscarPorId(id);
  if (!existente) throw new ErrorHttp(404, 'Prenda no encontrada');

  const { cliente_id, codigo_etiqueta, descripcion, tipo, color } = req.datos;
  await exigirCliente(cliente_id);
  if (cliente_id !== existente.cliente.id && existente.estado !== 'recibida') {
    throw new ErrorHttp(409, 'No se puede cambiar de cliente una prenda que ya está en un pedido');
  }
  try {
    await pool.execute(
      'UPDATE prendas SET cliente_id = ?, codigo_etiqueta = ?, descripcion = ?, tipo = ?, color = ? WHERE id = ?',
      [cliente_id, codigo_etiqueta, descripcion, tipo, color, id]
    );
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe una prenda con ese código de etiqueta');
  }
  res.json(await buscarPorId(id));
}

// DELETE /api/prendas/:id (admin)
async function eliminar(req, res) {
  try {
    const [r] = await pool.execute('DELETE FROM prendas WHERE id = ?', [Number(req.params.id)]);
    if (r.affectedRows === 0) throw new ErrorHttp(404, 'Prenda no encontrada');
  } catch (err) {
    throw conflictoReferencia(err, 'No se puede eliminar: la prenda tiene pedidos registrados');
  }
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
