-- =====================================================================
-- FitManager - Esquema de base de datos (PostgreSQL 13+)
-- 16 tablas | 3FN | Integridad referencial completa
-- Nota 1: la tabla CLIENTE se eliminó del MER (indicación del docente).
--         El cliente es una PERSONA con un USUARIO cuyo ROL = 'Cliente'.
-- Nota 2: los ENUM del MER se implementan como VARCHAR + CHECK (forma
--         habitual en PostgreSQL; evita problemas de conversión de tipos).
-- Uso:  createdb fitmanager   y luego   psql -d fitmanager -f schema.sql
-- =====================================================================
SET client_encoding = 'UTF8';

DROP TABLE IF EXISTS detalle_rutina, ejercicio, rutina, reserva_clase, programacion_clase, clase,
  control_acceso, pago, factura, suscripcion, membresia, entrenador, usuario, persona, rol, sede CASCADE;

CREATE TABLE sede (
  id_sede    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  direccion  VARCHAR(200) NOT NULL,
  telefono   VARCHAR(20),
  estado     VARCHAR(10) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa','Inactiva'))
);

CREATE TABLE rol (
  id_rol      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
);

CREATE TABLE persona (
  id_persona          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  documento_identidad VARCHAR(20)  NOT NULL UNIQUE,
  nombres             VARCHAR(100) NOT NULL,
  apellidos           VARCHAR(100) NOT NULL,
  fecha_nacimiento    DATE,
  email               VARCHAR(120),
  telefono            VARCHAR(20),
  fecha_registro      DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE usuario (
  id_usuario     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona     INT NOT NULL UNIQUE,
  id_rol         INT NOT NULL,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP(0) NOT NULL DEFAULT LOCALTIMESTAMP(0),
  CONSTRAINT fk_usuario_persona FOREIGN KEY (id_persona) REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_rol     FOREIGN KEY (id_rol)     REFERENCES rol(id_rol)         ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE entrenador (
  id_entrenador INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona    INT NOT NULL UNIQUE,
  id_sede       INT NOT NULL,
  especialidad  VARCHAR(100),
  CONSTRAINT fk_entrenador_persona FOREIGN KEY (id_persona) REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_entrenador_sede    FOREIGN KEY (id_sede)    REFERENCES sede(id_sede)       ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE membresia (
  id_membresia  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        VARCHAR(80) NOT NULL UNIQUE,
  descripcion   TEXT,
  precio        NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  duracion_dias INT NOT NULL CHECK (duracion_dias > 0),
  estado        VARCHAR(10) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa','Inactiva'))
);

-- id_cliente referencia a PERSONA (cuyo usuario tiene rol 'Cliente'; se valida en la capa lógica)
CREATE TABLE suscripcion (
  id_suscripcion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente     INT NOT NULL,
  id_membresia   INT NOT NULL,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE NOT NULL,
  estado         VARCHAR(10) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Activa','Vencida','Cancelada')),
  CONSTRAINT ck_suscripcion_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT fk_suscripcion_cliente   FOREIGN KEY (id_cliente)   REFERENCES persona(id_persona)     ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_suscripcion_membresia FOREIGN KEY (id_membresia) REFERENCES membresia(id_membresia) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_suscripcion_cliente_estado ON suscripcion (id_cliente, estado);
CREATE INDEX idx_suscripcion_estado_fin ON suscripcion (estado, fecha_fin);

CREATE TABLE factura (
  id_factura     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_suscripcion INT NOT NULL,
  numero_factura VARCHAR(50) NOT NULL UNIQUE,
  fecha_emision  TIMESTAMP(0) NOT NULL DEFAULT LOCALTIMESTAMP(0),
  subtotal       NUMERIC(10,2) NOT NULL,
  descuento      NUMERIC(10,2) NOT NULL DEFAULT 0,
  impuesto       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL,
  estado         VARCHAR(10) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Pagada','Anulada')),
  CONSTRAINT fk_factura_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES suscripcion(id_suscripcion) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_factura_suscripcion ON factura (id_suscripcion);

CREATE TABLE pago (
  id_pago         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_factura      INT NOT NULL,
  monto           NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago      TIMESTAMP(0) NOT NULL DEFAULT LOCALTIMESTAMP(0),
  metodo_pago     VARCHAR(15) NOT NULL CHECK (metodo_pago IN ('Efectivo','Tarjeta','Transferencia','PSE')),
  estado_pago     VARCHAR(10) NOT NULL DEFAULT 'Aprobado' CHECK (estado_pago IN ('Pendiente','Aprobado','Rechazado','Anulado')),
  referencia_pago VARCHAR(100) UNIQUE,
  concepto        VARCHAR(150),
  CONSTRAINT fk_pago_factura FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_pago_factura ON pago (id_factura);

CREATE TABLE control_acceso (
  id_acceso          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente         INT NOT NULL,
  id_sede            INT NOT NULL,
  fecha_hora_ingreso TIMESTAMP(0) NOT NULL DEFAULT LOCALTIMESTAMP(0),
  fecha_hora_salida  TIMESTAMP(0),
  CONSTRAINT fk_acceso_cliente FOREIGN KEY (id_cliente) REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_acceso_sede    FOREIGN KEY (id_sede)    REFERENCES sede(id_sede)       ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_acceso_ingreso ON control_acceso (fecha_hora_ingreso);
CREATE INDEX idx_acceso_cliente ON control_acceso (id_cliente);
CREATE INDEX idx_acceso_sede ON control_acceso (id_sede);

CREATE TABLE clase (
  id_clase         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_clase     VARCHAR(80) NOT NULL UNIQUE,
  descripcion      TEXT,
  capacidad_maxima INT NOT NULL CHECK (capacidad_maxima > 0)
);

CREATE TABLE programacion_clase (
  id_programacion   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_clase          INT NOT NULL,
  id_entrenador     INT NOT NULL,
  id_sede           INT NOT NULL,
  fecha_hora_inicio TIMESTAMP(0) NOT NULL,
  duracion_minutos  INT NOT NULL CHECK (duracion_minutos > 0),
  CONSTRAINT fk_prog_clase      FOREIGN KEY (id_clase)      REFERENCES clase(id_clase)           ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_prog_entrenador FOREIGN KEY (id_entrenador) REFERENCES entrenador(id_entrenador) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_prog_sede       FOREIGN KEY (id_sede)       REFERENCES sede(id_sede)             ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_prog_entrenador ON programacion_clase (id_entrenador);

CREATE TABLE reserva_clase (
  id_reserva      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente      INT NOT NULL,
  id_programacion INT NOT NULL,
  fecha_reserva   TIMESTAMP(0) NOT NULL DEFAULT LOCALTIMESTAMP(0),
  estado_reserva  VARCHAR(10) NOT NULL DEFAULT 'Confirmada' CHECK (estado_reserva IN ('Confirmada','Asistio','Cancelada')),
  CONSTRAINT uq_reserva UNIQUE (id_cliente, id_programacion),
  CONSTRAINT fk_reserva_cliente FOREIGN KEY (id_cliente)      REFERENCES persona(id_persona)                 ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reserva_prog    FOREIGN KEY (id_programacion) REFERENCES programacion_clase(id_programacion) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_reserva_programacion ON reserva_clase (id_programacion);

CREATE TABLE rutina (
  id_rutina        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente       INT NOT NULL,
  id_entrenador    INT NOT NULL,
  nombre_rutina    VARCHAR(100) NOT NULL,
  objetivo         VARCHAR(150),
  fecha_asignacion DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT fk_rutina_cliente    FOREIGN KEY (id_cliente)    REFERENCES persona(id_persona)       ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rutina_entrenador FOREIGN KEY (id_entrenador) REFERENCES entrenador(id_entrenador) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_rutina_cliente ON rutina (id_cliente);

CREATE TABLE ejercicio (
  id_ejercicio     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_ejercicio VARCHAR(100) NOT NULL UNIQUE,
  grupo_muscular   VARCHAR(50) NOT NULL,
  descripcion      TEXT
);

CREATE TABLE detalle_rutina (
  id_detalle         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_rutina          INT NOT NULL,
  id_ejercicio       INT NOT NULL,
  series             INT NOT NULL CHECK (series > 0),
  repeticiones       INT NOT NULL CHECK (repeticiones > 0),
  descanso_segundos  INT NOT NULL DEFAULT 60 CHECK (descanso_segundos >= 0),
  orden              INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_detalle_rutina    FOREIGN KEY (id_rutina)    REFERENCES rutina(id_rutina)       ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES ejercicio(id_ejercicio) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_detalle_rutina ON detalle_rutina (id_rutina);
