import Papa from "papaparse";
import type { GuestData } from "./types";

// Country name → ISO 3166-1 Alpha-3 code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
    españa: "ESP", spain: "ESP", espagne: "ESP",
    francia: "FRA", france: "FRA",
    alemania: "DEU", germany: "DEU", deutschland: "DEU",
    "reino unido": "GBR", "united kingdom": "GBR",
    italia: "ITA", italy: "ITA",
    portugal: "PRT",
    "países bajos": "NLD", netherlands: "NLD", holanda: "NLD",
    bélgica: "BEL", belgium: "BEL",
    "estados unidos": "USA", "united states": "USA",
    argentina: "ARG",
    méxico: "MEX", mexico: "MEX",
    colombia: "COL",
    brasil: "BRA", brazil: "BRA",
    china: "CHN",
    japón: "JPN", japan: "JPN",
    marruecos: "MAR", morocco: "MAR",
    rumanía: "ROU", romania: "ROU",
    polonia: "POL", poland: "POL",
    suiza: "CHE", switzerland: "CHE",
    austria: "AUT",
    suecia: "SWE", sweden: "SWE",
    noruega: "NOR", norway: "NOR",
    dinamarca: "DNK", denmark: "DNK",
    finlandia: "FIN", finland: "FIN",
    irlanda: "IRL", ireland: "IRL",
    "república checa": "CZE", "czech republic": "CZE", chequia: "CZE",
    hungría: "HUN", hungary: "HUN",
    grecia: "GRC", greece: "GRC",
    croacia: "HRV", croatia: "HRV",
    bulgaria: "BGR",
    ucrania: "UKR", ukraine: "UKR",
    rusia: "RUS", russia: "RUS",
    turquía: "TUR", turkey: "TUR",
    canadá: "CAN", canada: "CAN",
    australia: "AUS",
    chile: "CHL",
    perú: "PER", peru: "PER",
    venezuela: "VEN",
    ecuador: "ECU",
    bolivia: "BOL",
    uruguay: "URY",
    paraguay: "PRY",
    cuba: "CUB",
    "república dominicana": "DOM",
    guatemala: "GTM",
    honduras: "HND",
    "el salvador": "SLV",
    nicaragua: "NIC",
    "costa rica": "CRI",
    panamá: "PAN",
    andorra: "AND",
};

// Document type text → code mapping
const DOC_TYPE_TO_CODE: Record<string, string> = {
    dni: "D",
    "d.n.i.": "D",
    "d.n.i": "D",
    nif: "D",
    pasaporte: "P",
    passport: "P",
    "permiso de conducir": "C",
    "driving license": "C",
    "carta de identidad": "I",
    "identity card": "I",
    "permiso de residencia": "N",
    nie: "X",
    "n.i.e.": "X",
    "n.i.e": "X",
};

function normalizeCountry(raw: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();
    // Already a 3-letter code?
    if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
    // Already a 2-letter code? Convert common ones
    if (/^[A-Z]{2}$/.test(trimmed)) {
        const map2to3: Record<string, string> = {
            ES: "ESP", FR: "FRA", DE: "DEU", GB: "GBR", IT: "ITA",
            PT: "PRT", NL: "NLD", BE: "BEL", US: "USA", AR: "ARG",
            MX: "MEX", CO: "COL", BR: "BRA", CN: "CHN", JP: "JPN",
        };
        return map2to3[trimmed] || trimmed;
    }
    return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()] || trimmed;
}

function normalizeDocType(raw: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();
    // Already a single letter code?
    if (/^[A-Z]$/.test(trimmed.toUpperCase())) return trimmed.toUpperCase();
    return DOC_TYPE_TO_CODE[trimmed.toLowerCase()] || trimmed;
}

function parseDate(raw: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();

    // Already YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // DD/MM/YYYY or DD-MM-YYYY
    const match1 = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match1) {
        const [, d, m, y] = match1;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // DD/MM/YYYY HH:mm:ss
    const match2 = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s+(\d{2}):(\d{2})/);
    if (match2) {
        const [, d, m, y, h, min] = match2;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${h}:${min}`;
    }

    // YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 16);

    return trimmed;
}

function splitApellidos(apellidos: string): { primero: string; segundo: string } {
    if (!apellidos) return { primero: "", segundo: "" };
    const parts = apellidos.trim().split(/\s+/);
    if (parts.length === 1) return { primero: parts[0], segundo: "" };
    if (parts.length === 2) return { primero: parts[0], segundo: parts[1] };

    const particulas = new Set(["de", "del", "la", "las", "los", "y", "san", "santa"]);
    const groups: string[] = [];
    let currentGroup = "";

    for (const part of parts) {
        if (particulas.has(part.toLowerCase())) {
            currentGroup += (currentGroup ? " " : "") + part;
        } else {
            currentGroup += (currentGroup ? " " : "") + part;
            groups.push(currentGroup);
            currentGroup = "";
        }
    }

    if (currentGroup && groups.length > 0) {
        groups[groups.length - 1] += " " + currentGroup;
    } else if (currentGroup) {
        groups.push(currentGroup);
    }

    if (groups.length === 1) {
        return { primero: groups[0], segundo: "" };
    }

    return {
        primero: groups[0],
        segundo: groups.slice(1).join(" ")
    };
}

export function parseCSV(
    fileContent: string
): { data: Record<string, string>[]; headers: string[] } {
    const result = Papa.parse<Record<string, string>>(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        dynamicTyping: false,
    });

    return {
        data: result.data,
        headers: result.meta.fields || [],
    };
}

export function mapCSVToGuests(
    rows: Record<string, string>[]
): GuestData[] {
    return rows.map((row, index) => {
        const apellidos = splitApellidos(row["Nombre Completo (Apellidos)"] || "");
        const nacionalidadPais = row["Nacionalidad (País)"] || row["Dirección (País)"] || "";
        const direccionPais = row["Dirección (País)"] || "";

        return {
            csvRowNumber: index + 2, // +2 because row 1 is headers, and index is 0-based
            nombre: (row["Nombre Completo (Nombre)"] || "").trim(),
            primerApellido: apellidos.primero,
            segundoApellido: apellidos.segundo,
            fechaNacimiento: parseDate(row["Fecha de Nacimiento"] || ""),
            nacionalidad: normalizeCountry(nacionalidadPais),
            tipoDocumento: normalizeDocType(row["Tipo de Documento"] || ""),
            numeroDocumento: (row["Número del documento"] || "").trim(),
            soporteDocumento: (row["Número de soporte del documento"] || "").trim() || undefined,
            direccion: (row["Dirección (Dirección)"] || "").trim(),
            direccion2: (row["Dirección (Dirección 2)"] || "").trim() || undefined,
            ciudad: (row["Dirección (Ciudad)"] || "").trim(),
            provincia: (row["Dirección (Estado/Provincia)"] || "").trim() || undefined,
            codigoPostal: (row["Codigo Postal"] || row["Dirección (ZIP / Código Postal)"] || "").trim(),
            pais: normalizeCountry(direccionPais),
            telefono: (row["Teléfono"] || row["Teléfono o e-mail"] || "").trim() || undefined,
            email: (row["e-mail"] || "").trim() || undefined,
            fechaEntrada: parseDate(row["Fecha entrada"] || ""),
            rol: "VI", // Default: Viajero
        };
    });
}
