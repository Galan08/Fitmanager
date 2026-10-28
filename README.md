# FitManager — Sistema de administración para gimnasio (Cliente/Servidor)

Aplicación web **cliente/servidor** con **Node.js + Express** (servidor y API REST), **PostgreSQL** (base de datos de 16 tablas) y una interfaz **HTML/CSS/JS** (cliente).
Proyecto del Segundo Parcial — UFPS Ocaña.

**Video en YouTube:** `PEGAR_AQUÍ_EL_ENLACE`

## Requisitos
- Node.js 18 o superior
- PostgreSQL 13 o superior (incluye `psql`; también sirve pgAdmin)

## Ejecución paso a paso
```bash
# 1) Instalar dependencias
npm install

# 2) Crear la base de datos (elige UNA opción)
psql -U postgres -c "CREATE DATABASE fitmanager ENCODING 'UTF8'"
#    a) Esquema + datos de ejemplo:
psql -U postgres -d fitmanager -f database/schema.sql
psql -U postgres -d fitmanager -f database/seed.sql
#    b) o restaurar el backup completo (estructura + datos):
psql -U postgres -d fitmanager -f database/fitmanager_backup.sql
#    (si restauraste el backup o ya tenías la base creada, agrega los índices nuevos:)
psql -U postgres -d fitmanager -f database/migrations/001_indices.sql
#    (con pgAdmin: clic derecho en la base > Query Tool > abrir el .sql > ejecutar)

# 3) Configurar la conexión
cp .env.example .env        # en Windows: copy .env.example .env
#    editar DB_USER / DB_PASSWORD con los de tu PostgreSQL

# 4) Iniciar
npm start
```
Abrir **http://localhost:3000**

### Usuarios de prueba (contraseña `Admin123*`)
| Usuario | Rol |
|---|---|
| `admin` | Administrador (todo) |
| `recepcion` | Recepcionista (clientes, suscripciones, pagos, accesos, reservas, informes) |
| `carlos.rojas`, `laura.mendez`, `andres.pico` | Entrenador (clases, rutinas, ejercicios) |
| `cliente1` … `cliente12` | Cliente (portal: su suscripción, rutinas y reserva de clases) |

> Los datos de ejemplo usan fechas relativas a la fecha en que se generó `seed.sql`. Para regenerarlos con la fecha de hoy: `npm run seed` y volver a cargar `schema.sql` + `seed.sql`.
> El backup se creó con `pg_dump --no-owner --no-privileges --clean --if-exists`, por eso se puede restaurar sobre una base existente.

## Estructura
```
database/   schema.sql · seed.sql · generate_seed.js · fitmanager_backup.sql
docs/       DOCUMENTACION.md (problema, modelo, capas, módulos) · diagrama_er.html/.mmd · GUION_VIDEO.md
public/     CAPA DE PRESENTACIÓN (interfaz web)
src/
  presentation/   API REST: rutas, autenticación JWT, permisos por rol
  business/       CAPA LÓGICA: servicios, reglas de negocio, validaciones
  data/           CAPA FÍSICA: repositorios con las consultas SQL
  config/         conexión a PostgreSQL (pool) y transacciones
tests/api.test.js   pruebas de integración (con el servidor en marcha: node tests/api.test.js)
```

## Qué demuestra (rúbrica)
- **Modelo:** 16 tablas, PK/FK (19), N:M con tablas intermedias, CHECK/UNIQUE. El cliente se maneja por rol (sin tabla `cliente`).
- **Arquitectura:** presentación / lógica / acceso a datos separadas.
- **CRUD:** INSERT, SELECT, UPDATE y DELETE reales en todos los módulos.
- **Informes:** 8 informes con JOIN, filtros y agregaciones (+ exportación CSV).
- Documentación completa en `docs/DOCUMENTACION.md`.

## Despliegue en la nube (Supabase + Vercel)
1. **Supabase**: crear el proyecto y, en *SQL Editor*, ejecutar en orden `database/schema.sql`, `database/seed.sql` y `database/migrations/001_indices.sql`. En *Connect* copiar la cadena del **Transaction pooler** (puerto 6543).
2. **Vercel**: importar el repositorio (sin build ni configuración extra) y agregar en *Environment Variables*: `DATABASE_URL` (la cadena de Supabase), `JWT_SECRET` (uno largo y nuevo), `JWT_EXPIRES` e `IVA_PORCENTAJE`.

`vercel.json` envía `/api/*` a `api/index.js`, que reutiliza la app de `server.js`; Vercel sirve `public/` como archivos estáticos.
