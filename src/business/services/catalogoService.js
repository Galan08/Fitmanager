// CAPA LÓGICA: reglas de los catálogos (sedes, membresías, clases, ejercicios).
const { makeCrudService } = require('./crudService');
const { sedeRepo, membresiaRepo, claseRepo, ejercicioRepo } = require('../../data/repositories/catalogos');
const v = require('../validators');

const ESTADOS = ['Activa', 'Inactiva'];

module.exports = {
  sedeService: makeCrudService(sedeRepo, {
    nombre: 'Sede',
    validate: (d) => {
      v.required(d, { nombre: 'Nombre', direccion: 'Dirección' });
      if (d.estado) v.oneOf(d.estado, ESTADOS, 'Estado');
    },
  }),
  membresiaService: makeCrudService(membresiaRepo, {
    nombre: 'Membresía',
    validate: (d) => {
      v.required(d, { nombre: 'Nombre', precio: 'Precio', duracion_dias: 'Duración (días)' });
      v.nonNegative(d.precio, 'Precio');
      v.positive(d.duracion_dias, 'Duración (días)');
      if (d.estado) v.oneOf(d.estado, ESTADOS, 'Estado');
    },
  }),
  claseService: makeCrudService(claseRepo, {
    nombre: 'Clase',
    validate: (d) => {
      v.required(d, { nombre_clase: 'Nombre de la clase', capacidad_maxima: 'Capacidad máxima' });
      v.positive(d.capacidad_maxima, 'Capacidad máxima');
    },
  }),
  ejercicioService: makeCrudService(ejercicioRepo, {
    nombre: 'Ejercicio',
    validate: (d) => v.required(d, { nombre_ejercicio: 'Nombre del ejercicio', grupo_muscular: 'Grupo muscular' }),
  }),
};
