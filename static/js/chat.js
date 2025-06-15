document.addEventListener("DOMContentLoaded", function () {
  const inputMensaje = document.getElementById("input-mensaje");
  const btnRecomendar = document.getElementById("btn-recomendar");
  const respuestaDiv = document.getElementById("respuesta");
  const chatExpandable = document.getElementById("chat-expandable");

  // ✍️ Efecto máquina de escribir
  function escribirConEfecto(texto, contenedor, delay = 20) {
    contenedor.innerHTML = "";
    let i = 0;
    function escribir() {
      if (i < texto.length) {
        contenedor.innerHTML += texto[i] === "\n" ? "<br>" : texto[i];
        i++;
        setTimeout(escribir, delay);
        respuestaDiv.scrollTop = respuestaDiv.scrollHeight; // scroll mientras escribe
      }
    }
    escribir();
  }

  // 🚀 Solicita recomendación
  async function obtenerRecomendacion() {
    const mensaje = inputMensaje.value.trim();
    if (!mensaje) return;

    // Mostrar mensaje del usuario
    const userParrafo = document.createElement("p");
    userParrafo.innerHTML = `<strong>Tú:</strong> ${mensaje}`;
    respuestaDiv.appendChild(userParrafo);

    // Crear contenedor de Edulu
    const eduluParrafo = document.createElement("p");
    const eduluLabel = document.createElement("strong");
    eduluLabel.textContent = "Edulu: ";
    const eduluSpan = document.createElement("span");

    eduluParrafo.appendChild(eduluLabel);
    eduluParrafo.appendChild(eduluSpan);
    respuestaDiv.appendChild(eduluParrafo);
    respuestaDiv.scrollTop = respuestaDiv.scrollHeight;

    inputMensaje.value = "";

    try {
      const res = await fetch("/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });

      const data = await res.json();

      if (data.respuesta) {
        escribirConEfecto(data.respuesta, eduluSpan);
        // Expande el chat solo la primera vez que llega una respuesta
        if (chatExpandable && !chatExpandable.classList.contains('expanded')) {
          chatExpandable.classList.add('expanded');
        }
      } else {
        // Si no hay respuesta específica, verificar si el mensaje no contiene carrera o ciudad
        if (!mensaje.toLowerCase().includes('carrera') && !mensaje.toLowerCase().includes('ciudad')) {
          eduluSpan.innerText = "Hola! Por favor, menciona una carrera o ciudad para que pueda ayudarte mejor.";
        } else {
          eduluSpan.innerText = `⚠️ Error: ${data.error || "No se pudo obtener respuesta de la IA."}`;
        }
      }
    } catch (err) {
      eduluSpan.innerText = "⚠️ Error de red.";
    }
  }

  // 📥 Listeners
  btnRecomendar.addEventListener("click", (e) => {
    e.preventDefault();
    obtenerRecomendacion();
  });

  inputMensaje.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      obtenerRecomendacion();
    }
  });
});
