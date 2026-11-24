const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { ErrorHttp } = require('../middlewares/errores');
const { conflictoDuplicado } = require('../utilidades/listado');

const COSTO_BCRYPT = 10;
// Se compara contra este hash cuando el correo no existe, para que el tiempo de
// respuesta no revele qué correos están registrados.
const HASH_FALSO = bcrypt.hashSync('clave-que-nadie-usa', COSTO_BCRYPT);

// POST /api/auth/login (público)
async function login(req, res) {
  const { correo, clave } = req.datos;
  const [filas] = await pool.execute(
    'SELECT id, nombre, correo, hash, rol, activo FROM usuarios WHERE correo = ?',
    [correo]
  );
  const usuario = filas[0];
  const coincide = await bcrypt.compare(clave, usuario ? usuario.hash : HASH_FALSO);

  // Mismo mensaje para correo inexistente, clave incorrecta o usuario inactivo
  if (!usuario || !usuario.activo || !coincide) {
    throw new ErrorHttp(401, 'Credenciales inválidas');
  }

  const expiraEn = process.env.JWT_EXPIRA || '2h';
  // El token lleva solo { id, rol }
  const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: expiraEn,
    algorithm: 'HS256',
  });
  res.json({
    token,
    expira_en: expiraEn,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
  });
}

// POST /api/auth/registro (solo admin). El rol siempre es "operador".
async function registro(req, res) {
  const { nombre, correo, clave } = req.datos;
  const hash = await bcrypt.hash(clave, COSTO_BCRYPT);
  try {
    const [r] = await pool.execute(
      "INSERT INTO usuarios (nombre, correo, hash, rol) VALUES (?, ?, ?, 'operador')",
      [nombre, correo, hash]
    );
    res.status(201).json({ id: r.insertId, nombre, correo, rol: 'operador' });
  } catch (err) {
    throw conflictoDuplicado(err, 'Ya existe un usuario con ese correo');
  }
}

// GET /api/auth/perfil: se lee de la base de datos, no del token
async function perfil(req, res) {
  const [filas] = await pool.execute(
    'SELECT id, nombre, correo, rol FROM usuarios WHERE id = ? AND activo = 1',
    [req.usuario.id]
  );
  if (!filas[0]) throw new ErrorHttp(401, 'Usuario no encontrado o inactivo');
  res.json(filas[0]);
}

module.exports = { login, registro, perfil };
