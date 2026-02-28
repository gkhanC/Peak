import { Board } from "../entities/Board";
import { MetricData, EntryData } from "../types/DTOs";

export interface IBoardRepository {
    getAll(): Promise<Board[]>;
    getById(id: number): Promise<Board | null>;
    create(board: Partial<Board>): Promise<Board>;
}

export interface IMetricRepository {
    getAll(): Promise<MetricData[]>;
    getByBoardId(boardId: number): Promise<MetricData[]>;
}

export interface IEntryRepository {
    getAll(): Promise<EntryData[]>;
    getByMetricId(metricId: number): Promise<EntryData[]>;
}
