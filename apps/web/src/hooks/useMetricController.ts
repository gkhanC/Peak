import * as React from "react";
import { BaseMetric, MetricFactory } from "@peak/core";

export function useMetricController(initialMetricData: any) {
    const [metric, setMetric] = React.useState<BaseMetric>(MetricFactory.create(initialMetricData));
    const [history, setHistory] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFlipped, setIsFlipped] = React.useState(false);

    const fetchHistory = React.useCallback(async () => {
        try {
            const [entriesRes, metricRes] = await Promise.all([
                fetch(`/api/entries?metricId=${metric.id}`),
                fetch(`/api/metrics/${metric.id}`)
            ]);

            if (entriesRes.ok) {
                const data = await entriesRes.json();
                const desc = data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setHistory(desc);
            }

            if (metricRes.ok) {
                const hydratedMetricData = await metricRes.json();
                setMetric(MetricFactory.create(hydratedMetricData));
            }
        } catch (e) { console.error(e) }
    }, [metric.id]);

    const logValue = async (data: any) => {
        setIsLoading(true);
        try {
            await fetch("/api/entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metricId: metric.id, data })
            });
            await fetchHistory();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return {
        metric,
        history,
        isLoading,
        isFlipped,
        setIsFlipped,
        logValue,
        refresh: fetchHistory
    };
}

