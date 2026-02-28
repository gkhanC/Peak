import { BaseMetric, DayAggregate, ProgressionResult } from "./Metric";

export class MeasurementMetric extends BaseMetric {
    public calculateProgression(method: 'sinceCreation' | 'lastTwo'): ProgressionResult {
        const aggregates = this.dayAggregates;
        if (!aggregates || aggregates.length === 0) {
            return { percentage: 0, isCalculatable: false };
        }

        const latestDay = aggregates[aggregates.length - 1];
        let perc = 0;

        if (method === 'sinceCreation') {
            const firstDay = aggregates[0];
            const baseVal = aggregates.length === 1 ? 0 : firstDay.val;
            const delta = latestDay.val - baseVal;
            perc = baseVal !== 0 ? (delta / Math.abs(baseVal)) * 100 : (delta !== 0 ? (delta > 0 ? 100 : -100) : 0);
        } else {
            // lastTwo
            if (aggregates.length < 2) return { percentage: 0, isCalculatable: false };
            const previousDay = aggregates[aggregates.length - 2];
            const delta = latestDay.val - previousDay.val;
            perc = previousDay.val !== 0 ? (delta / Math.abs(previousDay.val)) * 100 : (delta !== 0 ? (delta > 0 ? 100 : -100) : 0);
        }

        return { percentage: this.adjustForDirection(perc), isCalculatable: true };
    }

    public toJSON(): Record<string, any> {
        return {
            id: this.id,
            boardId: this.boardId,
            name: this.name,
            type: this.type,
            schema: this.schema,
            target: this.target,
            progressDirection: this.progressDirection,
            dayAggregates: this.dayAggregates
        };
    }
}
