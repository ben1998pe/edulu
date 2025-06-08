document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("btn-recomendar");
  const input = document.getElementById("input-mensaje");
  const respuestaContenedor = document.getElementById("respuesta");

  boton.addEventListener("click", async () => {
    const mensaje = input.value.trim();

    if (!mensaje) {
      respuestaContenedor.innerText = "Por favor, escribe algo para que la IA te recomiende.";
      return;
    }

    respuestaContenedor.innerText = "⏳ Pensando...";

    try {
      const response = await fetch("/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });

      const data = await response.json();

      if (data.respuesta) {
        respuestaContenedor.innerText = data.respuesta;
      } else if (data.error) {
        respuestaContenedor.innerText = "⚠️ Error: " + data.error;
      } else {
        respuestaContenedor.innerText = "❌ No se obtuvo una respuesta válida.";
      }
    } catch (error) {
      console.error("Error al consultar a la IA:", error);
      respuestaContenedor.innerText = "❌ Error al consultar a la IA.";
    }
  });
});
