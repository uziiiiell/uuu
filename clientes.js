const { validarCuerpo, validarQuery } = require('../middlewares/validar');
const { reglasListado } = require('../utilidades/listado');

const ORDEN = ['id', 'nombre', 'identidad', 'creado_en'];

const validarCliente = validarCuerpo({
  identidad: {
    tipo: 'texto', requerido: true, min: 4, max: 20,
    patron: /^[A-Za-z0-9-]+$/, mensajePatron: 'Solo admite letras, números y guion',
  },
  nombre: { tipo: 'texto', requerido: true, min: 3, max: 100 },
  telefono: { tipo: 'texto', patron: /^\d{4}-\d{4}$/, mensajePatron: 'Debe tener el formato 9999-9999' },
  correo: {
    tipo: 'texto', max: 120, minusculas: true,
    patron: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensajePatron: 'Debe ser un correo válido',
  },
});

const validarListadoClientes = validarQuery(reglasListado(ORDEN));

module.exports = { validarCliente, validarListadoClientes };
