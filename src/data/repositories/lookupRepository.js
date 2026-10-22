// CAPA FÍSICA: listas {value,label} para llenar selectores de la interfaz.
const { pool } = require('../../config/db');
const q = async (sql) => (await pool.query(sql))[0];

const lookups = {
  sedes: () => q(`SELECT id_sede AS value, nombre AS label FROM sede WHERE estado = 'Activa' ORDER BY nombre`),
  clientes: () => q(`SELECT p.id_persona AS value, CONCAT(p.nombres,' ',p.apellidos,' (',p.documento_identidad,')') AS label
      FROM persona p JOIN usuario u ON u.id_persona = p.id_persona JOIN rol r ON r.id_rol = u.id_rol
     WHERE r.nombre = 'Cliente' ORDER BY p.nombres, p.apellidos`),
  entrenadores: () => q(`SELECT e.id_entrenador AS value, CONCAT(p.nombres,' ',p.apellidos,' - ',COALESCE(e.especialidad,'General')) AS label
      FROM entrenador e JOIN persona p ON p.id_persona = e.id_persona ORDER BY p.nombres`),
  membresias: () => q(`SELECT id_membresia AS value, CONCAT(nombre,' - $',to_char(precio,'FM999,999,999'),' / ',duracion_dias,' días') AS label FROM membresia WHERE estado = 'Activa' ORDER BY precio`),
  clases: () => q(`SELECT id_clase AS value, CONCAT(nombre_clase,' (cupo ',capacidad_maxima,')') AS label FROM clase ORDER BY nombre_clase`),
  ejercicios: () => q(`SELECT id_ejercicio AS value, CONCAT(nombre_ejercicio,' - ',grupo_muscular) AS label FROM ejercicio ORDER BY grupo_muscular, nombre_ejercicio`),
  programaciones: () => q(`SELECT pc.id_programacion AS value,
        CONCAT(c.nombre_clase,' | ',to_char(pc.fecha_hora_inicio,'DD/MM HH24:MI'),' | ',s.nombre,' (',
          (SELECT COUNT(*) FROM reserva_clase r WHERE r.id_programacion = pc.id_programacion AND r.estado_reserva <> 'Cancelada'),'/',c.capacidad_maxima,')') AS label
      FROM programacion_clase pc JOIN clase c ON c.id_clase = pc.id_clase JOIN sede s ON s.id_sede = pc.id_sede
     WHERE pc.fecha_hora_inicio >= LOCALTIMESTAMP ORDER BY pc.fecha_hora_inicio`),
  facturas_pendientes: () => q(`SELECT f.id_factura AS value, CONCAT(f.numero_factura,' - ',p.nombres,' ',p.apellidos) AS label
      FROM factura f JOIN suscripcion s ON s.id_suscripcion = f.id_suscripcion JOIN persona p ON p.id_persona = s.id_cliente
     WHERE f.estado = 'Pendiente' ORDER BY f.id_factura DESC`),
  roles_personal: () => q(`SELECT nombre AS value, nombre AS label FROM rol WHERE nombre IN ('Administrador','Recepcionista')`),
};

module.exports = { lookupRepo: lookups };
