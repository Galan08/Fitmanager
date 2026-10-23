-- Índices para búsquedas frecuentes (ya incluidos en schema.sql). Aplicar en bases existentes:
--   psql -d fitmanager -f database/migrations/001_indices.sql
CREATE INDEX IF NOT EXISTS idx_suscripcion_estado_fin ON suscripcion (estado, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_factura_suscripcion ON factura (id_suscripcion);
CREATE INDEX IF NOT EXISTS idx_pago_factura ON pago (id_factura);
CREATE INDEX IF NOT EXISTS idx_acceso_cliente ON control_acceso (id_cliente);
CREATE INDEX IF NOT EXISTS idx_acceso_sede ON control_acceso (id_sede);
CREATE INDEX IF NOT EXISTS idx_prog_entrenador ON programacion_clase (id_entrenador);
CREATE INDEX IF NOT EXISTS idx_reserva_programacion ON reserva_clase (id_programacion);
CREATE INDEX IF NOT EXISTS idx_rutina_cliente ON rutina (id_cliente);
CREATE INDEX IF NOT EXISTS idx_detalle_rutina ON detalle_rutina (id_rutina);
