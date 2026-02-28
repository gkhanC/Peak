import * as React from "react";
import { BaseMetric } from "@peak/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompoundPresenterProps {
    metric: BaseMetric;
    onLog: (set: number, rep: number) => void;
    isLoading: boolean;
}

export function CompoundPresenter({ metric, onLog, isLoading }: CompoundPresenterProps) {
    const [set, setSet] = React.useState("");
    const [rep, setRep] = React.useState("");

    const handleLog = () => {
        if (!set || !rep) return;
        onLog(Number(set), Number(rep));
        setSet("");
        setRep("");
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-2">
                    <Input type="number" placeholder="Sets" className="h-12 bg-black/40 border-white/5 text-lg font-bold text-center rounded-xl" value={set} onChange={(e) => setSet(e.target.value)} disabled={isLoading} />
                    <div className="flex items-center text-neutral-600 font-black px-1">×</div>
                    <Input type="number" placeholder="Reps" className="h-12 bg-black/40 border-white/5 text-lg font-bold text-center rounded-xl" value={rep} onChange={(e) => setRep(e.target.value)} disabled={isLoading} onKeyDown={(e) => e.key === 'Enter' && handleLog()} />
                </div>
                <Button size="lg" className="h-12 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 hover:from-slate-600 hover:to-slate-800 text-white rounded-xl font-bold px-8" onClick={handleLog} disabled={isLoading}>Push</Button>
            </div>
        </div>
    );
}
