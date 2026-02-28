import { BaseMetric, ProgressionResult } from "./Metric";

export class MeasurementTimeMetric extends BaseMetric {
    public calculateProgression(method: 'sinceCreation' | 'lastTwo'): ProgressionResult {
        const aggregates = this.dayAggregates;
        if (!aggregates || aggregates.length === 0) {
            return { percentage: 0, isCalculatable: false };
        }

        const latestDay = aggregates[aggregates.length - 1];

        // Extract progress directions
        const measDir = this.schema?.measurementDirection || this.progressDirection;
        const timeDir = this.schema?.timeDirection || this.progressDirection;

        // If measurement is Ascending (more measurement is better) and time is Descending (less time is better),
        // then a higher rate (Meas/Time) is positive progress.
        // We will simplify: If measurement is Ascending, Higher Rate is Better. 
        // If measurement is Descending, Lower Rate is Better.
        const isHigherRateBetter = measDir === 'Ascending';

        let ratePerc = 0;

        const getRate = (agg: any) => {
            const measurement = agg?.val?.measurement || 0;
            const time = agg?.val?.time || 0;
            if (time === 0) return measurement; // Fallback to just meas if time is not provided
            return measurement / time;
        };

        const currentRate = getRate(latestDay);

        if (method === 'sinceCreation') {
            const baseRate = aggregates.length === 1 ? 0 : getRate(aggregates[0]);
            const deltaRate = currentRate - baseRate;

            ratePerc = baseRate !== 0 ? (deltaRate / Math.abs(baseRate)) * 100 : (deltaRate !== 0 ? (deltaRate > 0 ? 100 : -100) : 0);
        } else {
            // lastTwo
            if (aggregates.length < 2) return { percentage: 0, isCalculatable: false };
            const prevRate = getRate(aggregates[aggregates.length - 2]);
            const deltaRate = currentRate - prevRate;

            ratePerc = prevRate !== 0 ? (deltaRate / Math.abs(prevRate)) * 100 : (deltaRate !== 0 ? (deltaRate > 0 ? 100 : -100) : 0);
        }

        // Adjust for direction preference
        const finalPercentage = isHigherRateBetter ? ratePerc : -ratePerc;

        return { percentage: finalPercentage, isCalculatable: true };
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
