import { create } from "xmlbuilder2";
import type { GuestData, CommunicationType } from "./types";
import { getIneCode, normalizeDocType, normalizeCountry } from "./catalogos-mapeo";

interface XMLBuildOptions {
    establishmentCode: string;
    communicationType: CommunicationType;
    guests: GuestData[];
    referenciaContrato?: string;
    fechaContrato?: string;
    fechaEntradaGlobal?: string;
    fechaSalidaGlobal?: string;
    numeroPersonasGlobal?: number;
    tipoPago?: string;
    fechaPago?: string;
}

export function buildCommunicationXML(options: XMLBuildOptions): string {
    const {
        establishmentCode,
        communicationType,
        guests,
        referenciaContrato,
        fechaContrato,
        fechaEntradaGlobal,
        fechaSalidaGlobal,
        numeroPersonasGlobal,
        tipoPago,
        fechaPago
    } = options;

    const doc = create({ version: "1.0", encoding: "UTF-8" });

    // Namespace depends on communication type
    const isReserva = communicationType === "reserva";
    const namespace = isReserva
        ? "http://www.neg.hospedajes.mir.es/altaReservaHospedaje"
        : "http://www.neg.hospedajes.mir.es/altaParteHospedaje";

    const root = doc.ele("peticion");
    root.att("xmlns", namespace);
    root.att("xmlns:hospe", "http://www.neg.hospedajes.mir.es/tiposGenerales");

    // solicitud structure differs
    const solicitud = root.ele("solicitud", { xmlns: "" });

    // In guest reports (PV), establishment code is global for the lot inside solicitud
    if (!isReserva) {
        solicitud.ele("codigoEstablecimiento").txt(establishmentCode);
    }

    // One or more communications
    const comunicacion = solicitud.ele("comunicacion");

    // In reservations (RH), establishment code is inside each communication block
    if (isReserva) {
        const establecimiento = comunicacion.ele("establecimiento");
        establecimiento.ele("codigo").txt(establishmentCode);
    }

    // Contract block
    const contrato = comunicacion.ele("contrato");
    contrato.ele("referencia").txt(referenciaContrato || `REF-${Date.now()}`);
    contrato.ele("fechaContrato").txt(fechaContrato || new Date().toISOString().split("T")[0]);

    const fallbackEntrada = guests.length > 0 ? guests[0].fechaEntrada : "";
    const fallbackSalida = guests.length > 0 && guests[0].fechaSalida ? guests[0].fechaSalida : undefined;

    // Dates must be xsd:dateTime (YYYY-MM-DDTHH:MM:SS)
    const formatDateTime = (dt?: string) => {
        if (!dt) return "";
        if (dt.length === 10) return `${dt}T12:00:00`; // Default time if only date
        if (dt.length === 16) return `${dt}:00`; // Add seconds if only YYYY-MM-DDTHH:mm
        return dt;
    };

    contrato.ele("fechaEntrada").txt(formatDateTime(fechaEntradaGlobal || fallbackEntrada));
    if (fechaSalidaGlobal || fallbackSalida) {
        contrato.ele("fechaSalida").txt(formatDateTime((fechaSalidaGlobal || fallbackSalida) as string));
    }

    contrato.ele("numPersonas").txt((numeroPersonasGlobal || guests.length).toString());

    // Payment block (mandatory)
    const pago = contrato.ele("pago");

    // SES API expects numeric codes (1=Efectivo, 2=Tarjeta, 3=Transferencia, 4=Plataforma, 5=Otros)
    // although XSD says string(5), the production system often rejects "EF", "OT", etc.
    let mappedTipoPago = "5"; // Default to "5" (Otros)
    const rawPago = (tipoPago || "").toLowerCase().trim();

    if (rawPago.includes("efectivo") || rawPago === "ef") mappedTipoPago = "1";
    else if (rawPago.includes("tarjeta") || rawPago === "ta") mappedTipoPago = "2";
    else if (rawPago.includes("transferencia") || rawPago === "tr") mappedTipoPago = "3";
    else if (rawPago.includes("plataforma") || rawPago === "pp") mappedTipoPago = "4";
    else if (rawPago.includes("otros") || rawPago === "ot") mappedTipoPago = "5";
    else if (/^\d$/.test(rawPago)) mappedTipoPago = rawPago;

    pago.ele("tipoPago").txt(mappedTipoPago);
    if (fechaPago) {
        pago.ele("fechaPago").txt(fechaPago);
    }

    // Build each traveler/guest
    // Ensure at least one Titular (TI) exists for the data to show up in the SES portal "Titular" tab
    const hasTitular = guests.some(g => g.rol === "TI");

    for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        const persona = comunicacion.ele("persona");

        // If no guest is marked as TI, we promote the first one to TI
        let finalRol = guest.rol || "VI";
        if (!hasTitular && i === 0) {
            finalRol = "TI";
        }

        persona.ele("rol").txt(finalRol);
        persona.ele("nombre").txt(guest.nombre);
        persona.ele("apellido1").txt(guest.primerApellido);
        if (guest.segundoApellido) {
            persona.ele("apellido2").txt(guest.segundoApellido);
        }

        // Use mapping catalogs for robust document type and country normalization
        const mappedDocType = normalizeDocType(guest.tipoDocumento || "1");
        const mappedCountry = normalizeCountry(guest.pais || "ESP");

        persona.ele("tipoDocumento").txt(mappedDocType);

        if (guest.numeroDocumento) {
            persona.ele("numeroDocumento").txt(guest.numeroDocumento);
        }

        // soporteDocumento is ONLY for guest reports (PV), not for reservations (RH)
        if (!isReserva && guest.soporteDocumento) {
            persona.ele("soporteDocumento").txt(guest.soporteDocumento);
        }

        if (guest.fechaNacimiento) {
            persona.ele("fechaNacimiento").txt(guest.fechaNacimiento);
        }
        if (guest.nacionalidad) {
            persona.ele("nacionalidad").txt(normalizeCountry(guest.nacionalidad));
        }
        if (guest.sexo) {
            persona.ele("sexo").txt(guest.sexo);
        }

        const direccion = persona.ele("direccion");
        direccion.ele("direccion").txt(guest.direccion);
        if (guest.direccion2) {
            direccion.ele("direccionComplementaria").txt(guest.direccion2);
        }

        // INE code for automatic province/municipality population on SES portal
        const finalIneCode = guest.codigoMunicipio || getIneCode(guest.ciudad, guest.provincia, guest.codigoPostal);
        if (finalIneCode && mappedCountry === "ESP") {
            direccion.ele("codigoMunicipio").txt(finalIneCode);
        }

        // Concatenate province to city name for better visibility in SES portal
        const cityAndProvince = guest.provincia
            ? `${guest.ciudad} (${guest.provincia})`
            : guest.ciudad;

        direccion.ele("nombreMunicipio").txt(cityAndProvince);
        direccion.ele("codigoPostal").txt(guest.codigoPostal);
        direccion.ele("pais").txt(mappedCountry);

        if (guest.telefono) {
            persona.ele("telefono").txt(guest.telefono);
        }
        if (guest.email) {
            persona.ele("correo").txt(guest.email);
        }

        // parentesco is ONLY for guest reports (PV)
        if (!isReserva && guest.parentesco) {
            persona.ele("parentesco").txt(guest.parentesco);
        }
    }

    return doc.end({ prettyPrint: true });
}

