import { BaseMetric, DayAggregate, ProgressionResult } from "./Metric";

export class CumulativeMetric extends BaseMetric {
    public calculateProgression(method: 'sinceCreation' | 'lastTwo'): ProgressionResult {
        const aggregates = this.dayAggregates;
        if (!aggregates || aggregates.length === 0) {
            return { percentage: 0, isCalculatable: false };
        }

        const latestDay = aggregates[aggregates.length - 1];
        let perc = 0;
        let requiresDirectionAdjustment = false;

        const isDescending = this.progressDirection === 'Descending';
        const startingValue = typeof this.schema === 'object' && this.schema !== null && 'startingValue' in this.schema
            ? Number(this.schema.startingValue)
            : 0;

        if (method === 'sinceCreation') {
            const curVal = isDescending ? startingValue + latestDay.cumulative : latestDay.cumulative;
            const effectiveTarget = this.target !== null ? this.target : (isDescending ? 0 : null);

            if (effectiveTarget !== null) { // Has a target
                if (isDescending) {
                    const totalToLoose = startingValue - effectiveTarget;
                    const lostSoFar = startingValue - curVal;
                    // Protect against division by 0
                    if (totalToLoose === 0) {
                        perc = curVal <= effectiveTarget ? 100 : 0;
                    } else {
                        perc = Math.min((lostSoFar / totalToLoose) * 100, 100);
                        perc = Math.max(perc, 0); // Can't be negative
                    }
                } else {
                    perc = effectiveTarget === 0 ? (curVal >= 0 ? 100 : 0) : Math.min((curVal / effectiveTarget) * 100, 100);
                    perc = Math.max(perc, 0);
                }
            } else {
                // Endless counters
                if (isDescending) {
                    perc = curVal < startingValue ? 100 : 0;
                } else {
                    perc = curVal > 0 ? 100 : 0;
                }
            }
            requiresDirectionAdjustment = false;
        } else {
            // lastTwo
            if (aggregates.length < 2) return { percentage: 0, isCalculatable: false };
            const previousDay = aggregates[aggregates.length - 2];
            const curVal = isDescending ? startingValue + latestDay.cumulative : latestDay.cumulative;
            const prevVal = isDescending ? startingValue + previousDay.cumulative : previousDay.cumulative;

            const delta = curVal - prevVal;

            if (prevVal !== 0) {
                perc = (delta / Math.abs(prevVal)) * 100;
            } else {
                perc = delta !== 0 ? (delta > 0 ? 100 : -100) : 0;
            }
            requiresDirectionAdjustment = true;
        }

        const finalPercentage = requiresDirectionAdjustment ? this.adjustForDirection(perc) : perc;
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
