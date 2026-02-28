import { NextResponse } from "next/server";
import { bootstrapDI } from "@/lib/di/bootstrap";
import { container } from "@/lib/di/container";

// Initialize DI Container
bootstrapDI();
const boardService = container.getBoardService();
// We also need access to the repository for creation, so let's get it from the container or service
// For now, we'll instantiate just the repo we need, but ideally the service handles creation
import { DrizzleBoardRepository } from "@peak/db";
const boardRepo = new DrizzleBoardRepository();

export async function GET() {
    try {
        const boardsWithProgress = await boardService.getBoardsWithProgress();
        return NextResponse.json(boardsWithProgress);
    } catch (error) {
        console.error("Failed to fetch boards:", error);
        return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const upperName = name.trim().toUpperCase();
        const newBoard = await boardRepo.create({ ...body, name: upperName });
        return NextResponse.json(newBoard, { status: 201 });
    } catch (error) {
        console.error("Failed to create board:", error);
        return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
    }
}
