export type MetricType = 'SingleValue' | 'CompoundValue' | 'Checklist' | 'Count' | 'Goal' | 'CountTime' | 'MeasurementTime' | 'SetRep' | 'SetMeasurement' | 'SetRepTime' | 'SetMeasurementTime' | 'Measurement';
export type ProgressDirection = 'Ascending' | 'Descending';

export interface DayAggregate {
    day: string;
    val: number | any;
    cumulative: number | any;
}

export interface ProgressionResult {
    percentage: number;
    isCalculatable: boolean;
}

export abstract class BaseMetric {
    public dayAggregates: DayAggregate[] = [];

    constructor(
        public readonly id: number,
        public readonly boardId: number,
        public readonly name: string,
        public readonly type: MetricType,
        public readonly schema: any,
        public readonly target: number | null,
        public readonly progressDirection: ProgressDirection,
        public readonly progressionMethod: string
    ) { }

    setAggregates(aggregates: DayAggregate[]): void {
        this.dayAggregates = aggregates;
    }

    // Abstract method to be implemented by specialized metric types
    public abstract calculateProgression(method: 'sinceCreation' | 'lastTwo'): ProgressionResult;

    // Abstract method for JSON serialization
    public abstract toJSON(): Record<string, any>;

    protected adjustForDirection(percentage: number): number {
        return this.progressDirection === 'Descending' ? -percentage : percentage;
    }
}
