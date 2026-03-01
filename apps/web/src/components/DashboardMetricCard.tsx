"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCw } from "lucide-react";
import { ProgressionMethod } from "@/types";
import { useMetricController } from "@/hooks/useMetricController";
import { GoalPresenter } from "./presenters/GoalPresenter";
import { MeasurementPresenter } from "./presenters/MeasurementPresenter";
import { CompoundPresenter } from "./presenters/CompoundPresenter";
import { ChecklistPresenter } from "./presenters/ChecklistPresenter";
import { HistoryPresenter } from "./presenters/HistoryPresenter";
import { CountTimePresenter } from "./presenters/CountTimePresenter";
import { MeasurementTimePresenter } from "./presenters/MeasurementTimePresenter";
import { SetRepPresenter } from "./presenters/SetRepPresenter";
import { SetMeasurementPresenter } from "./presenters/SetMeasurementPresenter";
import { SetRepTimePresenter } from "./presenters/SetRepTimePresenter";
import { SetMeasurementTimePresenter } from "./presenters/SetMeasurementTimePresenter";
import { SetRepMeasurementPresenter } from "./presenters/SetRepMeasurementPresenter";
import { MetricChart } from "./presenters/MetricChart";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Settings, Database, Trash2, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";
import { MetricSettingsDialog } from "./MetricSettingsDialog";
import { ManageDataDialog } from "./ManageDataDialog";
import { ChecklistProgressBoxes } from "./presenters/ChecklistProgressBoxes";

function CircularProgress({ percent, isImprovement, size = 60 }: { percent: number, isImprovement: boolean, size?: number }) {
    const strokeWidth = Math.max(2, size * 0.08); // Responsive stroke
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const absPercent = Math.min(100, Math.abs(percent));
    const offset = circumference - (absPercent / 100) * circumference;
    const color = isImprovement ? "#10b981" : "#ef4444";

    return (
        <div className="relative flex items-center justify-center shadow-inner rounded-full bg-black/20" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-md">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#ffffff10" strokeWidth={strokeWidth} fill="transparent" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none" style={{ transform: `scale(${size / 50})` }}>
                <span className="text-[10px] font-black text-white">{Math.abs(Math.round(percent))}%</span>
                <span className={`text-[8px] font-black uppercase ${isImprovement ? 'text-emerald-500' : 'text-red-500'} -mt-[1px]`}>
                    {isImprovement ? 'UP' : 'DN'}
                </span>
            </div>
        </div>
    );
}

interface DashboardMetricCardProps {
    metric: any;
    boardName: string;
    onLog?: () => void;
    boardProgressionMethod?: ProgressionMethod;
    showLineGraphics?: boolean;
}

