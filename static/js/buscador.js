let todasLasOpciones = [];

// Función para cargar los datos iniciales usando el método anterior
async function cargarDatos() {
    try {
        const response = await fetch('/api/carreras_completas');
        const data = await response.json();
        // Aplana el objeto a una lista
        todasLasOpciones = [];
        Object.values(data).forEach(lista => {
            lista.forEach(inst => todasLasOpciones.push(inst));
        });
        console.log('Datos cargados:', todasLasOpciones.length, 'instituciones');
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Cargar datos cuando el documento esté listo
document.addEventListener('DOMContentLoaded', cargarDatos);

// Llenar filtros dinámicamente y agregar autocompletado
window.addEventListener('DOMContentLoaded', async () => {
  const inputCarrera = document.getElementById('filtro-carrera');
  const inputCiudad = document.getElementById('filtro-ciudad');
  const selectTipo = document.getElementById('filtro-tipo');

  try {
    const res = await fetch('/filtros_buscador');
    const data = await res.json();
    // Autocompletado para carrera
    if (inputCarrera && data.carreras) {
      inputCarrera.addEventListener('input', function() {
        mostrarSugerencias(inputCarrera, data.carreras);
      });
    }
    // Autocompletado para ciudad
    if (inputCiudad && data.ciudades) {
      inputCiudad.addEventListener('input', function() {
        mostrarSugerencias(inputCiudad, data.ciudades);
      });
    }
    // Llenar select de tipo
    if (selectTipo && data.tipos) {
      selectTipo.innerHTML = '<option value="">Todos</option>';
      data.tipos.forEach(tipo => {
        const opt = document.createElement('option');
        opt.value = tipo;
        opt.textContent = tipo;
        selectTipo.appendChild(opt);
      });
    }
    // Filtrar solo al hacer clic en el botón Buscar
    const btnBuscar = document.getElementById('btn-buscar');
    if (btnBuscar) btnBuscar.addEventListener('click', filtrarYRenderizar);
  } catch (e) {
    // Error al cargar filtros
  }
});

// Autocompletado simple (sugerencias debajo del input)
function mostrarSugerencias(input, lista) {
  let datalist = input.nextElementSibling;
  if (!datalist || datalist.tagName !== 'DATALIST') {
    datalist = document.createElement('datalist');
    datalist.id = input.id + '-datalist';
    input.setAttribute('list', datalist.id);
    input.parentNode.insertBefore(datalist, input.nextSibling);
  }
  datalist.innerHTML = '';
  const val = input.value.toLowerCase();
  lista.filter(item => item.toLowerCase().includes(val)).slice(0, 10).forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    datalist.appendChild(option);
  });
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
        const matchCarrera = !carrera || inst["Carrera"].toLowerCase().includes(carrera);
        const matchCiudad = !ciudad || inst["Ciudad"].toLowerCase().includes(ciudad);
        const matchTipo = !tipo || inst["Tipo de institución"] === tipo;
        return matchCarrera && matchCiudad && matchTipo;
    });

    console.log('Resultados encontrados:', resultados.length);

    const contenedor = document.getElementById('resultadosBuscador');
    if (!contenedor) {
        console.error('No se encontró el contenedor de resultados');
        return;
    }

    contenedor.innerHTML = '';
    
    if (resultados.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600">No se encontraron resultados</p>
            </div>
        `;
        return;
    }

    resultados.forEach(inst => {
        contenedor.appendChild(createCard(inst));
    });
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
