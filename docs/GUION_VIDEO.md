# Guion del video de YouTube (≈10–12 min, todos los integrantes participan)

Ten abierta la app con el usuario **admin** (clave `Admin123*`), pgAdmin o DBeaver con la base `fitmanager` y el editor con el código.

| # | Qué mostrar | Quién (sugerido) | Tiempo |
|---|---|---|---|
| 1 | Problema que resuelve (aforos, morosos, seguimiento) — `docs/DOCUMENTACION.md` §1 | Integrante 1 | 1 min |
| 2 | Modelo relacional / diagrama `docs/diagrama_er.html`; mencionar que **Cliente se maneja por Rol** | Integrante 1 | 1.5 min |
| 3 | Tablas y relaciones principales (persona→usuario→rol, suscripción→factura→pago, reserva_clase y detalle_rutina como N:M) en pgAdmin | Integrante 1 | 1.5 min |
| 4 | Arquitectura por capas: abrir `views.js` (presentación) → `routes/index.js` → `services/accesoService.js` (lógica) → `repositories/accesoRepository.js` (SQL) → `config/db.js` | Integrante 2 | 2 min |
| 5 | Demostración general: login por rol (admin, recepcion, carlos.rojas, cliente1) | Integrante 2 | 1 min |
| 6 | **INSERT**: crear cliente → crear suscripción (cobrando) → mostrar la fila en la BD | Integrante 2 | 1.5 min |
| 7 | **SELECT**: Clientes con búsqueda, Facturas, Panel (aforo) y la misma consulta en pgAdmin | Integrante 3 | 1 min |
| 8 | **UPDATE**: editar cliente, registrar salida de un acceso, cambiar estado de reserva | Integrante 3 | 1 min |
| 9 | **DELETE**: eliminar un acceso/reserva ✔ y mostrar el bloqueo de integridad al borrar un cliente con historial ✘ | Integrante 3 | 1 min |
| 10 | Explicar cada módulo (tabla de `DOCUMENTACION.md` §5) | Todos | 1.5 min |
| 11 | Cómo cada módulo usa la BD: reglas (ingreso sin suscripción → denegado; clase llena; cruce de horarios; pago > saldo) | Integrante 2 | 1 min |
| 12 | **Informes**: recorrer los 8, cambiar filtros, descargar CSV, mostrar el JOIN en el repositorio | Integrante 3 | 1.5 min |

Consejos: grabar en 1080p, mostrar la pantalla del código y de la BD, no leer diapositivas, y poner el enlace del video en el README.