export function DashboardMetricCard({ metric: initialMetric, boardName, onLog, boardProgressionMethod, showLineGraphics = false }: DashboardMetricCardProps) {
    const {
        metric,
        history,
        isLoading,
        isFlipped,
        setIsFlipped,
        logValue
    } = useMetricController(initialMetric);

    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isSettingsDeleteMode, setIsSettingsDeleteMode] = React.useState(false);
    const [isManageDataOpen, setIsManageDataOpen] = React.useState(false);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const [quickCount, setQuickCount] = React.useState("");
    const [quickMeasurement, setQuickMeasurement] = React.useState("");
    const [quickTime, setQuickTime] = React.useState("");
    const [quickSet, setQuickSet] = React.useState("");
    const [quickRep, setQuickRep] = React.useState("");
    const [quickValue, setQuickValue] = React.useState("");

    const [chartMode, setChartMode] = React.useState<'Time' | 'Value'>('Time');
    // For calculating the main delta text, we'll continue using 'sinceCreation' logic for consistency unless defined by board.
    const deltaMethod = boardProgressionMethod || 'sinceCreation';
    const progressionDelta = metric.calculateProgression(deltaMethod as any);

    const chartData = React.useMemo(() => {
        if (chartMode === 'Time') {
            if (!metric.dayAggregates) return [];
            return metric.dayAggregates.map((agg: any) => {
                const dateStr = new Date(agg.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                let baseValue = metric.type === 'Count' || metric.type === 'Goal' ? agg.cumulative : agg.val;

                // Specific mappings
                if (metric.type === 'CompoundValue') return { name: dateStr, value: agg.val, raw: agg.val };
                if (metric.type === 'SetRep') return { name: dateStr, value: (agg.val?.set || 0) * (agg.val?.rep || 0), raw: agg.val };
                if (metric.type === 'SetMeasurement') return { name: dateStr, value: (agg.val?.set || 0) * (agg.val?.measurement || 0), raw: agg.val };

                if ((metric.type as any) === 'CountTime') {
                    const c = agg.val?.count || 0;
                    const t = agg.val?.time || 0;
                    return { name: dateStr, value: t > 0 ? Number((c / t).toFixed(2)) : c, raw: agg.val };
                }
                if ((metric.type as any) === 'MeasurementTime') {
                    const m = agg.val?.measurement || 0;
                    const t = agg.val?.time || 0;
                    return { name: dateStr, value: t > 0 ? Number((m / t).toFixed(2)) : m, raw: agg.val };
                }
                if (metric.type === 'SetRepTime') {
                    const s = agg.val?.set || 0;
                    const r = agg.val?.rep || 0;
                    const t = agg.val?.time || 0;
                    const sr = s * r;
                    return { name: dateStr, value: t > 0 ? Number((sr / t).toFixed(2)) : sr, raw: agg.val };
                }
                if (metric.type === 'SetMeasurementTime') {
                    const s = agg.val?.set || 0;
                    const m = agg.val?.measurement || 0;
                    const t = agg.val?.time || 0;
                    const sm = s * m;
                    return { name: dateStr, value: t > 0 ? Number((sm / t).toFixed(2)) : sm, raw: agg.val };
                }
                if (metric.type === 'SetRepMeasurement') {
                    const s = agg.val?.set || 0;
                    const r = agg.val?.rep || 0;
                    const m = agg.val?.measurement || 0;
                    const srm = s * r * m;
                    return { name: dateStr, value: srm, raw: agg.val };
                }

                return { name: dateStr, value: baseValue, raw: { value: baseValue } };
            });
        } else {
            // VALUE mode (raw history)
            if (!history || history.length === 0) return [];
            return history.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(entry => {
                const dateStr = new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                let valToMap = entry.data?.value || 0;

                if (metric.type === 'SetRep') valToMap = (entry.data?.set || 0) * (entry.data?.rep || 0);
                if (metric.type === 'SetMeasurement') valToMap = (entry.data?.set || 0) * (entry.data?.measurement || 0);

                if ((metric.type as any) === 'CountTime') {
                    const c = entry.data?.count || 0;
                    const t = entry.data?.time || 0;
                    valToMap = t > 0 ? Number((c / t).toFixed(2)) : c;
                }
                if ((metric.type as any) === 'MeasurementTime') {
                    const m = entry.data?.measurement || 0;
                    const t = entry.data?.time || 0;
                    valToMap = t > 0 ? Number((m / t).toFixed(2)) : m;
                }
                if (metric.type === 'SetRepTime') {
                    const s = entry.data?.set || 0;
                    const r = entry.data?.rep || 0;
                    const t = entry.data?.time || 0;
                    valToMap = t > 0 ? Number(((s * r) / t).toFixed(2)) : (s * r);
                }
                if (metric.type === 'SetMeasurementTime') {
                    const s = entry.data?.set || 0;
                    const m = entry.data?.measurement || 0;
                    const t = entry.data?.time || 0;
                    valToMap = t > 0 ? Number(((s * m) / t).toFixed(2)) : (s * m);
                }
                if (metric.type === 'SetRepMeasurement') {
                    const s = entry.data?.set || 0;
                    const r = entry.data?.rep || 0;
                    const m = entry.data?.measurement || 0;
                    valToMap = s * r * m;
                }

                return { name: dateStr, value: valToMap, raw: entry.data };
            });
        }
    }, [metric, history, chartMode]);

    // Calculate current display value
    const latestAgg = metric.dayAggregates && metric.dayAggregates.length > 0
        ? metric.dayAggregates[metric.dayAggregates.length - 1]
        : null;

    const startingValue = typeof metric.schema === 'object' && metric.schema !== null && 'startingValue' in metric.schema
        ? Number(metric.schema.startingValue)
        : 0;

    let currentValueDisplay: string | number = "0";
    if (metric.type === 'Count' || metric.type === 'Goal') {
        const isDescending = metric.progressDirection === 'Descending';
        if (latestAgg) {
            currentValueDisplay = isDescending ? startingValue + latestAgg.cumulative : latestAgg.cumulative;
        } else {
            currentValueDisplay = isDescending ? startingValue : 0;
        }
    } else if (metric.type === 'CompoundValue' || metric.type === 'SingleValue') {
        if (latestAgg) currentValueDisplay = latestAgg.val;
    } else if (metric.type === 'Checklist') {
        const items = metric.schema?.items;
        if (Array.isArray(items) && items.length > 0) {
            const completed = items.filter((i: any) => i.completed).length;
            currentValueDisplay = `${completed}/${items.length}`;
        } else {
            currentValueDisplay = "0/0";
        }
    } else if (metric.type === 'Measurement') {
        const unit = metric.schema?.unit || '';
        if (latestAgg) currentValueDisplay = unit ? `${latestAgg.val} <span class="text-lg text-neutral-500">${unit}</span>` : latestAgg.val;
    } else if ((metric.type as any) === 'CountTime') {
        if (latestAgg && latestAgg.val) {
            currentValueDisplay = `<span class="text-emerald-400 mr-2"><span class="text-[10px] text-emerald-900 mr-1 uppercase">Count</span>${(latestAgg.val as any).count || 0}</span><span class="text-amber-400"><span class="text-[10px] text-amber-900 mr-1 uppercase">Time</span>${(latestAgg.val as any).time || 0}</span>`;
        } else {
            currentValueDisplay = `<span class="text-emerald-400 mr-2"><span class="text-[10px] text-emerald-900 mr-1 uppercase">Count</span>0</span><span class="text-amber-400"><span class="text-[10px] text-amber-900 mr-1 uppercase">Time</span>0</span>`;
        }
    } else if ((metric.type as any) === 'MeasurementTime') {
        if (latestAgg && latestAgg.val) {
            currentValueDisplay = `<span class="text-indigo-400 mr-2"><span class="text-[10px] text-indigo-900 mr-1 uppercase">Unit</span>${(latestAgg.val as any).measurement || 0}</span><span class="text-amber-400"><span class="text-[10px] text-amber-900 mr-1 uppercase">Time</span>${(latestAgg.val as any).time || 0}</span>`;
        } else {
            currentValueDisplay = `<span class="text-indigo-400 mr-2"><span class="text-[10px] text-indigo-900 mr-1 uppercase">Unit</span>0</span><span class="text-amber-400"><span class="text-[10px] text-amber-900 mr-1 uppercase">Time</span>0</span>`;
        }
    } else if (metric.type === 'SetRep') {
        if (latestAgg && latestAgg.val) currentValueDisplay = `<span class="text-[10px] text-neutral-500 mr-1">SETS</span>${latestAgg.val.set || 0} <span class="text-neutral-600 font-bold px-1">×</span> <span class="text-[10px] text-neutral-500 mr-1">REPS</span>${latestAgg.val.rep || 0}`;
    } else if (metric.type === 'SetMeasurement') {
        const unitLabel = metric.schema?.unit || 'UNIT';
        if (latestAgg && latestAgg.val) currentValueDisplay = `<span class="text-[10px] text-neutral-500 mr-1">SETS</span>${latestAgg.val.set || 0} <span class="text-neutral-600 font-bold px-1">×</span> <span class="text-[10px] text-neutral-500 mr-1 uppercase">${unitLabel}</span>${latestAgg.val.measurement || 0}`;
    } else if (metric.type === 'SetRepTime') {
        if (latestAgg && latestAgg.val) currentValueDisplay = `<span class="text-[10px] text-neutral-500 mr-1">SETS</span>${latestAgg.val.set || 0} <span class="text-[10px] text-neutral-500 mr-1 ml-2">REPS</span>${latestAgg.val.rep || 0} <span class="text-amber-500 ml-2"><span class="text-[10px] text-amber-900 mr-1">TIME</span>${latestAgg.val.time || 0}</span>`;
    } else if (metric.type === 'SetMeasurementTime') {
        const unitLabel = metric.schema?.unit || 'UNIT';
        if (latestAgg && latestAgg.val) currentValueDisplay = `<span class="text-[10px] text-neutral-500 mr-1">SETS</span>${latestAgg.val.set || 0} <span class="text-[10px] text-neutral-500 mr-1 ml-2 uppercase">${unitLabel}</span>${latestAgg.val.measurement || 0} <span class="text-amber-500 ml-2"><span class="text-[10px] text-amber-900 mr-1">TIME</span>${latestAgg.val.time || 0}</span>`;
    } else if (metric.type === 'SetRepMeasurement') {
        const unitLabel = metric.schema?.unit || 'UNIT';
        if (latestAgg && latestAgg.val) currentValueDisplay = `<span class="text-[10px] text-neutral-500 mr-1">SETS</span>${latestAgg.val.set || 0} <span class="text-[10px] text-neutral-500 mr-1 ml-2">REPS</span>${latestAgg.val.rep || 0} <span class="text-[10px] text-neutral-500 mr-1 ml-2 uppercase">${unitLabel}</span>${latestAgg.val.measurement || 0}`;
    }

    const targetDisplay = metric.target !== null ? metric.target : null;

    return (
        <Card className={`col-span-1 border-slate-800 bg-[#09090b] ${isExpanded ? 'lg:col-span-2' : ''} flex flex-col relative shadow-2xl transition-all hover:border-slate-700`}>
            <div className={`flex flex-col w-full rounded-xl overflow-hidden transition-all duration-500 [backface-visibility:hidden] ${isFlipped && isExpanded ? '[transform:rotateY(180deg)] absolute inset-0 opacity-0 pointer-events-none' : ''}`}>
                <CardHeader
                    className="flex flex-row flex-wrap xl:flex-nowrap items-center justify-between p-3 lg:p-4 cursor-pointer hover:bg-white/5 transition-colors gap-y-4 gap-x-6 min-h-[80px]"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {/* 1. Metric Info */}
                    <div className="flex flex-col overflow-hidden w-full sm:w-1/3 xl:w-[180px] shrink-0">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-100 flex-wrap">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-neutral-500 shrink-0" />}
                            <span className="truncate">{metric.name}</span>
                        </CardTitle>
                        <div className="pl-6 mt-0.5">
                            <span className="text-[10px] text-neutral-500 opacity-60 tracking-widest uppercase font-bold">
                                {metric.type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        </div>
                        {isExpanded && (
                            <div className="flex items-center gap-1 pl-6">
                                {(['Time', 'Value'] as const).map(m => (
                                    <Button
                                        key={m}
                                        variant="ghost"
                                        size="sm"
                                        className={`h-5 px-1.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${chartMode === m ? 'bg-white text-black' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                                        onClick={(e) => { e.stopPropagation(); setChartMode(m); }}
                                    >
                                        {m}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Progression Graph (Restored for Board page line mode) */}
                    {!isExpanded && showLineGraphics && metric.type !== 'Checklist' && (
                        <div className="hidden xl:flex items-center w-[120px] shrink-0 h-12 mx-4 opacity-50 hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                                <AreaChart data={chartData.slice(-7)}>
                                    <defs>
                                        <linearGradient id={`lineGrad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={progressionDelta.percentage >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={progressionDelta.percentage >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={progressionDelta.percentage >= 0 ? "#10b981" : "#ef4444"}
                                        strokeWidth={2}
                                        fill={`url(#lineGrad-${metric.id})`}
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {!isExpanded && showLineGraphics && metric.type === 'Checklist' && (
                        <div className="hidden xl:flex items-center w-[120px] shrink-0 h-12 mx-4 overflow-hidden">
                            <ChecklistProgressBoxes metric={metric} maxBoxes={10} className="w-5 h-5" />
                        </div>
                    )}

                    {/* Right Group: Count -> Log Btn -> Circle -> Settings */}
                    <div className="flex items-center justify-end gap-3 sm:gap-6 shrink-0 w-full xl:w-auto" onClick={(e) => e.stopPropagation()}>

                        {/* 3. Counter Value */}
                        <div className="flex flex-col items-end justify-center min-w-[70px] xl:w-[100px]">
                            <div className="flex items-baseline gap-1">
                                {(metric.type as any) === 'CountTime' || (metric.type as any) === 'MeasurementTime' || metric.type === 'SetRep' || metric.type === 'SetMeasurement' || metric.type === 'SetRepTime' || metric.type === 'SetMeasurementTime' || metric.type === 'SetRepMeasurement' || metric.type === 'Measurement' ? (
                                    <span className="text-xl font-black text-white tracking-tighter leading-none flex items-center" dangerouslySetInnerHTML={{ __html: currentValueDisplay as string }} />
                                ) : metric.type === 'Checklist' ? (
                                    <span className="text-2xl font-black text-white tracking-tighter leading-none flex items-baseline">
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest mr-1.5 font-bold">Done</span>
                                        {currentValueDisplay}
                                    </span>
                                ) : metric.type === 'Count' || metric.type === 'Goal' ? (
                                    <span className="text-2xl font-black text-white tracking-tighter leading-none flex items-baseline">
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest mr-1.5 font-bold">Total</span>
                                        {currentValueDisplay}
                                    </span>
                                ) : (
                                    <span className="text-2xl font-black text-white tracking-tighter leading-none whitespace-pre">
                                        {currentValueDisplay}
                                    </span>
                                )}
                            </div>
                            {targetDisplay !== null && <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase leading-none mt-1">Target {targetDisplay}</span>}
                        </div>

                        {/* 4. Inline Inputs for CountTime */}
                        {!isExpanded && ((metric.type as any) === 'CountTime') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-emerald-500/50">C</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-emerald-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickCount}
                                            onChange={(e) => setQuickCount(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-amber-500/50">T</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-amber-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickTime}
                                            onChange={(e) => setQuickTime(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickCount === "" || quickTime === "") return;
                                            await logValue({ count: Number(quickCount), time: Number(quickTime) });
                                            setQuickCount("");
                                            setQuickTime("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickCount === "" || quickTime === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for MeasurementTime */}
                        {!isExpanded && ((metric.type as any) === 'MeasurementTime') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-indigo-500/50">U</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-indigo-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickMeasurement}
                                            onChange={(e) => setQuickMeasurement(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-amber-500/50">T</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-amber-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickTime}
                                            onChange={(e) => setQuickTime(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickMeasurement === "" || quickTime === "") return;
                                            await logValue({ measurement: Number(quickMeasurement), time: Number(quickTime) });
                                            setQuickMeasurement("");
                                            setQuickTime("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickMeasurement === "" || quickTime === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for Set & Rep (CompoundValue, SetRep) */}
                        {!isExpanded && (metric.type === 'CompoundValue' || metric.type === 'SetRep') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">S</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickSet}
                                            onChange={(e) => setQuickSet(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">R</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickRep}
                                            onChange={(e) => setQuickRep(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickSet === "" || quickRep === "") return;
                                            await logValue({ set: Number(quickSet), rep: Number(quickRep) });
                                            setQuickSet("");
                                            setQuickRep("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickSet === "" || quickRep === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for SetMeasurement */}
                        {!isExpanded && (metric.type === 'SetMeasurement') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">S</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickSet}
                                            onChange={(e) => setQuickSet(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-indigo-500/50">U</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-indigo-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickMeasurement}
                                            onChange={(e) => setQuickMeasurement(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickSet === "" || quickMeasurement === "") return;
                                            await logValue({ set: Number(quickSet), measurement: Number(quickMeasurement) });
                                            setQuickSet("");
                                            setQuickMeasurement("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickSet === "" || quickMeasurement === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for SetRepTime */}
                        {!isExpanded && (metric.type === 'SetRepTime') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">S</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-1.5 pl-4" placeholder="0" value={quickSet} onChange={(e) => setQuickSet(e.target.value)} type="number" step="any" />
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">R</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-1.5 pl-4" placeholder="0" value={quickRep} onChange={(e) => setQuickRep(e.target.value)} type="number" step="any" />
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-amber-500/50">T</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-amber-500 text-right pr-1.5 pl-4" placeholder="0" value={quickTime} onChange={(e) => setQuickTime(e.target.value)} type="number" step="any" />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickSet === "" || quickRep === "" || quickTime === "") return;
                                            await logValue({ set: Number(quickSet), rep: Number(quickRep), time: Number(quickTime) });
                                            setQuickSet("");
                                            setQuickRep("");
                                            setQuickTime("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickSet === "" || quickRep === "" || quickTime === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for SetMeasurementTime */}
                        {!isExpanded && (metric.type === 'SetMeasurementTime') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">S</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-1.5 pl-4" placeholder="0" value={quickSet} onChange={(e) => setQuickSet(e.target.value)} type="number" step="any" />
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-indigo-500/50">U</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-indigo-500 text-right pr-1.5 pl-4" placeholder="0" value={quickMeasurement} onChange={(e) => setQuickMeasurement(e.target.value)} type="number" step="any" />
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-amber-500/50">T</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-amber-500 text-right pr-1.5 pl-4" placeholder="0" value={quickTime} onChange={(e) => setQuickTime(e.target.value)} type="number" step="any" />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickSet === "" || quickMeasurement === "" || quickTime === "") return;
                                            await logValue({ set: Number(quickSet), measurement: Number(quickMeasurement), time: Number(quickTime) });
                                            setQuickSet("");
                                            setQuickMeasurement("");
                                            setQuickTime("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickSet === "" || quickMeasurement === "" || quickTime === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for SetRepMeasurement */}
                        {!isExpanded && (metric.type === 'SetRepMeasurement') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">S</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-1.5 pl-4" placeholder="0" value={quickSet} onChange={(e) => setQuickSet(e.target.value)} type="number" step="any" />
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-neutral-500">R</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-neutral-500 text-right pr-1.5 pl-4" placeholder="0" value={quickRep} onChange={(e) => setQuickRep(e.target.value)} type="number" step="any" />
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                                    <div className="relative">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-indigo-500/50">U</span>
                                        <Input className="w-12 h-8 text-xs bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-indigo-500 text-right pr-1.5 pl-4" placeholder="0" value={quickMeasurement} onChange={(e) => setQuickMeasurement(e.target.value)} type="number" step="any" />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickSet === "" || quickRep === "" || quickMeasurement === "") return;
                                            await logValue({ set: Number(quickSet), rep: Number(quickRep), measurement: Number(quickMeasurement) });
                                            setQuickSet("");
                                            setQuickRep("");
                                            setQuickMeasurement("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickSet === "" || quickRep === "" || quickMeasurement === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Inline Inputs for SingleValue, Measurement */}
                        {!isExpanded && (metric.type === 'SingleValue' || metric.type === 'Measurement') && (
                            <div className="xl:w-[220px] flex justify-end">
                                <div className="flex items-center justify-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-indigo-500/50">V</span>
                                        <Input
                                            className="w-14 h-8 text-sm bg-transparent border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-indigo-500 text-right pr-2 pl-5"
                                            placeholder="0"
                                            value={quickValue}
                                            onChange={(e) => setQuickValue(e.target.value)}
                                            type="number"
                                            step="any"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded shadow-[0_0_10px_rgba(0,0,0,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all transform hover:scale-105 ml-1"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (quickValue === "") return;
                                            await logValue({ value: Number(quickValue) });
                                            setQuickValue("");
                                            if (onLog) onLog();
                                        }}
                                        disabled={isLoading || quickValue === ""}
                                    >
                                        {isLoading ? "..." : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* 4.5. Log Button for others */}
                        {!isExpanded && (metric.type === 'Goal' || metric.type === 'Count') && (
                            <div className="flex items-center justify-end xl:w-[220px]">
                                <Button
                                    size="icon"
                                    className={`h-8 w-8 shrink-0 rounded shadow-[0_0_15px_rgba(0,0,0,0.6)] border border-white/20 ${metric.progressDirection === 'Descending' ? 'bg-gradient-to-br from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600'} text-white transition-all transform hover:scale-105`}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const valToLog = metric.progressDirection === 'Descending' ? -1 : 1;
                                        await logValue({ value: valToLog });
                                        if (onLog) onLog();
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "..." : metric.progressDirection === 'Descending' ? <Minus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} /> : <Plus className="h-4 w-4 font-black drop-shadow-md" strokeWidth={3} />}
                                </Button>
                            </div>
                        )}

                        {/* 5. Circular Progress */}
                        <div className="shrink-0 flex items-center justify-center xl:w-[50px]">
                            <CircularProgress percent={progressionDelta.percentage} isImprovement={progressionDelta.percentage >= 0} size={isExpanded ? 54 : 44} />
                        </div>

                        {/* 6. Settings Menu */}
                        <div className="xl:w-[32px] flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#09090b] border-slate-800 text-slate-300 shadow-[0_0_20px_rgba(30,58,138,0.2)]">
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 hover:text-white" onSelect={() => { setIsSettingsDeleteMode(false); setIsSettingsOpen(true); }}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 hover:text-white" onSelect={() => setIsManageDataOpen(true)}>
                                        <Database className="mr-2 h-4 w-4" />
                                        <span>Manage Data</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer hover:bg-red-500/10 text-red-500 hover:text-red-400" onSelect={() => { setIsSettingsDeleteMode(true); setIsSettingsOpen(true); }}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Metric</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                {isExpanded && (
                    <div className="p-4 pt-2 space-y-4 flex-grow flex flex-col justify-end">
                        <div className="flex flex-col sm:flex-row items-stretch justify-between h-full pt-2 gap-4 relative">
                            <div className="w-full sm:w-[40%] flex flex-col gap-4">
                                <div>
                                    {metric.type === 'Goal' || metric.type === 'Count' ? (
                                        <GoalPresenter
                                            metric={metric}
                                            onLog={async () => {
                                                const valToLog = metric.progressDirection === 'Descending' ? -1 : 1;
                                                await logValue({ value: valToLog });
                                                if (onLog) onLog();
                                            }}
                                            isLoading={isLoading}
                                        />
                                    ) : metric.type === 'CompoundValue' ? (
                                        <CompoundPresenter metric={metric} onLog={async (s, r) => { await logValue({ set: s, rep: r }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : metric.type === 'Checklist' ? (
                                        <ChecklistPresenter
                                            metric={metric}
                                            isLoading={isLoading}
                                            onUpdateSchema={async (s) => {
                                                await fetch(`/api/metrics/${metric.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schema: s }) });
                                                if (onLog) onLog();
                                            }}
                                            onLog={async (perc) => { await logValue({ value: perc }); if (onLog) onLog(); }}
                                        />
                                    ) : (metric.type as any) === 'CountTime' ? (
                                        <CountTimePresenter metric={metric} onLog={async (count, time) => { await logValue({ count, time }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : (metric.type as any) === 'MeasurementTime' ? (
                                        <MeasurementTimePresenter metric={metric} onLog={async (measurement, time) => { await logValue({ measurement, time }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : metric.type === 'SetRep' ? (
                                        <SetRepPresenter metric={metric} onLog={async (s, r) => { await logValue({ set: s, rep: r }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : metric.type === 'SetMeasurement' ? (
                                        <SetMeasurementPresenter metric={metric} onLog={async (s, m) => { await logValue({ set: s, measurement: m }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : metric.type === 'SetRepTime' ? (
                                        <SetRepTimePresenter metric={metric} onLog={async (s, r, t) => { await logValue({ set: s, rep: r, time: t }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : metric.type === 'SetMeasurementTime' ? (
                                        <SetMeasurementTimePresenter metric={metric} onLog={async (s, m, t) => { await logValue({ set: s, measurement: m, time: t }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : metric.type === 'SetRepMeasurement' ? (
                                        <SetRepMeasurementPresenter metric={metric} onLog={async (s, r, m) => { await logValue({ set: s, rep: r, measurement: m }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    ) : (
                                        <MeasurementPresenter metric={metric} onLog={async (v) => { await logValue({ value: v }); if (onLog) onLog(); }} isLoading={isLoading} />
                                    )}
                                </div>
                                {metric.type !== 'Checklist' && (
                                    <div className="hidden sm:flex flex-col bg-black/40 rounded-xl border border-white/5 p-3 pb-8 flex-grow overflow-hidden relative">
                                        <h4 className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">Recent Logs</h4>
                                        <div className="flex flex-col gap-2 overflow-y-auto">
                                            {history && history.length > 0 ? history.slice(0, 5).map((entry, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-black/30 px-2 py-1.5 rounded-md border border-white/5">
                                                    <span className="text-xs text-slate-300 font-medium">
                                                        {(metric.type as any) === 'CountTime' ? `C: ${entry.data.count || 0}  T: ${entry.data.time || 0}`
                                                            : (metric.type as any) === 'MeasurementTime' ? `U: ${entry.data.measurement || 0}  T: ${entry.data.time || 0}`
                                                                : metric.type === 'SetRep' ? `${entry.data.set || 0}S × ${entry.data.rep || 0}R`
                                                                    : metric.type === 'SetMeasurement' ? `${entry.data.set || 0}S × ${entry.data.measurement || 0}${metric.schema?.unit || 'U'}`
                                                                        : metric.type === 'SetRepTime' ? `${entry.data.set || 0}S × ${entry.data.rep || 0}R in ${entry.data.time || 0}T`
                                                                            : metric.type === 'SetMeasurementTime' ? `${entry.data.set || 0}S × ${entry.data.measurement || 0}${metric.schema?.unit || 'U'} in ${entry.data.time || 0}T`
                                                                                : metric.type === 'SetRepMeasurement' ? `${entry.data.set || 0}S × ${entry.data.rep || 0}R × ${entry.data.measurement || 0}${metric.schema?.unit || 'U'}`
                                                                                    : metric.type === 'CompoundValue' ? `${entry.data.set}s, ${entry.data.rep}r`
                                                                                        : entry.data.value}
                                                    </span>
                                                    <span className="text-[9px] text-neutral-500">
                                                        {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            )) : (
                                                <div className="text-xs text-neutral-600 mt-2">No history.</div>
                                            )}
                                        </div>
                                        <Button variant="link" size="sm" className="absolute bottom-1 right-2 p-0 h-auto text-[10px] text-cyan-500 hover:text-cyan-400" onClick={(e) => { e.stopPropagation(); setIsManageDataOpen(true); }}>View All</Button>
                                    </div>
                                )}
                            </div>
                            <div className="w-full sm:w-[60%] h-[180px] sm:h-auto bg-black/20 rounded-2xl overflow-hidden border border-white/5 relative shadow-inner flex flex-col">
                                <span className="absolute top-2 right-4 text-[9px] uppercase tracking-widest text-neutral-600 font-bold z-10 pointer-events-none">
                                    {chartMode === 'Time' ? 'By Day Progress' : 'Entry Distribution'}
                                </span>
                                <MetricChart metric={metric} chartData={chartData} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className={`flex flex-col h-full w-full bg-[#050505] p-6 transition-all duration-500 [transform:rotateY(180deg)] [backface-visibility:hidden] ${!isFlipped ? 'absolute inset-0 opacity-0 pointer-events-none' : ''}`}>
                    <HistoryPresenter metric={metric} history={history} onBack={() => setIsFlipped(false)} />
                </div>
            )}

            {/* Modals */}
            <MetricSettingsDialog
                metric={metric}
                isOpen={isSettingsOpen}
                startInDeleteMode={isSettingsDeleteMode}
                onClose={() => setIsSettingsOpen(false)}
                onUpdate={() => { if (onLog) onLog(); }} // Re-use onLog to trigger board refresh for now
            />

            <ManageDataDialog
                metric={metric}
                history={history}
                isOpen={isManageDataOpen}
                onClose={() => setIsManageDataOpen(false)}
                onUpdate={() => { logValue(null as any); if (onLog) onLog(); }} // Dummy logValue call to trigger fetchHistory
            />
        </Card>
    );
}
