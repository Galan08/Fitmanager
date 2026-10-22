const BaseRepository = require('../baseRepository');

const sedeRepo = new BaseRepository('sede', 'id_sede', ['nombre', 'direccion', 'telefono', 'estado']);
const membresiaRepo = new BaseRepository('membresia', 'id_membresia', ['nombre', 'descripcion', 'precio', 'duracion_dias', 'estado']);
const claseRepo = new BaseRepository('clase', 'id_clase', ['nombre_clase', 'descripcion', 'capacidad_maxima']);
const ejercicioRepo = new BaseRepository('ejercicio', 'id_ejercicio', ['nombre_ejercicio', 'grupo_muscular', 'descripcion']);
const rolRepo = new BaseRepository('rol', 'id_rol', ['nombre', 'descripcion']);

module.exports = { sedeRepo, membresiaRepo, claseRepo, ejercicioRepo, rolRepo };
