import { NextResponse } from "next/server";
import { db, boards, metricDefinitions, entries } from "@peak/db";
import { eq, inArray } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
        }

        const body = await req.json();
        const { name, description, theme, tag, color, illustration, progressionMethod } = body;

        // Ensure we handle setting null explicitly vs undefined (not changing)
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim().toUpperCase();
        if (description !== undefined) updateData.description = description;
        if (theme !== undefined) updateData.theme = theme;
        if (tag !== undefined) updateData.tag = tag;
        if (color !== undefined) updateData.color = color;
        if (illustration !== undefined) updateData.illustration = illustration;
        if (progressionMethod !== undefined) updateData.progressionMethod = progressionMethod;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No update provided" }, { status: 400 });
        }

        const updated = await db.update(boards)
            .set(updateData)
            .where(eq(boards.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        return NextResponse.json(updated[0], { status: 200 });
    } catch (error) {
        console.error("Failed to update board:", error);
        return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
        }

        // Delete associated entries first (via metrics)
        const boardMetrics = await db.select().from(metricDefinitions).where(eq(metricDefinitions.boardId, id));
        if (boardMetrics.length > 0) {
            const metricIds = boardMetrics.map(m => m.id);
            await db.delete(entries).where(inArray(entries.metricId, metricIds));

            // Delete associated metrics
            await db.delete(metricDefinitions).where(eq(metricDefinitions.boardId, id));
        }

        // Default constraints will fail if we don't delete metrics and entries first (handled above)
        await db.delete(boards).where(eq(boards.id, id));

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete board:", error);
        return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
    }
}
