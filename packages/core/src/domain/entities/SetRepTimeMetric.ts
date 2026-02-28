import { BaseMetric, DayAggregate, ProgressionResult } from "./Metric";

export class SetRepTimeMetric extends BaseMetric {
    public calculateProgression(method: 'sinceCreation' | 'lastTwo'): ProgressionResult {
        const aggregates = this.dayAggregates;
        if (!aggregates || aggregates.length === 0) {
            return { percentage: 0, isCalculatable: false };
        }

        const latestDay = aggregates[aggregates.length - 1];
        let perc = 0;

        const getVal = (agg: DayAggregate) => {
            const setVal = agg.val?.set || 0;
            const repVal = agg.val?.rep || 0;
            const timeVal = agg.val?.time || 0;
            return timeVal > 0 ? (setVal * repVal) / timeVal : (setVal * repVal);
        };

        if (method === 'sinceCreation') {
            const firstDay = aggregates[0];
            const baseVal = aggregates.length === 1 ? 0 : getVal(firstDay);
            const latestVal = getVal(latestDay);
            const delta = latestVal - baseVal;
            perc = baseVal !== 0 ? (delta / Math.abs(baseVal)) * 100 : (delta !== 0 ? (delta > 0 ? 100 : -100) : 0);
        } else {
            if (aggregates.length < 2) return { percentage: 0, isCalculatable: false };
            const previousDay = aggregates[aggregates.length - 2];
            const previousVal = getVal(previousDay);
            const latestVal = getVal(latestDay);
            const delta = latestVal - previousVal;
            perc = previousVal !== 0 ? (delta / Math.abs(previousVal)) * 100 : (delta !== 0 ? (delta > 0 ? 100 : -100) : 0);
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
