import { db, boards, metricDefinitions, entries } from "@peak/db";
import { inArray } from "drizzle-orm";

async function run() {
    try {
        const boardNames = ['Spor', 'İş', 'Görevler', 'Öğrenim'];
        const bRows = await db.select().from(boards).where(inArray(boards.name, boardNames));

        if (bRows.length > 0) {
            const bIds = bRows.map(b => b.id);
            const mRows = await db.select().from(metricDefinitions).where(inArray(metricDefinitions.boardId, bIds));

            if (mRows.length > 0) {
                const mIds = mRows.map(m => m.id);
                // delete entries
                await db.delete(entries).where(inArray(entries.metricId, mIds));
                // delete metrics
                await db.delete(metricDefinitions).where(inArray(metricDefinitions.boardId, bIds));
            }
            // delete boards
            await db.delete(boards).where(inArray(boards.name, boardNames));
            console.log("Deleted dummy boards and their associated data.");
        } else {
            console.log("No dummy boards found to delete.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
run();
