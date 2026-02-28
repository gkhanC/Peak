import { IBoardRepository, IMetricRepository, IEntryRepository } from "../domain/repositories/Interfaces";
import { Board } from "../domain/entities/Board";
import { MetricService } from "./MetricService";

export class BoardService {
    private metricService: MetricService;

    constructor(
        private boardRepo: IBoardRepository,
        private metricRepo: IMetricRepository,
        private entryRepo: IEntryRepository
    ) {
        this.metricService = new MetricService(metricRepo, entryRepo);
    }

    async getBoardsWithProgress(): Promise<Board[]> {
        const boardsData = await this.boardRepo.getAll();
        const metrics = await this.metricService.getHydratedMetrics();

        return boardsData.map(data => {
            const board = Board.fromPlain(data);
            const boardMetrics = metrics.filter(m => m.boardId === board.id);

            if (boardMetrics.length === 0) {
                board.setProgressionPercentage(0);
                return board;
            }

            let totalPercentage = 0;
            let validMetricsCount = 0;

            for (const m of boardMetrics) {
                // Calculation logic is now OWNED by the Metric object (Polymorphism)
                const result = m.calculateProgression(board.progressionMethod);
                if (result.isCalculatable) {
                    totalPercentage += result.percentage;
                    validMetricsCount++;
                }
            }

            const avg = validMetricsCount > 0 ? totalPercentage / validMetricsCount : 0;
            board.setProgressionPercentage(avg);
            return board;
        });
    }
}
