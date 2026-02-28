import { useState, useEffect, useCallback } from "react";

export function useBoardHistory(boardId: number) {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async (initial = false) => {
        if (initial) setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/history`);
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            setHistory(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (initial) setIsLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchHistory(true);
    }, [fetchHistory]);

    return { history, isLoading, error, refresh: fetchHistory };
}
