// Carga los datos de ejemplo: usuarios (con bcrypt), prendas, pedidos y pagos.
// Los servicios y clientes ya los crea database/esquema.sql.
// Se puede ejecutar varias veces: vacía sus tablas y las vuelve a llenar.
//
// Uso: npm run semilla
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const USUARIOS = [
  { nombre: 'Jefe de lavandería', correo: 'admin@sigla.hn', clave: 'Admin2026!', rol: 'admin' },
  { nombre: 'Operador de turno', correo: 'operador@sigla.hn', clave: 'Operador2026!', rol: 'operador' },
];

// [cliente_id, codigo_etiqueta, descripcion, tipo, color, estado]
const PRENDAS = [
  [1, 'ETQ-0001', 'Camisa blanca manga larga', 'camisa', 'blanco', 'entregada'],
  [1, 'ETQ-0002', 'Pantalón de vestir', 'pantalon', 'negro', 'entregada'],
  [2, 'ETQ-0003', 'Traje de dos piezas', 'traje', 'gris', 'en_proceso'],
  [2, 'ETQ-0004', 'Camisa de algodón', 'camisa', 'celeste', 'en_proceso'],
  [3, 'ETQ-0005', 'Vestido de fiesta', 'vestido', 'rojo', 'en_proceso'],
  [4, 'ETQ-0006', 'Edredón matrimonial', 'edredon', 'beige', 'en_proceso'],
  [4, 'ETQ-0007', 'Cobija de lana', 'cobija', 'azul', 'en_proceso'],
  [5, 'ETQ-0008', 'Blusa de seda', 'blusa', 'blanco', 'entregada'],
  [5, 'ETQ-0009', 'Falda plisada', 'falda', 'negro', 'recibida'],
  [6, 'ETQ-0010', 'Chaqueta de cuero', 'chaqueta', 'negro', 'recibida'],
  [6, 'ETQ-0011', 'Camiseta deportiva', 'camiseta', 'verde', 'recibida'],
  [7, 'ETQ-0012', 'Jeans', 'pantalon', 'azul', 'recibida'],
  [7, 'ETQ-0013', 'Sábana king', 'sabana', 'blanco', 'recibida'],
  [8, 'ETQ-0014', 'Corbata de seda', 'corbata', 'rojo', 'recibida'],
  [8, 'ETQ-0015', 'Saco de lino', 'saco', 'beige', 'recibida'],
];

// Pedidos en distintos estados.
// [cliente_id, usuario (1=admin, 2=operador), dias_atras_recepcion, dias_para_entrega (negativo = ya pasó), estado, total]
const PEDIDOS = [
  [1, 2, 14, -10, 'entregado', 67.5],
  [2, 1, 2, 1, 'listo', 150],
  [3, 2, 6, -2, 'en_proceso', 125], // atrasado
  [4, 2, 1, 3, 'en_proceso', 240],
  [5, 1, 20, -16, 'entregado', 60],
];

// [pedido_id, prenda_id, servicio_id, cantidad, precio_unitario]
const DETALLES = [
  [1, 1, 1, 1.5, 25], [1, 1, 3, 1, 15], [1, 2, 3, 1, 15],
  [2, 3, 4, 1, 90], [2, 4, 2, 1, 60],
  [3, 5, 4, 1, 90], [3, 5, 6, 1, 35],
  [4, 6, 5, 1, 120], [4, 7, 5, 1, 120],
  [5, 8, 2, 1, 60],
];

// [pedido_id, usuario_id, monto, metodo]
const PAGOS = [
  [1, 2, 67.5, 'efectivo'],
  [2, 1, 50, 'tarjeta'],
  [4, 2, 100, 'transferencia'],
  [5, 1, 60, 'efectivo'],
];

async function main() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sigla',
    charset: 'utf8mb4',
  });

  try {
    // Los clientes (1 a 8) y servicios (1 a 6) vienen de esquema.sql
    const [[{ clientes }]] = await conexion.query('SELECT COUNT(*) AS clientes FROM clientes WHERE id BETWEEN 1 AND 8');
    const [[{ servicios }]] = await conexion.query('SELECT COUNT(*) AS servicios FROM servicios WHERE id BETWEEN 1 AND 6');
    if (clientes !== 8 || servicios !== 6) {
      throw new Error('Faltan clientes o servicios de ejemplo. Ejecute primero: npm run db');
    }

    await conexion.query('SET FOREIGN_KEY_CHECKS = 0');
    await conexion.query('TRUNCATE TABLE pagos');
    await conexion.query('TRUNCATE TABLE pedido_detalle');
    await conexion.query('TRUNCATE TABLE pedidos');
    await conexion.query('TRUNCATE TABLE prendas');
    await conexion.query('TRUNCATE TABLE usuarios');
    await conexion.query('SET FOREIGN_KEY_CHECKS = 1');

    await conexion.beginTransaction();

    for (const u of USUARIOS) {
      const hash = await bcrypt.hash(u.clave, 10);
      await conexion.execute(
        'INSERT INTO usuarios (nombre, correo, hash, rol) VALUES (?, ?, ?, ?)',
        [u.nombre, u.correo, hash, u.rol]
      );
    }

    for (const p of PRENDAS) {
      await conexion.execute(
        'INSERT INTO prendas (cliente_id, codigo_etiqueta, descripcion, tipo, color, estado) VALUES (?, ?, ?, ?, ?, ?)',
        p
      );
    }

    for (const [cliente, usuario, diasAtras, diasEntrega, estado, total] of PEDIDOS) {
      if (estado === 'entregado') {
        await conexion.execute(
          'INSERT INTO pedidos (cliente_id, usuario_id, fecha_recepcion, fecha_entrega_prevista, fecha_entrega, estado, total) ' +
          'VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_ADD(CURDATE(), INTERVAL ? DAY), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?)',
          [cliente, usuario, diasAtras, diasEntrega, diasEntrega, estado, total]
        );
      } else {
        await conexion.execute(
          'INSERT INTO pedidos (cliente_id, usuario_id, fecha_recepcion, fecha_entrega_prevista, estado, total) ' +
          'VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?)',
          [cliente, usuario, diasAtras, diasEntrega, estado, total]
        );
      }
    }

    for (const [pedido, prenda, servicio, cantidad, precio] of DETALLES) {
      await conexion.execute(
        'INSERT INTO pedido_detalle (pedido_id, prenda_id, servicio_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [pedido, prenda, servicio, cantidad, precio, Math.round(cantidad * precio * 100) / 100]
      );
    }

    for (const pago of PAGOS) {
      await conexion.execute(
        'INSERT INTO pagos (pedido_id, usuario_id, monto, metodo) VALUES (?, ?, ?, ?)',
        pago
      );
    }

    await conexion.commit();
    console.log('Semilla cargada: 2 usuarios, 15 prendas, 5 pedidos, 10 líneas de detalle y 4 pagos.');
    for (const u of USUARIOS) console.log(`  ${u.rol.padEnd(9)} ${u.correo}  /  ${u.clave}`);
  } catch (err) {
    await conexion.rollback().catch(() => {});
    console.error('No se pudo cargar la semilla:', err.message);
    process.exitCode = 1;
  } finally {
    await conexion.end();
  }
}

main();
