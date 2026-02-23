import { NextRequest, NextResponse } from "next/server";
import { getImportJob, updateImportJob, createBatch, updateBatch } from "@/lib/store";
import { sendCommunication, checkBatchStatus, compressAndEncode } from "@/lib/ses-client";
import { buildCommunicationXML } from "@/lib/xml-builder";

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

        // Generate XML
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

        // FIX #1: Store FULL XML (not truncated to 32 bytes) for proper auditing
        const xmlHash = Buffer.from(xml).toString("base64");

        // Create batch record (linked to the first job, others noted in api_response)
        const batch = await createBatch({
            importJobId: firstJob.id,
            type: firstJob.communicationType,
            status: "pending",
            xmlHash,
            itemCount: allGuestsToSend.length,
            acceptedCount: 0,
            rejectedCount: 0,
        });

        // Mark as processing
        await updateBatch(batch.id, {
            status: "processing",
            apiResponse: { sources: targets }
        });

        for (const id of targets) {
            await updateImportJob(id, { status: "sending" });
        }

        const response = await sendCommunication(allGuestsToSend, firstJob);

        if (response.success) {
            // FIX #2: After the Ministry accepts the batch globally, query per-guest status
            // A global "Ok" does NOT mean every guest was accepted individually
            let acceptedCount = allGuestsToSend.length;
            let rejectedCount = 0;
            let guestErrors: Array<{ code: string; message: string }> = [];

            if (response.batchId) {
                try {
                    // Brief delay so the Ministry can log the batch before we query
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const batchStatus = await checkBatchStatus(response.batchId);

                    if (batchStatus.errors && batchStatus.errors.length > 0) {
                        guestErrors = batchStatus.errors;
                        rejectedCount = batchStatus.errors.length;
                        acceptedCount = Math.max(0, allGuestsToSend.length - rejectedCount);
                        console.warn(
                            `⚠️ Lote ${response.batchId}: ${rejectedCount} viajero(s) rechazados:`,
                            guestErrors
                        );
                    } else {
                        console.log(
                            `✅ Lote ${response.batchId}: ${acceptedCount} viajero(s) aceptados correctamente`
                        );
                    }
                } catch (statusErr) {
                    // Non-fatal: we still consider the send successful, log the failure
                    console.warn("No se pudo consultar el estado detallado del lote:", statusErr);
                }
            }

            const finalStatus = rejectedCount > 0 ? "error" : "accepted";

            await updateBatch(batch.id, {
                status: finalStatus,
                sesBatchId: response.batchId,
                acceptedCount,
                rejectedCount,
                apiResponse: {
                    raw: response.rawResponse,
                    sources: targets,
                    // FIX #3: Persist per-guest error details for auditing
                    guestErrors: guestErrors.length > 0 ? guestErrors : undefined,
                },
            });

            for (const id of targets) {
                await updateImportJob(id, { status: "sent" });
            }

            return NextResponse.json({
                success: true,
                batch: {
                    ...batch,
                    status: finalStatus,
                    sesBatchId: response.batchId,
                    acceptedCount,
                    rejectedCount,
                },
                xml,
                guestCount: allGuestsToSend.length,
                acceptedCount,
                rejectedCount,
                // FIX #3: Return per-guest errors to the frontend for display
                guestErrors: guestErrors.length > 0 ? guestErrors : undefined,
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
