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

## 2. Modelo relacional

Notación: **PK** clave primaria · *FK* clave foránea · UK única. Diagrama completo: `docs/diagrama_er.png` / `docs/diagrama_er.pdf` (se ven sin internet), generados desde `diagrama_er.html` / `diagrama_er.mmd`. Los tipos del diagrama son los implementados en PostgreSQL.

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

## 3. Arquitectura por capas

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

## 4. Módulos funcionales

### Módulo 1: Autenticación y control de roles

**Objetivo:** permitir que cada usuario inicie sesión y limitar lo que puede ver y hacer según su rol.

**Actor:** todos los usuarios (Administrador, Recepcionista, Entrenador y Cliente).

**Tablas utilizadas:** usuario, persona y rol.

**Uso de la base de datos:** busca el usuario por su nombre de usuario uniendo `usuario` con `persona` (para el nombre) y con `rol` (para el rol); compara la contraseña con el hash bcrypt guardado y, si es correcta, genera un token JWT con el id de la persona y su rol.

**Operaciones utilizadas:** SELECT.

**Relaciones utilizadas:** usuario → persona (1:1), usuario → rol (N:1).

**Conexión con otros componentes:** el token que entrega se envía en cada petición; el middleware `authenticate` lo verifica y `guard` decide si el rol puede leer o escribir en cada módulo. El menú de la interfaz también se arma según el rol.

---

### Módulo 2: Panel principal

**Objetivo:** mostrar al personal un resumen del estado del gimnasio en tiempo real.

**Actor:** Administrador, Recepcionista y Entrenador.

**Tablas utilizadas:** usuario, rol, suscripcion, pago, factura, programacion_clase, control_acceso y sede.

**Uso de la base de datos:** cuenta los clientes registrados, las suscripciones activas, los ingresos del mes, las facturas pendientes con su saldo y las clases programadas para hoy; además calcula el aforo actual de cada sede contando los ingresos sin salida registrada.

**Operaciones utilizadas:** SELECT (con COUNT, SUM y LEFT JOIN).

**Relaciones utilizadas:** usuario → rol, pago → factura, control_acceso → sede.

**Conexión con otros componentes:** solo lee lo que registran los módulos de Suscripciones, Facturación y pagos, Control de acceso y Clases; reutiliza las consultas del repositorio de informes y de accesos.

---

### Módulo 3: Gestión de clientes

**Objetivo:** registrar y mantener la información de los afiliados del gimnasio.

**Actor:** Recepcionista y Administrador (crean, editan y eliminan); el Entrenador solo consulta.

**Tablas utilizadas:** persona, usuario y rol.

**Uso de la base de datos:** al registrar un cliente inserta sus datos personales en `persona` y crea su cuenta en `usuario` con el rol "Cliente", todo en una sola transacción (si algo falla, no se guarda nada). La contraseña se guarda cifrada. Al consultar une las tres tablas filtrando por el rol Cliente. Al eliminar, borra el usuario y la persona; si el cliente tiene historial (suscripciones, accesos, reservas o rutinas), la base de datos lo impide por integridad referencial y se muestra un mensaje claro.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** usuario → persona (1:1), usuario → rol (N:1).

**Conexión con otros componentes:** el cliente es la base de Suscripciones, Control de acceso, Reservas, Rutinas y Portal del cliente. Todos esos módulos verifican con `clienteRepo.hasRole(id, 'Cliente')` que la persona tenga el rol Cliente antes de insertar (esto reemplaza a la antigua tabla `cliente`).

---

### Módulo 4: Gestión de entrenadores

**Objetivo:** administrar el personal técnico que dicta clases y diseña rutinas.

**Actor:** Administrador (crea, edita y elimina); Recepcionista y Entrenador consultan.

**Tablas utilizadas:** persona, usuario, rol, entrenador y sede.

**Uso de la base de datos:** valida que la sede exista e inserta en una transacción la persona, su usuario con rol "Entrenador" y su registro en `entrenador` con la sede y la especialidad. Al consultar une las cinco tablas para mostrar nombre, especialidad y sede.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** usuario → persona, usuario → rol, entrenador → persona (1:1), entrenador → sede (N:1).

**Conexión con otros componentes:** el entrenador se usa en Clases y programación (quién dicta cada clase), en Rutinas (quién la asigna) y en el informe de actividad por entrenador.

