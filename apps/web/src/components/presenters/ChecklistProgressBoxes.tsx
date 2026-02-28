import * as React from "react";

interface ChecklistProgressBoxesProps {
    metric: any;
    maxBoxes: number;
    className?: string; // e.g. "w-8 h-8", "w-4 h-4"
}

export function ChecklistProgressBoxes({ metric, maxBoxes, className = "w-8 h-8" }: ChecklistProgressBoxesProps) {
    const items = metric.schema?.items;

    // If no items, we can optionally return a fallback or just empty
    if (!Array.isArray(items) || items.length === 0) {
        return (
            <div className={`flex items-center justify-center text-xs text-neutral-600 uppercase font-black tracking-widest ${className === 'w-4 h-4' ? 'text-[8px]' : ''}`}>
                No tasks
            </div>
        );
    }

    const totalTasks = items.length;
    const completedTasks = items.filter(i => i.completed).length;
    const incompleteTasks = totalTasks - completedTasks;

    // Logic:
    // Determine visibleCompleted: prioritize completed, but max out at (maxBoxes - 1) if there's at least 1 incomplete task.
    // That way, we always guarantee room for at least 1 incomplete box to show not-done status.
    const visibleCompleted = incompleteTasks > 0
        ? Math.min(completedTasks, maxBoxes - 1)
        : Math.min(completedTasks, maxBoxes);

    // Determine visibleIncomplete: take whatever space is left from maxBoxes.
    const remainingBoxSpace = maxBoxes - visibleCompleted;
    const visibleIncomplete = Math.min(incompleteTasks, remainingBoxSpace);

    // Determine omitted tasks number
    const visibleTasks = visibleCompleted + visibleIncomplete;
    const omittedTasks = totalTasks - visibleTasks;

    const boxes = [];

    // Render completed boxes
    for (let i = 0; i < visibleCompleted; i++) {
        boxes.push(
            <div key={`c-${i}`} className={`${className} rounded border border-emerald-400 bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0`}>
                <svg className="w-3/4 h-3/4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
        );
    }

    // Render incomplete boxes
    for (let i = 0; i < visibleIncomplete; i++) {
        boxes.push(
            <div key={`i-${i}`} className={`${className} rounded border border-white/20 bg-black/40 flex items-center justify-center shrink-0`}>
            </div>
        );
    }

    // Render omitted pill if needed
    if (omittedTasks > 0) {
        boxes.push(
            <div key="omitted" className={`px-1.5 h-full min-h-[${className.split(' ')[1]}] rounded bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center text-[10px] font-black shrink-0`}>
                +{omittedTasks}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-1 items-center justify-center group relative cursor-crosshair">
            {boxes}

            {/* Tooltip for hover detail */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black border border-neutral-800 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-bold shadow-xl">
                {completedTasks} / {totalTasks} tasks completed ({(completedTasks / totalTasks * 100).toFixed(0)}%)
            </div>
        </div>
    );
}
