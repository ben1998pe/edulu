let todasLasOpciones = [];
let carrerasUnicas = [];
let ciudadesUnicas = [];

// Variables para paginación
let paginaActual = 1;
let resultadosPaginados = [];
const CARDS_POR_PAGINA = 10;

// Función para cargar los datos iniciales
async function cargarDatos() {
    try {
        const response = await fetch('/api/carreras_completas');
        const data = await response.json();
        
        todasLasOpciones = [];
        const tempCarreras = new Set();
        const tempCiudades = new Set();

        Object.values(data).forEach(lista => {
            lista.forEach(inst => {
                todasLasOpciones.push(inst);
                if (inst["Carrera"]) tempCarreras.add(inst["Carrera"]);
                if (inst["Ciudad"]) tempCiudades.add(inst["Ciudad"]);
            });
        });

        carrerasUnicas = Array.from(tempCarreras).sort();
        ciudadesUnicas = Array.from(tempCiudades).sort();
        
        // Exponer globalmente para comparison.js
        window.instituciones = todasLasOpciones;
        
        console.log('Datos cargados:', todasLasOpciones.length, 'instituciones');
        console.log('Carreras únicas cargadas:', carrerasUnicas.length);
        console.log('Ciudades únicas cargadas:', ciudadesUnicas.length);

    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Cargar datos cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();

    // Configurar autocompletado para Carrera
    const carreraInput = document.getElementById('carreraInput');
    const sugerenciasCarrera = document.getElementById('sugerenciasCarrera');
    setupAutocomplete(carreraInput, sugerenciasCarrera, () => carrerasUnicas);

    // Configurar autocompletado para Ciudad
    const ciudadInput = document.getElementById('ciudadInput');
    const sugerenciasCiudad = document.getElementById('sugerenciasCiudad');
    setupAutocomplete(ciudadInput, sugerenciasCiudad, () => ciudadesUnicas);
});

function setupAutocomplete(inputElement, suggestionsContainer, getSuggestionsData) {
    inputElement.addEventListener('input', () => {
        const query = inputElement.value.toLowerCase();
        suggestionsContainer.innerHTML = '';

        if (query.length < 2) {
            suggestionsContainer.classList.add('hidden');
            return;
        }

        const allSuggestions = getSuggestionsData();
        const filteredSuggestions = allSuggestions.filter(item => 
            item.toLowerCase().includes(query)
        ).slice(0, 10); // Limitar a 10 sugerencias

        if (filteredSuggestions.length > 0) {
            filteredSuggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.classList.add('p-2', 'cursor-pointer', 'hover:bg-indigo-100', 'rounded-md');
                div.textContent = suggestion;
                div.addEventListener('click', () => {
                    inputElement.value = suggestion;
                    suggestionsContainer.classList.add('hidden');
                });
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.classList.remove('hidden');
        } else {
            suggestionsContainer.classList.add('hidden');
        }
    });

    inputElement.addEventListener('blur', () => {
        // Retrasar el ocultamiento para permitir clic en sugerencia
        setTimeout(() => {
            suggestionsContainer.classList.add('hidden');
        }, 200);
    });
}

function renderPaginador(totalPaginas) {
    const paginador = document.getElementById('paginadorBuscador');
    if (!paginador) return;
    paginador.innerHTML = '';
    if (totalPaginas <= 1) return;
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'px-3 py-1 rounded-lg font-semibold border border-indigo-200 bg-white shadow text-indigo-600 hover:bg-indigo-100 transition ' + (i === paginaActual ? 'bg-indigo-600 text-white' : '');
        btn.addEventListener('click', () => {
            paginaActual = i;
            renderResultadosPaginados();
        });
        paginador.appendChild(btn);
    }
}

function renderResultadosPaginados() {
    const contenedor = document.getElementById('resultadosBuscador');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    if (resultadosPaginados.length === 0) {
        contenedor.innerHTML = `<div class="text-center py-8"><p class="text-gray-600">No se encontraron resultados</p></div>`;
        renderPaginador(1);
        return;
    }
    const totalPaginas = Math.ceil(resultadosPaginados.length / CARDS_POR_PAGINA);
    const inicio = (paginaActual - 1) * CARDS_POR_PAGINA;
    const fin = inicio + CARDS_POR_PAGINA;
    resultadosPaginados.slice(inicio, fin).forEach(inst => {
        contenedor.appendChild(createCard(inst));
    });
    renderPaginador(totalPaginas);
}

