-- =====================================================================
-- SIGLA · Sistema de Gestión de Lavandería
-- DIA-117 Programación Aplicada · Proyecto CE2
--
-- Uso:  mysql -u root -p < database/esquema.sql      (o: npm run db)
-- Se puede ejecutar varias veces seguidas: borra y recrea la base.
-- Los usuarios (con hash bcrypt), prendas, pedidos y pagos de ejemplo
-- los carga database/semilla.js (npm run semilla).
-- =====================================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS sigla;
CREATE DATABASE sigla
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE sigla;

-- ---------------------------------------------------------------------
-- 1. usuarios: empleados que inician sesión en la API
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  hash CHAR(60) NOT NULL,
  rol ENUM('admin', 'operador') NOT NULL DEFAULT 'operador',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. servicios: catálogo 1 (lavado, planchado, tintorería...)
-- ---------------------------------------------------------------------
CREATE TABLE servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  tipo_cobro ENUM('kilo', 'unidad') NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_servicios_precio CHECK (precio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. clientes: catálogo 2 (identidad única)
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identidad VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(9) NULL,
  correo VARCHAR(120) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. prendas: entidad principal (FK a clientes, campo de estado)
--    recibida -> en_proceso (al crear el pedido) -> entregada
-- ---------------------------------------------------------------------
CREATE TABLE prendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  codigo_etiqueta VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(100) NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  color VARCHAR(30) NULL,
  estado ENUM('recibida', 'en_proceso', 'entregada') NOT NULL DEFAULT 'recibida',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prendas_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT,
  INDEX idx_prendas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. pedidos: cabecera de la transacción
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha_recepcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega_prevista DATE NOT NULL,
  fecha_entrega DATETIME NULL,
  estado ENUM('en_proceso', 'listo', 'entregado') NOT NULL DEFAULT 'en_proceso',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  observaciones VARCHAR(255) NULL,
  CONSTRAINT chk_pedidos_total CHECK (total >= 0),
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_pedidos_estado_fecha (estado, fecha_entrega_prevista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. pedido_detalle: líneas del pedido (prenda + servicio aplicado).
--    Resuelve el muchos a muchos entre pedidos y servicios.
--    precio_unitario guarda el precio vigente al momento del pedido.
-- ---------------------------------------------------------------------
CREATE TABLE pedido_detalle (
  pedido_id INT NOT NULL,
  prenda_id INT NOT NULL,
  servicio_id INT NOT NULL,
  cantidad DECIMAL(8,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (pedido_id, prenda_id, servicio_id),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_precio CHECK (precio_unitario > 0),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_prenda FOREIGN KEY (prenda_id)
    REFERENCES prendas(id) ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_servicio FOREIGN KEY (servicio_id)
    REFERENCES servicios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. pagos: un pedido puede tener uno o varios pagos
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  usuario_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pagos_monto CHECK (monto > 0),
  CONSTRAINT fk_pagos_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pagos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Datos de catálogo (los usuarios con bcrypt los carga semilla.js)
-- ---------------------------------------------------------------------
INSERT INTO servicios (nombre, descripcion, tipo_cobro, precio) VALUES
  ('Lavado por kilo',      'Lavado y secado de ropa de uso diario',        'kilo',   25.00),
  ('Lavado en seco',       'Para prendas delicadas o de tela fina',        'unidad', 60.00),
  ('Planchado',            'Planchado y doblado por prenda',               'unidad', 15.00),
  ('Tintorería',           'Limpieza profesional de trajes y vestidos',    'unidad', 90.00),
  ('Lavado de cobijas',    'Cobijas, edredones y cubrecamas',              'unidad', 120.00),
  ('Desmanchado',          'Tratamiento especial para manchas difíciles',  'unidad', 35.00);

INSERT INTO clientes (identidad, nombre, telefono, correo) VALUES
  ('0801-1990-12345', 'María Fernanda Mejía',     '9988-7654', 'maria.mejia@correo.hn'),
  ('0703-1985-00421', 'José Luis Castillo',       '3344-5566', 'jose.castillo@correo.hn'),
  ('0801-1998-07788', 'Ana Patricia Zelaya',      '9456-1234', NULL),
  ('1201-1979-00315', 'Carlos Alberto Reyes',     '8877-6655', 'carlos.reyes@correo.hn'),
  ('0801-2001-15520', 'Daniela Sofía Ordóñez',    '3211-0987', 'daniela.ordonez@correo.hn'),
  ('0501-1992-03344', 'Roberto Antonio Núñez',    NULL,        NULL),
  ('0703-1996-09912', 'Lesly Carolina Banegas',   '9900-1122', 'lesly.banegas@correo.hn'),
  ('0801-1988-21001', 'Kevin Josué Paz',          '3300-4455', 'kevin.paz@correo.hn');
