import { NextResponse } from "next/server";
import { bootstrapDI } from "@/lib/di/bootstrap";
import { container } from "@/lib/di/container";

import { DrizzleMetricRepository, DrizzleEntryRepository } from "@peak/db";
import { MetricService } from "@peak/core";

bootstrapDI();
// The container currently only exposes BoardService out of the box. 
// For a complete DI setup we'd expose all services.
// Let's instantiate MetricService correctly using the DI registered repos, 
// or manually since we just need it here.
const metricRepo = new DrizzleMetricRepository();
const entryRepo = new DrizzleEntryRepository();
const metricService = new MetricService(metricRepo, entryRepo);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const metricId = parseInt(resolvedParams.id, 10);

        if (isNaN(metricId)) {
            return NextResponse.json({ error: "Invalid metric ID" }, { status: 400 });
        }

        const metric = await metricService.getHydratedMetric(metricId);

        if (!metric) {
            return NextResponse.json({ error: "Metric not found" }, { status: 404 });
        }

        // Return the fully calculated domain object
        const responseData = (metric as any).toJSON ? (metric as any).toJSON() : metric;
        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Failed to fetch hydrated metric:", error);
        return NextResponse.json({ error: "Failed to fetch metric" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const metricId = parseInt(resolvedParams.id, 10);

        if (isNaN(metricId)) {
            return NextResponse.json({ error: "Invalid metric ID" }, { status: 400 });
        }

        const body = await req.json();
        const { name, target, schema } = body;

        // Note: Using raw db for updates as we don't have update() on repo interfaces yet.
        const { db, metricDefinitions } = await import("@peak/db");
        const { eq } = await import("drizzle-orm");

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim().toUpperCase();
        if (target !== undefined) updateData.target = target || null;
        if (schema !== undefined) updateData.schema = schema;

        const updated = await db
            .update(metricDefinitions)
            .set(updateData)
            .where(eq(metricDefinitions.id, metricId))
            .returning();

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error("Failed to update metric:", error);
        return NextResponse.json({ error: "Failed to update metric" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const metricId = parseInt(resolvedParams.id, 10);

        if (isNaN(metricId)) {
            return NextResponse.json({ error: "Invalid metric ID" }, { status: 400 });
        }

        const { db, metricDefinitions, entries } = await import("@peak/db");
        const { eq } = await import("drizzle-orm");

        // First delete all entries associated with this metric
        await db.delete(entries).where(eq(entries.metricId, metricId));
        // Then delete the metric itself
        await db.delete(metricDefinitions).where(eq(metricDefinitions.id, metricId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete metric:", error);
        return NextResponse.json({ error: "Failed to delete metric" }, { status: 500 });
    }
}
