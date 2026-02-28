import { NextResponse } from "next/server";
import { db, boards, metricDefinitions, entries } from "@peak/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // Expected format: spor/şınav 5x25
        const parts = text.trim().split(" ");
        if (parts.length < 2) {
            return NextResponse.json({ error: "Invalid format. Expected board/metric value" }, { status: 400 });
        }

        const pathParts = parts[0].split("/");
        if (pathParts.length < 2) {
            return NextResponse.json({ error: "Invalid board path. Expected board/metric" }, { status: 400 });
        }

        const boardName = pathParts[0];
        const metricName = pathParts[1];
        const valueStr = parts.slice(1).join(" ");

        // 1. Find Board
        const b = await db.select().from(boards).where(eq(boards.name, boardName)).limit(1);
        if (b.length === 0) {
            return NextResponse.json({ error: `Board '${boardName}' not found` }, { status: 404 });
        }

        // 2. Find Metric
        const query = db.select().from(metricDefinitions);
        const m = await (query as any)
            .where(eq(metricDefinitions.boardId, b[0].id))
            .where(eq(metricDefinitions.name, metricName))
            .limit(1);

        if (m.length === 0) {
            return NextResponse.json({ error: `Metric '${metricName}' not found` }, { status: 404 });
        }

        const metricDef = m[0];
        let dataToLog: any = {};

        // 3. Smart Parse Value
        if (metricDef.type === "CompoundValue") {
            if (valueStr.includes("x")) {
                const [set, rep] = valueStr.split("x");
                dataToLog = { set: Number(set), rep: Number(rep) };
            } else {
                return NextResponse.json({ error: "Invalid format for Compound. Expected setsxreps (e.g. 5x25)" }, { status: 400 });
            }
        } else if (metricDef.type === "SingleValue") {
            const key = Object.keys(metricDef.schema)[0] || "value";
            dataToLog = { [key]: Number(valueStr.replace(/[^0-9.-]/g, '')) };
        } else if (metricDef.type === "Task") {
            dataToLog = { [valueStr]: true }; // Rough assumption for tick
        }

        const inserted = await db.insert(entries).values({
            metricId: metricDef.id,
            data: dataToLog,
            timestamp: new Date()
        }).returning();

        return NextResponse.json({ success: true, entry: inserted[0] });

    } catch (error) {
        console.error("Failed to execute smart command:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
