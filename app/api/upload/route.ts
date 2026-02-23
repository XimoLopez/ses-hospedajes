import { NextRequest, NextResponse } from "next/server";
import { parseCSV, mapCSVToGuests } from "@/lib/csv-parser";
import { validateGuests } from "@/lib/validation";
import { createImportJob } from "@/lib/store";
import type { CommunicationType } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const communicationType = (formData.get("communicationType") as CommunicationType) || "parte_viajeros";

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        // Read file content
        const fileContent = await file.text();

        // Parse CSV
        const { data, headers } = parseCSV(fileContent);

        if (data.length === 0) {
            return NextResponse.json(
                { error: "El archivo CSV está vacío o no se pudieron leer los datos" },
                { status: 400 }
            );
        }

        // Map CSV to internal model
        const guests = mapCSVToGuests(data);

        // Validate
        const validationResult = validateGuests(guests);

        // Create import job
        const job = await createImportJob({
            filename: file.name,
            rowCount: guests.length,
            validCount: validationResult.validCount,
            errorCount: validationResult.errorCount,
            status: validationResult.isValid ? "validated" : "error",
            communicationType,
            referenciaContrato: formData.get("referenciaContrato") as string || undefined,
            fechaContrato: formData.get("fechaContrato") as string || undefined,
            fechaEntradaGlobal: formData.get("fechaEntradaGlobal") as string || undefined,
            fechaSalidaGlobal: formData.get("fechaSalidaGlobal") as string || undefined,
            numeroPersonasGlobal: formData.get("numeroPersonasGlobal") ? parseInt(formData.get("numeroPersonasGlobal") as string) : undefined,
            tipoPago: formData.get("tipoPago") as string || undefined,
            fechaPago: formData.get("fechaPago") as string || undefined,
            guests,
            validationResult,
        });

        return NextResponse.json({
            success: true,
            job,
            headers,
            preview: data.slice(0, 5),
        });
    } catch (error) {
        console.error("Error processing upload:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Error al procesar el archivo" },
            { status: 500 }
        );
    }
}
