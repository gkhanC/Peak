import { DrizzleBoardRepository, DrizzleMetricRepository, DrizzleEntryRepository } from "@peak/db";
import { container } from "./container";

let isInitialized = false;

export function bootstrapDI() {
    if (isInitialized) return;

    const boardRepo = new DrizzleBoardRepository();
    const metricRepo = new DrizzleMetricRepository();
    const entryRepo = new DrizzleEntryRepository();

    container.registerRepositories(boardRepo, metricRepo, entryRepo);
    isInitialized = true;
}
