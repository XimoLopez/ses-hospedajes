// Types for the SES.Hospedajes integration module

export type SESEnvironment = "PRE" | "PRO";

export type CommunicationType = "reserva" | "parte_viajeros";

export type BatchStatus =
    | "pending"
    | "processing"
    | "accepted"
    | "rejected"
    | "error";

export type ItemStatus =
    | "valid"
    | "warning"
    | "error"
    | "sent"
    | "accepted"
    | "rejected";

export type ImportJobStatus =
    | "uploaded"
    | "validating"
    | "validated"
    | "sending"
    | "sent"
    | "error"
    | "partial_error";

// ---- CSV Mapping ----

export interface CSVColumnMapping {
    csvColumn: string;
    internalField: string;
}

// CSV columns from the user's file
export const CSV_COLUMNS = [
    "Nombre Completo (Prefijo)",
    "Nombre Completo (Nombre)",
    "Nombre Completo (Segundo nombre)",
    "Nombre Completo (Apellidos)",
    "Nombre Completo (Sufijo)",
    "Dirección (Dirección)",
    "Dirección (Dirección 2)",
    "Dirección (Ciudad)",
    "Dirección (Estado/Provincia)",
    "Dirección (ZIP / Código Postal)",
    "Dirección (País)",
    "Codigo Postal",
    "Tipo de Documento",
    "Número del documento",
    "Número de soporte del documento",
    "Nacionalidad (Dirección)",
    "Nacionalidad (Dirección 2)",
    "Nacionalidad (Ciudad)",
    "Nacionalidad (Estado/Provincia)",
    "Nacionalidad (ZIP / Código Postal)",
    "Nacionalidad (País)",
    "Fecha de Nacimiento",
    "Teléfono o e-mail",
    "Teléfono",
    "e-mail",
    "Consentimiento (Consentimiento)",
    "Consentimiento (Texto)",
    "Consentimiento (Descripción)",
    "Creada por (ID de usuario)",
    "ID Entrada",
    "Fecha entrada",
    "Fecha de actualización",
    "URL de origen",
    "ID de transacción",
    "Cantidad del pago",
    "Fecha de pago",
    "Estado del pago",
    "Id de entrada",
    "Agente de usuario",
    "IP del usuario",
] as const;

// ---- Internal Guest Model ----

export interface GuestData {
    // Identifiers
    csvRowNumber: number;
    referencia?: string;

    // Personal data
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
    sexo?: string;
    fechaNacimiento: string; // YYYY-MM-DD
    nacionalidad: string; // ISO 3166-1 Alfa-3

    // Document
    tipoDocumento: string;
    numeroDocumento: string;
    soporteDocumento?: string;

    // Address
    direccion: string;
    direccion2?: string;
    ciudad: string;
    provincia?: string;
    codigoMunicipio?: string; // 5-digit INE code
    codigoPostal: string;
    pais: string;

    // Contact
    telefono?: string;
    email?: string;

    // Stay
    fechaEntrada: string;  // YYYY-MM-DD or YYYY-MM-DDTHH:mm
    fechaSalida?: string;

    // Relationship (for minors)
    parentesco?: string;
    rol: string; // "VI" = viajero, "TI" = titular
}

// ---- Validation ----

export interface ValidationError {
    row: number;
    field: string;
    message: string;
    severity: "error" | "warning";
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    validGuests: GuestData[];
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
}

// ---- Import Job ----

export interface ImportJob {
    id: string;
    filename: string;
    rowCount: number;
    validCount: number;
    errorCount: number;
    status: ImportJobStatus;
    communicationType: CommunicationType;
    createdAt: string;

    // --- Datos Globales del Contrato (Aportados en Modal) ---
    referenciaContrato?: string;
    fechaContrato?: string; // Formato YYYY-MM-DD
    fechaEntradaGlobal?: string; // Formato YYYY-MM-DDTHH:mm
    fechaSalidaGlobal?: string; // Formato YYYY-MM-DDTHH:mm
    numeroPersonasGlobal?: number;
    tipoPago?: string; // Ej: "Otros medios de pago"
    fechaPago?: string;

    guests: GuestData[];
    rawData?: any;
    validationResult?: ValidationResult;
}

// ---- Communication Batch ----

export interface CommunicationBatch {
    id: string;
    importJobId: string;
    sesBatchId?: string;
    type: CommunicationType;
    status: BatchStatus;
    xmlHash?: string;
    sentAt?: string;
    apiResponse?: any;
    itemCount: number;
    acceptedCount: number;
    rejectedCount: number;
}

// ---- SES SOAP Types ----

export interface SESConfig {
    environment: SESEnvironment;
    wsUser: string;
    wsPassword: string;
    establishmentCode: string;
    entityCode: string;
    endpoint: string;
}

export interface SESResponse {
    success: boolean;
    batchId?: string;
    status?: string;
    errors?: Array<{
        code: string;
        message: string;
        field?: string;
    }>;
    rawResponse?: string;
}

// ---- Document Types Catalog ----

export const DOCUMENT_TYPES: Record<string, string> = {
    "1": "DNI",
    "2": "Pasaporte",
    "3": "Permiso de conducir",
    "5": "Carta de identidad",
    "4": "Permiso de residencia / TIE / NIE",
};

// Legacy to Numeric mapping for RD 933/2021
export const DOCUMENT_TYPE_MAPPING: Record<string, string> = {
    D: "1",
    P: "2",
    C: "3",
    I: "5",
    N: "4",
    X: "4",
};

// ---- Country codes (ISO 3166-1 Alfa-3) commonly used ----

export const COUNTRIES: Record<string, string> = {
    ESP: "España",
    FRA: "Francia",
    DEU: "Alemania",
    GBR: "Reino Unido",
    ITA: "Italia",
    PRT: "Portugal",
    NLD: "Países Bajos",
    BEL: "Bélgica",
    USA: "Estados Unidos",
    ARG: "Argentina",
    MEX: "México",
    COL: "Colombia",
    BRA: "Brasil",
    CHN: "China",
    JPN: "Japón",
    MAR: "Marruecos",
    ROU: "Rumanía",
    POL: "Polonia",
    CHE: "Suiza",
    AUT: "Austria",
    SWE: "Suecia",
    NOR: "Noruega",
    DNK: "Dinamarca",
    FIN: "Finlandia",
    IRL: "Irlanda",
    CZE: "República Checa",
    HUN: "Hungría",
    GRC: "Grecia",
    HRV: "Croacia",
    BGR: "Bulgaria",
    UKR: "Ucrania",
    RUS: "Rusia",
    TUR: "Turquía",
    CAN: "Canadá",
    AUS: "Australia",
};
