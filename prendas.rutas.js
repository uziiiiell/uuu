const router = require('express').Router();
const { auth, permitir } = require('../middlewares/auth');
const { validarId } = require('../middlewares/validar');
const { validarPrenda, validarListadoPrendas } = require('../validaciones/prendas');
const c = require('../controladores/prendas.controlador');

// El operador recibe las prendas en mostrador; solo el admin las borra.
router.get('/', auth, validarListadoPrendas, c.listar);
router.get('/:id', auth, validarId, c.obtener);
router.post('/', auth, validarPrenda, c.crear);
router.put('/:id', auth, validarId, validarPrenda, c.actualizar);
router.delete('/:id', auth, permitir('admin'), validarId, c.eliminar);

module.exports = router;
