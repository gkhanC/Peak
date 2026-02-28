import * as React from "react";
import { BaseMetric } from "@peak/core";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface GoalPresenterProps {
    metric: BaseMetric;
    onLog: () => void;
    isLoading: boolean;
}

export function GoalPresenter({ metric, onLog, isLoading }: GoalPresenterProps) {
    const isDescending = metric.progressDirection === 'Descending';
    const startingValue = metric.schema && typeof metric.schema === 'object' && 'startingValue' in metric.schema
        ? Number((metric.schema as any).startingValue)
        : 0;

    const accumulatedCount = metric.dayAggregates.length > 0 ? metric.dayAggregates[metric.dayAggregates.length - 1].cumulative : 0;
    const totalCount = isDescending ? startingValue + accumulatedCount : accumulatedCount;
    const effectiveTarget = metric.target !== null ? metric.target : (isDescending ? 0 : null);

    const isGoalComplete = effectiveTarget !== null ? (isDescending ? totalCount <= effectiveTarget : totalCount >= effectiveTarget) : false;

    let goalPercentage = 0;
    if (effectiveTarget !== null) {
        if (isDescending) {
            // e.g. start at 500, target 0. Current 400. Progress = (500-400)/(500-0) = 20%
            const totalToLoose = startingValue - effectiveTarget;
            const lostSoFar = startingValue - totalCount;
            goalPercentage = totalToLoose !== 0 ? Math.min(100, Math.round((lostSoFar / totalToLoose) * 100)) : 0;
        } else {
            goalPercentage = Math.min(100, Math.round((totalCount / effectiveTarget) * 100));
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner">
            {isGoalComplete && (
                <div className="absolute top-3 right-3 text-emerald-400 z-10 animate-bounce">
                    <CheckCircle2 className="h-6 w-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                </div>
            )}
            <div className="flex items-center gap-1.5 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <div className={`text-7xl font-black tracking-tighter transition-all duration-700 ${isGoalComplete ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-110' : 'text-white'}`}>
                    {totalCount}
                </div>
                {effectiveTarget !== null && (
                    <>
                        <span className="text-3xl font-black text-neutral-600 mt-4">/</span>
                        <div className="text-4xl font-black text-yellow-400 mt-4 tracking-tighter">{effectiveTarget}</div>
                    </>
                )}
            </div>
            {effectiveTarget !== null && (
                <div className="w-full mt-6 space-y-4 px-1 group/target">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isGoalComplete ? 'text-emerald-400' : 'text-cyan-400'} animate-pulse`}>
                                {isGoalComplete ? 'Goal Achieved' : 'Goal Target'}
                            </span>
                            <span className="text-2xl font-black text-white leading-none mt-1">{goalPercentage}%</span>
                        </div>
                    </div>
                    <Progress value={goalPercentage} className={`h-3 bg-white/5 ${isGoalComplete ? '[&>div]:bg-emerald-500' : '[&>div]:bg-cyan-500'}`} />
                </div>
            )}
            <div className="w-full mt-8">
                {!isGoalComplete ? (
                    <Button size="lg" className={`w-full h-14 text-xl font-black tracking-[0.2em] text-white rounded-2xl ${isDescending ? 'bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500' : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'}`} onClick={onLog} disabled={isLoading}>
                        {isLoading ? "..." : isDescending ? "-1" : "+1"}
                    </Button>
                ) : (
                    <div className="w-full h-14 flex items-center justify-center border-2 border-emerald-500/20 bg-emerald-500/10 rounded-2xl text-emerald-400 font-black tracking-[0.2em]">DONE</div>
                )}
            </div>
        </div>
    );
}
