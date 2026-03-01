import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, BarChart, Bar, Legend, CartesianGrid, YAxis } from "recharts";
import { BaseMetric } from "@peak/core";
import { ChecklistProgressBoxes } from "./ChecklistProgressBoxes";

interface MetricChartProps {
    metric: BaseMetric;
    chartData: any[];
}

const CustomTooltip = ({ active, payload, label, metric }: any) => {
    if (active && payload && payload.length) {
        const raw = payload[0].payload.raw;
        const value = payload[0].value;
        const color = payload[0].color || payload[0].fill || "#06b6d4";

        return (
            <div className="bg-[#111] border border-[#333] p-2 rounded-xl shadow-xl flex flex-col min-w-[120px]">
                <p className="text-[10px] text-neutral-400 font-bold mb-1 opacity-80">{label}</p>
                <div className="flex flex-col gap-1">
                    {/* If we have specific fragment data passed in via `raw`, render them smartly */}
                    {raw && typeof raw === 'object' ? (
                        <>
                            {raw.set !== undefined && raw.rep !== undefined && raw.time !== undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Set</span> <span className="text-white">{raw.set}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Rep</span> <span className="text-white">{raw.rep}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-amber-500/80 mr-3">Time</span> <span className="text-amber-400">{raw.time}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Rate</span> <span>{value}</span></div>
                                </>
                            )}
                            {raw.set !== undefined && raw.measurement !== undefined && raw.time !== undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Set</span> <span className="text-white">{raw.set}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3 uppercase">{metric.schema?.unit || 'Unit'}</span> <span className="text-white">{raw.measurement}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-amber-500/80 mr-3">Time</span> <span className="text-amber-400">{raw.time}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Rate</span> <span>{value}</span></div>
                                </>
                            )}
                            {raw.set !== undefined && raw.rep !== undefined && raw.measurement !== undefined && raw.time === undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Set</span> <span className="text-white">{raw.set}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Rep</span> <span className="text-white">{raw.rep}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3 uppercase">{metric.schema?.unit || 'Unit'}</span> <span className="text-white">{raw.measurement}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Total</span> <span>{value}</span></div>
                                </>
                            )}
                            {raw.set !== undefined && raw.rep !== undefined && raw.measurement === undefined && raw.time === undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Set</span> <span className="text-white">{raw.set}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Rep</span> <span className="text-white">{raw.rep}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Total</span> <span>{value}</span></div>
                                </>
                            )}
                            {raw.set !== undefined && raw.measurement !== undefined && raw.rep === undefined && raw.time === undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3">Set</span> <span className="text-white">{raw.set}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-neutral-500 mr-3 uppercase">{metric.schema?.unit || 'Unit'}</span> <span className="text-white">{raw.measurement}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Total</span> <span>{value}</span></div>
                                </>
                            )}
                            {raw.count !== undefined && raw.time !== undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-emerald-500/80 mr-3">Count</span> <span className="text-emerald-400">{raw.count}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-amber-500/80 mr-3">Time</span> <span className="text-amber-400">{raw.time}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Rate</span> <span>{value}</span></div>
                                </>
                            )}
                            {raw.measurement !== undefined && raw.time !== undefined && raw.set === undefined && (
                                <>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-indigo-500/80 mr-3 uppercase">{metric.schema?.unit || 'Unit'}</span> <span className="text-indigo-400">{raw.measurement}</span></div>
                                    <div className="flex justify-between text-xs font-medium"><span className="text-amber-500/80 mr-3">Time</span> <span className="text-amber-400">{raw.time}</span></div>
                                    <div className="h-[1px] bg-white/10 my-1 w-full" />
                                    <div className="flex justify-between text-xs font-bold text-cyan-400"><span className="mr-3">Rate</span> <span>{value}</span></div>
                                </>
                            )}
                            {(raw.value !== undefined) && raw.count === undefined && raw.set === undefined && raw.measurement === undefined && (
                                <div className="flex justify-between items-center text-sm font-black" style={{ color }}>
                                    <span className="mr-3">Value</span> <span>{value}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex justify-between items-center text-sm font-black" style={{ color }}>
                            <span className="mr-3">Value</span> <span>{value}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export function MetricChart({ metric, chartData }: MetricChartProps) {
    if (chartData.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-xs text-neutral-700 uppercase font-black">
                No activity yet
            </div>
        );
    }

    if (metric.type === 'CompoundValue') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="set" stackId="a" fill="#06b6d4" name="Sets" radius={[0, 0, 8, 8]} />
                    <Bar dataKey="rep" stackId="a" fill="#3b82f6" name="Reps" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    if (metric.type === 'Checklist') {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full p-6">
                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Task Completion</div>
                <ChecklistProgressBoxes metric={metric} maxBoxes={20} className="w-8 h-8" />
            </div>
        );
    }

    const isGoalComplete = (metric.type === 'Goal' || metric.type === 'Count') && metric.target ?
        (metric.dayAggregates.length > 0 && metric.dayAggregates[metric.dayAggregates.length - 1].cumulative >= metric.target) : false;

    const chartColor = isGoalComplete ? "#10b981" : (metric.type === 'SingleValue' ? "#d946ef" : "#06b6d4");

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id={`color-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'transparent', stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area
                    type={metric.type === 'Count' || metric.type === 'Goal' ? 'stepAfter' : 'monotone'}
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#color-${metric.id})`}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
