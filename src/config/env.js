require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'cambia-este-secreto',
  jwtExpires: process.env.JWT_EXPIRES || '8h',
  iva: Number(process.env.IVA_PORCENTAJE ?? 19),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fitmanager',
  },
};
