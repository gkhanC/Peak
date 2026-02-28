import { NextResponse } from "next/server";
import { entries, db } from "@peak/db"; // keeping db for manual insert if repository create is missing
import { bootstrapDI } from "@/lib/di/bootstrap";
// We still need the repo directly here
import { DrizzleEntryRepository } from "@peak/db";

bootstrapDI();
const entryRepo = new DrizzleEntryRepository();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const metricId = searchParams.get("metricId");

        if (!metricId) {
            return NextResponse.json({ error: "metricId is required" }, { status: 400 });
        }

        const metricEntries = await entryRepo.getByMetricId(parseInt(metricId, 10));

        return NextResponse.json(metricEntries);
    } catch (error) {
        console.error("Failed to fetch entries:", error);
        return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { metricId, data, timestamp: reqTimestamp } = body;

        if (!metricId || !data) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const valuesToInsert: any = {
            metricId,
            data,
        };

        if (reqTimestamp) {
            valuesToInsert.timestamp = new Date(reqTimestamp);
        }

        const inserted = await db
            .insert(entries)
            .values(valuesToInsert)
            .returning();

        return NextResponse.json(inserted[0], { status: 201 });
    } catch (error) {
        console.error("Failed to log entry:", error);
        return NextResponse.json({ error: "Failed to log entry" }, { status: 500 });
    }
}
