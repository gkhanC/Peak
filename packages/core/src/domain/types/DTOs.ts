// Data Transfer Objects (DTOs) for Repository Layer

export interface MetricData {
    id: number;
    boardId: number;
    name: string;
    type: string;
    schema: any; // Could be further typed if schema is stricter
    target: number | null;
    progressDirection: string;
    progressionMethod: string;
    createdAt: Date;
}

export interface EntryData {
    id: number;
    metricId: number;
    data: any; // Dynamic based on metric schema
    timestamp: Date;
}
