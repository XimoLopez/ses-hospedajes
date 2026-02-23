import type { GuestData, ValidationError, ValidationResult } from "./types";
import { DOCUMENT_TYPES, COUNTRIES } from "./types";
import { normalizeDocType } from "./catalogos-mapeo";

function validateField(
    guest: GuestData,
    field: string,
    value: string | undefined,
    message: string,
    severity: "error" | "warning" = "error"
): ValidationError | null {
    if (!value || value.trim() === "") {
        return { row: guest.csvRowNumber, field, message, severity };
    }
    return null;
}

function validateDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const clean = dateStr.substring(0, 10);
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const [, y, m, d] = match;
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return (
        date.getFullYear() === parseInt(y) &&
        date.getMonth() === parseInt(m) - 1 &&
        date.getDate() === parseInt(d)
    );
}

function validateDocNumber(tipo: string, numero: string): boolean {
    if (!tipo || !numero) return false;
    const trimmed = numero.trim();

    switch (tipo.toUpperCase()) {
        case "D": // DNI
            return /^\d{8}[A-Z]$/i.test(trimmed);
        case "X": // NIE
            return /^[XYZ]\d{7}[A-Z]$/i.test(trimmed);
        case "P": // Pasaporte
            return trimmed.length >= 5 && trimmed.length <= 20;
        default:
            return trimmed.length >= 3;
    }
}

export function validateGuests(guests: GuestData[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validGuests: GuestData[] = [];

    for (const guest of guests) {
        const guestErrors: ValidationError[] = [];
        const guestWarnings: ValidationError[] = [];

        // --- Required fields ---
        const nameErr = validateField(guest, "nombre", guest.nombre, "El nombre es obligatorio");
        if (nameErr) guestErrors.push(nameErr);

        const apellidoErr = validateField(
            guest,
            "primerApellido",
            guest.primerApellido,
            "El primer apellido es obligatorio"
        );
        if (apellidoErr) guestErrors.push(apellidoErr);

        // Segundo apellido obligatorio si doc es DNI
        if (guest.tipoDocumento === "D" && !guest.segundoApellido?.trim()) {
            guestErrors.push({
                row: guest.csvRowNumber,
                field: "segundoApellido",
                message: "El segundo apellido es obligatorio para documentos tipo DNI",
                severity: "error",
            });
        }

        // Document type
        const docTypeErr = validateField(
            guest,
            "tipoDocumento",
            guest.tipoDocumento,
            "El tipo de documento es obligatorio"
        );
        if (docTypeErr) {
            guestErrors.push(docTypeErr);
        } else {
            const normalizedType = normalizeDocType(guest.tipoDocumento);
            if (!DOCUMENT_TYPES[normalizedType]) {
                guestWarnings.push({
                    row: guest.csvRowNumber,
                    field: "tipoDocumento",
                    message: `Tipo de documento "${guest.tipoDocumento}" no reconocido. Valores válidos: ${Object.keys(DOCUMENT_TYPES).join(", ")}`,
                    severity: "warning",
                });
            }
        }

        // Document number
        const docNumErr = validateField(
            guest,
            "numeroDocumento",
            guest.numeroDocumento,
            "El número de documento es obligatorio"
        );
        if (docNumErr) {
            guestErrors.push(docNumErr);
        } else if (!validateDocNumber(guest.tipoDocumento, guest.numeroDocumento)) {
            guestWarnings.push({
                row: guest.csvRowNumber,
                field: "numeroDocumento",
                message: `Formato del documento "${guest.numeroDocumento}" puede no ser válido para tipo "${guest.tipoDocumento}"`,
                severity: "warning",
            });
        }

        // Date of birth
        const dobErr = validateField(
            guest,
            "fechaNacimiento",
            guest.fechaNacimiento,
            "La fecha de nacimiento es obligatoria"
        );
        if (dobErr) {
            guestErrors.push(dobErr);
        } else if (!validateDate(guest.fechaNacimiento)) {
            guestErrors.push({
                row: guest.csvRowNumber,
                field: "fechaNacimiento",
                message: `Fecha de nacimiento inválida: "${guest.fechaNacimiento}". Formato esperado: YYYY-MM-DD`,
                severity: "error",
            });
        }

        // Nationality
        const natErr = validateField(
            guest,
            "nacionalidad",
            guest.nacionalidad,
            "La nacionalidad es obligatoria"
        );
        if (natErr) {
            guestErrors.push(natErr);
        } else if (!COUNTRIES[guest.nacionalidad] && !/^[A-Z]{3}$/.test(guest.nacionalidad)) {
            guestWarnings.push({
                row: guest.csvRowNumber,
                field: "nacionalidad",
                message: `Código de nacionalidad "${guest.nacionalidad}" puede no ser un código ISO válido`,
                severity: "warning",
            });
        }

        // Address
        const addrErr = validateField(
            guest,
            "direccion",
            guest.direccion,
            "La dirección es obligatoria"
        );
        if (addrErr) guestErrors.push(addrErr);

        // City
        const cityErr = validateField(
            guest,
            "ciudad",
            guest.ciudad,
            "La ciudad es obligatoria"
        );
        if (cityErr) guestErrors.push(cityErr);

        // Country
        const countryErr = validateField(
            guest,
            "pais",
            guest.pais,
            "El país es obligatorio"
        );
        if (countryErr) guestErrors.push(countryErr);

        // Fecha entrada
        const entryErr = validateField(
            guest,
            "fechaEntrada",
            guest.fechaEntrada,
            "La fecha de entrada es obligatoria"
        );
        if (entryErr) {
            guestErrors.push(entryErr);
        } else if (!validateDate(guest.fechaEntrada.substring(0, 10))) {
            guestErrors.push({
                row: guest.csvRowNumber,
                field: "fechaEntrada",
                message: `Fecha de entrada inválida: "${guest.fechaEntrada}"`,
                severity: "error",
            });
        }

        // Contact info (at least one required)
        if (!guest.telefono?.trim() && !guest.email?.trim()) {
            guestErrors.push({
                row: guest.csvRowNumber,
                field: "contacto",
                message: "Se requiere al menos un dato de contacto (teléfono o email)",
                severity: "error",
            });
        }

        // Email format
        if (guest.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
            guestWarnings.push({
                row: guest.csvRowNumber,
                field: "email",
                message: `Formato de email posiblemente inválido: "${guest.email}"`,
                severity: "warning",
            });
        }

        // Phone format
        if (guest.telefono?.trim() && !/^[+\d\s()-]{6,20}$/.test(guest.telefono.trim())) {
            guestWarnings.push({
                row: guest.csvRowNumber,
                field: "telefono",
                message: `Formato de teléfono posiblemente inválido: "${guest.telefono}"`,
                severity: "warning",
            });
        }

        errors.push(...guestErrors);
        warnings.push(...guestWarnings);

        if (guestErrors.length === 0) {
            validGuests.push(guest);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validGuests,
        totalRows: guests.length,
        validCount: validGuests.length,
        errorCount: guests.length - validGuests.length,
        warningCount: warnings.length,
    };
}
