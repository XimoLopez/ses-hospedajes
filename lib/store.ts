// Store para Producción - Conectado a Supabase PostgreSQL
import type { ImportJob, CommunicationBatch } from "./types";
import { getSupabaseClient } from "./supabase";

function mapJobFromDB(dbJob: any): ImportJob {
    const raw = dbJob.raw_data || {};
    return {
        id: dbJob.id,
        filename: dbJob.filename,
        rowCount: dbJob.total_rows,
        validCount: dbJob.valid_count,
        errorCount: dbJob.error_count,
        status: dbJob.status,
        createdAt: dbJob.created_at,
        referenciaContrato: dbJob.referencia_contrato,
        fechaContrato: dbJob.fecha_contrato,
        fechaEntradaGlobal: dbJob.fecha_entrada_global,
        fechaSalidaGlobal: dbJob.fecha_salida_global,
        numeroPersonasGlobal: dbJob.numero_personas_global,
        tipoPago: dbJob.tipo_pago,
        fechaPago: dbJob.fecha_pago,
        rawData: raw.originalRawData,
        validationResult: dbJob.validation_result,
        communicationType: raw.communicationType || "parte_viajeros",
        guests: raw.guests || [],
    };
}

function mapBatchFromDB(dbBatch: any): CommunicationBatch {
    return {
        id: dbBatch.id,
        importJobId: dbBatch.import_job_id,
        type: dbBatch.type,
        status: dbBatch.status,
        sesBatchId: dbBatch.ses_batch_id || "",
        itemCount: dbBatch.item_count,
        acceptedCount: dbBatch.accepted_count,
        rejectedCount: dbBatch.rejected_count,
        xmlHash: dbBatch.xml_hash || "",
        apiResponse: dbBatch.api_response,
        sentAt: dbBatch.created_at, // Map created_at to sentAt
    } as CommunicationBatch;
}

// ---- Import Jobs ----

export async function createImportJob(data: Omit<ImportJob, "id" | "createdAt">): Promise<ImportJob> {
    const supabase = getSupabaseClient();
    const { data: inserted, error } = await supabase
        .from('import_jobs')
        .insert({
            filename: data.filename,
            total_rows: data.rowCount,
            valid_count: data.validCount,
            error_count: data.errorCount,
            status: data.status,
            referencia_contrato: data.referenciaContrato,
            fecha_contrato: data.fechaContrato,
            fecha_entrada_global: data.fechaEntradaGlobal,
            fecha_salida_global: data.fechaSalidaGlobal,
            numero_personas_global: data.numeroPersonasGlobal,
            tipo_pago: data.tipoPago,
            fecha_pago: data.fechaPago,
            raw_data: {
                communicationType: data.communicationType,
                guests: data.guests,
                originalRawData: data.rawData
            },
            validation_result: data.validationResult || {}
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Error creating import job:", error);
        throw error;
    }
    return mapJobFromDB(inserted);
}

export async function getImportJobs(): Promise<ImportJob[]> {
    const supabase = getSupabaseClient();
    console.log("DB: Fetching import_jobs...");
    const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("DB: Error fetching import jobs:", error);
        return [];
    }
    console.log(`DB: Successfully fetched ${data?.length || 0} import jobs`);
    return data.map(mapJobFromDB);
}

export async function getImportJob(id: string): Promise<ImportJob | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return undefined;
    }
    return mapJobFromDB(data);
}

export async function updateImportJob(id: string, updates: Partial<ImportJob>): Promise<ImportJob | undefined> {
    const supabase = getSupabaseClient();

    // Fetch current to merge JSONB
    const current = await getImportJob(id);
    if (!current) return undefined;

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.filename !== undefined) dbUpdates.filename = updates.filename;
    if (updates.rowCount !== undefined) dbUpdates.total_rows = updates.rowCount;
    if (updates.validCount !== undefined) dbUpdates.valid_count = updates.validCount;
    if (updates.errorCount !== undefined) dbUpdates.error_count = updates.errorCount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.validationResult !== undefined) dbUpdates.validation_result = updates.validationResult;

    if (updates.referenciaContrato !== undefined) dbUpdates.referencia_contrato = updates.referenciaContrato;
    if (updates.fechaContrato !== undefined) dbUpdates.fecha_contrato = updates.fechaContrato;
    if (updates.fechaEntradaGlobal !== undefined) dbUpdates.fecha_entrada_global = updates.fechaEntradaGlobal;
    if (updates.fechaSalidaGlobal !== undefined) dbUpdates.fecha_salida_global = updates.fechaSalidaGlobal;
    if (updates.numeroPersonasGlobal !== undefined) dbUpdates.numero_personas_global = updates.numeroPersonasGlobal;
    if (updates.tipoPago !== undefined) dbUpdates.tipo_pago = updates.tipoPago;
    if (updates.fechaPago !== undefined) dbUpdates.fecha_pago = updates.fechaPago;

    // Merge raw_data fields if provided
    dbUpdates.raw_data = {
        communicationType: updates.communicationType ?? current.communicationType,
        guests: updates.guests ?? current.guests,
        originalRawData: updates.rawData ?? current.rawData
    };

    const { data, error } = await supabase
        .from('import_jobs')
        .update(dbUpdates as any)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating import job:", error);
        return undefined;
    }
    return mapJobFromDB(data);
}

