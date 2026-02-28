import * as React from "react";
import { BaseMetric } from "@peak/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MeasurementPresenterProps {
    metric: BaseMetric;
    onLog: (val: number) => void;
    isLoading: boolean;
}

export function MeasurementPresenter({ metric, onLog, isLoading }: MeasurementPresenterProps) {
    const [val, setVal] = React.useState("");
    const latestValue = metric.dayAggregates.length > 0 ? metric.dayAggregates[metric.dayAggregates.length - 1].val : null;

    const handleLog = () => {
        if (!val) return;
        onLog(Number(val));
        setVal("");
    };

    const unit = metric.schema?.unit || "";

    return (
        <div className="flex flex-col sm:flex-row gap-8 items-end w-full">
            <div className="flex-grow w-full">
                <div className="flex flex-col gap-2 mb-6">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest">{unit ? `NEW ENTRY (${unit})` : "NEW ENTRY"}</label>
                    <div className="flex items-center gap-3">
                        <Input type="number" step="any" placeholder="Record value..." className="h-12 bg-black/40 border-white/5 text-lg font-bold rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={val} onChange={(e) => setVal(e.target.value)} disabled={isLoading} onKeyDown={(e) => e.key === 'Enter' && handleLog()} />
                        <Button size="lg" className="h-12 bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-700 rounded-xl font-bold px-8 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" onClick={handleLog} disabled={isLoading}>SAVE</Button>
                    </div>
                </div>
            </div>
            <div className="shrink-0 flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-black mb-1">LATEST PEAK</span>
                <div className="text-6xl font-black text-white tracking-tighter flex items-baseline gap-1">
                    {latestValue !== null ? latestValue : '--'}
                    {unit && <span className="text-xl text-neutral-600">{unit}</span>}
                </div>
            </div>
        </div>
    );
}
