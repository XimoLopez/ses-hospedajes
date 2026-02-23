import { NextRequest, NextResponse } from "next/server";
import { getImportJob, updateImportJob, createBatch, updateBatch } from "@/lib/store";
import { sendCommunication } from "@/lib/ses-client";
import { buildCommunicationXML } from "@/lib/xml-builder";
import { compressAndEncode } from "@/lib/ses-client";

export async function POST(request: NextRequest) {
    try {
        const { jobId, jobIds, guestIndices } = await request.json();

        const targets = jobIds || (jobId ? [jobId] : []);

        if (targets.length === 0) {
            return NextResponse.json({ error: "Se requieren jobIds o jobId" }, { status: 400 });
        }

        const jobs = [];
        for (const id of targets) {
            const job = await getImportJob(id);
            if (!job) {
                return NextResponse.json({ error: `Job ${id} no encontrado` }, { status: 404 });
            }
            jobs.push(job);
        }

        // Combine guests from all jobs
        let allGuestsToSend: any[] = [];

        for (const job of jobs) {
            const jobGuests = guestIndices
                ? job.guests.filter((_: unknown, i: number) => guestIndices.includes(i))
                : job.validationResult?.validGuests || [];
            allGuestsToSend = [...allGuestsToSend, ...jobGuests];
        }

        if (allGuestsToSend.length === 0) {
            return NextResponse.json(
                { error: "No hay registros válidos para enviar" },
                { status: 400 }
            );
        }

        // Use the first job as reference for contract metadata
        const firstJob = jobs[0];

        // Generate XML for preview
        const xml = buildCommunicationXML({
            establishmentCode: process.env.SES_ESTABLISHMENT_CODE || "",
            communicationType: firstJob.communicationType,
            guests: allGuestsToSend,
            referenciaContrato: firstJob.referenciaContrato,
            fechaContrato: firstJob.fechaContrato,
            fechaEntradaGlobal: firstJob.fechaEntradaGlobal,
            fechaSalidaGlobal: firstJob.fechaSalidaGlobal,
            numeroPersonasGlobal: firstJob.numeroPersonasGlobal,
            tipoPago: firstJob.tipoPago,
            fechaPago: firstJob.fechaPago
        });

        const base64Zip = await compressAndEncode(xml);

        // Create batch record (linked to the first job, but we'll note others in api_response)
        const batch = await createBatch({
            importJobId: firstJob.id,
            type: firstJob.communicationType,
            status: "pending",
            xmlHash: Buffer.from(xml).toString("base64").substring(0, 32),
            itemCount: allGuestsToSend.length,
            acceptedCount: 0,
            rejectedCount: 0,
        });

        // Attempt to send
        await updateBatch(batch.id, {
            status: "processing",
            apiResponse: { sources: targets }
        });

        for (const id of targets) {
            await updateImportJob(id, { status: "sending" });
        }

        const response = await sendCommunication(allGuestsToSend, firstJob);

        if (response.success) {
            await updateBatch(batch.id, {
                status: "accepted",
                sesBatchId: response.batchId,
                acceptedCount: allGuestsToSend.length,
                apiResponse: { raw: response.rawResponse, sources: targets },
            });

            for (const id of targets) {
                await updateImportJob(id, { status: "sent" });
            }

            return NextResponse.json({
                success: true,
                batch: {
                    ...batch,
                    status: "pending",
                    sesBatchId: response.batchId,
                },
                xml,
                guestCount: allGuestsToSend.length,
            });
        } else {
            await updateBatch(batch.id, {
                status: "error",
                apiResponse: { errors: response.errors, raw: response.rawResponse, sources: targets },
            });

            for (const id of targets) {
                await updateImportJob(id, { status: "error" });
            }

            return NextResponse.json({
                success: false,
                batch: {
                    ...batch,
                    status: "error",
                },
                errors: response.errors,
                xml,
            });
        }
    } catch (error) {
        console.error("Error sending communication:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Error al enviar" },
            { status: 500 }
        );
    }
}
