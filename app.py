from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import json
import os
import unicodedata

app = Flask(__name__)

# Configura tu API KEY de Gemini
genai.configure(api_key="AIzaSyCO-PHui--f7uUuCc99Vk_N3bHvO_edDwQ")
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")

# Función para normalizar texto
def normalizar(texto):
    texto = texto.lower()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return texto

# Carga el JSON de carreras
with open("carreras_completas.json", "r", encoding="utf-8") as f:
    carreras_data = json.load(f)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/recomendar", methods=["POST"])
def recomendar():
    try:
        data = request.get_json()
        mensaje = data.get("mensaje", "")
        print("Mensaje del usuario:", mensaje)

        # Normaliza el mensaje para filtrar carreras relevantes
        filtro = normalizar(mensaje)
        carreras_relevantes = []

        # Paso 1: Coincidencia exacta o parcial con el nombre completo de la carrera
        for carrera_nombre, lista in carreras_data.items():
            carrera_normalizada = normalizar(carrera_nombre)
            if filtro in carrera_normalizada or carrera_normalizada in filtro:
                carreras_relevantes.extend(lista)

        # Paso 2 (fallback): Coincidencias palabra por palabra si no se encontró nada
        if not carreras_relevantes:
            for carrera_nombre, lista in carreras_data.items():
                carrera_normalizada = normalizar(carrera_nombre)
                if any(palabra in carrera_normalizada for palabra in filtro.split()):
                    carreras_relevantes.extend(lista)

        # Si sigue vacío, tomar muestra genérica para no dejar sin respuesta
        if not carreras_relevantes:
            for lista in carreras_data.values():
                carreras_relevantes.extend(lista)
                if len(carreras_relevantes) >= 5:
                    break

        carreras_json = json.dumps(carreras_relevantes, ensure_ascii=False)

        prompt = (
            f"Eres un orientador vocacional que recomienda carreras y universidades del Perú. "
            f"Basado en la siguiente información del usuario:\n"
            f"{mensaje}\n\n"
            f"Y en esta base de datos de opciones:\n{carreras_json}\n\n"
            f"Devuelve una recomendación clara y amigable de máximo 3 opciones con nombre de carrera, universidad y ciudad."
        )

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024
            )
        )

        return jsonify({"respuesta": response.text})

    except Exception as e:
        print("❌ Error en /recomendar:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
