const { validarCuerpo, validarQuery } = require('../middlewares/validar');
const { reglasListado } = require('../utilidades/listado');

const ESTADOS = ['recibida', 'en_proceso', 'entregada'];
const ORDEN = ['id', 'codigo_etiqueta', 'descripcion', 'creado_en'];

// "estado" no aparece: el estado inicial es siempre "recibida" y después
// solo cambia con los pedidos. Si el cliente lo envía, se ignora.
const validarPrenda = validarCuerpo({
  cliente_id: { tipo: 'entero', requerido: true },
  codigo_etiqueta: {
    tipo: 'texto', requerido: true, min: 4, max: 30,
    patron: /^[A-Za-z0-9-]+$/, mensajePatron: 'Solo admite letras, números y guion',
  },
  descripcion: { tipo: 'texto', requerido: true, min: 3, max: 100 },
  tipo: { tipo: 'texto', requerido: true, min: 3, max: 40 },
  color: { tipo: 'texto', max: 30 },
});

const validarListadoPrendas = validarQuery({
  ...reglasListado(ORDEN),
  cliente_id: { tipo: 'entero' },
  estado: { tipo: 'enum', valores: ESTADOS },
});

module.exports = { validarPrenda, validarListadoPrendas };
