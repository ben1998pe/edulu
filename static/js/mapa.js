// Llenar el select de carreras dinámicamente
let todasLasCarreras = [];
let choicesCarrera = null;
let leafletMap = null;
let leafletMarkers = [];

window.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('select-carrera');
  const buscador = document.getElementById('buscador-carrera');
  if (!select) return;
  try {
    const res = await fetch('/carreras');
    const data = await res.json();
    if (data.carreras && Array.isArray(data.carreras)) {
      todasLasCarreras = data.carreras;
      renderCarreras(todasLasCarreras, select);
      // Inicializar Choices.js después de llenar el select
      if (choicesCarrera) choicesCarrera.destroy();
      choicesCarrera = new Choices(select, {
        searchEnabled: true,
        itemSelectText: '',
        shouldSort: false,
        placeholder: true,
        searchPlaceholderValue: 'Buscar carrera...'
      });
    }
  } catch (e) {
    // Si hay error, muestra una opción de error
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = 'No se pudieron cargar las carreras';
    select.appendChild(option);
  }

  // Filtrar carreras mientras se escribe
  if (buscador) {
    buscador.addEventListener('input', function() {
      const texto = buscador.value.toLowerCase();
      const filtradas = todasLasCarreras.filter(carrera => carrera.toLowerCase().includes(texto));
      renderCarreras(filtradas, select);
    });
  }

  // Evento para mostrar marcadores al seleccionar una carrera
  if (select) {
    select.addEventListener('change', async function() {
      const carrera = select.value;
      if (!carrera) return;
      // Quitar marcadores anteriores
      leafletMarkers.forEach(m => leafletMap.removeLayer(m));
      leafletMarkers = [];
      // Consultar universidades por carrera
      try {
        const res = await fetch(`/universidades_por_carrera?carrera=${encodeURIComponent(carrera)}`);
        const data = await res.json();
        if (data.ciudades && Array.isArray(data.ciudades)) {
          data.ciudades.forEach(ciudad => {
            const marker = L.marker(ciudad.coords).addTo(leafletMap);
            leafletMarkers.push(marker);
            // Crear popup con la lista de universidades
            let popupHtml = `
              <div class='popup-glass animate-popup-wow p-3 rounded-xl shadow-xl border border-indigo-100 bg-white/80 backdrop-blur-md flex flex-col items-center' style='min-width:170px; position:relative;'>
                <button class='ver-universidades-btn flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow transition-all duration-200' style='font-size:1rem;' onclick='window.mostrarPanelUniversidades && window.mostrarPanelUniversidades(${JSON.stringify(ciudad.ciudad)}, ${JSON.stringify(ciudad.universidades)})'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  Ver universidades
                </button>
              </div>
              <style>
                .popup-glass { box-shadow: 0 8px 32px 0 rgba(99,102,241,0.18); border: 1.5px solid #a5b4fc; }
                .animate-popup-wow { animation: popupWow 0.5s cubic-bezier(.68,-0.55,.27,1.55); }
                @keyframes popupWow {
                  0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
                  80% { opacity: 1; transform: translateY(5px) scale(1.03); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .ver-universidades-btn:active { transform: scale(0.97); }
              </style>
            `;
            marker.bindPopup(popupHtml);
          });
          // Ajustar vista a los marcadores si hay alguno
          if (data.ciudades.length > 0) {
            const group = new L.featureGroup(leafletMarkers);
            leafletMap.fitBounds(group.getBounds().pad(0.2));
          }
        }
      } catch (e) {
        // Error al cargar marcadores
      }
    });
  }
});

function renderCarreras(lista, select) {
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Selecciona una carrera';
  select.appendChild(defaultOption);
  lista.forEach(carrera => {
    const option = document.createElement('option');
    option.value = carrera;
    option.textContent = carrera;
    select.appendChild(option);
  });
}

// Inicializar el mapa de Leaflet centrado en Perú
window.addEventListener('DOMContentLoaded', () => {
  const mapaDiv = document.getElementById('mapa-leaflet');
  if (mapaDiv && typeof L !== 'undefined') {
    leafletMap = L.map('mapa-leaflet');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);
    // Ajustar la vista para mostrar todo Perú
    const bounds = [
      [ -0.04, -81.35 ],   // Noroeste
      [ -18.35, -68.65 ]   // Sureste
    ];
    leafletMap.fitBounds(bounds);
  }
});

