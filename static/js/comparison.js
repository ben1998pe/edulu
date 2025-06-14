// Asegurar que las funciones estén disponibles globalmente
window.charts = {
    duration: null,
    ratio: null,
    cost: null
};

function normalizar(str) {
    return (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

window.showComparisonModal = function(selectedInstitution) {
    console.log('Abriendo modal para:', selectedInstitution);
    const modal = document.getElementById('comparisonModal');
    if (!modal) {
        console.error('No se encontró el elemento modal');
        return;
    }
    modal.classList.remove('hidden');
    
    // Obtener todas las instituciones con la misma carrera
    const carrera = selectedInstitution["Carrera"];
    let instituciones = window.instituciones.filter(inst => inst["Carrera"] === carrera);
    
    // Priorizar instituciones de la misma ciudad
    const ciudadSel = normalizar(selectedInstitution["Ciudad"]);
    const costoSel = parseCostoAnual(selectedInstitution["Costo anual"]);
    // Separar por ciudad
    let mismasCiudad = instituciones.filter(inst => normalizar(inst["Ciudad"]) === ciudadSel);
    let otrasCiudades = instituciones.filter(inst => normalizar(inst["Ciudad"]) !== ciudadSel);
    // Ordenar por cercanía de precio respecto a la seleccionada
    function distanciaPrecio(inst) {
        const costo = parseCostoAnual(inst["Costo anual"]);
        if (costoSel == null || costo == null) return Number.MAX_SAFE_INTEGER;
        return Math.abs(costo - costoSel);
    }
    mismasCiudad.sort((a, b) => distanciaPrecio(a) - distanciaPrecio(b));
    otrasCiudades.sort((a, b) => distanciaPrecio(a) - distanciaPrecio(b));
    // Tomar hasta 20, priorizando mismas ciudad
    let topInstituciones = mismasCiudad.slice(0, 20);
    if (topInstituciones.length < 20) {
        topInstituciones = topInstituciones.concat(otrasCiudades.slice(0, 20 - topInstituciones.length));
    }
    // Comparar insensible a mayúsculas y espacios
    const selInstNorm = normalizar(selectedInstitution["Institución"]);
    const yaIncluida = topInstituciones.some(inst => normalizar(inst["Institución"]) === selInstNorm && normalizar(inst["Ciudad"]) === ciudadSel);
    if (!yaIncluida) {
        topInstituciones.push(selectedInstitution);
    }
    // Eliminar duplicados por nombre y ciudad (normalizado)
    const uniqueInstituciones = [];
    const seen = new Set();
    for (const inst of topInstituciones) {
        const key = normalizar(inst["Institución"]) + '|' + normalizar(inst["Ciudad"]);
        if (!seen.has(key)) {
            uniqueInstituciones.push(inst);
            seen.add(key);
        }
    }
    instituciones = uniqueInstituciones;
    
    // Actualizar título del modal
    document.getElementById('modalTitle').textContent = `Comparación: ${carrera}`;
    
    // Crear gráficos
    createDurationChart(instituciones, selectedInstitution);
    createRatioChart(instituciones, selectedInstitution);
    createCostChart(instituciones, selectedInstitution);
    
    // Mostrar información adicional
    showAdditionalInfo(selectedInstitution);
};

window.closeComparisonModal = function() {
    const modal = document.getElementById('comparisonModal');
    if (!modal) {
        console.error('No se encontró el elemento modal');
        return;
    }
    modal.classList.add('hidden');
    
    // Destruir gráficos existentes
    Object.values(window.charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    window.charts = {
        duration: null,
        ratio: null,
        cost: null
    };
};

function createDurationChart(instituciones, selectedInstitution) {
    const ctx = document.getElementById('durationChart');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de duración');
        return;
    }
    
    // Ajustar ancho dinámicamente
    ctx.width = Math.max(600, instituciones.length * 40);
    ctx.height = 256;
    
    // Destruir gráfico existente
    if (window.charts.duration) window.charts.duration.destroy();
    
    const selectedKey = selectedInstitution["Institución"] + '|' + selectedInstitution["Ciudad"];
    const data = {
        labels: instituciones.map(inst => inst["Institución"]),
        datasets: [{
            label: 'Duración (años)',
            data: instituciones.map(inst => {
                const duracion = inst["Duración"];
                if (!duracion || duracion === 'ND') return null;
                return parseFloat(duracion);
            }),
            backgroundColor: instituciones.map(inst => {
                const key = inst["Institución"] + '|' + inst["Ciudad"];
                return key === selectedKey ? 'rgba(99,102,241,0.7)' : 'rgba(79,70,229,0.2)';
            }),
            borderColor: instituciones.map(inst => {
                const key = inst["Institución"] + '|' + inst["Ciudad"];
                return key === selectedKey ? 'rgba(99,102,241,1)' : 'rgba(79,70,229,1)';
            }),
            borderWidth: 2
        }]
    };
    
    window.charts.duration = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Años'
                    }
                }
            }
        }
    });
}

