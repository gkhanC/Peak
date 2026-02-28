import * as React from "react";
import { BaseMetric } from "@peak/core";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface HistoryPresenterProps {
    metric: BaseMetric;
    history: any[];
    onBack: () => void;
}

export function HistoryPresenter({ metric, history, onBack }: HistoryPresenterProps) {
    return (
        <div className={`flex flex-col h-full w-full bg-[#161616] p-6`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg tracking-tight uppercase text-white">Full History</h3>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                        <p className="text-sm">No activity records yet.</p>
                    </div>
                ) : (
                    history.map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center group text-sm p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all hover:translate-x-1">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span className="text-[10px] text-neutral-700 font-mono">{new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="font-black text-xl text-white tracking-tighter">
                                {metric.type === 'CompoundValue' ? `${entry.data.set}x${entry.data.rep}` :
                                    metric.type === 'SingleValue' ? entry.data[Object.keys(metric.schema || {})[0] || 'value'] :
                                        metric.type === 'Count' ? `+${entry.data.value || 1}` : 'CHECK'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
