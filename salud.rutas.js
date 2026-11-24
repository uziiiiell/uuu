const router = require('express').Router();
const { salud } = require('../controladores/salud.controlador');

router.get('/', salud);

module.exports = router;
