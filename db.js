const mysql = require('mysql2/promise');

// Un solo pool para toda la aplicación (RNF-09).
// dateStrings devuelve las fechas como texto "AAAA-MM-DD HH:mm:ss" en vez de objetos Date.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sigla',
  charset: 'utf8mb4',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
