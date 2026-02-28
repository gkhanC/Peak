"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, ChevronLeft, Terminal, Plus, Trash2, LayoutDashboard, BarChart3, History, ArrowLeft, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    fetchAllBoards, createBoardAction, deleteBoardsAction,
    createMetricAction, deleteMetricAction, getHydratedMetricsAction,
    addValueToMetricAction, getMetricHistoryAction, deleteValuesAction
} from "@/app/actions/cliActions";
import { sortMetrics } from "@/lib/metricUtils";
import { cn } from "@/lib/utils";

type ViewState =
    | 'main'
    | 'create_board'
    | 'delete_board'
    | 'select_board'
    | 'board_menu'
    | 'add_metric'
    | 'delete_metric'
    | 'add_value_select'
    | 'add_value_input'
    | 'show_metric_info'
    | 'show_all_metrics'
    | 'show_board_report'
    | 'delete_value_select_item';

export function GlobalCommandPalette() {
    const [open, setOpen] = React.useState(false);
    const [view, setView] = React.useState<ViewState>('main');
    const [search, setSearch] = React.useState("");

    // Data states
    const [boards, setBoards] = React.useState<any[]>([]);
    const [selectedBoard, setSelectedBoard] = React.useState<any>(null);
    const [metrics, setMetrics] = React.useState<any[]>([]);
    const [selectedMetric, setSelectedMetric] = React.useState<any>(null);
    const [history, setHistory] = React.useState<any[]>([]);

    // Form states
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [metricDraft, setMetricDraft] = React.useState<any>({});
    const [infoMsg, setInfoMsg] = React.useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Reset when closed
    React.useEffect(() => {
        if (!open) {
            setView('main');
            setSearch("");
            setInfoMsg(null);
            setSelectedBoard(null);
            setSelectedMetric(null);
        }
    }, [open]);

    // Data Loaders
    const loadBoards = async () => {
        const res = await fetchAllBoards();
        setBoards(res);
    };

    const loadMetrics = async (bId: number) => {
        const res = await getHydratedMetricsAction(bId);
        setMetrics(res);
    };

    // Navigation helper
    const goTo = (v: ViewState) => {
        setView(v);
        setSearch("");
        setInfoMsg(null);
    };

    // --- Action Handlers --- 

    const handleCreateBoard = async (name: string) => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        const res = await createBoardAction(name.trim());
        if (res.success) {
            setInfoMsg({ type: 'success', text: `Board '${name}' created.` });
            setTimeout(() => { setOpen(false); window.location.reload(); }, 1000);
        } else {
            setInfoMsg({ type: 'error', text: res.error || "Failed to create board" });
        }
        setIsSubmitting(false);
    };

    const handleDeleteBoards = async (ids: number[]) => {
        setIsSubmitting(true);
        await deleteBoardsAction(ids);
        setInfoMsg({ type: 'success', text: 'Boards deleted.' });
        setTimeout(() => { setOpen(false); window.location.reload(); }, 1000);
        setIsSubmitting(false);
    };

    const handleAddMetric = async () => {
        const t = metricDraft.type;
        if (!t) return;

        // Check if more info needed
        if ((t.includes('Measurement') || t === 'Goal') && !metricDraft.schema?.unit) {
            return;
        }
        if ((t === 'Goal' || t === 'Count') && metricDraft.schema?.target === undefined) {
            return;
        }

        setIsSubmitting(true);
        const res = await createMetricAction(selectedBoard.id, metricDraft.name, metricDraft.type, metricDraft.dir || 'Ascending', metricDraft.schema);
        if (res.success) {
            setInfoMsg({ type: 'success', text: `Metric '${metricDraft.name}' created!` });
            setTimeout(() => { loadMetrics(selectedBoard.id); goTo('board_menu'); }, 1000);
        } else {
            setInfoMsg({ type: 'error', text: res.error || "Failed to create metric" });
        }
        setIsSubmitting(false);
    };

    const handleAddValue = async (val: string) => {
        setIsSubmitting(true);
        const t = selectedMetric.type;
        let payload: any = { value: 0 };

        try {
            if (t === 'Checklist' || t === 'Task') payload = { value: Number(val) };
            else if (t === 'SetRep' || t === 'CompoundValue') { const [s, r] = val.toLowerCase().split('x'); payload = { set: Number(s), rep: Number(r) } }
            else if (t === 'SetMeasurement') { const [s, m] = val.toLowerCase().split('x'); payload = { set: Number(s), measurement: Number(m.replace(/[^0-9.]/g, '')) } }
            else if (t === 'SetRepTime') { const [main, time] = val.toLowerCase().split('='); const [s, r] = main.split('x'); payload = { set: Number(s), rep: Number(r), time: Number(time) } }
            else if (t === 'SetMeasurementTime') { const [main, time] = val.toLowerCase().split('='); const [s, m] = main.split('x'); payload = { set: Number(s), measurement: Number(m.replace(/[^0-9.]/g, '')), time: Number(time) } }
            else if (t === 'CountTime') { const [c, time] = val.toLowerCase().split('='); payload = { count: Number(c), time: Number(time) } }
            else if (t === 'MeasurementTime') { const [m, time] = val.toLowerCase().split('='); payload = { measurement: Number(m.replace(/[^0-9.]/g, '')), time: Number(time) } }
            else payload = { value: Number(val.replace(/[^0-9.-]/g, '')) };

            await addValueToMetricAction(selectedMetric.id, payload);
            setInfoMsg({ type: 'success', text: 'Value logged successfully!' });
            setTimeout(() => { setOpen(false); window.location.reload(); }, 1000);
        } catch (e) {
            setInfoMsg({ type: 'error', text: 'Invalid format.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Renders ---

    const renderHeader = () => (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 bg-neutral-900/50">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase">
                {selectedBoard ? `Peak / ${selectedBoard.name}` : "Peak Engine"}
            </span>
            {view !== 'main' && (
                <button
                    onClick={() => {
                        if (['create_board', 'delete_board', 'select_board'].includes(view)) goTo('main');
                        else if (view === 'board_menu') goTo('select_board');
                        else goTo('board_menu');
                    }}
                    className="ml-auto flex items-center text-[10px] font-mono text-neutral-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-3 h-3 mr-1" /> BACK
                </button>
            )}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[650px] border border-white/10 bg-[#0d0d0d] text-white backdrop-blur-xl">
                <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-transparent" value={search} onValueChange={setSearch}>
                    {renderHeader()}

                    <div className="flex items-center border-b border-white/5 px-3 bg-white/[0.02]">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Command.Input
                            placeholder={
                                view === 'create_board' ? "Give your board a name..." :
                                    view === 'add_value_input' ? `Enter value (e.g. 2x10${selectedMetric?.schema?.unit ? ' ' + selectedMetric.schema.unit : ''})` :
                                        "Cerca komutlar..."
                            }
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (view === 'create_board') handleCreateBoard(search);
                                    if (view === 'add_value_input') handleAddValue(search);
                                }
                            }}
                        />
                    </div>

                    <Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden p-2 font-mono text-xs">
                        {infoMsg && (
                            <div className={cn(
                                "m-2 p-3 rounded border border-white/5 text-xs animate-in fade-in slide-in-from-top-1",
                                infoMsg.type === 'error' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                    infoMsg.type === 'success' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                                {infoMsg.text}
                            </div>
                        )}

                        <Command.Empty className="py-6 text-center text-neutral-500">
                            Nessun risultato trovato.
                        </Command.Empty>

                        {view === 'main' && (
                            <Command.Group heading="Main Navigation">
                                <Command.Item onSelect={() => goTo('create_board')} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <Plus className="w-4 h-4 text-green-400" />
                                    <span>Create New Board</span>
                                </Command.Item>
                                <Command.Item onSelect={async () => { await loadBoards(); goTo('select_board'); }} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                                    <span>Browse / Select Boards</span>
                                </Command.Item>
                                <Command.Item onSelect={async () => { await loadBoards(); goTo('delete_board'); }} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                    <span>Delete Boards</span>
                                </Command.Item>
                            </Command.Group>
                        )}

                        {view === 'select_board' && (
                            <Command.Group heading="Choose a Board">
                                {boards.map(b => (
                                    <Command.Item key={b.id} onSelect={() => { setSelectedBoard(b); goTo('board_menu'); }} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                            <span>{b.name}</span>
                                        </div>
                                        <ArrowLeft className="w-3 h-3 opacity-0 rotate-180 group-hover:opacity-100 transition-opacity" />
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {view === 'board_menu' && selectedBoard && (
                            <Command.Group heading={`Active Board: ${selectedBoard.name}`}>
                                <Command.Item onSelect={() => { setMetricDraft({}); goTo('add_metric'); }} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                    <Plus className="w-4 h-4 text-green-400" /> Add New Metric
                                </Command.Item>
                                <Command.Item onSelect={async () => { await loadMetrics(selectedBoard.id); goTo('add_value_select'); }} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                    <Send className="w-4 h-4 text-cyan-400" /> Log Value
                                </Command.Item>
                                <Command.Item onSelect={async () => { await loadMetrics(selectedBoard.id); goTo('show_board_report'); }} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                    <BarChart3 className="w-4 h-4 text-magenta-400" /> Progress Report
                                </Command.Item>
                                <Command.Item onSelect={async () => { await loadMetrics(selectedBoard.id); goTo('delete_metric'); }} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                    <Trash2 className="w-4 h-4 text-red-400" /> Manage / Delete Metrics
                                </Command.Item>
                            </Command.Group>
                        )}

                        {(view === 'add_value_select' || view === 'delete_metric') && (
                            <Command.Group heading="Select Metric">
                                {sortMetrics(metrics).map(m => (
                                    <Command.Item key={m.id} onSelect={async () => {
                                        setSelectedMetric(m);
                                        if (view === 'add_value_select') goTo('add_value_input');
                                        else {
                                            if (confirm(`Delete metric ${m.name}?`)) {
                                                await deleteMetricAction(m.id);
                                                setInfoMsg({ type: 'success', text: 'Metric deleted.' });
                                                await loadMetrics(selectedBoard.id);
                                            }
                                        }
                                    }} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{m.name}</span>
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-tighter">{m.type}</span>
                                        </div>
                                        {m.progSinceCreation !== null && m.progSinceCreation !== undefined && (
                                            <span className={cn("text-xs font-bold", m.progSinceCreation >= 0 ? "text-green-400" : "text-red-400")}>
                                                {m.progSinceCreation > 0 ? "+" : ""}{m.progSinceCreation.toFixed(1)}%
                                            </span>
                                        )}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {view === 'add_metric' && (
                            <div className="space-y-4 p-2">
                                {!metricDraft.name ? (
                                    <div className="text-center py-4">
                                        <p className="text-neutral-400 mb-4">Enter a name for your new metric in the search box above.</p>
                                        <button onClick={() => { if (search) { setMetricDraft({ name: search }); setSearch(""); } }} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-all font-bold">
                                            CONTINUE WITH: "{search || '...'}"
                                        </button>
                                    </div>
                                ) : !metricDraft.type ? (
                                    <Command.Group heading="Select Metric Type">
                                        {['SingleValue', 'CompoundValue', 'Task', 'Count', 'Goal', 'Measurement', 'SetRep', 'SetMeasurement', 'CountTime', 'MeasurementTime', 'SetRepTime', 'SetMeasurementTime'].map(t => (
                                            <Command.Item key={t} onSelect={() => { setMetricDraft({ ...metricDraft, type: t }); setSearch(""); }} className="p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                                {t.replace(/([A-Z])/g, ' $1').trim()}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Name</p>
                                            <p className="text-lg font-bold text-cyan-400">{metricDraft.name}</p>
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-2">Type</p>
                                            <p className="text-sm font-bold">{metricDraft.type}</p>
                                        </div>

                                        {(metricDraft.type.includes('Measurement') || metricDraft.type === 'Goal') && !metricDraft.schema?.unit && (
                                            <div className="text-center py-4 border border-dashed border-white/20 rounded-lg">
                                                <p className="text-neutral-400 mb-2">Enter unit (e.g. kg, km, steps) above</p>
                                                <button onClick={() => { if (search) { setMetricDraft({ ...metricDraft, schema: { ...metricDraft.schema, unit: search } }); setSearch(""); } }} className="text-cyan-400 font-bold underline">
                                                    USE "{search}" AS UNIT
                                                </button>
                                            </div>
                                        )}

                                        {((metricDraft.type === 'Goal' || metricDraft.type === 'Count') && metricDraft.schema?.target === undefined) && (
                                            <div className="text-center py-4 border border-dashed border-white/20 rounded-lg">
                                                <p className="text-neutral-400 mb-2">Enter target value above</p>
                                                <button onClick={() => { if (!isNaN(Number(search))) { setMetricDraft({ ...metricDraft, schema: { ...metricDraft.schema, target: Number(search) } }); setSearch(""); } }} className="text-cyan-400 font-bold underline">
                                                    SET TARGET TO {search}
                                                </button>
                                            </div>
                                        )}

                                        {/* Final confirm button if all data present */}
                                        {((!metricDraft.type.includes('Measurement') && metricDraft.type !== 'Goal' && metricDraft.type !== 'Count') ||
                                            (metricDraft.schema?.unit || (metricDraft.type === 'Count' && metricDraft.schema?.target !== undefined))) && (
                                                <button
                                                    onClick={handleAddMetric}
                                                    disabled={isSubmitting}
                                                    className="w-full py-4 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isSubmitting ? "CREATING..." : <><Plus className="w-4 h-4" /> CREATE METRIC</>}
                                                </button>
                                            )}
                                    </div>
                                )}
                            </div>
                        )}
                        {view === 'show_board_report' && (
                            <div className="p-2 pt-0 space-y-4">
                                <div className="grid grid-cols-4 border-b border-white/10 pb-2 text-[10px] text-neutral-500 font-bold uppercase tracking-widest px-2">
                                    <div className="col-span-2">Metric</div>
                                    <div className="text-right">Progress</div>
                                    <div className="text-right">Trend</div>
                                </div>
                                {sortMetrics(metrics).map(m => {
                                    const prog = m.progSinceCreation !== null && m.progSinceCreation !== undefined ? m.progSinceCreation : 0;
                                    const bars = Math.min(10, Math.max(0, Math.floor(prog / 10)));
                                    return (
                                        <div key={m.id} className="grid grid-cols-4 items-center px-2 py-1 hover:bg-white/5 rounded transition-colors group">
                                            <div className="col-span-2">
                                                <p className="font-bold">{m.name}</p>
                                                <p className="text-[8px] text-neutral-500 uppercase">{m.type}</p>
                                            </div>
                                            <div className={cn("text-right font-mono font-bold", prog >= 0 ? "text-green-400" : "text-red-400")}>
                                                {prog > 0 ? "+" : ""}{prog.toFixed(1)}%
                                            </div>
                                            <div className="text-right font-mono text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
                                                {"█".repeat(bars)}{"░".repeat(10 - bars)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Command.List>

                </Command>
            </DialogContent>
        </Dialog>
    );
}
