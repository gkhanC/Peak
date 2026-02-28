import { useState, useEffect, useCallback } from "react";

export function useMetrics(boardId?: number) {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async (initial = false) => {
        if (initial) setIsLoading(true);
        try {
            const res = await fetch("/api/metrics");
            if (!res.ok) throw new Error("Failed to fetch metrics");
            const allMetrics = await res.json();
            if (boardId) {
                setMetrics(allMetrics.filter((m: any) => m.boardId === boardId));
            } else {
                setMetrics(allMetrics);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (initial) setIsLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchMetrics(true);
    }, [fetchMetrics]);

    return { metrics, setMetrics, isLoading, error, refresh: fetchMetrics };
}