// Mostrar panel inferior con universidades de la ciudad seleccionada
function mostrarPanelUniversidades(ciudad, universidades) {
  const panel = document.getElementById('panel-universidades');
  const titulo = document.getElementById('panel-titulo');
  if (!panel || !titulo) return;
  titulo.textContent = `Universidades en ${ciudad}`;
  // Limpiar controles del slider antes de renderizar
  const dots = panel.querySelector('.glider-dots');
  if (dots) dots.innerHTML = '';
  const prev = panel.querySelector('.glider-prev');
  const next = panel.querySelector('.glider-next');
  if (window.gliderInstance) {
    try { window.gliderInstance.destroy(); } catch(e){}
    window.gliderInstance = null;
  }
  // Eliminar y recrear el nodo del slider para evitar duplicados
  const oldSlider = document.getElementById('panel-lista-universidades');
  if (oldSlider) {
    const newSlider = document.createElement('div');
    newSlider.id = 'panel-lista-universidades';
    newSlider.className = 'glider';
    oldSlider.parentNode.replaceChild(newSlider, oldSlider);
  }
  const lista = document.getElementById('panel-lista-universidades');
  lista.innerHTML = '';
  universidades.forEach(u => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-gray-50 rounded-xl border border-gray-200 shadow min-h-28 flex flex-col justify-between mx-2';
    let logoHtml = '';
    if (u.web) {
      try {
        const url = new URL(u.web);
        const dominio = url.hostname.replace(/^www\./, '');
        logoHtml = `<div class='flex justify-center'><img src='https://img.logo.dev/${dominio}?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true' alt='Logo' width='44' height='44' class='mb-1 rounded' style='object-fit:contain;max-height:44px;max-width:44px;display:block;' onerror="this.onerror=null;this.src='https://img.logo.dev/logo.dev?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true';"></div>`;
      } catch(e) {
        logoHtml = `<div class='flex justify-center'><img src='https://img.logo.dev/logo.dev?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true' alt='Logo' width='44' height='44' class='mb-1 rounded' style='object-fit:contain;max-height:44px;max-width:44px;display:block;'></div>`;
      }
    } else {
      logoHtml = `<div class='flex justify-center'><img src='https://img.logo.dev/logo.dev?token=pk_JIk4mA1YTwKncwOGjTCLug&retina=true' alt='Logo' width='44' height='44' class='mb-1 rounded' style='object-fit:contain;max-height:44px;max-width:44px;display:block;'></div>`;
    }
    div.innerHTML = logoHtml + `<b class='block text-center'>${u.nombre}</b><span class='block text-sm text-gray-700 text-center'>${u.carrera}</span>` +
      (u.web ? `<br/><a href='${u.web}' target='_blank' class='text-indigo-600 underline block text-center'>Sitio web</a>` : '') +
      (u.costo_anual ? `<br/><span class='text-xs text-gray-500 block text-center'>Costo anual: ${u.costo_anual}</span>` : '') +
      (u.duracion ? `<br/><span class='text-xs text-gray-500 block text-center'>Duración: ${u.duracion}</span>` : '');
    lista.appendChild(div);
  });
  panel.style.display = 'block';
  panel.classList.add('animate-panel-wow');
  document.body.classList.add('overflow-hidden');
  setTimeout(() => panel.classList.remove('translate-y-full'), 10);

  // Inicializar Glider.js
  setTimeout(() => {
    if (window.gliderInstance) window.gliderInstance.destroy();
    window.gliderInstance = new Glider(lista, {
      slidesToShow: 1,
      slidesToScroll: 1,
      draggable: true,
      dots: panel.querySelector('.glider-dots'),
      arrows: {
        prev: panel.querySelector('.glider-prev'),
        next: panel.querySelector('.glider-next')
      },
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 3
          }
        }
      ]
    });
  }, 100);

  // Mostrar overlay
  const overlay = document.getElementById('panel-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100');
    }, 10);
  }
}

function ocultarPanelUniversidades() {
  const panel = document.getElementById('panel-universidades');
  if (!panel) return;
  panel.classList.add('translate-y-full');
  panel.classList.remove('animate-panel-wow');
  document.body.classList.remove('overflow-hidden');
  setTimeout(() => { panel.style.display = 'none'; }, 300);

  // Ocultar overlay
  const overlay = document.getElementById('panel-overlay');
  if (overlay) {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const cerrarBtn = document.getElementById('cerrar-panel');
  if (cerrarBtn) {
    cerrarBtn.addEventListener('click', ocultarPanelUniversidades);
  }
});

// Para exponer la función al scope global:
window.mostrarPanelUniversidades = mostrarPanelUniversidades;
