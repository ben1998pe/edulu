// Llenar el select de carreras dinámicamente
let todasLasCarreras = [];
let choicesCarrera = null;
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
