
import { getSupabaseClient } from './lib/store';
// Note: store.ts exports getSupabaseClient through another file probably, but let's check lib/store.ts directly
import { getImportJobs, getBatches } from './lib/store';

async function test() {
    console.log("--- TEST SUPABASE ---");
    try {
        const jobs = await getImportJobs();
        const batches = await getBatches();

        console.log("Total Jobs:", jobs.length);
        console.log("Last 3 Jobs:", JSON.stringify(jobs.slice(0, 3), null, 2));

        console.log("Total Batches:", batches.length);
        console.log("Last 3 Batches:", JSON.stringify(batches.slice(0, 3), null, 2));
    } catch (e) {
        console.error("Error in test:", e);
    }
}

test();
