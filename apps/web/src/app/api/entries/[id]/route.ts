import { NextResponse } from "next/server";
import { db, entries } from "@peak/db";
import { eq } from "drizzle-orm";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const entryId = parseInt(resolvedParams.id, 10);

        if (isNaN(entryId)) {
            return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
        }

        await db.delete(entries).where(eq(entries.id, entryId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete entry:", error);
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}
