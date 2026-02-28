import { BaseMetric, DayAggregate, ProgressionResult } from "./Metric";

export class ChecklistMetric extends BaseMetric {
    public calculateProgression(): ProgressionResult {
        // Checklist progression is dynamic based on schema state
        if (!this.schema || !Array.isArray(this.schema.items) || this.schema.items.length === 0) {
            return { percentage: 0, isCalculatable: false };
        }

        const items = this.schema.items as Array<{ id: string, text: string, completed: boolean }>;
        const total = items.length;
        const completed = items.filter(i => i.completed).length;

        const percentage = total === 0 ? 0 : (completed / total) * 100;
        return { percentage, isCalculatable: true };
    }

    public toJSON(): Record<string, any> {
        return {
            id: this.id,
            boardId: this.boardId,
            name: this.name,
            type: this.type,
            schema: this.schema,
            target: this.target,
            progressDirection: this.progressDirection,
            dayAggregates: this.dayAggregates
        };
    }
}

