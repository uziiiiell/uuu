const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errores');
const saludRutas = require('./rutas/salud.rutas');
const authRutas = require('./rutas/auth.rutas');
const serviciosRutas = require('./rutas/servicios.rutas');
const clientesRutas = require('./rutas/clientes.rutas');
const prendasRutas = require('./rutas/prendas.rutas');

const app = express();

app.use(helmet());
// Sin CORS_ORIGEN en .env no se habilita ningún origen (nunca "*").
app.use(cors({ origin: process.env.CORS_ORIGEN || false }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/salud', saludRutas);
app.use('/api/auth', authRutas);
app.use('/api/servicios', serviciosRutas);
app.use('/api/clientes', clientesRutas);
app.use('/api/prendas', prendasRutas);

// Siempre al final, en este orden
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
