import { db, metricDefinitions, entries } from '@peak/db';
import { eq } from 'drizzle-orm';
import { MetricService } from '@peak/core/src/services/MetricService';

async function main() {
    // Fake repos just to bypass DB layer if MetricService allows, or we just pass the arrays directly
    const metricSvc = new MetricService(null as any, null as any);

    const metricsData = await db.select().from(metricDefinitions).where(eq(metricDefinitions.name, 'DUMBLE'));
    const allEntries = await db.select().from(entries).where(eq(entries.metricId, metricsData[0].id));

    const instantiatedMetrics = metricSvc.instantiateMetricsWithData(metricsData, allEntries);
    const m = instantiatedMetrics[0];

    console.log("Day Aggregates:", JSON.stringify(m.dayAggregates, null, 2));

    const pSinceCreation = m.calculateProgression('sinceCreation');
    console.log("Progression since creation:", pSinceCreation);

    // Dump what getVal returns
    const getVal = (agg: any) => {
        const setVal = agg.val?.set || 0;
        const repVal = agg.val?.rep || 0;
        const measurementVal = agg.val?.measurement || 0;
        console.log(`setVal: ${setVal}, repVal: ${repVal}, measVal: ${measurementVal} -> Prod: ${setVal * repVal * measurementVal}`);
        return setVal * repVal * measurementVal;
    };

    console.log("Base Day:");
    getVal(m.dayAggregates[0]);
    console.log("Latest Day:");
    getVal(m.dayAggregates[m.dayAggregates.length - 1]);

    process.exit(0);
}

main().catch(console.error);
