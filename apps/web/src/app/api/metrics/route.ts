import { NextResponse } from "next/server";
import { metricDefinitions, db } from "@peak/db";
import { bootstrapDI } from "@/lib/di/bootstrap";
import { DrizzleMetricRepository, DrizzleEntryRepository } from "@peak/db";
import { MetricService } from "@peak/core";

bootstrapDI();
const metricRepo = new DrizzleMetricRepository();
const entryRepo = new DrizzleEntryRepository();
const metricService = new MetricService(metricRepo, entryRepo);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const boardId = searchParams.get("boardId");

        const metrics = await metricService.getHydratedMetrics(boardId ? parseInt(boardId, 10) : undefined);
        return NextResponse.json(metrics.map(m => m.toJSON()));
    } catch (error) {
        console.error("Failed to fetch metrics:", error);
        return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { boardId, name, type, schema, progressDirection, progressionMethod, target } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const upperName = name.trim().toUpperCase();
        const existingMetrics = await metricService.getHydratedMetrics(boardId);
        if (existingMetrics.some(m => m.name.toUpperCase() === upperName)) {
            return NextResponse.json({ error: "A metric with this name already exists on this board" }, { status: 409 });
        }

        // Using direct db insert for creation since repository doesn't have create method yet
        // In a true OOP/Clean Architecture, we'd add create() to IMetricRepository
        const inserted = await db
            .insert(metricDefinitions)
            .values({
                boardId,
                name: upperName,
                type,
                schema,
                progressDirection,
                progressionMethod: progressionMethod || 'sinceCreation',
                target: target || null,
            } as any)
            .returning();

        return NextResponse.json(inserted[0], { status: 201 });
    } catch (error) {
        console.error("Failed to create metric:", error);
        return NextResponse.json({ error: "Failed to create metric" }, { status: 500 });
    }
}
