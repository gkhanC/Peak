"use server";

import { db, boards, metricDefinitions, entries } from "@peak/db";
import { eq, inArray, desc } from "drizzle-orm";
import { MetricService } from "@peak/core";
// @ts-ignore
import { DrizzleMetricRepository, DrizzleEntryRepository } from "@peak/db";

const metricRepo = new DrizzleMetricRepository();
const entryRepo = new DrizzleEntryRepository();
const metricSvc = new MetricService(metricRepo, entryRepo);

export async function fetchAllBoards() {
    return await db.select().from(boards).orderBy(boards.id);
}

export async function createBoardAction(name: string) {
    if (!name) return { success: false, error: "Name required" };
    try {
        const upperName = name.trim().toUpperCase();
        await db.insert(boards).values({ name: upperName });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteBoardsAction(ids: number[]) {
    if (ids.length === 0) return { success: false, error: "No boards specified" };
    try {
        const metricsToDelete = await db.select().from(metricDefinitions).where(inArray(metricDefinitions.boardId, ids));
        const mIds = metricsToDelete.map((m: any) => m.id);
        if (mIds.length > 0) {
            await db.delete(entries).where(inArray(entries.metricId, mIds));
            await db.delete(metricDefinitions).where(inArray(metricDefinitions.boardId, ids));
        }
        await db.delete(boards).where(inArray(boards.id, ids));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createMetricAction(boardId: number, name: string, type: string, dir: string, schema: any) {
    try {
        const upperName = name.trim().toUpperCase();
        await db.insert(metricDefinitions).values({
            boardId, name: upperName, type: type as any, schema, progressDirection: dir as any
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMetricAction(metricId: number) {
    try {
        await db.delete(entries).where(eq(entries.metricId, metricId));
        await db.delete(metricDefinitions).where(eq(metricDefinitions.id, metricId));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getHydratedMetricsAction(boardId: number) {
    try {
        const list = await metricSvc.getHydratedMetrics(boardId);
        // Serialize explicitly because the class instance can't cross Server/Client boundary cleanly
        return list.map((m: any) => {
            const progSinceObj = m.calculateProgression('sinceCreation');
            const progLastTwoObj = m.calculateProgression('lastTwo');

            return {
                id: m.id,
                name: m.name,
                type: m.type,
                schema: m.schema,
                target: m.target,
                progressDirection: m.progressDirection,
                dayAggregates: m.dayAggregates,
                progSinceCreation: progSinceObj.isCalculatable ? progSinceObj.percentage : null,
                progLastTwo: progLastTwoObj.isCalculatable ? progLastTwoObj.percentage : null,
            };
        });
    } catch (e: any) {
        console.error(e);
        return [];
    }
}

export async function addValueToMetricAction(metricId: number, payload: any) {
    try {
        await db.insert(entries).values({ metricId, data: payload, timestamp: new Date() });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getMetricHistoryAction(metricId: number) {
    try {
        const hist = await db.select().from(entries).where(eq(entries.metricId, metricId)).orderBy(desc(entries.timestamp)).limit(20);
        return hist;
    } catch (e) {
        return [];
    }
}

export async function deleteValuesAction(entryIds: number[]) {
    if (entryIds.length === 0) return { success: false };
    try {
        await db.delete(entries).where(inArray(entries.id, entryIds));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
