"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalCommandPalette } from "@/components/CommandPalette";
import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import { NewMetricDialog } from "@/components/NewMetricDialog";
import Image from "next/image";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { BoardSettingsDialog } from "@/components/BoardSettingsDialog";
import { useBoards } from "@/hooks/useBoards";
import { useMetrics } from "@/hooks/useMetrics";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { getThemeBgClass, getThemeChartColor, getThemeClasses } from "@/lib/theme";
import { isMetricComplete, sortMetrics } from "@/lib/metricUtils";
import { Board } from "@/types";

/**
 * Pano detay sayfası.
 * Belirli bir panonun metriklerini ve ilerleme geçmişini gösterir.
 */
export default function BoardDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const boardId = Number(params.id);

    const { boards, refresh: refreshBoards, setBoards, isLoading: boardsLoading } = useBoards();
    const { metrics, refresh: refreshMetrics, isLoading: metricsLoading } = useMetrics(boardId);
    const { history, refresh: refreshHistory, isLoading: historyLoading } = useBoardHistory(boardId);

    const [animatedProgression, setAnimatedProgression] = React.useState(0);

    const board = boards.find(b => b.id === boardId);

    React.useEffect(() => {
        if (board && board.progressionPercentage !== undefined) {
            const timer = setTimeout(() => {
                setAnimatedProgression(board.progressionPercentage || 0);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [board]);

    if (boardsLoading || metricsLoading || historyLoading) {
        return <div className="p-12 text-center text-neutral-400">Loading board details...</div>;
    }

    if (!board) {
        return (
            <div className="p-12 text-center">
                <p className="text-red-400 mb-4">Board not found.</p>
                <Button onClick={() => router.push('/')}>Go Back</Button>
            </div>
        );
    }

    const themeClass = getThemeClasses(board.theme);
    const themeBgClass = getThemeBgClass(board.theme);
    const chartColor = getThemeChartColor(board.theme);

    return (
        <main className="container mx-auto max-w-7xl p-6 lg:p-12 space-y-10">
            <GlobalCommandPalette />

            {/* Üst Başlık */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mt-4">
                <div className="flex flex-col items-start cursor-pointer group" onClick={() => router.push('/')}>
                    <div className="flex items-center gap-4 transition-transform group-hover:scale-105">
                        <Image src="/logo.png" alt="Peak Logo" width={72} height={72} className="rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-slate-800" />
                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-br from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent pb-1">Peak</h1>
                    </div>
                </div>
                <div className="flex gap-4">
                    <p className="text-neutral-500 mt-6 ml-1 flex items-center gap-2">
                        Press <kbd className="bg-slate-900 px-2 py-1 rounded-md text-xs font-mono border border-slate-800 text-white">Cmd + K</kbd> to quick command
                    </p>
                </div>
            </header>

            {/* Pano Bilgi Alanı */}
            <div className={`relative overflow-hidden rounded-xl border ${themeClass.split(' ')[0]} ${themeBgClass} p-5 shadow-2xl`}>
                {/* Arka Plan Görseli */}
                {board.illustration && (
                    <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 opacity-20 pointer-events-none z-0"
                        style={{ WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 80%)', maskImage: 'linear-gradient(to left, black 20%, transparent 80%)' }}
                    >
                        <Image src={`/illustrations/${board.illustration}`} alt="Theme Art" fill className="object-contain drop-shadow-2xl mix-blend-screen" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    {/* Sol: Bilgi & Navigasyon */}
                    <div className="flex flex-col flex-1 min-w-[250px]">
                        <Button variant="outline" size="sm" onClick={() => router.push('/')} className="mb-3 bg-black/50 border-slate-800 hover:bg-slate-900 text-white w-fit h-7 text-xs px-2">
                            <ArrowLeft className="h-3 w-3 mr-1.5" /> Back
                        </Button>

                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h2 className={`text-2xl font-black tracking-tight ${themeClass.split(' ').slice(-1)[0]}`}>{board.name}</h2>
                            {board.theme && board.theme !== 'default' && (
                                <Badge variant="outline" className="text-[10px] uppercase bg-black/40 border-slate-800 px-1.5 py-0">{board.theme}</Badge>
                            )}
                            {board.tag && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{board.tag}</Badge>
                            )}
                            <div className="ml-auto lg:hidden">
                                <BoardSettingsDialog
                                    board={board}
                                    isHeader
                                    onUpdate={(updated?: Board | null) => {
                                        if (updated) {
                                            setBoards(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
                                        } else {
                                            router.push('/');
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <p className="text-sm text-neutral-400 max-w-xl line-clamp-2 leading-relaxed">
                            {board.description || "No description provided for this board."}
                        </p>

                        <div className="flex items-center gap-2 mt-3 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                            <TrendingUp className="h-3 w-3 animate-pulse" />
                            <span>{board.progressionMethod === 'lastTwo' ? 'Recent Delta Mode' : 'Overall Progress Mode'}</span>
                        </div>
                    </div>

                    {/* Sağ: İlerleme & Grafik */}
                    <div className="flex items-center gap-4 w-full lg:w-auto shrink-0 justify-between lg:justify-end">

                        {/* Geçmiş Grafiği */}
                        <div className="hidden md:flex h-[70px] w-[180px] lg:w-[250px] bg-black/20 rounded-xl overflow-hidden border border-white/5 relative group shadow-inner">
                            {history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="boardProgColorMini" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={chartColor} stopOpacity={0.6} />
                                                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#111]/90 border border-slate-800 px-2 py-1 rounded shadow-xl backdrop-blur-md">
                                                            <p className="text-[8px] text-neutral-500 font-mono uppercase tracking-tighter mb-0.5">{payload[0].payload.date}</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-sm font-black text-white">{Math.round(Number(payload[0].value))}%</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="progress"
                                            stroke={chartColor}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#boardProgColorMini)"
                                            isAnimationActive={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-[8px] uppercase tracking-widest text-neutral-600 font-bold">
                                    No data
                                </div>
                            )}
                        </div>

                        {/* İlerleme Dairesi */}
                        <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl flex items-center gap-3 shrink-0">
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <svg width="48" height="48" className="transform -rotate-90">
                                    <circle cx="24" cy="24" r="21" stroke="#ffffff10" strokeWidth="4" fill="transparent" />
                                    <circle
                                        cx="24" cy="24" r="21"
                                        stroke={animatedProgression >= 0 ? "#10b981" : "#ef4444"}
                                        strokeWidth="4"
                                        fill="transparent"
                                        strokeDasharray={131.95}
                                        strokeDashoffset={131.95 - (Math.abs(Math.min(100, animatedProgression)) / 100) * 131.95}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-white">{animatedProgression}%</span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[8px] uppercase tracking-[0.1em] text-neutral-500 mb-0.5 leading-none">Progression</span>
                                <div className="flex items-baseline gap-1 leading-none">
                                    <span className="text-2xl font-black text-white">{animatedProgression}</span>
                                    <span className="text-[10px] font-bold text-neutral-500">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <BoardSettingsDialog
                                board={board}
                                isHeader
                                onUpdate={(updated?: Board | null) => {
                                    if (updated) {
                                        setBoards(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
                                    } else {
                                        router.push('/');
                                    }
                                }}
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* Metrikler Bölümü */}
            <div className="pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight uppercase">Tracked Metrics</h2>
                    <NewMetricDialog boardId={boardId} onCreated={refreshMetrics} />
                </div>

                <div className="flex flex-col gap-3">
                    {sortMetrics(metrics).map((m) => (
                        <DashboardMetricCard
                            key={m.id}
                            metric={m}
                            boardName={board.name}
                            onLog={() => {
                                refreshBoards();
                                refreshMetrics();
                                refreshHistory();
                            }}
                            boardProgressionMethod={board.progressionMethod}
                            showLineGraphics={true}
                        />
                    ))}

                    {metrics.length === 0 && (
                        <div className="col-span-full py-20 text-center text-neutral-600 border border-dashed border-slate-800 rounded-3xl bg-black/20">
                            <p className="text-sm font-mono uppercase tracking-widest mb-2 font-bold">Pano Boş</p>
                            <p className="text-xs">Takip edilecek metrik bulunamadı. Yeni bir hedef ekleyin!</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