---

### Módulo 5: Personal administrativo

**Objetivo:** gestionar las cuentas de administradores y recepcionistas que usan el sistema.

**Actor:** Administrador.

**Tablas utilizadas:** persona, usuario y rol.

**Uso de la base de datos:** inserta la persona y su usuario con el rol elegido (Administrador o Recepcionista) en una transacción; permite cambiar el rol, los datos personales y la contraseña.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** usuario → persona, usuario → rol.

**Conexión con otros componentes:** las cuentas creadas aquí son las que inician sesión en el módulo de Autenticación y operan el resto de módulos según su rol.

---

### Módulo 6: Sedes

**Objetivo:** mantener el catálogo de sucursales del gimnasio.

**Actor:** Administrador (CRUD); Recepcionista y Entrenador consultan.

**Tablas utilizadas:** sede.

**Uso de la base de datos:** registra nombre, dirección, teléfono y estado (Activa/Inactiva). Una sede con entrenadores, accesos o clases asociadas no se puede eliminar (ON DELETE RESTRICT); para dejar de usarla se cambia su estado a Inactiva.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** es tabla padre de entrenador, control_acceso y programacion_clase (1:N).

**Conexión con otros componentes:** Entrenadores, Control de acceso y Programación de clases solo permiten elegir sedes activas; el Panel muestra el aforo por sede.

---

### Módulo 7: Membresías

**Objetivo:** definir los planes que el gimnasio vende, con su precio y duración.

**Actor:** Administrador (CRUD); Recepcionista y Entrenador consultan.

**Tablas utilizadas:** membresia.

**Uso de la base de datos:** registra nombre, descripción, precio, duración en días y estado. Valida que el precio no sea negativo y que la duración sea mayor a cero.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** es tabla padre de suscripcion (1:N).

**Conexión con otros componentes:** Suscripciones toma de aquí el precio (para la factura) y la duración (para calcular la fecha de fin); el informe "Membresías más vendidas" agrupa por este plan.

---

### Módulo 8: Suscripciones

**Objetivo:** vender un plan a un cliente: calcular sus fechas, generar la factura y, si se desea, cobrarla en el mismo paso.

**Actor:** Recepcionista y Administrador.

**Tablas utilizadas:** suscripcion, persona, usuario, rol, membresia, factura y pago.

**Uso de la base de datos:** consulta que la persona tenga rol Cliente y que la membresía exista y esté activa; calcula la fecha de fin con la duración del plan; verifica que el cliente no tenga otra suscripción activa o pendiente que se cruce en fechas. Luego, en **una sola transacción**, inserta la suscripción, inserta la factura (subtotal, descuento, IVA y total) y, si se eligió método de pago, inserta el pago. Al listar, actualiza a "Vencida" las suscripciones activas cuya fecha de fin ya pasó. Solo permite eliminar suscripciones sin pagos (borra también su factura); si tiene pagos, se debe cambiar a "Cancelada".

**Operaciones utilizadas:** SELECT, INSERT, UPDATE y DELETE.

**Relaciones utilizadas:** suscripcion → persona (N:1), suscripcion → membresia (N:1), factura → suscripcion (N:1), pago → factura (N:1).

**Conexión con otros componentes:** su estado "Activa" es la condición que exigen Control de acceso, Reservas y Portal del cliente; el estado lo actualiza automáticamente el módulo de Facturación y pagos.

---

### Módulo 9: Facturación y pagos

**Objetivo:** cobrar las facturas y mantener sincronizado el estado de la factura y de la suscripción.

**Actor:** Recepcionista y Administrador.

**Tablas utilizadas:** factura, pago, suscripcion, persona y membresia.

**Uso de la base de datos:** consulta las facturas con lo pagado y el saldo (suma de pagos aprobados). Al registrar un pago valida que la factura no esté anulada ni pagada y que el monto no supere el saldo; inserta el pago y, en la misma transacción, recalcula: si lo pagado cubre el total, la factura pasa a "Pagada" y la suscripción a "Activa"; si no, quedan "Pendiente". Lo mismo ocurre al cambiar el estado de un pago o eliminarlo. Una factura sin pagos se puede anular.