function filtrarYRenderizar() {
    if (!todasLasOpciones || todasLasOpciones.length === 0) {
        console.error('No hay datos disponibles para filtrar');
        return;
    }

    const carrera = document.getElementById('carreraInput').value.toLowerCase();
    const ciudad = document.getElementById('ciudadInput').value.toLowerCase();
    const tipo = document.getElementById('tipoInput').value;

    console.log('Filtrando con:', { carrera, ciudad, tipo });

    const resultados = todasLasOpciones.filter(inst => {
        const matchCarrera = !carrera || (inst["Carrera"] && inst["Carrera"].toLowerCase().includes(carrera));
        const matchCiudad = !ciudad || (inst["Ciudad"] && inst["Ciudad"].toLowerCase().includes(ciudad));
        const matchTipo = !tipo || inst["Tipo de institución"] === tipo;
        return matchCarrera && matchCiudad && matchTipo;
    });

    console.log('Resultados encontrados:', resultados.length);

    // Guardar resultados y resetear página
    resultadosPaginados = resultados;
    paginaActual = 1;
    renderResultadosPaginados();
}

function createCard(inst) {
    // Logo
    let logoHtml = '';
    if (inst["Página web"]) {
        try {
            const url = new URL(inst["Página web"]);
            const dominio = url.hostname.replace(/^www\./, '');
            logoHtml = `<div class='flex justify-center'><img src='https://img.logo.dev/${dominio}?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true' alt='Logo' width='48' height='48' class='mb-2 rounded shadow' style='object-fit:contain;max-height:48px;max-width:48px;display:block;' onerror="this.onerror=null;this.src='https://img.logo.dev/logo.dev?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true';"></div>`;
        } catch(e) {
            logoHtml = `<div class='flex justify-center'><img src='https://img.logo.dev/logo.dev?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true' alt='Logo' width='48' height='48' class='mb-2 rounded shadow' style='object-fit:contain;max-height:48px;max-width:48px;display:block;'></div>`;
        }
    } else {
        logoHtml = `<div class='flex justify-center'><img src='https://img.logo.dev/logo.dev?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true' alt='Logo' width='48' height='48' class='mb-2 rounded shadow' style='object-fit:contain;max-height:48px;max-width:48px;display:block;'></div>`;
    }

    // Etiquetas
    const chip = (txt, color) => `<span class='inline-block px-3 py-1 rounded-full text-xs font-semibold mr-2 mb-1' style='background:${color};color:#fff;'>${txt}</span>`;
    const tipoChip = inst["Tipo de institución"] ? chip(inst["Tipo de institución"], inst["Tipo de institución"] === 'Universidad' ? '#6366f1' : '#9333ea') : '';

    // Card
    const div = document.createElement('div');
    div.className = 'glass-card-buscador bg-white/70 backdrop-blur-lg border border-indigo-100 rounded-2xl shadow-xl p-6 flex flex-col items-center min-h-[340px] transition-all duration-500 hover:scale-105 hover:shadow-2xl relative';
    div.innerHTML = `
        <div class='absolute top-4 right-4'>${tipoChip}</div>
        ${logoHtml}
        <b class='block text-center text-lg md:text-xl mb-1 text-gray-900 truncate w-full max-w-[220px]'>${inst["Institución"]}</b>
        <span class='block text-center text-indigo-600 font-semibold mb-2 truncate w-full max-w-[220px]'>${inst["Carrera"]}</span>
        <span class='block text-center text-gray-700 mb-2 truncate w-full max-w-[220px]'>${inst["Ciudad"]}</span>
        <div class='flex flex-wrap justify-center gap-2 mb-2'>
            ${inst["Costo anual"] && inst["Costo anual"] !== 'ND' ? `<span class='inline-flex items-center gap-1 text-xs text-gray-600 bg-indigo-50 rounded px-2 py-1'><svg class='w-4 h-4' fill='none' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24'><path d='M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z'/></svg> ${inst["Costo anual"]}</span>` : ''}
            ${inst["Duración"] && inst["Duración"] !== 'ND' ? `<span class='inline-flex items-center gap-1 text-xs text-gray-600 bg-indigo-50 rounded px-2 py-1'><svg class='w-4 h-4' fill='none' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24'><path d='M12 8v4m0 4h.01'/></svg> ${inst["Duración"]}</span>` : ''}
        </div>
        <div class='flex-grow'></div>
        <button class='mt-3 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow transition-all duration-300 self-end'>Ver más</button>
    `;

    // Agregar el evento click al botón
    const button = div.querySelector('button');
    button.addEventListener('click', () => {
        if (typeof showComparisonModal === 'function') {
            showComparisonModal(inst);
        } else {
            console.error('La función showComparisonModal no está disponible');
        }
    });

    return div;
}