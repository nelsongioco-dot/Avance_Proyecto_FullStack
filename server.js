
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./auth");
const tareasRoutes = require("./tareas");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Comprobar que el servidor funciona.
app.get("/", (req, res) => {
  res.json({
    mensaje: "Servidor del Gestor de Tareas funcionando"
  });
});

// Rutas para registrar usuarios e iniciar sesión.
app.use("/api/auth", authRoutes);
app.use("/api/tareas", tareasRoutes);

// Iniciar el servidor.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
