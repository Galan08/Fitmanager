# FitManager — Documentación técnica del proyecto

**Sistema cliente/servidor de administración y gestión para gimnasio**
Universidad Francisco de Paula Santander Seccional Ocaña · Bases de Datos · Segundo parcial
Integrantes: Dorainy Guerrero Bayona (0192366) · Jesús Miguel Zapata Lozano (0192342) · Johan Sebastián Galán Herrera (0192348)

---

## 1. Descripción del problema

Un gimnasio gestiona a diario clientes, cobros de membresías, ingresos a las sedes, clases grupales y rutinas personalizadas. Sin un sistema centralizado aparecen tres problemas:

- Incumplimiento de aforo en clases grupales (más reservas que cupos).
- Pérdidas por clientes con membresía vencida que siguen ingresando, y facturas sin cobrar.
- Falta de seguimiento del trabajo de entrenadores y de la asistencia de los clientes.

**FitManager** resuelve esto con una aplicación web cliente/servidor que guarda todo en una base de datos relacional de **16 tablas** (3FN). Necesita base de datos porque la información es persistente, compartida por varios usuarios a la vez, relacional (un pago depende de una factura, que depende de una suscripción, que depende de un cliente y un plan) y debe consultarse con filtros y agrupaciones para los informes.

## 2. Cambio al MER por indicación del docente

Se **eliminó la tabla `Cliente`**: el cliente se maneja por **rol**. Un cliente es una `Persona` con un `Usuario` cuyo `Rol` es "Cliente".

| Antes | Ahora |
|---|---|
| `cliente(id_cliente, id_persona, fecha_registro)` | Tabla eliminada. `fecha_registro` pasó a `persona`. |
| FK `id_cliente → cliente` en suscripcion, control_acceso, reserva_clase, rutina | FK `id_cliente → persona(id_persona)` |
| Garantía de "ser cliente" por la tabla | Se valida en la **capa lógica** (`clienteRepo.hasRole(id, 'Cliente')`) antes de cada INSERT |

Resultado: 17 → **16 tablas** (el mínimo exigido es 12; todas tienen función real).

**Motor de base de datos: PostgreSQL.** Adaptaciones de tipos respecto al MER original:

| MER | PostgreSQL |
|---|---|
| `INT AUTO_INCREMENT` | `INT GENERATED ALWAYS AS IDENTITY` |
| `DECIMAL(10,2)` | `NUMERIC(10,2)` |
| `DATETIME` | `TIMESTAMP(0)` |
| `ENUM('A','B')` | `VARCHAR` + `CHECK (col IN ('A','B'))` |
| `BIGINT AUTO_INCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` |

## 3. Modelo relacional

Notación: **PK** clave primaria · *FK* clave foránea · UK única. Diagrama completo: `docs/diagrama_er.html` (o `diagrama_er.mmd`).

