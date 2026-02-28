import { MetricType, ProgressDirection } from "@peak/core/src/domain/entities/Metric";

// Helper type to mirror the DTO structure of a metric
interface MetricDTO {
    id: number;
    boardId: number;
    name: string;
    type: string;
    schema: any;
    target: number | null;
    progressDirection: string;
    dayAggregates: any[];
    progSinceCreation?: number | null;
    progLastTwo?: number | null;
}

export function isMetricComplete(metric: MetricDTO): boolean {
    if (metric.type !== 'Goal' && metric.type !== 'Count') return false; // Only Goal and Count can "complete" right now

    const isDescending = metric.progressDirection === 'Descending';
    const startingValue = metric.schema && typeof metric.schema === 'object' && 'startingValue' in metric.schema
        ? Number(metric.schema.startingValue)
        : 0;

    const accumulatedCount = metric.dayAggregates && metric.dayAggregates.length > 0
        ? metric.dayAggregates[metric.dayAggregates.length - 1].cumulative
        : 0;

    const totalCount = isDescending ? startingValue + accumulatedCount : accumulatedCount;
    const effectiveTarget = metric.target !== null ? metric.target : (isDescending ? 0 : null);

    if (effectiveTarget !== null) {
        return isDescending ? totalCount <= effectiveTarget : totalCount >= effectiveTarget;
    }

    return false;
}

export function sortMetrics(metrics: MetricDTO[]): MetricDTO[] {
    return [...metrics].sort((a, b) => {
        const isAMeasurement = a.type.toLowerCase().includes('measurement');
        const isBMeasurement = b.type.toLowerCase().includes('measurement');

        // 1. Priority to Measurement types
        if (isAMeasurement && !isBMeasurement) return -1;
        if (!isAMeasurement && isBMeasurement) return 1;

        // 2. Sort by type
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }

        // 3. Sort by name alphabetically
        return a.name.localeCompare(b.name);
    });
}
