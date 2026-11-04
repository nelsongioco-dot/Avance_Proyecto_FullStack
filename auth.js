
"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const router = express.Router();

// Conexión a nuestra base de datos.
const conexion = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Registrar un usuario nuevo.
router.post("/registro", async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (
    typeof nombre !== "string" ||
    typeof correo !== "string" ||
    typeof contrasena !== "string" ||
    !nombre.trim() ||
    !correo.trim() ||
    contrasena.length < 8
  ) {
    return res.status(400).json({
      mensaje: "Ingresa nombre, correo y contraseña de al menos 8 caracteres"
    });
  }

  let db;

  try {
    db = await mysql.createConnection(conexion);

    const [existentes] = await db.execute(
      "SELECT id FROM usuarios WHERE correo = ?",
      [correo.trim()]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        mensaje: "Este correo ya está registrado"
      });
    }

    // Protegemos la contraseña antes de guardarla.
    const contrasenaSegura = await bcrypt.hash(contrasena, 10);

    await db.execute(
      "INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)",
      [nombre.trim(), correo.trim(), contrasenaSegura]
    );

    res.status(201).json({
      mensaje: "Usuario registrado correctamente"
    });

  } catch (error) {
    console.error("Error de registro:", error.message);

    res.status(500).json({
      mensaje: "No se pudo registrar el usuario"
    });

  } finally {
    if (db) await db.end();
  }
});

module.exports = router;


 // Inicio de sesión de usuarios.
router.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body || {};

  if (
    typeof correo !== "string" ||
    typeof contrasena !== "string" ||
    !correo.trim() ||
    !contrasena
  ) {
    return res.status(400).json({
      mensaje: "Ingresa tu correo y contraseña"
    });
  }

  let db;

  try {
    db = await mysql.createConnection(conexion);

    const [usuarios] = await db.execute(
      "SELECT id, nombre, correo, contrasena FROM usuarios WHERE correo = ?",
      [correo.trim()]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos"
      });
    }

    const usuario = usuarios[0];

    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      usuario.contrasena
    );

    if (!contrasenaCorrecta) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos"
      });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      }
    });

  } catch (error) {
    console.error("Error de login:", error.message);

    res.status(500).json({
      mensaje: "No se pudo iniciar sesión"
    });

  } finally {
    if (db) await db.end();
  }
});
