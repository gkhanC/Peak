export type MetricType = "SingleValue" | "CompoundValue" | "Checklist" | "Count" | "Goal" | "CountTime" | "MeasurementTime";
export type ProgressDirection = "Ascending" | "Descending";
export type ProgressionMethod = "lastTwo" | "sinceCreation";

export interface Board {
    id: number;
    name: string;
    description: string | null;
    theme: string;
    tag: string | null;
    color: string | null;
    illustration: string | null;
    progressionMethod: ProgressionMethod;
    progressionPercentage?: number;
    createdAt: string;
}

export interface Metric {
    id: number;
    boardId: number;
    name: string;
    type: MetricType;
    schema: Record<string, string>;
    target: number | null;
    progressDirection: ProgressDirection;
    progressionMethod: ProgressionMethod;
}

export interface Entry {
    id: number;
    metricId: number;
    timestamp: string;
    data: Record<string, any>;
}