| Tabla | Atributos | Claves foráneas |
|---|---|---|
| **sede** | **id_sede**, nombre, direccion, telefono, estado | — |
| **rol** | **id_rol**, nombre (UK), descripcion | — |
| **persona** | **id_persona**, documento_identidad (UK), nombres, apellidos, fecha_nacimiento, email, telefono, fecha_registro | — |
| **usuario** | **id_usuario**, id_persona (UK), id_rol, username (UK), password_hash, fecha_creacion | *id_persona → persona*, *id_rol → rol* |
| **entrenador** | **id_entrenador**, id_persona (UK), id_sede, especialidad | *id_persona → persona*, *id_sede → sede* |
| **membresia** | **id_membresia**, nombre (UK), descripcion, precio, duracion_dias, estado | — |
| **suscripcion** | **id_suscripcion**, id_cliente, id_membresia, fecha_inicio, fecha_fin, estado | *id_cliente → persona*, *id_membresia → membresia* |
| **factura** | **id_factura**, id_suscripcion, numero_factura (UK), fecha_emision, subtotal, descuento, impuesto, total, estado | *id_suscripcion → suscripcion* |
| **pago** | **id_pago**, id_factura, monto, fecha_pago, metodo_pago, estado_pago, referencia_pago (UK), concepto | *id_factura → factura* |
| **control_acceso** | **id_acceso**, id_cliente, id_sede, fecha_hora_ingreso, fecha_hora_salida | *id_cliente → persona*, *id_sede → sede* |
| **clase** | **id_clase**, nombre_clase (UK), descripcion, capacidad_maxima | — |
| **programacion_clase** | **id_programacion**, id_clase, id_entrenador, id_sede, fecha_hora_inicio, duracion_minutos | *→ clase*, *→ entrenador*, *→ sede* |
| **reserva_clase** | **id_reserva**, id_cliente, id_programacion, fecha_reserva, estado_reserva — UK(id_cliente, id_programacion) | *id_cliente → persona*, *id_programacion → programacion_clase* |
| **rutina** | **id_rutina**, id_cliente, id_entrenador, nombre_rutina, objetivo, fecha_asignacion | *id_cliente → persona*, *id_entrenador → entrenador* |
| **ejercicio** | **id_ejercicio**, nombre_ejercicio (UK), grupo_muscular, descripcion | — |
| **detalle_rutina** | **id_detalle**, id_rutina, id_ejercicio, series, repeticiones, descanso_segundos, orden | *id_rutina → rutina* (CASCADE), *id_ejercicio → ejercicio* |

**19 claves foráneas** en total. Relaciones: 1:1 (persona–usuario), 1:N (sede–entrenador, suscripcion–factura, factura–pago, …) y **N:M resueltas con tablas intermedias**: `reserva_clase` (cliente ↔ programación de clase) y `detalle_rutina` (rutina ↔ ejercicio).

**Integridad:** todas las FK usan `ON DELETE RESTRICT` (no se borra lo que tiene historial) salvo `detalle_rutina → rutina` que usa `CASCADE`. Hay `CHECK` en precios, duraciones, montos, series, repeticiones y fechas; `CHECK ... IN (...)` en los estados (equivalente a los ENUM del MER); UNIQUE en documento, usuario, número de factura y referencia de pago.

## 4. Arquitectura por capas

```
fitmanager/
├─ server.js                         ← arranque (Express)
├─ public/                           ┐
│  ├─ index.html, css/, js/          │ CAPA DE PRESENTACIÓN
│  │   views.js, modules.js, ui.js   │ (interfaz: formularios, tablas, menús, validación visual)
├─ src/presentation/                 │ + API REST: rutas HTTP, autenticación JWT, permisos por rol
│  ├─ routes/, middleware/           ┘
├─ src/business/                     ← CAPA LÓGICA
│  ├─ services/*.js                  (reglas de negocio, validaciones, transacciones)
│  ├─ validators.js, errors.js
├─ src/data/                         ← CAPA FÍSICA / ACCESO A DATOS
│  ├─ baseRepository.js              (INSERT/SELECT/UPDATE/DELETE genérico)
│  └─ repositories/*.js              (consultas SQL específicas, JOINs, informes)
├─ src/config/db.js                  ← pool de conexiones PostgreSQL y transacciones
└─ database/                         ← schema.sql, seed.sql, fitmanager_backup.sql
```

**Regla de dependencias:** presentación → lógica → datos → PostgreSQL. Nunca al revés. **El SQL solo existe en `src/data`**; las reglas de negocio solo en `src/business`; el HTML/JS de pantalla nunca toca la base de datos.

| Capa | Qué contiene | Ejemplo |
|---|---|---|
| Presentación | Formularios, menús, tablas, botones, validaciones visuales; rutas REST que reciben la petición y devuelven JSON | `public/js/views.js`, `src/presentation/routes/index.js` |
| Lógica | Reglas del gimnasio | "No se permite el ingreso sin suscripción activa", "no reservar clase llena", "un entrenador no puede tener dos clases a la vez", "un pago no puede superar el saldo" |
| Física / datos | Conexión, consultas SQL, transacciones | `src/data/repositories/*.js`, `src/config/db.js` |

