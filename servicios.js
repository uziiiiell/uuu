const { validarCuerpo, validarQuery } = require('../middlewares/validar');
const { reglasListado } = require('../utilidades/listado');

const TIPOS_COBRO = ['kilo', 'unidad'];
const ORDEN = ['id', 'nombre', 'precio', 'creado_en'];

// Se usa igual en POST y PUT (PUT reemplaza el registro completo)
const validarServicio = validarCuerpo({
  nombre: { tipo: 'texto', requerido: true, min: 3, max: 60 },
  descripcion: { tipo: 'texto', max: 255 },
  tipo_cobro: { tipo: 'enum', requerido: true, valores: TIPOS_COBRO },
  precio: { tipo: 'numero', requerido: true, mayorQue: 0, max: 99999999.99, decimales: 2 },
});

const validarListadoServicios = validarQuery({
  ...reglasListado(ORDEN),
  tipo_cobro: { tipo: 'enum', valores: TIPOS_COBRO },
});

module.exports = { validarServicio, validarListadoServicios };
