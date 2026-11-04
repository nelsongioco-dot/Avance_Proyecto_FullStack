
"use strict";

// Dirección de nuestra API.
const API_TAREAS = "/api/tareas";

// Elementos de la página.
const formularioLogin = document.getElementById("formulario-login");
const mensajeLogin = document.getElementById("mensaje-login");
const seccionLogin = document.getElementById("seccion-login");
const seccionTareas = document.getElementById("seccion-tareas");

const formulario = document.getElementById("formulario-tareas");
const entrada = document.getElementById("nueva-tarea");
const lista = document.getElementById("lista-tareas");
const contador = document.getElementById("contador-tareas");
const mensajeVacio = document.getElementById("mensaje-vacio");
const mensajeError = document.getElementById("mensaje-error");

let tokenUsuario = "";
let tareas = [];

// Mostrar mensajes de error.
function mostrarError(mensaje) {
  mensajeError.textContent = mensaje;
}

// Enviar solicitudes al servidor con nuestro token.
async function solicitarAPI(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenUsuario}`,
      ...opciones.headers
    }
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    if (respuesta.status === 401 || respuesta.status === 403) {
      cerrarSesion();
    }

    throw new Error(datos.mensaje || "Ocurrió un error");
  }

  return datos;
}

// Dibujar las tareas en la página.
function mostrarTareas() {
  lista.innerHTML = "";

  tareas.forEach(tarea => {
    const elemento = document.createElement("li");

    const completada = Boolean(tarea.completa);

    elemento.className = completada
      ? "tarea completada"
      : "tarea";

    elemento.dataset.id = tarea.id;

    elemento.innerHTML = `
      <div class="tarea-contenido">
        <input
          type="checkbox"
          class="check-tarea"
          ${completada ? "checked" : ""}
          aria-label="Completar tarea"
        >
        <span class="nombre-tarea"></span>
      </div>

      <div class="acciones">
        <button type="button" class="btn-editar">
          Editar
        </button>
        <button type="button" class="btn-eliminar">
          Eliminar
        </button>
      </div>
    `;

    elemento.querySelector(".nombre-tarea").textContent =
      tarea.nombre;

    lista.appendChild(elemento);
  });

  const pendientes = tareas.filter(
    tarea => !Boolean(tarea.completa)
  ).length;

  contador.textContent = `${pendientes} ${
    pendientes === 1 ? "pendiente" : "pendientes"
  }`;

  mensajeVacio.hidden = tareas.length > 0;
}

// Consultar las tareas guardadas en MySQL.
async function cargarTareas() {
  try {
    mostrarError("");

    tareas = await solicitarAPI(API_TAREAS);

    mostrarTareas();

  } catch (error) {
    mostrarError(error.message);
    console.error("Error al cargar tareas:", error);
  }
}

// Agregar una tarea nueva.
async function agregarTarea(nombre) {
  const texto = nombre.trim();

  if (!texto) {
    mostrarError("Escribe una tarea válida.");
    return false;
  }

  if (texto.length > 120) {
    mostrarError("La tarea no puede superar 120 caracteres.");
    return false;
  }

  try {
    await solicitarAPI(API_TAREAS, {
      method: "POST",
      body: JSON.stringify({
        nombre: texto
      })
    });

    await cargarTareas();
    return true;

  } catch (error) {
    mostrarError(error.message);
    return false;
  }
}

// Editar el nombre de una tarea.
async function editarTarea(id) {
  const tarea = tareas.find(
    tarea => Number(tarea.id) === Number(id)
  );

  if (!tarea) return;

  const nuevoNombre = prompt(
    "Edita el nombre de la tarea:",
    tarea.nombre
  );

  if (nuevoNombre === null) return;

  const texto = nuevoNombre.trim();

  if (!texto || texto.length > 120) {
    mostrarError("Escribe un nombre válido de máximo 120 caracteres.");
    return;
  }

  try {
    await solicitarAPI(`${API_TAREAS}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        nombre: texto,
        completa: Boolean(tarea.completa)
      })
    });

    await cargarTareas();

  } catch (error) {
    mostrarError(error.message);
  }
}

// Marcar o desmarcar una tarea.
async function completarTarea(id) {
  const tarea = tareas.find(
    tarea => Number(tarea.id) === Number(id)
  );

  if (!tarea) return;

  try {
    await solicitarAPI(`${API_TAREAS}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        nombre: tarea.nombre,
        completa: !Boolean(tarea.completa)
      })
    });

    await cargarTareas();

  } catch (error) {
    mostrarError(error.message);
    mostrarTareas();
  }
}

// Eliminar una tarea.
async function eliminarTarea(id) {
  const tarea = tareas.find(
    tarea => Number(tarea.id) === Number(id)
  );

  if (!tarea) return;

  try {
    await solicitarAPI(`${API_TAREAS}/${id}`, {
      method: "DELETE"
    });

    await cargarTareas();

  } catch (error) {
    mostrarError(error.message);
  }
}

// Cerrar sesión cuando el token deje de ser válido.
function cerrarSesion() {
  tokenUsuario = "";
  tareas = [];

  mostrarTareas();

  seccionTareas.hidden = true;
  seccionLogin.hidden = false;

  mensajeLogin.textContent = "Tu sesión terminó. Inicia sesión nuevamente.";
}

// Iniciar sesión.
formularioLogin.addEventListener("submit", async evento => {
  evento.preventDefault();

  const correo = document.getElementById("correo-login").value;
  const contrasena = document.getElementById("contrasena-login").value;

  mensajeLogin.textContent = "Comprobando datos...";

  try {
    const respuesta = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        correo,
        contrasena
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensajeLogin.textContent =
        datos.mensaje || "No se pudo iniciar sesión";
      return;
    }

    tokenUsuario = datos.token;

    seccionLogin.hidden = true;
    seccionTareas.hidden = false;

    mensajeLogin.textContent = "";
    document.getElementById("contrasena-login").value = "";

    await cargarTareas();

  } catch (error) {
    mensajeLogin.textContent =
      "No se pudo conectar con el servidor";

    console.error(error);
  }
});

// Formulario para agregar tareas.
formulario.addEventListener("submit", async evento => {
  evento.preventDefault();

  const agregada = await agregarTarea(entrada.value);

  if (agregada) {
    entrada.value = "";
    entrada.focus();
  }
});

// Botones de editar y eliminar.
lista.addEventListener("click", async evento => {
  const elemento = evento.target.closest(".tarea");

  if (!elemento) return;

  const id = elemento.dataset.id;

  if (evento.target.closest(".btn-editar")) {
    await editarTarea(id);
  }

  if (evento.target.closest(".btn-eliminar")) {
    await eliminarTarea(id);
  }
});

// Casilla para completar tareas.
lista.addEventListener("change", async evento => {
  if (evento.target.matches(".check-tarea")) {
    const elemento = evento.target.closest(".tarea");

    if (elemento) {
      await completarTarea(elemento.dataset.id);
    }
  }
});

// Al abrir la página, mostramos primero el inicio de sesión.
seccionLogin.hidden = false;
seccionTareas.hidden = true;