**Seguridad:** contraseñas con bcrypt (hash), sesión con JWT, permisos por rol (Administrador, Recepcionista, Entrenador, Cliente) verificados en el servidor; consultas parametrizadas (sin inyección SQL).

## 5. Módulos funcionales

| Módulo | Objetivo | Actor | Tablas | Operaciones |
|---|---|---|---|---|
| **Autenticación** | Iniciar sesión y limitar funciones por rol | Todos | usuario, persona, rol | SELECT |
| **Clientes** | Registrar y mantener afiliados | Recepcionista, Admin | persona, usuario, rol | INSERT, SELECT, UPDATE, DELETE (transacción persona+usuario) |
| **Entrenadores / Personal** | Gestionar equipo técnico y administrativo | Admin | persona, usuario, rol, entrenador, sede | INSERT, SELECT, UPDATE, DELETE |
| **Sedes y Membresías** | Catálogos del negocio | Admin | sede, membresia | CRUD |
| **Suscripciones** | Vender un plan: calcula fechas y genera la factura (y cobra opcionalmente) | Recepcionista | suscripcion, membresia, persona, factura, pago | INSERT (3 tablas en una transacción), SELECT, UPDATE, DELETE |
| **Facturas y Pagos** | Cobrar; cada pago actualiza factura y suscripción | Recepcionista | factura, pago, suscripcion | INSERT, SELECT, UPDATE, DELETE |
| **Control de acceso** | Registrar ingreso/salida validando suscripción activa; aforo en vivo | Recepcionista | control_acceso, suscripcion, sede, persona | INSERT, SELECT, UPDATE (salida), DELETE |
| **Clases y programación** | Catálogo y horarios con entrenador y sede, sin cruces | Entrenador, Admin | clase, programacion_clase, entrenador, sede | CRUD |
| **Reservas** | Reservar cupo (suscripción vigente + cupo libre) | Recepcionista, Cliente | reserva_clase, programacion_clase, clase, suscripcion | INSERT, SELECT, UPDATE, DELETE |
| **Rutinas y ejercicios** | Diseñar rutinas con series/repeticiones/descanso | Entrenador | rutina, detalle_rutina, ejercicio, persona, entrenador | CRUD |
| **Portal del cliente** | El cliente ve su suscripción, rutinas y reserva clases | Cliente | suscripcion, rutina, detalle_rutina, reserva_clase | SELECT, INSERT, UPDATE |
| **Informes** | Convertir datos en decisiones | Admin, Recepción, Entrenador | varias (JOIN) | SELECT con agrupaciones |

### Informes (8, todos con JOIN, filtros y agregaciones)
1. Ingresos mensuales (pago · SUM/COUNT/AVG por mes)
2. Membresías más vendidas (membresia + suscripcion + factura)
3. Suscripciones por vencer (renovaciones)
4. Cartera pendiente (factura + pago + suscripcion + persona; saldo = total − pagado)
5. Ocupación de clases (clase + programacion + reserva; % de ocupación)
6. Actividad por entrenador (entrenador + programacion + reserva + rutina)
7. Horas pico por sede (control_acceso + sede; permanencia promedio)
8. Clientes más frecuentes (top 10)

Además el **Panel** muestra el aforo en tiempo real por sede y KPIs. Todos los informes se pueden descargar en CSV.

## 6. Transacciones y reglas destacadas
- **Crear suscripción** = INSERT suscripción + INSERT factura (+ INSERT pago si se cobra) en **una transacción** (rollback si algo falla).
- **Registrar/anular/eliminar un pago** recalcula automáticamente el estado de la factura (Pendiente/Pagada) y de la suscripción (Pendiente/Activa).
- **Eliminar** respeta la integridad: una suscripción con pagos o un cliente con historial **no se pueden borrar** (se muestra un mensaje claro); la suscripción se cancela en su lugar.
- Suscripciones activas con fecha vencida pasan a **Vencida** automáticamente.