export function buildSOAPEnvelope(
    xmlContent: string,
    base64Zip: string,
    wsUser: string,
    wsPassword: string,
    establishmentCode: string,
    communicationType: CommunicationType = "parte_viajeros"
): string {
    const doc = create({ version: "1.0", encoding: "UTF-8" });

    const envelope = doc.ele("soapenv:Envelope");
    envelope.att("xmlns:soapenv", "http://schemas.xmlsoap.org/soap/envelope/");
    envelope.att("xmlns:com", "http://www.soap.servicios.hospedajes.mir.es/comunicacion");

    // Header with auth
    const header = envelope.ele("soapenv:Header");
    const security = header.ele("wsse:Security");
    security.att(
        "xmlns:wsse",
        "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
    );
    security.att(
        "xmlns:wsu",
        "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
    );

    const usernameToken = security.ele("wsse:UsernameToken");
    usernameToken.ele("wsse:Username").txt(wsUser);
    usernameToken.ele("wsse:Password", {
        Type: "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"
    }).txt(wsPassword);

    // Body
    const body = envelope.ele("soapenv:Body");
    const comunicacionRequest = body.ele("com:comunicacionRequest");

    // Peticion node (type peticionType)
    const peticion = comunicacionRequest.ele("peticion");

    // Cabecera Lote
    const cabecera = peticion.ele("cabecera");
    cabecera.ele("codigoArrendador").txt(establishmentCode);
    cabecera.ele("aplicacion").txt("SES-HOSPEDAJES-APP");
    cabecera.ele("tipoOperacion").txt("A"); // Alta

    const tipoCode = communicationType === "parte_viajeros" ? "PV" : "RH";
    cabecera.ele("tipoComunicacion").txt(tipoCode);

    // Solicitud (Base64 ZIP)
    peticion.ele("solicitud").txt(base64Zip);

    return doc.end({ prettyPrint: true });
}

export function buildConsultaLoteSOAP(
    loteId: string,
    wsUser: string,
    wsPassword: string,
    establishmentCode: string
): string {
    const doc = create({ version: "1.0", encoding: "UTF-8" });

    const envelope = doc.ele("soapenv:Envelope");
    envelope.att("xmlns:soapenv", "http://schemas.xmlsoap.org/soap/envelope/");
    envelope.att("xmlns:com", "http://www.soap.servicios.hospedajes.mir.es/comunicacion");

    const header = envelope.ele("soapenv:Header");
    const security = header.ele("wsse:Security");
    security.att(
        "xmlns:wsse",
        "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
    );
    security.att(
        "xmlns:wsu",
        "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
    );
    const usernameToken = security.ele("wsse:UsernameToken");
    usernameToken.ele("wsse:Username").txt(wsUser);
    usernameToken.ele("wsse:Password", {
        Type: "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"
    }).txt(wsPassword);

    const body = envelope.ele("soapenv:Body");
    const consultaLoteRequest = body.ele("com:consultaLoteRequest");

    // codigosLote node
    const codigosLote = consultaLoteRequest.ele("codigosLote");
    codigosLote.ele("lote").txt(loteId);

    return doc.end({ prettyPrint: true });
}
