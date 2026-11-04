
require('dotenv').config();
const mysql = require('mysql2/promise');

async function probarConexion() {
  try {
    const conexion = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Conexión exitosa con MySQL');
    await conexion.end();
  } catch (error) {
    console.error('Error al conectar:', error.message);
  }
}

probarConexion();
