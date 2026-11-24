const router = require('express').Router();
const { auth, permitir } = require('../middlewares/auth');
const { validarId } = require('../middlewares/validar');
const { validarCliente, validarListadoClientes } = require('../validaciones/clientes');
const c = require('../controladores/clientes.controlador');

// Operador y admin pueden todo, salvo borrar (solo admin).
router.get('/', auth, validarListadoClientes, c.listar);
router.get('/:id', auth, validarId, c.obtener);
router.post('/', auth, validarCliente, c.crear);
router.put('/:id', auth, validarId, validarCliente, c.actualizar);
router.delete('/:id', auth, permitir('admin'), validarId, c.eliminar);

module.exports = router;
