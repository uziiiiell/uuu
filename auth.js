const { validarCuerpo } = require('../middlewares/validar');

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const claveSegura = (clave) => {
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return 'Debe tener al menos una letra y un número';
  // bcrypt solo usa los primeros 72 bytes
  if (Buffer.byteLength(clave, 'utf8') > 72) return 'No puede superar 72 bytes';
  return null;
};

// El rol NO está aquí: si el cliente lo envía, se ignora (asignación masiva)
const validarRegistro = validarCuerpo({
  nombre: { tipo: 'texto', requerido: true, min: 3, max: 100 },
  correo: { tipo: 'texto', requerido: true, max: 120, minusculas: true, patron: CORREO, mensajePatron: 'Debe ser un correo válido' },
  clave: { tipo: 'texto', requerido: true, min: 8, max: 72, sinRecortar: true, personalizada: claveSegura },
});

const validarLogin = validarCuerpo({
  correo: { tipo: 'texto', requerido: true, max: 120, minusculas: true },
  clave: { tipo: 'texto', requerido: true, max: 72, sinRecortar: true },
});

module.exports = { validarRegistro, validarLogin };
