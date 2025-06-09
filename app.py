from flask import Flask, render_template, request, jsonify
import requests
import json
import unicodedata

app = Flask(__name__)

# Configurar OpenRouter
API_KEY = "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"
MODEL = "mistralai/mistral-7b-instruct:free"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Cargar JSON
with open("carreras_completas.json", "r", encoding="utf-8") as f:
    carreras_data = json.load(f)

# Mapeo de ciudad a región
ciudad_to_region = {
    "trujillo": "la libertad",
    "arequipa": "arequipa",
    "piura": "piura",
    "lima": "lima",
    "huancayo": "junin",
    "cusco": "cusco",
    "chiclayo": "lambayeque",
    "ica": "ica",
    # Agrega más si es necesario
}

def normalizar(texto):
    texto = texto.lower()
    texto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in texto if not unicodedata.combining(c))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/recomendar", methods=["POST"])
def recomendar():
    try:
        data = request.get_json()
        mensaje = data.get("mensaje", "")
        print("Mensaje del usuario:", mensaje)

        prompt = (
            f"Extrae la carrera y ciudad del siguiente mensaje de forma JSON clara:\n"
            f"\"{mensaje}\"\n"
            f"Devuelve solo un JSON con claves 'carrera' y 'ciudad'. Ejemplo: {{\"carrera\": \"Psicología\", \"ciudad\": \"Lima\"}}"
        )

        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=HEADERS, json={
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 100
        })

        raw = response.json()
        print("🔍 Respuesta cruda de extracción:\n", json.dumps(raw, indent=2))

        content = raw["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        carrera = normalizar(parsed.get("carrera", ""))
        ciudad_usuario = normalizar(parsed.get("ciudad", ""))
        ciudad_mapeada = ciudad_to_region.get(ciudad_usuario, ciudad_usuario)

        print("🎯 Carrera detectada:", carrera)
        print("📍 Ciudad detectada:", ciudad_usuario, f"(mapeada a {ciudad_mapeada})")

        resultados = []
        for nombre, lista in carreras_data.items():
            if carrera in normalizar(nombre):
                for inst in lista:
                    if ciudad_mapeada in normalizar(inst["Ciudad"]):
                        resultados.append(inst)

        if not resultados:
            return jsonify({"respuesta": f"No se encontraron resultados para {parsed['carrera']} en {parsed['ciudad']}. Intenta con otra carrera o ciudad."})

        respuesta = f"Basado en tu interés en la carrera de {parsed['carrera']} y en estudiar en {parsed['ciudad']}, te recomiendo las siguientes opciones:\n"
        for i, r in enumerate(resultados[:3], start=1):
            respuesta += f"\n{i}. {r['Institución']}: Carrera de {r['Carrera']} en {r['Ciudad']}."
            if r['Costo anual']: respuesta += f"\n- Costo anual: {r['Costo anual']}"
            if r['Duración']: respuesta += f"\n- Duración: {r['Duración']}"
            if r['Página web']: respuesta += f"\n- Página web: {r['Página web']}\n"

        return jsonify({"respuesta": respuesta.strip()})

    except Exception as e:
        print("❌ Error en /recomendar:", e)
        return jsonify({"respuesta": "⚠️ Error: No se pudo obtener respuesta de la IA."})

if __name__ == "__main__":
    app.run(debug=True)
