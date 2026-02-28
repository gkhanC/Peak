import { db } from "../../index";
import { entries } from "../../schema";
import { IEntryRepository, EntryData } from "@peak/core";
import { eq } from "drizzle-orm";

export class DrizzleEntryRepository implements IEntryRepository {
    async getAll(): Promise<EntryData[]> {
        const result = await db.select().from(entries);
        return result as EntryData[];
    }

    async getByMetricId(metricId: number): Promise<EntryData[]> {
        const result = await db.select().from(entries).where(eq(entries.metricId, metricId));
        return result as EntryData[];
    }
}
