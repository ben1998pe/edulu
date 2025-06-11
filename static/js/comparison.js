// Asegurar que las funciones estén disponibles globalmente
window.charts = {
    duration: null,
    ratio: null,
    cost: null
};

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
    const instituciones = window.instituciones.filter(inst => inst["Carrera"] === carrera);
    
    // Ordenar instituciones por costo anual (si está disponible)
    instituciones.sort((a, b) => {
        const costoA = parseFloat(a["Costo anual"]) || 0;
        const costoB = parseFloat(b["Costo anual"]) || 0;
        return costoA - costoB;
    });
    
    // Actualizar título del modal
    document.getElementById('modalTitle').textContent = `Comparación: ${carrera}`;
    
    // Crear gráficos
    createDurationChart(instituciones);
    createRatioChart(instituciones);
    createCostChart(instituciones);
    
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

function createDurationChart(instituciones) {
    const ctx = document.getElementById('durationChart');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de duración');
        return;
    }
    
    // Destruir gráfico existente
    if (window.charts.duration) window.charts.duration.destroy();
    
    const data = {
        labels: instituciones.map(inst => inst["Institución"]),
        datasets: [{
            label: 'Duración (años)',
            data: instituciones.map(inst => {
                const duracion = inst["Duración"];
                if (!duracion || duracion === 'ND') return null;
                return parseFloat(duracion);
            }),
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
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

function createRatioChart(instituciones) {
    const ctx = document.getElementById('ratioChart');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de ratio');
        return;
    }
    
    // Destruir gráfico existente
    if (window.charts.ratio) window.charts.ratio.destroy();
    
    const data = {
        labels: instituciones.map(inst => inst["Institución"]),
        datasets: [{
            label: 'Ratio Ingresantes/Postulantes',
            data: instituciones.map(inst => {
                const ratio = inst["% Ingresantes/postulantes"];
                if (!ratio || ratio === 'ND') return null;
                return parseFloat(ratio);
            }),
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgba(16, 185, 129, 1)',
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

function createCostChart(instituciones) {
    const ctx = document.getElementById('costChart');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de costo');
        return;
    }
    
    // Destruir gráfico existente
    if (window.charts.cost) window.charts.cost.destroy();
    
    const data = {
        labels: instituciones.map(inst => inst["Institución"]),
        datasets: [{
            label: 'Costo Anual',
            data: instituciones.map(inst => {
                const costo = inst["Costo anual"];
                if (!costo || costo === 'ND') return null;
                return parseFloat(costo);
            }),
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2
        }]
    };
    
    window.charts.cost = new Chart(ctx, {
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
                        text: 'Soles'
                    }
                }
            }
        }
    });
}

function showAdditionalInfo(institution) {
    const container = document.getElementById('additionalInfo');
    if (!container) {
        console.error('No se encontró el contenedor de información adicional');
        return;
    }
    
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Tipo de Institución</p>
                <p class="font-semibold text-gray-900">${institution["Tipo de institución"]}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Ciudad</p>
                <p class="font-semibold text-gray-900">${institution["Ciudad"]}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Modalidad</p>
                <p class="font-semibold text-gray-900">${institution["Modalidad"] || 'No especificado'}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Acreditación</p>
                <p class="font-semibold text-gray-900">${institution["Acreditación"] || 'No especificado'}</p>
            </div>
        </div>
    `;
} 