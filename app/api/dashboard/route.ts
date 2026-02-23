import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        console.log("--- DASHBOARD API DIRECT FETCH ---");
        const supabase = getSupabaseClient();

        // Log environment for debug
        console.log("Supabase Client Info:", {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            keyPrefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").substring(0, 10)
        });

        // Fetch Stats
        const { data: statsJobs, error: errJobs } = await supabase.from('import_jobs').select('id');
        const { data: statsBatches, error: errBatches } = await supabase.from('communication_batches').select('status, type, item_count, accepted_count, ses_batch_id');

        if (errJobs) console.error("Error fetching jobs stats:", errJobs);
        if (errBatches) console.error("Error fetching batches stats:", errBatches);

        const validJobs = statsJobs || [];
        const validBatches = statsBatches || [];

        console.log(`Query results for stats: ${validJobs.length} jobs, ${validBatches.length} batches`);

        const totalGuests = validBatches
            .filter((b: any) => b.type === "parte_viajeros" && (b.status === "accepted" || b.ses_batch_id))
            .reduce((sum, b: any) => sum + (b.accepted_count || b.item_count || 0), 0);

        const stats = {
            totalJobs: validJobs.length,
            totalBatches: validBatches.length,
            acceptedBatches: validBatches.filter((b: any) => b.status === "accepted" || b.ses_batch_id).length,
            rejectedBatches: validBatches.filter((b: any) => b.status === "rejected").length,
            pendingBatches: validBatches.filter((b: any) => b.status === "pending" || b.status === "processing").length,
            totalGuests
        };

        // Fetch Recent Jobs
        const { data: dbJobs } = await supabase
            .from('import_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentJobs = (dbJobs || []).map(dbJob => ({
            id: dbJob.id,
            filename: dbJob.filename,
            rowCount: dbJob.total_rows,
            validCount: dbJob.valid_count,
            errorCount: dbJob.error_count,
            status: dbJob.status,
            createdAt: dbJob.created_at,
            referenciaContrato: dbJob.referencia_contrato
        }));

        // Fetch Recent Batches
        const { data: dbBatches } = await supabase
            .from('communication_batches')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentBatches = (dbBatches || []).map(dbBatch => ({
            id: dbBatch.id,
            importJobId: dbBatch.import_job_id,
            type: dbBatch.type,
            status: dbBatch.status,
            sesBatchId: dbBatch.ses_batch_id || "",
            itemCount: dbBatch.item_count,
            acceptedCount: dbBatch.accepted_count,
            rejectedCount: dbBatch.rejected_count,
            sentAt: dbBatch.created_at
        }));

        console.log(`Returning: ${recentJobs.length} jobs, ${recentBatches.length} batches`);

        return NextResponse.json({
            stats,
            recentJobs,
            recentBatches
        });
    } catch (error) {
        console.error("Error in dashboard direct fetch:", error);
        return NextResponse.json(
            { error: "Error al obtener datos del dashboard" },
            { status: 500 }
        );
    }
}
