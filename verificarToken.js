
"use strict";

const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "Necesitas iniciar sesión"
    });
  }

  const token = autorizacion.split(" ")[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = datos;
    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: "Sesión inválida o vencida"
    });
  }
}

module.exports = verificarToken;
