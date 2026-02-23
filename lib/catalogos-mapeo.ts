/**
 * Catálogos de mapeo para la integración con SES.HOSPEDAJES
 * Ayudan a normalizar los datos recibidos de formularios externos (ej: Gravity Forms)
 * a los códigos requeridos por el Ministerio del Interior.
 */

// Prefijos INE por provincia (Primeros 2 dígitos del código de 5)
export const PROVINCIA_INE_PREFIX: Record<string, string> = {
    'álava': '01', 'alava': '01',
    'albacete': '02',
    'alicante': '03', 'alacant': '03',
    'almería': '04', 'almeria': '04',
    'asturias': '33',
    'ávila': '05', 'avila': '05',
    'badajoz': '06',
    'baleares': '07', 'illes balears': '07', 'palma': '07',
    'barcelona': '08',
    'burgos': '09',
    'cáceres': '10', 'caceres': '10',
    'cádiz': '11', 'cadiz': '11',
    'cantabria': '39',
    'castellón': '12', 'castello': '12',
    'ciudad real': '13',
    'córdoba': '14', 'cordoba': '14',
    'la coruña': '15', 'a coruña': '15', 'coruña': '15',
    'cuenca': '16',
    'gerona': '17', 'girona': '17',
    'granada': '18',
    'guadalajara': '19',
    'guipúzcoa': '20', 'gipuzkoa': '20',
    'huelva': '21',
    'huesca': '22',
    'jaén': '23', 'jaen': '23',
    'león': '24', 'leon': '24',
    'lérida': '25', 'lleida': '25',
    'lugo': '27',
    'madrid': '28',
    'málaga': '29', 'malaga': '29',
    'murcia': '30',
    'navarra': '31',
    'orense': '32', 'ourense': '32',
    'palencia': '34',
    'las palmas': '35',
    'pontevedra': '36',
    'la rioja': '26', 'rioja': '26',
    'salamanca': '37',
    'segovia': '40',
    'sevilla': '41',
    'soria': '42',
    'tarragona': '43',
    'santa cruz de tenerife': '38', 'tenerife': '38',
    'teruel': '44',
    'toledo': '45',
    'valencia': '46',
    'valladolid': '47',
    'vizcaya': '48', 'bizkaia': '48',
    'zamora': '49',
    'zaragoza': '50',
    'ceuta': '51',
    'melilla': '52'
};

// Mapeo de países comunes a ISO 3166-1 Alfa-3 (3 letras)
export const COUNTRY_MAPPING: Record<string, string> = {
    'españa': 'ESP', 'spain': 'ESP',
    'francia': 'FRA', 'france': 'FRA',
    'alemania': 'DEU', 'germany': 'DEU', 'deutschland': 'DEU',
    'reino unido': 'GBR', 'uk': 'GBR', 'united kingdom': 'GBR',
    'italia': 'ITA', 'italy': 'ITA',
    'portugal': 'PRT',
    'estados unidos': 'USA', 'usa': 'USA', 'united states': 'USA',
    'países bajos': 'NLD', 'holanda': 'NLD', 'netherlands': 'NLD',
    'bélgica': 'BEL', 'belgium': 'BEL',
    'suiza': 'CHE', 'switzerland': 'CHE',
    'austria': 'AUT',
    'irlanda': 'IRL', 'ireland': 'IRL',
    'suecia': 'SWE', 'sweden': 'SWE',
    'noruega': 'NOR', 'norway': 'NOR',
    'dinamarca': 'DNK', 'denmark': 'DNK',
    'finlandia': 'FIN', 'finland': 'FIN',
    'polonia': 'POL', 'poland': 'POL',
    'rumanía': 'ROU', 'romania': 'ROU',
    'argentina': 'ARG',
    'méxico': 'MEX', 'mexico': 'MEX',
    'colombia': 'COL',
    'brasil': 'BRA', 'brazil': 'BRA',
    'canadá': 'CAN', 'canada': 'CAN',
    'australia': 'AUS'
};

// Mapeo extendido para tipos de documento (Gravity Forms labels a códigos RD 933/2021)
export const DOC_TYPE_MAPPING_EXTENDED: Record<string, string> = {
    // Labels comunes
    'dni': '1', 'nif': '1', 'documento nacional de identidad': '1',
    'pasaporte': '2', 'passport': '2',
    'permiso de conducir': '3', 'conducir': '3', 'driving license': '3',
    'nie': '4', 'tie': '4', 'permiso de residencia': '4', 'residency permit': '4',
    'carta de identidad': '5', 'id card': '5', 'identidad': '5',
    // Códigos cortos/legacy
    'd': '1',
    'p': '2',
    'c': '3',
    'i': '5',
    'n': '4',
    'x': '4'
};

/**
 * Obtiene el código INE de municipio (5 dígitos)
 * @param ciudad Nombre de la ciudad
 * @param provincia Nombre de la provincia
 * @param cp Código postal
 * @returns Código de 5 dígitos o undefined
 */
export function getIneCode(ciudad?: string, provincia?: string, cp?: string): string | undefined {
    let provincePrefix = '';

    // 1. Intentar por código postal (España)
    if (cp && cp.length === 5) {
        provincePrefix = cp.substring(0, 2);
    }
    // 2. Intentar por nombre de provincia
    else if (provincia) {
        const p = provincia.toLowerCase().trim();
        provincePrefix = PROVINCIA_INE_PREFIX[p] || '';
    }

    if (provincePrefix) {
        // Por ahora devolvemos Prefijo + 000 (Código de Capital o genérico de provincia)
        // ya que el sistema SES lo acepta para poblar automáticamente provincia/ciudad
        return provincePrefix + '000';
    }

    return undefined;
}

/**
 * Normaliza el tipo de documento a código numérico
 */
export function normalizeDocType(input: string): string {
    const val = input.toLowerCase().trim();
    if (/^\d$/.test(val)) return val; // Ya es un número
    return DOC_TYPE_MAPPING_EXTENDED[val] || '1'; // Default DNI
}

/**
 * Normaliza el código de país a ISO Alfa-3
 */
export function normalizeCountry(input: string): string {
    const val = input.toLowerCase().trim();
    if (val.length === 3) return val.toUpperCase();
    return COUNTRY_MAPPING[val] || 'ESP';
}
