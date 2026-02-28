import { BoardService, IBoardRepository, IMetricRepository, IEntryRepository } from "@peak/core";

export class ServiceContainer {
    private static instance: ServiceContainer;

    private boardService: BoardService | null = null;

    private boardRepo: IBoardRepository | null = null;
    private metricRepo: IMetricRepository | null = null;
    private entryRepo: IEntryRepository | null = null;

    private constructor() { }

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }

    public registerRepositories(boardRepo: IBoardRepository, metricRepo: IMetricRepository, entryRepo: IEntryRepository) {
        this.boardRepo = boardRepo;
        this.metricRepo = metricRepo;
        this.entryRepo = entryRepo;
    }

    public getBoardService(): BoardService {
        if (!this.boardService) {
            if (!this.boardRepo || !this.metricRepo || !this.entryRepo) {
                throw new Error("Repositories not registered! Call registerRepositories first.");
            }
            this.boardService = new BoardService(this.boardRepo, this.metricRepo, this.entryRepo);
        }
        return this.boardService;
    }
}

export const container = ServiceContainer.getInstance();