// ---- Communication Batches ----

export async function createBatch(data: Omit<CommunicationBatch, "id">): Promise<CommunicationBatch> {
    const supabase = getSupabaseClient();
    const { data: inserted, error } = await supabase
        .from('communication_batches')
        .insert({
            import_job_id: data.importJobId,
            type: data.type,
            status: data.status,
            ses_batch_id: data.sesBatchId,
            item_count: data.itemCount,
            accepted_count: data.acceptedCount,
            rejected_count: data.rejectedCount,
            xml_hash: data.xmlHash,
            api_response: (data as any).apiResponse || {}
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Error creating batch:", error);
        throw error;
    }
    return mapBatchFromDB(inserted);
}

export async function getBatches(): Promise<CommunicationBatch[]> {
    const supabase = getSupabaseClient();
    console.log("DB: Calling communication_batches.select('*')...");
    const result = await supabase
        .from('communication_batches')
        .select('*')
        .order('created_at', { ascending: false });

    console.log("DB: Raw Supabase Response for batches:", {
        error: result.error,
        dataLength: result.data?.length,
        status: result.status,
        statusText: result.statusText
    });

    const { data, error } = result;

    if (error) {
        console.error("DB: Error fetching batches:", error);
        return [];
    }

    const mapped = data.map(mapBatchFromDB);

    // DEBUG DUMMY
    if (mapped.length === 0) {
        console.log("DB: No batches found, adding dummy for testing...");
        mapped.push({
            id: "dummy-test-id",
            importJobId: "none",
            status: "accepted",
            type: "parte_viajeros",
            itemCount: 99,
            acceptedCount: 99,
            rejectedCount: 0,
            sesBatchId: "DUMMY-SES-ID",
            sentAt: new Date().toISOString()
        });
    }

    console.log(`DB: Successfully fetched ${mapped.length} batches`);
    return mapped;
}

export async function getBatch(id: string): Promise<CommunicationBatch | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('communication_batches')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return undefined;
    }
    return mapBatchFromDB(data);
}

export async function updateBatch(
    id: string,
    updates: Partial<CommunicationBatch>
): Promise<CommunicationBatch | undefined> {
    const supabase = getSupabaseClient();

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.importJobId !== undefined) dbUpdates.import_job_id = updates.importJobId;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.sesBatchId !== undefined) dbUpdates.ses_batch_id = updates.sesBatchId;
    if (updates.itemCount !== undefined) dbUpdates.item_count = updates.itemCount;
    if (updates.acceptedCount !== undefined) dbUpdates.accepted_count = updates.acceptedCount;
    if (updates.rejectedCount !== undefined) dbUpdates.rejected_count = updates.rejectedCount;
    if (updates.xmlHash !== undefined) dbUpdates.xml_hash = updates.xmlHash;
    if (updates.apiResponse !== undefined) dbUpdates.api_response = updates.apiResponse;

    const { data, error } = await supabase
        .from('communication_batches')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating batch:", error);
        return undefined;
    }
    return mapBatchFromDB(data);
}

export async function getBatchesByJob(importJobId: string): Promise<CommunicationBatch[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('communication_batches')
        .select('*')
        .eq('import_job_id', importJobId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching batches by job:", error);
        return [];
    }
    return data.map(mapBatchFromDB);
}

// ---- Stats ----

export async function getStats() {
    const supabase = getSupabaseClient();

    const { data: jobs, error: jErr } = await supabase.from('import_jobs').select('total_rows');
    if (jErr) console.error("Stats: Error fetching jobs:", jErr);

    const { data: batches, error: bErr } = await supabase.from('communication_batches').select('status');
    if (bErr) console.error("Stats: Error fetching batches:", bErr);

    const validJobs = jobs || [];
    const validBatches = batches || [];

    const totalJobs = validJobs.length;
    const totalBatches = validBatches.length;

    const acceptedBatches = validBatches.filter((b: any) => b.status === "accepted").length;
    const rejectedBatches = validBatches.filter((b: any) => b.status === "rejected").length;
    const pendingBatches = validBatches.filter(
        (b: any) => b.status === "pending" || b.status === "processing"
    ).length;

    const totalGuests = validJobs.reduce((sum, j: any) => sum + (j.total_rows || 0), 0);

    return {
        totalJobs,
        totalBatches,
        acceptedBatches,
        rejectedBatches,
        pendingBatches,
        totalGuests,
    };
}
