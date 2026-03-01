import { IMetricRepository, IEntryRepository } from "../domain/repositories/Interfaces";
import { BaseMetric, DayAggregate } from "../domain/entities/Metric";
import { MetricFactory } from "../domain/entities/MetricFactory";

export class MetricService {
    constructor(
        private metricRepo: IMetricRepository,
        private entryRepo: IEntryRepository
    ) { }

    async getHydratedMetrics(boardId?: number): Promise<BaseMetric[]> {
        const metricsData = boardId
            ? await this.metricRepo.getByBoardId(boardId)
            : await this.metricRepo.getAll();

        const allEntries = await this.entryRepo.getAll(); // Optimization: Fetch only relevant entries in a real app

        return this.instantiateMetricsWithData(metricsData, allEntries);
    }

    async getHydratedMetric(metricId: number): Promise<BaseMetric | null> {
        // Optimization: In a real app we'd have getById on Repo
        const metricsData = await this.metricRepo.getAll();
        const metricData = metricsData.find(m => m.id === metricId);

        if (!metricData) return null;

        const allEntries = await this.entryRepo.getByMetricId(metricId);
        return this.instantiateMetricsWithData([metricData], allEntries)[0];
    }

    // This logic is shared with BoardService. In a true refactor, BoardService would use MetricService.
    public instantiateMetricsWithData(metricsData: any[], allEntries: any[]): BaseMetric[] {
        return metricsData.map(data => {
            const metric = MetricFactory.create(data);
            const mEntries = allEntries
                .filter(e => e.metricId === metric.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const dayAggregates: DayAggregate[] = [];
            if (mEntries.length > 0) {
                const key = (metric.schema && typeof metric.schema === 'object' && Object.keys(metric.schema).length > 0)
                    ? Object.keys(metric.schema as object)[0]
                    : "value";

                const daysMap = new Map<string, any[]>();
                mEntries.forEach(e => {
                    const d = new Date(e.timestamp).toISOString().split('T')[0];
                    if (!daysMap.has(d)) daysMap.set(d, []);
                    daysMap.get(d)!.push(e);
                });

                const sortedDays = Array.from(daysMap.keys()).sort();
                let runningSum = 0;

                sortedDays.forEach(d => {
                    const dayEntries = daysMap.get(d)!;
                    let dayVal: any = 0;
                    if (metric.type === 'Count' || metric.type === 'Goal') {
                        dayVal = dayEntries.reduce((acc, e) => acc + (Number((e.data as any)[key]) || Number((e.data as any).value) || 0), 0);
                        runningSum += dayVal;
                    } else if (metric.type === 'Checklist') {
                        const latest = dayEntries[dayEntries.length - 1];
                        const keys = Object.keys(metric.schema as object);
                        const trueCount = keys.filter(k => (latest.data as any)[k] === true).length;
                        dayVal = (trueCount / keys.length) * 100;
                        runningSum = dayVal;
                    } else if (
                        metric.type === 'CompoundValue' ||
                        metric.type === 'CountTime' ||
                        metric.type === 'MeasurementTime' ||
                        metric.type === 'SetRep' ||
                        metric.type === 'SetMeasurement' ||
                        metric.type === 'SetRepTime' ||
                        metric.type === 'SetMeasurementTime' ||
                        metric.type === 'SetRepMeasurement'
                    ) {
                        const latest = dayEntries[dayEntries.length - 1];
                        dayVal = latest.data;
                        runningSum = 0;
                    } else {
                        const latest = dayEntries[dayEntries.length - 1];
                        dayVal = Number((latest.data as any)[key]) || Number((latest.data as any).value) || 0;
                        runningSum = dayVal;
                    }
                    dayAggregates.push({ day: d, val: dayVal, cumulative: runningSum });
                });
            }

            metric.setAggregates(dayAggregates);
            return metric;
        });
    }
}
