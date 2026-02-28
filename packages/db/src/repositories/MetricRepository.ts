import { db } from "../../index";
import { metricDefinitions } from "../../schema";
import { IMetricRepository, MetricData } from "@peak/core";
import { eq } from "drizzle-orm";

export class DrizzleMetricRepository implements IMetricRepository {
    async getAll(): Promise<MetricData[]> {
        const result = await db.select().from(metricDefinitions);
        return result as MetricData[];
    }

    async getByBoardId(boardId: number): Promise<MetricData[]> {
        const result = await db.select().from(metricDefinitions).where(eq(metricDefinitions.boardId, boardId));
        return result as MetricData[];
    }
}
