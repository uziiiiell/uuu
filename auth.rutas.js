const router = require('express').Router();
const { auth, permitir } = require('../middlewares/auth');
const { validarLogin, validarRegistro } = require('../validaciones/auth');
const { login, registro, perfil } = require('../controladores/auth.controlador');

router.post('/login', validarLogin, login);
router.post('/registro', auth, permitir('admin'), validarRegistro, registro);
router.get('/perfil', auth, perfil);

module.exports = router;
