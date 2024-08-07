let geojsonData;
let map;
let highlightedLayer;

document.addEventListener("DOMContentLoaded", function () {
    initializeMap();

    // Evento sobre la lista
    document.querySelectorAll("#city-list li").forEach((item) => {
        item.addEventListener("mouseover", function () {
            let cityId = this.getAttribute("data-id");
            highlightCity(cityId);
        });

        item.addEventListener("mouseout", function () {
            removeHighlight();
        });
    });
});

// Escuchar cambios en el tamaño de la pantalla y re-inicializar el mapa
window.addEventListener('resize', function() {
    // Elimina el mapa actual antes de crear uno nuevo
    if (map) {
        map.remove();
    }
    initializeMap();
});

/* -------------------------------------- FUNCIONES ---------------------------------------- */

// Función para inicializar el mapa
function initializeMap() {
    // Inicializa el mapa y establece la vista en Chile

    if (window.matchMedia("(max-width: 767px)").matches) {
        // Configuración para móviles
        map = L.map("map", { zoomSnap: 0.1 }).setView([-38.6751, -68.543], 3); // Zoom más cercano para móviles
    } else if (
        window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches
    ) {
        // Configuración para tabletas
        map = L.map("map", { zoomSnap: 0.1 }).setView([-38.6751, -68.543], 3.5); // Zoom intermedio para tabletas
    } else {
        // Configuración para escritorio
        map = L.map("map", { zoomSnap: 0.1 }).setView([-38.6751, -68.543], 4.3); // Zoom por defecto para escritorio
    }

    // Añadir la capa de mapa base (OpenStreetMap en este caso)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Cargar el archivo GeoJSON y añadirlo al mapa
    axios
        .get("cl.json")
        .then(function (response) {
            geojsonData = response.data;
            L.geoJSON(geojsonData, {
                style: style,
                pointToLayer: pointToLayer,
            }).addTo(map);
        })
        .catch(function (error) {
            console.error("Error al cargar el archivo GeoJSON:", error);
        });
}

// Función para resaltar la ciudad en el mapa
function highlightCity(cityId) {
    if (highlightedLayer) {
        map.removeLayer(highlightedLayer);
    }

    // Encuentra la ciudad correspondiente en el GeoJSON
    let feature = geojsonData.features.find((f) => f.properties.id === cityId);
    if (feature) {
        // Crear un LayerGroup para manejar el resaltado
        highlightedLayer = L.layerGroup();

        // Añadir la capa GeoJSON al LayerGroup
        L.geoJSON(feature, {
            pointToLayer: function (feature, latlng) {
                let iconHTML = `
                    <div class="highlighted-marker">
                        <div class="line"></div>
                        <div class="info-box">${feature.properties.name}</div>
                    </div>
                `;

                return L.marker(latlng, {
                    icon: L.divIcon({
                        className: "highlighted-marker",
                        html: iconHTML,
                        iconSize: [12, 12], // Ajusta el tamaño según sea necesario
                    }),
                });
            },
        }).addTo(highlightedLayer);

        // Añadir el LayerGroup al mapa
        highlightedLayer.addTo(map);

        // Hacer zoom al pin
        const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]; // Asegúrate de que el orden sea [lat, lng]
        map.setView(latlng, 8); // Ajusta el nivel de zoom según sea necesario

        // Activar la animación
        setTimeout(() => {
            document.querySelectorAll(".highlighted-marker .line").forEach((el) => {
                el.style.width = "55px"; // Cambia el ancho para activar la animación
            });
        }, 100); // Ajusta el retraso según sea necesario

        setTimeout(() => {
            document.querySelectorAll(".highlighted-marker").forEach((el) => {
                el.classList.add("active");
            });
        }, 100); // Ajusta el retraso según sea necesario
    } else {
        console.log("Ciudad no encontrada");
    }
}

// Función para eliminar el resaltado
function removeHighlight() {
    if (highlightedLayer) {
        map.removeLayer(highlightedLayer);
        highlightedLayer = null; // Limpia la variable para evitar problemas futuros
    }
}

// Función para transformar puntos GeoJSON en marcadores con icono personalizado
function pointToLayer(feature, latlng) {
    return L.marker(latlng, { icon: customIcon });
}

// Estilo para las características del GeoJSON
function style(feature) {
    return {
        color: "#F5F5F5", // Color del borde de las líneas y polígonos
        weight: 0.6, // Grosor del borde
        fillColor: "#051853", // Color del relleno de los polígonos
        fillOpacity: 0.8, // Opacidad del relleno para polígonos
    };
}

// Definir el ícono personalizado para los puntos
var customIcon = L.divIcon({
    className: "custom-icon", // Clase CSS para el ícono
    iconSize: [10, 10], // Ajusta el tamaño del ícono según sea necesario
    html: "<div></div>", // Contenido HTML del ícono
});
