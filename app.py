from flask import Flask, render_template, request, jsonify, session
import requests
import json
import unicodedata
import re

app = Flask(__name__)
app.secret_key = 'edulu-secret-key'  # Necesario para usar session

# Configurar OpenRouter
API_KEY = "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"
MODEL = "deepseek/deepseek-r1-0528-qwen3-8b:free"
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

# Diccionario robusto de ciudades principales de Perú con coordenadas
ciudades_coords = {
    "Lima": [-12.0464, -77.0428],
    "Arequipa": [-16.4090, -71.5375],
    "Trujillo": [-8.11599, -79.02898],
    "Chiclayo": [-6.7714, -79.8409],
    "Piura": [-5.1945, -80.6328],
    "Cusco": [-13.5319, -71.9675],
    "Iquitos": [-3.7437, -73.2516],
    "Huancayo": [-12.0651, -75.2049],
    "Tacna": [-18.0066, -70.2463],
    "Ica": [-14.0678, -75.7286],
    "Pucallpa": [-8.3791, -74.5539],
    "Juliaca": [-15.4997, -70.1333],
    "Chimbote": [-9.0745, -78.5936],
    "Ayacucho": [-13.1588, -74.2232],
    "Cajamarca": [-7.1617, -78.5127],
    "Puno": [-15.8402, -70.0219],
    "Tumbes": [-3.5669, -80.4515],
    "Tarapoto": [-6.4836, -76.3756],
    "Huaraz": [-9.5278, -77.5278],
    "Puerto Maldonado": [-12.5933, -69.1891],
    "Moquegua": [-17.1927, -70.9326],
    "Huánuco": [-9.9306, -76.2422],
    "Sullana": [-4.9039, -80.6851],
    "Chincha Alta": [-13.4196, -76.1367],
    "Abancay": [-13.6339, -72.8814],
    "Huaral": [-11.4956, -77.2076],
    "Cerro de Pasco": [-10.6827, -76.2567],
    "Moyobamba": [-6.0346, -76.9716],
    "Jaén": [-5.7081, -78.8087],
    "Huacho": [-11.1075, -77.6050],
    "Pisco": [-13.7103, -76.2032],
    "Tarma": [-11.4196, -75.6906],
    "Yurimaguas": [-5.9028, -76.1194],
    "Bagua": [-5.6366, -78.5370],
    "Sicuani": [-14.2722, -71.2261],
    "La Oroya": [-11.5261, -75.8925],
    # ... puedes agregar más ciudades según necesidad ...
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

        # Usar session para mantener el contexto de la conversación
        if "carrera" not in session:
            session["carrera"] = None
        if "ciudad" not in session:
            session["ciudad"] = None

        print(f"[DEBUG] Contexto actual: carrera={session['carrera']}, ciudad={session['ciudad']}")

        # Si ya tenemos ambos datos, generar la recomendación directamente
        if session["carrera"] and session["ciudad"]:
            carrera = normalizar(session["carrera"])
            ciudad_usuario = normalizar(session["ciudad"])
            ciudad_mapeada = ciudad_to_region.get(ciudad_usuario, ciudad_usuario)

            print("🎯 Carrera detectada (session):", carrera)
            print("📍 Ciudad detectada (session):", ciudad_usuario, f"(mapeada a {ciudad_mapeada})")

            resultados = []
            for nombre, lista in carreras_data.items():
                if carrera in normalizar(nombre):
                    for inst in lista:
                        if ciudad_mapeada in normalizar(inst["Ciudad"]):
                            resultados.append(inst)

            if not resultados:
                respuesta = f"No se encontraron resultados para {session['carrera']} en {session['ciudad']}. Intenta con otra carrera o ciudad."
            else:
                respuesta = f"Basado en tu interés en la carrera de {session['carrera']} y en estudiar en {session['ciudad']}, te recomiendo las siguientes opciones:\n"
                for i, r in enumerate(resultados[:3], start=1):
                    respuesta += f"\n{i}. {r['Institución']}: Carrera de {r['Carrera']} en {r['Ciudad']}."
                    if r['Costo anual']: respuesta += f"\n- Costo anual: {r['Costo anual']}"
                    if r['Duración']: respuesta += f"\n- Duración: {r['Duración']}"
                    if r['Página web']: respuesta += f"\n- Página web: {r['Página web']}\n"
            # Limpiar el contexto después de dar recomendaciones
            session["carrera"] = None
            session["ciudad"] = None
            print(f"[DEBUG] Contexto limpiado: carrera={session['carrera']}, ciudad={session['ciudad']}")
            return jsonify({"respuesta": respuesta.strip()})

        # Mejorar el prompt para que la IA actúe como un asesor educativo
        prompt = (
            "Eres un asesor educativo amigable y profesional de Perú. "
            "Solo hablas de universidades y carreras en Perú. "
            "Responde SIEMPRE en español y, si das un JSON, usa las claves 'carrera' y 'ciudad' (no 'career' ni 'city'). "
            "Sigue estas reglas estrictamente:\n"
            "1. Si el usuario solo saluda o hace una pregunta general, responde de manera amigable.\n"
            "2. Si el usuario menciona una ciudad, guárdala y pregunta por la carrera si no la tenemos.\n"
            "3. Si el usuario menciona una carrera, guárdala y pregunta por la ciudad si no la tenemos.\n"
            "4. Si ya tenemos ambos datos (carrera y ciudad) guardados, úsalos para responder en formato JSON, aunque el usuario no los repita en este mensaje.\n"
            "5. NO uses valores genéricos como 'Tu ciudad' o 'Tal vez aquí'.\n"
            "6. Mantén un tono conversacional y amigable.\n"
            "7. Si el usuario pregunta sobre costos, duración o requisitos, proporciona información general.\n"
            "8. Nunca menciones ciudades o universidades fuera de Perú.\n"
            "Contexto actual:\n"
            f"- Carrera mencionada: {session['carrera'] or 'No especificada'}\n"
            f"- Ciudad mencionada: {session['ciudad'] or 'No especificada'}\n"
            "Mensaje del usuario: " + mensaje
        )

        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=HEADERS, json={
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 200
        })

        raw = response.json()
        print("🔍 Respuesta cruda de extracción:\n", json.dumps(raw, indent=2))

        content = None
        try:
            content = raw["choices"][0]["message"]["content"]
        except Exception as e:
            # Manejar error de rate limit u otros
            if "error" in raw and raw["error"].get("code") == 429:
                return jsonify({"respuesta": "⚠️ Has alcanzado el límite de consultas gratuitas por hoy. Intenta nuevamente más tarde o contacta al administrador."})
            print(f"❌ Error en /recomendar: {e}")
            return jsonify({"respuesta": "⚠️ Error: No se pudo obtener respuesta de la IA."})
        
        # Intentar extraer JSON primero (aceptar claves en español o inglés)
        match = re.search(r'\{[\s\S]*?\}', content)
        carrera = None
        ciudad = None
        if match:
            try:
                parsed = json.loads(match.group(0))
                # Buscar claves posibles
                carrera = parsed.get("carrera") or parsed.get("career")
                ciudad = parsed.get("ciudad") or parsed.get("city")
                if carrera: carrera = carrera.strip()
                if ciudad: ciudad = ciudad.strip()
                # Validar y guardar en session si son válidos
                if carrera and ciudad and ciudad.lower() not in ["tu ciudad", "tal vez aquí", "no especificada"]:
                    session["carrera"] = carrera
                    session["ciudad"] = ciudad
                    print(f"[DEBUG] Guardado desde JSON: carrera={carrera}, ciudad={ciudad}")
                elif carrera and not session["carrera"]:
                    session["carrera"] = carrera
                    print(f"[DEBUG] Guardado solo carrera desde JSON: carrera={carrera}")
                elif ciudad and not session["ciudad"]:
                    session["ciudad"] = ciudad
                    print(f"[DEBUG] Guardado solo ciudad desde JSON: ciudad={ciudad}")
                # Si ya tenemos ambos, volver a entrar al flujo de recomendación
                if session["carrera"] and session["ciudad"]:
                    return jsonify({"respuesta": "¡Gracias! Ya tengo toda la información, por favor vuelve a enviar tu mensaje para recibir la recomendación."})
            except Exception as e:
                print(f"[DEBUG] Error al parsear JSON: {e}")
        else:
            # Si no hay JSON, intentar extraer del mensaje del usuario
            # Buscar ciudad (ej: 'soy de lima', 'vivo en trujillo')
            ciudad_match = re.search(r'(soy de|vivo en|en la ciudad de)\s+([a-záéíóúñ ]+)', mensaje, re.IGNORECASE)
            if ciudad_match:
                ciudad = ciudad_match.group(2).strip()
                session["ciudad"] = ciudad
                print(f"[DEBUG] Extraído ciudad del texto: ciudad={ciudad}")
            # Buscar carrera (frases comunes o solo el nombre)
            carrera_match = re.search(r'(me gusta|quiero estudiar|la carrera de|estudiar|la de)\s+([a-záéíóúñ ]+)', mensaje, re.IGNORECASE)
            if carrera_match:
                carrera = carrera_match.group(2).strip()
                session["carrera"] = carrera
                print(f"[DEBUG] Extraído carrera del texto (frase): carrera={carrera}")
            else:
                # Si el usuario solo escribe el nombre de la carrera (una o varias palabras)
                palabras = mensaje.strip().lower().split()
                # Si el mensaje es corto y no es un saludo ni ciudad, asumir que es carrera
                saludos = ["hola", "buenas", "saludos", "hey", "buenos", "dias", "tardes", "noches"]
                ciudades = ["lima", "arequipa", "trujillo", "cusco", "piura", "chiclayo", "huancayo", "ica", "puno", "tacna", "chimbote", "cajamarca", "ayacucho", "tarapoto", "huánuco", "pucallpa", "sullana", "juliaca", "ica", "moquegua", "tumbes", "cerro de pasco", "abancay", "huaraz", "ica", "ica"]
                if 1 <= len(palabras) <= 5 and not any(p in palabras for p in saludos+ciudades):
                    session["carrera"] = mensaje.strip()
                    print(f"[DEBUG] Extraído carrera del texto (solo nombre): carrera={mensaje.strip()}")
            # Si ya tenemos ambos, volver a entrar al flujo de recomendación
            if session["carrera"] and session["ciudad"]:
                return jsonify({"respuesta": "¡Gracias! Ya tengo toda la información, por favor vuelve a enviar tu mensaje para recibir la recomendación."})
        
        # Si no hay JSON o falló el parsing, usar la respuesta general
        return jsonify({"respuesta": content.strip()})

    except Exception as e:
        print("❌ Error en /recomendar:", e)
        return jsonify({"respuesta": "⚠️ Error: No se pudo obtener respuesta de la IA."})

