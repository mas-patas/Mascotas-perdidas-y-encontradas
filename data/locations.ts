
export interface LocationHierarchy {
    [department: string]: {
        [province: string]: string[]; // List of districts
    };
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export const peruLocations: LocationHierarchy = {
    "Amazonas": {
        "Chachapoyas": ["Chachapoyas", "Asunción", "Balsas", "Cheto", "Chiliquin"],
        "Bagua": ["Bagua", "Aramango", "Copallin", "El Parco", "Imaza", "La Peca"],
        "Bongará": ["Jumbilla", "Florida", "Valera"],
        "Utcubamba": ["Bagua Grande", "Cajaruro", "Cumba", "El Milagro", "Jamalca", "Lonya Grande", "Yamon"]
    },
    "Áncash": {
        "Huaraz": ["Huaraz", "Independencia", "Jangas"],
        "Santa": ["Chimbote", "Nuevo Chimbote", "Coishco", "Santa"]
    },
    "Apurímac": {
        "Abancay": ["Abancay", "Tamburco"],
        "Andahuaylas": ["Andahuaylas", "San Jerónimo", "Talavera"]
    },
    "Arequipa": {
        "Arequipa": ["Arequipa", "Alto Selva Alegre", "Cayma", "Cerro Colorado", "Characato", "Chiguata", "Jacobo Hunter", "José Luis Bustamante y Rivero", "La Joya", "Mariano Melgar", "Miraflores", "Mollebaya", "Paucarpata", "Pocsi", "Polobaya", "Quequeña", "Sabandia", "Sachaca", "San Juan de Siguas", "San Juan de Tarucani", "Santa Isabel de Siguas", "Santa Rita de Siguas", "Socabaya", "Tiabaya", "Uchumayo", "Vitor", "Yanahuara", "Yarabamba", "Yura"],
        "Camaná": ["Camaná", "Samuel Pastor"],
        "Caylloma": ["Chivay", "Majes"],
        "Islay": ["Mollendo", "Mejía"]
    },
    "Ayacucho": {
        "Huamanga": ["Ayacucho", "Carmen Alto", "San Juan Bautista", "Jesús Nazareno"]
    },
    "Cajamarca": {
        "Cajamarca": ["Cajamarca", "Baños del Inca"],
        "Jaén": ["Jaén"]
    },
    "Callao": {
        "Callao": ["Bellavista", "Callao", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Mi Perú", "Ventanilla"]
    },
    "Cusco": {
        "Cusco": ["Cusco", "San Jerónimo", "San Sebastián", "Santiago", "Wanchaq", "Poroy", "Saylla"],
        "Urubamba": ["Urubamba", "Machupicchu", "Ollantaytambo", "Maras", "Yucay"],
        "Anta": ["Anta", "Ancahuasi"]
    },
    "Huancavelica": {
        "Huancavelica": ["Huancavelica", "Ascensión"]
    },
    "Huánuco": {
        "Huánuco": ["Huánuco", "Amarilis", "Pillco Marca"]
    },
    "Ica": {
        "Ica": ["Ica", "La Tinguiña", "Parcona", "Subtanjalla"],
        "Chincha": ["Chincha Alta", "Sunampe", "Pueblo Nuevo"],
        "Pisco": ["Pisco", "San Andrés", "Paracas"]
    },
    "Junín": {
        "Huancayo": ["Huancayo", "El Tambo", "Chilca"],
        "Tarma": ["Tarma"]
    },
    "La Libertad": {
        "Trujillo": ["Trujillo", "El Porvenir", "Florencia de Mora", "Huanchaco", "La Esperanza", "Laredo", "Moche", "Poroto", "Salaverry", "Simbal", "Victor Larco Herrera"],
        "Pacasmayo": ["San Pedro de Lloc", "Pacasmayo"]
    },
    "Lambayeque": {
        "Chiclayo": ["Chiclayo", "Chongoyape", "Eten", "José Leonardo Ortiz", "La Victoria", "Lagunas", "Monsefú", "Pimentel", "Reque", "Santa Rosa", "Saña"],
        "Lambayeque": ["Lambayeque", "Mórrope", "Olmos", "Túcume"]
    },
    "Lima": {
        "Lima": ["Lima", "Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos", "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lince", "Los Olivos", "Lurigancho", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac", "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac", "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador", "Villa María del Triunfo"],
        "Barranca": ["Barranca", "Paramonga", "Pativilca", "Supe", "Supe Puerto"],
        "Cañete": ["San Vicente de Cañete", "Asia", "Calango", "Cerro Azul", "Chilca", "Coayllo", "Imperial", "Lunahuaná", "Mala", "Nuevo Imperial", "Pacarán", "Quilmaná", "San Antonio", "San Luis", "Santa Cruz de Flores", "Zúñiga"],
        "Huaral": ["Huaral", "Chancay"],
        "Huaura": ["Huacho", "Hualmay", "Santa María"]
    },
    "Loreto": {
        "Maynas": ["Iquitos", "Belén", "Punchana", "San Juan Bautista"],
        "Alto Amazonas": ["Yurimaguas"]
    },
    "Madre de Dios": {
        "Tambopata": ["Puerto Maldonado", "Las Piedras"]
    },
    "Moquegua": {
        "Mariscal Nieto": ["Moquegua"],
        "Ilo": ["Ilo", "El Algarrobal", "Pacocha"]
    },
    "Pasco": {
        "Pasco": ["Chaupimarca", "Yanacancha"]
    },
    "Piura": {
        "Piura": ["Piura", "Castilla", "Catacaos", "Cura Mori", "El Tallán", "La Arena", "La Unión", "Las Lomas", "Tambo Grande", "Veintiseis de Octubre"],
        "Sullana": ["Sullana", "Bellavista", "Marcavelica"],
        "Talara": ["Pariñas", "Máncora", "Los Organos"],
        "Paita": ["Paita", "Colán"]
    },
    "Puno": {
        "Puno": ["Puno"],
        "San Román": ["Juliaca"]
    },
    "San Martín": {
        "Moyobamba": ["Moyobamba"],
        "San Martín": ["Tarapoto", "Morales", "La Banda de Shilcayo"]
    },
    "Tacna": {
        "Tacna": ["Tacna", "Alto de la Alianza", "Ciudad Nueva", "Coronel Gregorio Albarracín Lanchipa", "Pocollay"]
    },
    "Tumbes": {
        "Tumbes": ["Tumbes", "Corrales", "La Cruz"],
        "Zarumilla": ["Zarumilla", "Aguas Verdes"]
    },
    "Ucayali": {
        "Coronel Portillo": ["Callería", "Yarinacocha", "Manantay"]
    }
};

export const departments = Object.keys(peruLocations).sort();

export const getProvinces = (department: string): string[] => {
    return peruLocations[department] ? Object.keys(peruLocations[department]).sort() : [];
};

export const getDistricts = (department: string, province: string): string[] => {
    return (peruLocations[department] && peruLocations[department][province]) 
        ? peruLocations[department][province].sort() 
        : [];
};

export const locationCoordinates: { [key: string]: Coordinates } = {
    "Amazonas": { lat: -6.23169, lng: -77.86903 },
    "Áncash": { lat: -9.52779, lng: -77.52778 },
    "Apurímac": { lat: -13.63389, lng: -72.88139 },
    "Arequipa": { lat: -16.40904, lng: -71.53745 },
    "Ayacucho": { lat: -13.15878, lng: -74.22321 },
    "Cajamarca": { lat: -7.16378, lng: -78.50027 },
    "Callao": { lat: -12.05659, lng: -77.11814 },
    "Cusco": { lat: -13.53195, lng: -71.96746 },
    "Huancavelica": { lat: -12.78614, lng: -74.97601 },
    "Huánuco": { lat: -9.93062, lng: -76.24223 },
    "Ica": { lat: -14.06777, lng: -75.72861 },
    "Junín": { lat: -11.15895, lng: -75.99304 },
    "La Libertad": { lat: -8.11599, lng: -79.02998 },
    "Lambayeque": { lat: -6.77137, lng: -79.84088 },
    "Lima": { lat: -12.046374, lng: -77.042793 },
    "Loreto": { lat: -3.74912, lng: -73.25383 },
    "Madre de Dios": { lat: -12.59331, lng: -69.18913 },
    "Moquegua": { lat: -17.19832, lng: -70.93567 },
    "Pasco": { lat: -10.66748, lng: -76.25668 },
    "Piura": { lat: -5.19449, lng: -80.63282 },
    "Puno": { lat: -15.8422, lng: -70.0199 },
    "San Martín": { lat: -6.48198, lng: -76.37154 },
    "Tacna": { lat: -18.01465, lng: -70.25215 },
    "Tumbes": { lat: -3.56693, lng: -80.45153 },
    "Ucayali": { lat: -8.37915, lng: -74.55387 },
    // Cities/Provinces mapping
    "Chachapoyas": { lat: -6.23169, lng: -77.86903 },
    "Bagua": { lat: -5.6398, lng: -78.5311 },
    "Huaraz": { lat: -9.52779, lng: -77.52778 },
    "Santa": { lat: -9.0761, lng: -78.5914 }, // Chimbote area
    "Abancay": { lat: -13.63389, lng: -72.88139 },
    "Huamanga": { lat: -13.15878, lng: -74.22321 },
    "Jaén": { lat: -5.7089, lng: -78.8078 },
    "Urubamba": { lat: -13.306, lng: -72.115 },
    "Anta": { lat: -13.460, lng: -72.148 },
    "Chincha": { lat: -13.4211, lng: -76.1335 },
    "Pisco": { lat: -13.7087, lng: -76.2033 },
    "Huancayo": { lat: -12.06513, lng: -75.20486 },
    "Trujillo": { lat: -8.11599, lng: -79.02998 },
    "Pacasmayo": { lat: -7.4006, lng: -79.5714 },
    "Chiclayo": { lat: -6.77137, lng: -79.84088 },
    "Barranca": { lat: -10.7528, lng: -77.7606 },
    "Cañete": { lat: -13.0764, lng: -76.3864 },
    "Huaral": { lat: -11.4945, lng: -77.2089 },
    "Huaura": { lat: -11.1075, lng: -77.6061 },
    "Maynas": { lat: -3.74912, lng: -73.25383 },
    "Tambopata": { lat: -12.59331, lng: -69.18913 },
    "Mariscal Nieto": { lat: -17.19832, lng: -70.93567 },
    "Ilo": { lat: -17.6394, lng: -71.3375 },
    "Sullana": { lat: -4.9039, lng: -80.6853 },
    "Talara": { lat: -4.5772, lng: -81.2719 },
    "San Román": { lat: -15.5, lng: -70.1333 },
    "Moyobamba": { lat: -6.0329, lng: -76.9723 },
    "Coronel Portillo": { lat: -8.37915, lng: -74.55387 }
};