**Operaciones utilizadas:** SELECT, INSERT (pago), UPDATE (estado de pago, factura y suscripción) y DELETE (pago). La factura no se inserta aquí: la genera el módulo de Suscripciones.

**Relaciones utilizadas:** pago → factura (N:1), factura → suscripcion (N:1), suscripcion → persona, suscripcion → membresia.

**Conexión con otros componentes:** recibe las facturas de Suscripciones y le devuelve el estado actualizado; alimenta los informes de ingresos mensuales y cartera pendiente, y los indicadores del Panel.

---

### Módulo 10: Control de acceso

**Objetivo:** registrar la entrada y salida de los clientes en cada sede, permitiendo el ingreso solo a quien tenga una suscripción vigente.

**Actor:** Recepcionista y Administrador.

**Tablas utilizadas:** control_acceso, persona, usuario, rol, sede y suscripcion.

**Uso de la base de datos:** consulta que la persona sea cliente, que la sede esté activa, que tenga una suscripción "Activa" dentro de sus fechas y que no tenga ya un ingreso abierto; si todo se cumple, inserta el ingreso con la fecha y hora actual. Al registrar la salida actualiza la hora de salida. También calcula el aforo actual por sede.

**Operaciones utilizadas:** SELECT, INSERT (ingreso), UPDATE (salida) y DELETE (corregir un registro).

**Relaciones utilizadas:** control_acceso → persona (N:1), control_acceso → sede (N:1); consulta suscripcion → persona.

**Conexión con otros componentes:** depende de Suscripciones para autorizar el ingreso; alimenta el aforo del Panel y los informes "Horas pico por sede" y "Clientes más frecuentes".

---

### Módulo 11: Clases y programación

**Objetivo:** mantener el catálogo de clases grupales y programar sus horarios con entrenador y sede, sin cruces.

**Actor:** Entrenador y Administrador (crean y editan); Recepcionista consulta.

**Tablas utilizadas:** clase, programacion_clase, entrenador, persona, sede y reserva_clase.

**Uso de la base de datos:** en el catálogo registra el nombre de la clase y su capacidad máxima. Al programar valida que la clase exista, que la sede esté activa y que el entrenador no tenga otra clase que se cruce en ese horario (consulta por rango de fecha y duración). Al listar muestra cuántos cupos están ocupados contando las reservas no canceladas. No permite eliminar una programación con reservas activas ni cambiarla a una clase con menos cupos que las reservas que ya tiene.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** programacion_clase → clase (N:1), programacion_clase → entrenador (N:1), programacion_clase → sede (N:1), entrenador → persona.

**Conexión con otros componentes:** los horarios programados son los que se reservan en Reservas y en el Portal del cliente; alimenta los informes de ocupación de clases y de actividad por entrenador.

---

### Módulo 12: Reservas de clases

**Objetivo:** reservar cupos en las clases programadas controlando el aforo.

**Actor:** Recepcionista y Administrador (el Cliente reserva desde su portal; el Entrenador consulta).

**Tablas utilizadas:** reserva_clase, programacion_clase, clase, persona, usuario, rol, suscripcion y sede.

**Uso de la base de datos:** consulta que la persona sea cliente, que la clase no haya comenzado, que el cliente tenga suscripción activa, que no tenga ya ese cupo reservado y que la cantidad de reservas sea menor que `clase.capacidad_maxima`. Si todo se cumple inserta la reserva (o reactiva una cancelada). Permite cambiar el estado a Confirmada, Asistió o Cancelada.

**Operaciones utilizadas:** SELECT, INSERT, UPDATE y DELETE.

**Relaciones utilizadas:** reserva_clase → persona y reserva_clase → programacion_clase. Es la **tabla intermedia que resuelve la relación N:M** entre clientes y clases programadas (con UNIQUE(id_cliente, id_programacion)).

**Conexión con otros componentes:** depende de Clases y programación (cupo y horario) y de Suscripciones (vigencia); el Portal del cliente reutiliza este mismo servicio, así que aplica las mismas reglas; alimenta el informe de ocupación.

---

### Módulo 13: Rutinas y ejercicios

**Objetivo:** diseñar rutinas de entrenamiento personalizadas para cada cliente.

**Actor:** Entrenador y Administrador (crean y editan); Recepcionista consulta.

**Tablas utilizadas:** rutina, detalle_rutina, ejercicio, persona, entrenador.

