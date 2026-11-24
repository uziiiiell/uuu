# SIGLA · API de Gestión de Lavandería

**Caso:** Sistema de lavandería (caso propio)
**Espacio:** DIA-117 Programación Aplicada, sección 1100, UNAH El Paraíso

## Integrantes

| Nombre | Número de cuenta |
|---|---|
| (completar) | (completar) |
| (completar) | (completar) |
| (completar) | (completar) |

## Requisitos previos

- Node.js LTS (20 o superior)
- MySQL 8
- Git

## Instalación

```bash
git clone <URL-del-repositorio>
cd lavanderia-api
npm install
cp .env.example .env     # completar DB_PASSWORD y JWT_SECRET
npm run db               # crea la base (pide la clave de MySQL)
npm run semilla          # carga usuarios, prendas, pedidos y pagos de ejemplo
npm start
```

Para generar el `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

El servidor no arranca si falta `JWT_SECRET` o tiene menos de 32 caracteres. Para desarrollo con recarga automática: `npm run dev`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| PORT | Puerto del servidor (3000) |
| DB_HOST | Servidor de MySQL (localhost) |
| DB_PORT | Puerto de MySQL (3306) |
| DB_USER | Usuario de MySQL |
| DB_PASSWORD | Clave de MySQL |
| DB_NAME | Nombre de la base de datos (sigla) |
| JWT_SECRET | Secreto para firmar tokens, 32 caracteres o más |
| JWT_EXPIRA | Duración del token (2h) |
| CORS_ORIGEN | Origen permitido por CORS (http://localhost:5500) |

## Usuarios de prueba

| Rol | Correo | Clave |
|---|---|---|
| admin | admin@sigla.hn | Admin2026! |
| operador | operador@sigla.hn | Operador2026! |

## Endpoints

Todos van bajo el prefijo `/api`, con JSON. Las rutas protegidas exigen el encabezado `Authorization: Bearer <token>`. Los listados aceptan `pagina`, `limite` (máximo 50), `orden` y `dir`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | /api/salud | público | Confirma que la API y la base responden |
| POST | /api/auth/login | público | Inicia sesión y devuelve el JWT |
| POST | /api/auth/registro | admin | Registra un empleado (rol `operador`) |
| GET | /api/auth/perfil | autenticado | Perfil del dueño del token |
| GET | /api/servicios | autenticado | Lista servicios |
| GET | /api/servicios/:id | autenticado | Detalle de un servicio |
| POST | /api/servicios | admin | Crea un servicio |
| PUT | /api/servicios/:id | admin | Modifica un servicio |
| DELETE | /api/servicios/:id | admin | Elimina un servicio sin historial |
| GET | /api/clientes | autenticado | Lista clientes; `buscar` en nombre o identidad |
| GET | /api/clientes/:id | autenticado | Detalle de un cliente |
| POST | /api/clientes | autenticado | Crea un cliente |
| PUT | /api/clientes/:id | autenticado | Modifica un cliente |
| DELETE | /api/clientes/:id | admin | Elimina un cliente sin historial |
| GET | /api/prendas | autenticado | Lista prendas; filtros `cliente_id`, `estado`, `buscar` |
| GET | /api/prendas/:id | autenticado | Detalle de una prenda |
| POST | /api/prendas | autenticado | Registra una prenda (estado inicial `recibida`) |
| PUT | /api/prendas/:id | autenticado | Modifica una prenda |
| DELETE | /api/prendas/:id | admin | Elimina una prenda sin historial |
| GET | /api/pedidos | autenticado | Lista pedidos; filtros `estado`, `cliente_id`, `desde`, `hasta` |
| GET | /api/pedidos/:id | autenticado | Pedido con cliente, prendas, servicios, pagos y empleado |
| POST | /api/pedidos | autenticado | Crea un pedido con varias prendas (transacción) |
| PATCH | /api/pedidos/:id/estado | autenticado | Avanza el estado: `listo` o `entregado` |
| GET | /api/pedidos/:id/pagos | autenticado | Lista los pagos de un pedido |
| POST | /api/pedidos/:id/pagos | autenticado | Registra un pago |
| GET | /api/reportes/atrasados | autenticado | Pedidos atrasados, con `dias_atraso` |
| GET | /api/reportes/servicios-mas-solicitados | admin | Top 5 de servicios en un rango `desde`/`hasta` |

Estado: salud, autenticación, servicios, clientes y prendas están implementados (Hito 2). Pedidos, pagos y reportes se implementan en el Hito 3.

## Colección de Postman

Importar `postman/SIGLA.postman_collection.json` en Postman y ejecutarla con el Runner sobre una base recién creada (`npm run db` y `npm run semilla`) con la API en marcha. Las variables `base_url` y las credenciales están en la colección.

## Decisiones de diseño y limitaciones conocidas

- Empleados y usuarios son la misma tabla (`usuarios`).
- Las prendas son la entidad principal: el pedido las pasa de `recibida` a `en_proceso`.
- El estado de una prenda no se envía desde el cliente; siempre nace `recibida`.
- Las contraseñas usan bcrypt (paquete `bcryptjs`, costo 10).
- Los listados usan `pool.query` con marcadores `?`; la columna de `orden` se valida contra una lista blanca y se escapa con `??`.
- Una prenda entregada no se reutiliza; si el cliente la trae otra vez, se registra una nueva.