@app.route("/carreras", methods=["GET"])
def obtener_carreras():
    carreras = list(carreras_data.keys())
    return jsonify({"carreras": carreras})

@app.route("/universidades_por_carrera", methods=["GET"])
def universidades_por_carrera():
    carrera = request.args.get("carrera")
    if not carrera:
        return jsonify({"error": "Falta el parámetro 'carrera'"}), 400
    carrera_normalizada = normalizar(carrera)
    resultados = {}
    for nombre, lista in carreras_data.items():
        if carrera_normalizada == normalizar(nombre):
            for inst in lista:
                ciudad = inst.get("Ciudad", "").strip()
                if ciudad not in ciudades_coords:
                    continue  # Solo ciudades conocidas
                if ciudad not in resultados:
                    resultados[ciudad] = {
                        "coords": ciudades_coords[ciudad],
                        "universidades": []
                    }
                resultados[ciudad]["universidades"].append({
                    "nombre": inst.get("Institución", ""),
                    "carrera": inst.get("Carrera", ""),
                    "costo_anual": inst.get("Costo anual", ""),
                    "duracion": inst.get("Duración", ""),
                    "web": inst.get("Página web", "")
                })
    # Convertir a lista para el frontend
    ciudades = []
    for ciudad, data in resultados.items():
        ciudades.append({
            "ciudad": ciudad,
            "coords": data["coords"],
            "universidades": data["universidades"]
        })
    return jsonify({"ciudades": ciudades})

@app.route("/filtros_buscador", methods=["GET"])
def filtros_buscador():
    carreras = set()
    ciudades = set()
    tipos = set()
    for lista in carreras_data.values():
        for inst in lista:
            carreras.add(inst.get("Carrera", "").strip())
            ciudades.add(inst.get("Ciudad", "").strip())
            tipos.add(inst.get("Tipo de institución", "").strip())
    return jsonify({
        "carreras": sorted(c for c in carreras if c),
        "ciudades": sorted(c for c in ciudades if c),
        "tipos": sorted(t for t in tipos if t)
    })

@app.route("/api/carreras_completas", methods=["GET"])
def api_carreras_completas():
    return jsonify(carreras_data)

@app.route('/api/instituciones')
def get_instituciones():
    try:
        with open('data/carreras.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Aplanar el JSON a una lista de opciones
        instituciones = []
        for lista in data.values():
            for inst in lista:
                instituciones.append(inst)
        return jsonify(instituciones)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