**Uso de la base de datos:** el catálogo de ejercicios registra nombre y grupo muscular. Al crear una rutina valida que el destinatario sea cliente y, si la crea un entrenador, toma automáticamente su `id_entrenador`. En el detalle inserta cada ejercicio con series, repeticiones, descanso y orden (el orden se calcula con el máximo actual + 1). Al eliminar una rutina, su detalle se borra en cascada.

**Operaciones utilizadas:** INSERT, SELECT, UPDATE y DELETE.

**Relaciones utilizadas:** rutina → persona (cliente), rutina → entrenador, detalle_rutina → rutina (ON DELETE CASCADE) y detalle_rutina → ejercicio. `detalle_rutina` es la **tabla intermedia que resuelve la relación N:M** entre rutinas y ejercicios.

**Conexión con otros componentes:** el cliente ve sus rutinas en el Portal; el número de rutinas asignadas aparece en el informe de actividad por entrenador.

---

### Módulo 14: Portal del cliente

**Objetivo:** que el cliente consulte su propia información y reserve clases sin intervención de la recepción.

**Actor:** Cliente.

**Tablas utilizadas:** persona, usuario, rol, suscripcion, membresia, rutina, detalle_rutina, ejercicio, reserva_clase, programacion_clase, clase y sede.

**Uso de la base de datos:** todas las consultas se filtran por el `id_persona` del usuario que inició sesión, así que el cliente solo ve sus datos: perfil, historial de suscripciones y si tiene una activa, sus rutinas con el detalle de ejercicios y sus reservas. Puede reservar una clase futura (INSERT) y cancelar una reserva confirmada (UPDATE del estado).

**Operaciones utilizadas:** SELECT, INSERT y UPDATE.

**Relaciones utilizadas:** suscripcion → persona, rutina → persona, detalle_rutina → rutina/ejercicio, reserva_clase → persona/programacion_clase.

**Conexión con otros componentes:** reutiliza el servicio de Reservas (mismas reglas de cupo y suscripción) y lee lo registrado en Suscripciones y Rutinas.

---

### Módulo 15: Informes

**Objetivo:** convertir los datos registrados por los demás módulos en información útil para la toma de decisiones.

**Actor:** Administrador, Recepcionista y Entrenador.

**Tablas utilizadas:** pago, factura, suscripcion, membresia, persona, clase, programacion_clase, reserva_clase, entrenador, rutina, control_acceso y sede.

**Uso de la base de datos:** ejecuta 8 consultas con JOIN, filtros por rango de fechas y agrupaciones:

1. Ingresos mensuales (pago: COUNT, SUM y AVG por mes).
2. Membresías más vendidas (membresia + suscripcion + factura).
3. Suscripciones por vencer en los próximos N días (suscripcion + persona + membresia).
4. Cartera pendiente: saldo por cliente (factura + pago + suscripcion + persona).
5. Ocupación de clases en porcentaje (clase + programacion_clase + reserva_clase).
6. Actividad por entrenador: clases, asistentes y rutinas (entrenador + programacion_clase + reserva_clase + rutina).
7. Horas pico por sede con permanencia promedio (control_acceso + sede).
8. Top 10 de clientes más frecuentes (control_acceso + persona).

Los resultados se pueden descargar en CSV.

**Operaciones utilizadas:** SELECT (con JOIN, GROUP BY, COUNT, SUM, AVG y subconsultas).

**Relaciones utilizadas:** prácticamente todas las claves foráneas del modelo.

**Conexión con otros componentes:** es solo de lectura; depende de lo que registran Suscripciones, Facturación y pagos, Control de acceso, Clases, Reservas y Rutinas.

---

## 6. Transacciones y reglas destacadas
- **Crear suscripción** = INSERT suscripción + INSERT factura (+ INSERT pago si se cobra) en **una transacción** (rollback si algo falla).
- **Registrar/anular/eliminar un pago** recalcula automáticamente el estado de la factura (Pendiente/Pagada) y de la suscripción (Pendiente/Activa).
- **Eliminar** respeta la integridad: una suscripción con pagos o un cliente con historial **no se pueden borrar** (se muestra un mensaje claro); la suscripción se cancela en su lugar.
- Suscripciones activas con fecha vencida pasan a **Vencida** automáticamente.
