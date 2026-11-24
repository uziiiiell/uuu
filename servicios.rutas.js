const router = require('express').Router();
const { auth, permitir } = require('../middlewares/auth');
const { validarId } = require('../middlewares/validar');
const { validarServicio, validarListadoServicios } = require('../validaciones/servicios');
const c = require('../controladores/servicios.controlador');

// Lectura: cualquier usuario autenticado. Escritura: solo admin.
router.get('/', auth, validarListadoServicios, c.listar);
router.get('/:id', auth, validarId, c.obtener);
router.post('/', auth, permitir('admin'), validarServicio, c.crear);
router.put('/:id', auth, permitir('admin'), validarId, validarServicio, c.actualizar);
router.delete('/:id', auth, permitir('admin'), validarId, c.eliminar);

module.exports = router;
