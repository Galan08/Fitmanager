// Punto de entrada del servidor (Express): sirve la API REST y la interfaz web estática.
const path = require('path');
const express = require('express');
const env = require('./src/config/env');
const { pool } = require('./src/config/db');
const api = require('./src/presentation/routes');
const errorHandler = require('./src/presentation/middleware/errorHandler');
const { suscripcionRepo } = require('./src/data/repositories/facturacionRepository');

const app = express();
app.use(express.json());
app.use('/api', api);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', errorHandler);
app.use(errorHandler);

(async () => {
  try {
    await pool.query('SELECT 1');
    await suscripcionRepo.marcarVencidas();
    app.listen(env.port, () => console.log(`FitManager en http://localhost:${env.port}`));
  } catch (e) {
    console.error('No se pudo conectar a la base de datos:', e.message);
    process.exit(1);
  }
})();
