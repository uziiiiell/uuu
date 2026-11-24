const pool = require('../db');

// RF-20: si la base no responde, el error llega al middleware central (500 genérico)
async function salud(req, res) {
  await pool.query('SELECT 1');
  res.json({ estado: 'ok', base_datos: 'ok' });
}

module.exports = { salud };
