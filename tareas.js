
"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const verificarToken = require("./verificarToken");

const router = express.Router();

// Configuración de nuestra base de datos.
const conexion = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Consultar las tareas del usuario.
router.get("/", verificarToken, async (req, res) => {
  let db;

  try {
    db = await mysql.createConnection(conexion);

    const [tareas] = await db.execute(
      "SELECT id, nombre, completa, fecha_creacion FROM tareas WHERE usuario_id = ? ORDER BY id DESC",
      [req.usuario.id]
    );

    res.json(tareas);

  } catch (error) {
    console.error("Error al consultar tareas:", error.message);

    res.status(500).json({
      mensaje: "No se pudieron consultar las tareas"
    });

  } finally {
    if (db) await db.end();
  }
});

// Crear una nueva tarea.
router.post("/", verificarToken, async (req, res) => {
  const { nombre } = req.body || {};

  if (typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({
      mensaje: "Escribe el nombre de la tarea"
    });
  }

  if (nombre.trim().length > 120) {
    return res.status(400).json({
      mensaje: "El nombre no puede superar 120 caracteres"
    });
  }

  let db;

  try {
    db = await mysql.createConnection(conexion);

    const [resultado] = await db.execute(
      "INSERT INTO tareas (nombre, completa, usuario_id) VALUES (?, 0, ?)",
      [nombre.trim(), req.usuario.id]
    );

    res.status(201).json({
      mensaje: "Tarea creada correctamente",
      tarea: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        completa: false
      }
    });

  } catch (error) {
    console.error("Error al crear tarea:", error.message);

    res.status(500).json({
      mensaje: "No se pudo crear la tarea"
    });

  } finally {
    if (db) await db.end();
  }
});

// Editar una tarea existente.
router.put("/:id", verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, completa } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      mensaje: "El ID de la tarea no es válido"
    });
  }

  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    nombre.trim().length > 120 ||
    typeof completa !== "boolean"
  ) {
    return res.status(400).json({
      mensaje: "Ingresa un nombre válido y el estado de la tarea"
    });
  }

  let db;

  try {
    db = await mysql.createConnection(conexion);

    const [resultado] = await db.execute(
      "UPDATE tareas SET nombre = ?, completa = ? WHERE id = ? AND usuario_id = ?",
      [nombre.trim(), completa ? 1 : 0, id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "No se encontró la tarea"
      });
    }

    res.json({
      mensaje: "Tarea actualizada correctamente",
      tarea: {
        id,
        nombre: nombre.trim(),
        completa
      }
    });

  } catch (error) {
    console.error("Error al actualizar tarea:", error.message);

    res.status(500).json({
      mensaje: "No se pudo actualizar la tarea"
    });

  } finally {
    if (db) await db.end();
  }
});

// Eliminar una tarea existente.
router.delete("/:id", verificarToken, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      mensaje: "El ID de la tarea no es válido"
    });
  }

  let db;

  try {
    db = await mysql.createConnection(conexion);

    const [resultado] = await db.execute(
      "DELETE FROM tareas WHERE id = ? AND usuario_id = ?",
      [id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "No se encontró la tarea"
      });
    }

    res.json({
      mensaje: "Tarea eliminada correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar tarea:", error.message);

    res.status(500).json({
      mensaje: "No se pudo eliminar la tarea"
    });

  } finally {
    if (db) await db.end();
  }
});

module.exports = router;
