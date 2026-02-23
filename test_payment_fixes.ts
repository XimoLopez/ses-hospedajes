import { buildCommunicationXML } from "./lib/xml-builder";
import { CommunicationType } from "./lib/types";

const testGuests = [
    {
        csvRowNumber: 1,
        nombre: "JUAN",
        primerApellido: "PEREZ",
        tipoDocumento: "P",
        numeroDocumento: "PAS123",
        fechaNacimiento: "1980-01-01",
        nacionalidad: "ESP",
        direccion: "Calle A",
        ciudad: "Madrid",
        provincia: "Madrid",
        codigoPostal: "28001",
        pais: "ESP",
        fechaEntrada: "2024-06-01",
        rol: "VI" // Initially VI, should be promoted to TI
    },
    {
        csvRowNumber: 2,
        nombre: "MARIA",
        primerApellido: "GARCIA",
        tipoDocumento: "1",
        numeroDocumento: "12345678Z",
        fechaNacimiento: "1985-05-05",
        nacionalidad: "ESP",
        direccion: "Calle B",
        ciudad: "Barcelona",
        provincia: "Barcelona",
        codigoPostal: "08001",
        pais: "ESP",
        fechaEntrada: "2024-06-01",
        rol: "VI"
    }
];

const xml = buildCommunicationXML({
    establishmentCode: "TEST-001",
    communicationType: "reserva" as CommunicationType,
    guests: testGuests as any,
    tipoPago: "Otros medios de pago" // Should map to "5"
});

console.log("--- XML GENERADO ---");
console.log(xml);

if (xml.includes("<tipoPago>5</tipoPago>")) {
    console.log("✅ Mapeo de pago corregido: 5");
} else {
    console.error("❌ Mapeo de pago fallido");
}

if (xml.includes("<rol>TI</rol>") && xml.indexOf("<rol>TI</rol>") < xml.indexOf("MARIA")) {
    console.log("✅ Promoción automática a TI (Titular) detectada en el primer huésped");
} else {
    console.error("❌ Fallo en la promoción automática a Titular");
}