function createRatioChart(instituciones, selectedInstitution) {
    const ctx = document.getElementById('ratioChart');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de ratio');
        return;
    }
    
    // Ajustar ancho dinámicamente
    ctx.width = Math.max(600, instituciones.length * 40);
    ctx.height = 256;
    
    // Destruir gráfico existente
    if (window.charts.ratio) window.charts.ratio.destroy();
    
    const selectedKey = selectedInstitution["Institución"] + '|' + selectedInstitution["Ciudad"];
    const data = {
        labels: instituciones.map(inst => inst["Institución"]),
        datasets: [{
            label: 'Ratio Ingresantes/Postulantes',
            data: instituciones.map(inst => {
                const ratio = inst["% Ingresantes/postulantes"];
                if (!ratio || ratio === 'ND') return null;
                return parseFloat(ratio);
            }),
            backgroundColor: instituciones.map(inst => {
                const key = inst["Institución"] + '|' + inst["Ciudad"];
                return key === selectedKey ? 'rgba(16,185,129,0.7)' : 'rgba(16,185,129,0.2)';
            }),
            borderColor: instituciones.map(inst => {
                const key = inst["Institución"] + '|' + inst["Ciudad"];
                return key === selectedKey ? 'rgba(16,185,129,1)' : 'rgba(16,185,129,1)';
            }),
            borderWidth: 2
        }]
    };
    
    window.charts.ratio = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Porcentaje'
                    }
                }
            }
        }
    });
}

function parseCostoAnual(valor) {
    if (!valor || valor === 'ND') return null;
    // Extraer todos los números (soporta decimales, comas, puntos)
    const matches = valor.toString().match(/\d+[\d.,]*/g);
    if (!matches || matches.length === 0) return null;
    // Convertir a números flotantes
    const nums = matches.map(str => {
        let limpio = str.replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(limpio);
    }).filter(n => !isNaN(n));
    if (nums.length === 0) return null;
    if (nums.length === 1) return nums[0];
    // Si hay dos o más, tomar el promedio de los dos primeros
    return (nums[0] + nums[1]) / 2;
}

function createCostChart(instituciones, selectedInstitution) {
    const ctx = document.getElementById('costChart');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de costo');
        return;
    }
    ctx.width = Math.max(600, instituciones.length * 40);
    ctx.height = 256;
    if (window.charts.cost) window.charts.cost.destroy();
    const selectedKey = selectedInstitution["Institución"] + '|' + selectedInstitution["Ciudad"];
    const data = {
        labels: instituciones.map(inst => inst["Institución"]),
        datasets: [{
            label: 'Costo Anual',
            data: instituciones.map(inst => parseCostoAnual(inst["Costo anual"])),
            backgroundColor: instituciones.map(inst => {
                const key = inst["Institución"] + '|' + inst["Ciudad"];
                return key === selectedKey ? 'rgba(245,158,11,0.7)' : 'rgba(245,158,11,0.2)';
            }),
            borderColor: instituciones.map(inst => {
                const key = inst["Institución"] + '|' + inst["Ciudad"];
                return key === selectedKey ? 'rgba(245,158,11,1)' : 'rgba(245,158,11,1)';
            }),
            borderWidth: 2
        }]
    };
    window.charts.cost = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Soles' } } }
        }
    });
}

function showAdditionalInfo(institution) {
    const container = document.getElementById('additionalInfo');
    if (!container) return;
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 rounded-lg p-3 text-center">
                <span class="block text-xs text-gray-500">Nombre</span>
                <span class="block font-semibold text-base">${institution["Institución"] || 'No especificado'}</span>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-center">
                <span class="block text-xs text-gray-500">Tipo de Institución</span>
                <span class="block font-semibold text-base">${institution["Tipo de institución"] || 'No especificado'}</span>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-center">
                <span class="block text-xs text-gray-500">Ciudad</span>
                <span class="block font-semibold text-base">${institution["Ciudad"] || 'No especificado'}</span>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-center">
                <span class="block text-xs text-gray-500">Costo anual</span>
                <span class="block font-semibold text-base">${institution["Costo anual"] || 'No especificado'}</span>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-center">
                <span class="block text-xs text-gray-500">Modalidad</span>
                <span class="block font-semibold text-base">${institution["Modalidad"] || 'No especificado'}</span>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-center">
                <span class="block text-xs text-gray-500">Acreditación</span>
                <span class="block font-semibold text-base">${institution["Acreditación"] || 'No especificado'}</span>
            </div>
        </div>
    `;
} 