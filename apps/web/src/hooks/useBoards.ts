import { useState, useEffect, useCallback } from "react";

export function useBoards() {
    const [boards, setBoards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBoards = useCallback(async (initial = false) => {
        if (initial) setIsLoading(true);
        try {
            const res = await fetch("/api/boards");
            if (!res.ok) throw new Error("Failed to fetch boards");
            const data = await res.json();
            setBoards(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (initial) setIsLoading(false);
        }
    }, []);

    const createBoard = async (boardData: any) => {
        const res = await fetch("/api/boards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(boardData),
        });
        if (!res.ok) throw new Error("Failed to create board");
        const newBoard = await res.json();
        setBoards(prev => [...prev, newBoard]);
        return newBoard;
    };

    useEffect(() => {
        fetchBoards(true);
    }, [fetchBoards]);

    return { boards, setBoards, isLoading, error, refresh: fetchBoards, createBoard };
}