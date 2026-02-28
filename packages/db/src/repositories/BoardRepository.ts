import { db } from "../../index";
import { boards } from "../../schema";
import { IBoardRepository, Board } from "@peak/core";
import { eq } from "drizzle-orm";

export class DrizzleBoardRepository implements IBoardRepository {
    async getAll(): Promise<Board[]> {
        const result = await db.select().from(boards).orderBy(boards.createdAt);
        return result.map(b => Board.fromPlain(b));
    }

    async getById(id: number): Promise<Board | null> {
        const result = await db.select().from(boards).where(eq(boards.id, id));
        if (result.length === 0) return null;
        return Board.fromPlain(result[0]);
    }

    async create(board: Partial<Board>): Promise<Board> {
        const inserted = await db.insert(boards).values({
            name: board.name!.toUpperCase(),
            description: board.description,
            theme: board.theme,
            tag: board.tag,
            color: board.color,
            illustration: board.illustration,
            progressionMethod: board.progressionMethod || 'sinceCreation'
        } as any).returning();
        return Board.fromPlain(inserted[0]);
    }
}
