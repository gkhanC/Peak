import { db, metricDefinitions, entries } from '@peak/db';
import { eq } from 'drizzle-orm';

async function main() {
    const metrics = await db.select().from(metricDefinitions).where(eq(metricDefinitions.name, 'DUMBLE'));
    if (metrics.length === 0) {
        console.log("DUMBLE not found");
        process.exit(0);
    }
    const metric = metrics[0];
    console.log("Metric:", metric);

    const hist = await db.select().from(entries).where(eq(entries.metricId, metric.id));
    console.log("Entries:", hist.map(h => ({ ...h, data: typeof h.data === 'object' ? JSON.stringify(h.data) : h.data })));
    process.exit(0);
}

main().catch(console.error);
