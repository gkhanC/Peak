"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlobalCommandPalette } from "@/components/CommandPalette";
import { Progress } from "@/components/ui/progress";
import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import Image from "next/image";
import { NewBoardDialog } from "@/components/NewBoardDialog";
import { BoardSettingsDialog } from "@/components/BoardSettingsDialog";
import { useBoards } from "@/hooks/useBoards";
import { useMetrics } from "@/hooks/useMetrics";
import { getThemeClasses } from "@/lib/theme";
import { isMetricComplete, sortMetrics } from "@/lib/metricUtils";
import { Board } from "@/types";

/**
 * Dashboard ana sayfası.
 * Kullanıcının takip ettiği panoları ve metrikleri özetler.
 */
export default function Home() {
  const { boards, refresh: refreshBoards, setBoards, isLoading: boardsLoading } = useBoards();
  const { metrics, refresh: refreshMetrics, isLoading: metricsLoading } = useMetrics();
  const router = useRouter();

  // Ortalama ilerleme yüzdesini hesapla
  const averageProgression = boards.length > 0
    ? Math.round(boards.reduce((a, b) => a + (b.progressionPercentage || 0), 0) / boards.length)
    : 0;

  if (boardsLoading || metricsLoading) {
    return <div className="p-12 text-center text-neutral-400">Loading...</div>;
  }

  return (
    <main className="container mx-auto max-w-[1850px] p-4 lg:px-4 space-y-10 relative z-10">
      <GlobalCommandPalette />

      {/* Gelişmiş Arka Plan Efektleri */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/20 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full animate-blob animation-delay-4000"></div>
      </div>

      {/* Üst Başlık ve Özet Bilgiler */}
      <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mt-4 backdrop-blur-sm">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <Image
                src="/logo.png"
                alt="Peak Logo"
                width={72}
                height={72}
                className="relative rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-br from-cyan-400 via-indigo-400 to-fuchsia-500 bg-clip-text text-transparent pb-1 drop-shadow-sm">
              Peak
            </h1>
          </div>
          <h2 className="text-xl font-medium text-white/50 mt-2 tracking-[0.2em] uppercase ml-1 drop-shadow-md">
            Dashboard
          </h2>
          <p className="text-white/40 mt-6 ml-1 flex items-center gap-2 font-medium">
            Press <kbd className="bg-black/40 px-2 py-1 rounded-md text-xs font-mono border border-white/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">Cmd + K</kbd> to quick command
          </p>
        </div>

        <div className="flex gap-8 backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="text-right">
            <p className="text-sm font-medium text-white/40 uppercase tracking-wider">Average Progression</p>
            <p className="text-4xl font-black font-mono bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">{averageProgression}%</p>
          </div>
          <div className="w-px bg-white/10 my-1"></div>
          <div className="text-right">
            <p className="text-sm font-medium text-white/40 uppercase tracking-wider">Active Boards</p>
            <p className="text-4xl font-black font-mono text-white drop-shadow-sm">{boards.length}</p>
          </div>
        </div>
      </header>

      {/* Takip Panoları Listesi */}
      <section className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-white/90 drop-shadow-md">Your Tracking Boards</h2>
          <NewBoardDialog onCreated={(newBoard: Board) => {
            setBoards(prev => [...prev, newBoard]);
          }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map(board => (
            <BoardCard key={board.id} board={board} onUpdate={(updated) => {
              if (updated) {
                setBoards(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
              } else {
                window.location.reload();
              }
            }} />
          ))}

          {boards.length === 0 && (
            <div className="col-span-full text-center py-16 px-6 bg-white/5 border border-dashed border-white/20 rounded-2xl backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <span className="text-2xl opacity-50">🚀</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Boards Found</h3>
              <p className="text-white/50 max-w-sm mx-auto">Create your first board to start tracking your progress brilliantly!</p>
            </div>
          )}
        </div>
      </section>

      {/* Metrikler Bölümü - Gruplandırılmış */}
      <section className="pt-10 border-t border-white/10 relative z-10">
        <h2 className="text-3xl font-bold tracking-tight text-white/90 mb-8 drop-shadow-md">Metrics Breakdown</h2>

        {boards.length === 0 && metrics.length === 0 && (
          <div className="py-12 text-center text-white/40 bg-black/20 border border-dashed border-white/10 rounded-2xl backdrop-blur-sm">
            No metrics available. Start by creating a board holding metrics.
          </div>
        )}

        <div className="space-y-12">
          {boards.map(board => {
            const boardMetrics = metrics.filter(m => m.boardId === board.id);
            if (boardMetrics.length === 0) return null;

            return (
              <div key={board.id} className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                {/* Board Group Background Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                  <h3 className="text-2xl font-bold tracking-wide text-white">{board.name}</h3>
                  <Badge variant="outline" className="ml-2 bg-white/5 border-white/10 text-white/60">
                    {boardMetrics.length} Metrics
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {sortMetrics(boardMetrics).map((m) => (
                    <DashboardMetricCard
                      key={m.id}
                      metric={m}
                      boardName={board.name}
                      boardProgressionMethod={board.progressionMethod}
                      onLog={() => {
                        refreshBoards();
                        refreshMetrics();
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Yetim metrikler (olmaması gerekir ama güvenli tarafta kalalım) */}
          {metrics.filter(m => !boards.some(b => b.id === m.boardId)).length > 0 && (
            <div className="bg-black/30 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
              <h3 className="text-xl font-bold text-red-400 mb-6">Orphaned Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.filter(m => !boards.some(b => b.id === m.boardId)).map(m => (
                  <DashboardMetricCard
                    key={m.id}
                    metric={m}
                    boardName={"Unknown"}
                    boardProgressionMethod={'sinceCreation'}
                    onLog={() => {
                      refreshBoards();
                      refreshMetrics();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * Pano kartı bileşeni.
 */
function BoardCard({ board, onUpdate }: { board: Board, onUpdate: (updated?: Board | null) => void }) {
  const router = useRouter();
  const themeClass = getThemeClasses(board.theme);

  return (
    <div className="relative group">
      <Card
        className={`${themeClass} cursor-pointer hover:border-white/50 transition-all flex flex-col justify-between overflow-hidden relative min-h-[160px]`}
        onClick={() => router.push(`/boards/${board.id}`)}
      >
        {/* Arka Plan Görseli */}
        {board.illustration && (
          <div
            className="absolute -right-6 -bottom-6 w-44 h-44 opacity-20 group-hover:opacity-50 group-hover:-translate-y-2 group-hover:-translate-x-2 group-hover:scale-105 transition-all duration-700 ease-out pointer-events-none z-0"
            style={{ WebkitMaskImage: 'radial-gradient(circle at 70% 70%, black 10%, transparent 70%)', maskImage: 'radial-gradient(circle at 70% 70%, black 10%, transparent 70%)' }}
          >
            <Image src={`/illustrations/${board.illustration}`} alt="Theme Art" width={176} height={176} className="object-cover drop-shadow-2xl mix-blend-screen" />
          </div>
        )}

        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-lg font-medium flex items-center justify-between gap-2">
            <span className="truncate pr-4">{board.name}</span>
          </CardTitle>
          <div className="flex gap-2 mt-1">
            {board.theme && board.theme !== 'default' && (
              <Badge variant="outline" className="text-[10px] uppercase opacity-70 bg-black/40 border-slate-800">
                {board.theme}
              </Badge>
            )}
            {board.tag && (
              <Badge variant="secondary" className="text-[10px] opacity-90">
                {board.tag}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="h-full flex flex-col justify-end relative z-10">
          <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
            {board.description || "No description provided."}
          </p>

          <div className="mt-auto pt-4 border-t border-slate-800/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral-500 font-black tracking-widest uppercase">Progression</span>
              <span className="text-xs font-mono font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                {board.progressionPercentage || 0}%
              </span>
            </div>
            <Progress value={board.progressionPercentage || 0} className="h-1 bg-slate-900" />
          </div>
        </CardContent>
      </Card>

      {/* Pano Ayarları */}
      <BoardSettingsDialog board={board} onUpdate={onUpdate} />
    </div>
  );
}
