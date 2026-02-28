import { NextResponse } from "next/server";
import { db, boards, metricDefinitions, entries } from "@peak/db";
import { eq, inArray } from "drizzle-orm";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const boardId = Number(params.id);

    try {
        const boardMetrics = await db.select().from(metricDefinitions).where(eq(metricDefinitions.boardId, boardId));
        if (boardMetrics.length === 0) return NextResponse.json([]);

        const metricIds = boardMetrics.map(m => m.id);
        const boardEntries = await db.select().from(entries).where(inArray(entries.metricId, metricIds));

        // Group entries by day
        const entriesByDay: Record<string, any[]> = {};
        boardEntries.forEach(e => {
            const day = new Date(e.timestamp).toISOString().split('T')[0];
            if (!entriesByDay[day]) entriesByDay[day] = [];
            entriesByDay[day].push(e);
        });

        const sortedDays = Object.keys(entriesByDay).sort();
        if (sortedDays.length === 0) return NextResponse.json([]);

        // We need to fetch the board to know the progressionMethod
        const boardData = await db.select().from(boards).where(eq(boards.id, boardId));
        if (boardData.length === 0) return NextResponse.json({ error: "Board not found" }, { status: 404 });
        const board = boardData[0];

        const history = [];
        const metricEntriesCache: Record<number, any[]> = {};
        boardMetrics.forEach(m => metricEntriesCache[m.id] = boardEntries.filter(e => e.metricId === m.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

        const firstDate = new Date(sortedDays[0]);
        const today = new Date();
        const currentDay = new Date(firstDate);

        while (currentDay <= today) {
            const dayStr = currentDay.toISOString().split('T')[0];
            const endOfDay = new Date(currentDay);
            endOfDay.setHours(23, 59, 59, 999);

            let totalPercentage = 0;
            let validMetricsCount = 0;

            boardMetrics.forEach(m => {
                const mEntriesUpToNow = metricEntriesCache[m.id].filter(e => e.timestamp <= endOfDay);
                if (mEntriesUpToNow.length === 0) return;

                const latestEntry = mEntriesUpToNow[mEntriesUpToNow.length - 1];
                const key = (m.schema && typeof m.schema === 'object' && Object.keys(m.schema as object).length > 0) ? Object.keys(m.schema as object)[0] : "value";

                // Group mEntriesUpToNow by day
                const mDaysMap = new Map<string, any[]>();
                mEntriesUpToNow.forEach(e => {
                    const d = new Date(e.timestamp).toISOString().split('T')[0];
                    if (!mDaysMap.has(d)) mDaysMap.set(d, []);
                    mDaysMap.get(d)!.push(e);
                });
                const mSortedDays = Array.from(mDaysMap.keys()).sort();

                const latestDayStr = mSortedDays[mSortedDays.length - 1];
                const firstDayStr = mSortedDays[0];
                const prevDayStr = mSortedDays.length > 1 ? mSortedDays[mSortedDays.length - 2] : null;

                const method = 'sinceCreation'; // BOARD HISTORY AGGREGATE ALWAYS USES ALL-TIME (sinceCreation)
                let perc = 0;
                let isCalculatable = false;

                if (m.type === "Task") {
                    isCalculatable = true;
                    const keys = Object.keys(m.schema as object);
                    if (keys.length > 0) {
                        const trueCount = keys.filter(k => (latestEntry.data as any)[k] === true).length;
                        perc = (trueCount / keys.length) * 100;
                    }
                } else {
                    isCalculatable = true;
                    const curVal = (m.type === 'Count' || m.type === 'Goal')
                        ? mEntriesUpToNow.reduce((acc, e) => acc + (Number((e.data as any)[key]) || Number((e.data as any).value) || 0), 0)
                        : (Number((latestEntry.data as any)[key]) || Number((latestEntry.data as any).value) || 0);

                    // TREAT BOTH GOAL AND COUNT WITH TARGETS AS COMPLETION-BASED
                    if ((m.type === 'Goal' || m.type === 'Count') && m.target && m.target > 0) {
                        perc = Math.min((curVal / m.target) * 100, 100);
                    } else {
                        const isSingleDay = mSortedDays.length === 1;
                        let baseVal = 0;
                        if (!isSingleDay && m.type !== 'Count' && m.type !== 'Goal') {
                            const firstDayEntries = mDaysMap.get(firstDayStr)!;
                            const firstE = firstDayEntries[firstDayEntries.length - 1];
                            baseVal = Number((firstE.data as any)[key]) || Number((firstE.data as any).value) || 0;
                        }

                        const delta = curVal - baseVal;
                        if (baseVal !== 0) {
                            perc = (delta / Math.abs(baseVal)) * 100;
                        } else {
                            perc = delta !== 0 ? 100 : 0;
                        }
                    }
                    if (m.progressDirection === 'Descending') perc = -perc;
                }

                if (isCalculatable) {
                    totalPercentage += perc;
                    validMetricsCount++;
                }
            });

            const avg = validMetricsCount > 0 ? totalPercentage / validMetricsCount : 0;
            history.push({
                date: dayStr,
                progress: Math.round(avg)
            });

            currentDay.setDate(currentDay.getDate() + 1);
        }

        return NextResponse.json(history);
    } catch (error) {
        console.error("Failed to fetch board history:", error);
        return NextResponse.json({ error: "Failed to fetch board history" }, { status: 500 });
    }
}
