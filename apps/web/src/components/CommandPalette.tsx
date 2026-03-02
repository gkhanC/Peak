"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, Terminal, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    fetchAllBoards, createBoardAction, deleteBoardsAction,
    createMetricAction, deleteMetricAction, getHydratedMetricsAction,
    addValueToMetricAction, getMetricHistoryAction, deleteValuesAction
} from "@/app/actions/cliActions";
import { sortMetrics } from "@/lib/metricUtils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Mimic CLI views exactly
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
    | 'delete_specific_value'
    | 'show_metric_history_select'
    | 'show_metric_history';

// Helper for numeric/letter hotkeys
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

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
    const [multiSelectIds, setMultiSelectIds] = React.useState<string[]>([]);

    // Form states
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [metricDraft, setMetricDraft] = React.useState<any>({});
    const [infoMsg, setInfoMsg] = React.useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    const router = useRouter();

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
            setMultiSelectIds([]);
            setMetricDraft({});
        }
    }, [open]);

    const loadBoards = async () => {
        const res = await fetchAllBoards();
        setBoards(res);
    };

    const loadMetrics = async (bId: number) => {
        const res = await getHydratedMetricsAction(bId);
        setMetrics(res);
    };

    const goTo = (v: ViewState) => {
        setView(v);
        setSearch("");
        setInfoMsg(null);
    };

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

    const handleDeleteBoards = async () => {
        if (multiSelectIds.length === 0) return;
        setIsSubmitting(true);
        await deleteBoardsAction(multiSelectIds.map(Number));
        setInfoMsg({ type: 'success', text: 'Selected boards deleted.' });
        setTimeout(() => { setOpen(false); window.location.reload(); }, 1000);
        setIsSubmitting(false);
    };

    const handleAddMetric = async () => {
        const t = metricDraft.type;
        if (!t) return;

        if ((t.includes('Measurement') || t === 'Goal') && !metricDraft.schema?.unit) return;
        if ((t === 'Goal' || t === 'Count') && metricDraft.schema?.target === undefined) return;

        setIsSubmitting(true);
        const res = await createMetricAction(selectedBoard.id, metricDraft.name, metricDraft.type, metricDraft.dir || 'Ascending', metricDraft.schema || {});
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
            else if (t === 'SetRepMeasurement') { const [s, r, m] = val.toLowerCase().split('x'); payload = { set: Number(s), rep: Number(r), measurement: Number(m.replace(/[^0-9.]/g, '')) } }
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

    const handleDeleteSpecificValue = async () => {
        if (multiSelectIds.length === 0) return;
        setIsSubmitting(true);
        await deleteValuesAction(multiSelectIds.map(Number));
        setInfoMsg({ type: 'success', text: 'Record(s) deleted.' });
        setTimeout(() => { setOpen(false); window.location.reload(); }, 1000);
        setIsSubmitting(false);
    };

    const executeMenuAction = async (key: string) => {
        if (isSubmitting) return;

        // Ensure key is lowercase for consistent mapping
        const k = key.toLowerCase();

        // Main Menu
        if (view === 'main') {
            switch (k) {
                case '1': goTo('create_board'); break;
                case '2': await loadBoards(); goTo('delete_board'); break;
                case '3': await loadBoards(); goTo('select_board'); break;
                case 'd': setOpen(false); router.push("/"); break;
                case '0': setOpen(false); break;
            }
        }
        // Board Menu
        else if (view === 'board_menu' && selectedBoard) {
            switch (k) {
                case '1': setMetricDraft({}); goTo('add_metric'); break;
                case '2': await loadMetrics(selectedBoard.id); goTo('delete_metric'); break;
                case '3': await loadMetrics(selectedBoard.id); goTo('add_value_select'); break;
                case '4': await loadMetrics(selectedBoard.id); goTo('show_metric_info'); break;
                case '5': await loadMetrics(selectedBoard.id); goTo('show_all_metrics'); break;
                case '6': await loadMetrics(selectedBoard.id); goTo('show_all_metrics'); break; // Equivalent to board info for now
                case '7': await loadMetrics(selectedBoard.id); goTo('show_metric_history_select'); break;
                case 'h': await loadMetrics(selectedBoard.id); goTo('show_metric_history_select'); break;
                case 'r': await loadMetrics(selectedBoard.id); goTo('show_board_report'); break;
                case 'v': setOpen(false); router.push(`/boards/${selectedBoard.id}`); break;
                case 'd': setOpen(false); router.push("/"); break;
                case '8': goTo('main'); break;
                case '0': setOpen(false); break;
            }
        }
        else if (view === 'select_board') {
            const index = k.match(/[a-z]/) ? LETTERS.indexOf(k) : (parseInt(k) - 1);
            if (index >= 0 && index < boards.length) {
                setSelectedBoard(boards[index]);
                goTo('board_menu');
            }
        }
        else if (view === 'delete_board') {
            const index = k.match(/[a-z]/) ? LETTERS.indexOf(k) : (parseInt(k) - 1);
            if (index >= 0 && index < boards.length) {
                const idStr = boards[index].id.toString();
                setMultiSelectIds(prev => prev.includes(idStr) ? prev.filter(x => x !== idStr) : [...prev, idStr]);
            }
        }
        else if (view === 'add_value_select' || view === 'show_metric_info' || view === 'delete_metric') {
            const index = k.match(/[a-z]/) ? LETTERS.indexOf(k) : (parseInt(k) - 1);
            const sorted = sortMetrics(metrics);
            if (index >= 0 && index < sorted.length) {
                const m = sorted[index];
                setSelectedMetric(m);
                if (view === 'add_value_select') {
                    goTo('add_value_input');
                } else if (view === 'delete_metric') {
                    if (confirm(`Delete metric ${m.name}?`)) {
                        setIsSubmitting(true);
                        await deleteMetricAction(m.id);
                        setInfoMsg({ type: 'success', text: 'Metric deleted.' });
                        await loadMetrics(selectedBoard.id);
                        setIsSubmitting(false);
                    }
                } else if (view === 'show_metric_info') {
                    goTo('show_metric_info');
                }
            }
        }
        else if (view === 'show_metric_history_select') {
            const index = k.match(/[a-z]/) ? LETTERS.indexOf(k) : (parseInt(k) - 1);
            const sorted = sortMetrics(metrics);
            if (index >= 0 && index < sorted.length) {
                const m = sorted[index];
                setSelectedMetric(m);
                const historyData = await getMetricHistoryAction(m.id);
                setHistory(historyData);
                goTo(k === '7' ? 'delete_specific_value' : 'show_metric_history'); // using context trick or just go to history
            }
        }
        else if (view === 'delete_specific_value') {
            const index = k.match(/[a-z]/) ? LETTERS.indexOf(k) : (parseInt(k) - 1);
            if (index >= 0 && index < history.length) {
                const idStr = history[index].id.toString();
                setMultiSelectIds(prev => prev.includes(idStr) ? prev.filter(x => x !== idStr) : [...prev, idStr]);
            }
        }
        else if (view === 'add_metric') {
            if (metricDraft.name && !metricDraft.type) {
                const types = ['SingleValue', 'CompoundValue', 'Task', 'Count', 'Goal', 'Measurement', 'SetRep', 'SetMeasurement', 'SetRepMeasurement', 'CountTime', 'MeasurementTime', 'SetRepTime', 'SetMeasurementTime'];
                const index = k.match(/[a-z]/) ? LETTERS.indexOf(k) : (parseInt(k) - 1);
                if (index >= 0 && index < types.length) {
                    setMetricDraft({ ...metricDraft, type: types[index] });
                }
            }
        }
    };

    // Render helper for list items
    const getPrefix = (index: number) => {
        return index < 9 ? `${index + 1}` : LETTERS[index - 9] || '?';
    };

    const renderHeader = () => (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 bg-neutral-900/50">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase">
                {selectedBoard ? `Peak CLI / ${selectedBoard.name}` : "Peak CLI Main Menu"}
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
                    <ArrowLeft className="w-3 h-3 mr-1" /> BACK (8)
                </button>
            )}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                onInteractOutside={(e) => {
                    e.preventDefault();
                    setInfoMsg({ type: 'error', text: 'Use ESC or Cmd+K to close the menu.' });
                }}
                className="overflow-hidden p-0 shadow-2xl sm:max-w-[700px] border border-white/10 bg-[#0d0d0d] text-white backdrop-blur-xl"
            >
                {/* Add standard visually hidden title for accessibility to fix warning */}
                <DialogTitle className="sr-only">Quick navigation and actions</DialogTitle>

                <Command
                    className="flex h-full w-full flex-col overflow-hidden rounded-md bg-transparent"
                    onKeyDown={(e) => {
                        // Prevent arrow keys entirely as per user request
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            setInfoMsg({ type: 'info', text: 'Arrow keys disabled. Please press the corresponding number or letter.' });
                            return;
                        }

                        // Intercept alphanumeric keys if we are NOT in a text input phase
                        const isTextInputPhase = view === 'create_board' || view === 'add_value_input' || (view === 'add_metric' && (!metricDraft.name || metricDraft.type?.includes("Measurement")));

                        if (!isTextInputPhase) {
                            if (/^[0-9a-z]$/i.test(e.key)) {
                                e.preventDefault();
                                executeMenuAction(e.key);
                            } else if (e.key === 'Enter') {
                                if (view === 'delete_board' && multiSelectIds.length > 0) {
                                    e.preventDefault();
                                    handleDeleteBoards();
                                } else if (view === 'delete_specific_value' && multiSelectIds.length > 0) {
                                    e.preventDefault();
                                    handleDeleteSpecificValue();
                                }
                            } else if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                                e.preventDefault();
                                setInfoMsg({ type: 'error', text: 'Invalid key. Use ESC to exit, or the option keys for actions.' });
                            }
                        }
                    }}
                >
                    {renderHeader()}

                    <div className="flex items-center border-b border-white/5 px-3 bg-white/[0.02]">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder={
                                view === 'create_board' ? "Enter Board Name to create..." :
                                    view === 'add_value_input' ? `Enter value (e.g. 2x10${selectedMetric?.schema?.unit ? ' ' + selectedMetric.schema.unit : ''})` :
                                        view === 'add_metric' && !metricDraft.name ? "Enter new Metric Name:" :
                                            view === 'add_metric' && (metricDraft.type?.includes('Measurement') || metricDraft.type === 'Goal') && !metricDraft.schema?.unit ? "Enter Unit (e.g. kg, km):" :
                                                view === 'add_metric' && (metricDraft.type === 'Goal' || metricDraft.type === 'Count') && metricDraft.schema?.target === undefined ? "Enter Target value (digit):" :
                                                    "Press corresponding number/letter or use arrows..."
                            }
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        />
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2 font-mono text-xs">
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
                            No options matched.
                        </Command.Empty>

                        {/* --- DYNAMIC SUBMISSIONS --- */}
                        {view === 'create_board' && search.trim().length > 0 && (
                            <Command.Group heading="Action">
                                <Command.Item forceMount value={search} onSelect={() => handleCreateBoard(search)} className="flex items-center gap-3 p-2 rounded cursor-pointer bg-white/5 transition-all text-green-400">
                                    <span className="font-bold">Create Board: "{search}"</span>
                                    <span className="text-neutral-500 ml-auto text-xs">Press Enter to confirm</span>
                                </Command.Item>
                            </Command.Group>
                        )}
                        {view === 'add_value_input' && search.trim().length > 0 && (
                            <Command.Group heading="Action">
                                <Command.Item forceMount value={search} onSelect={() => handleAddValue(search)} className="flex items-center gap-3 p-2 rounded cursor-pointer bg-white/5 transition-all text-green-400">
                                    <span className="font-bold">Log Value: "{search}"</span>
                                    <span className="text-neutral-500 ml-auto text-xs">Press Enter to confirm</span>
                                </Command.Item>
                            </Command.Group>
                        )}

                        {/* --- MAIN MENU --- */}
                        {view === 'main' && (
                            <Command.Group heading="Main Menu">
                                <Command.Item onSelect={() => executeMenuAction('1')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <span className="text-cyan-400 font-bold w-4">1</span><span>Create Board</span>
                                </Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('2')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <span className="text-cyan-400 font-bold w-4">2</span><span>Delete Board</span>
                                </Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('3')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <span className="text-cyan-400 font-bold w-4">3</span><span>Select Board</span>
                                </Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('d')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all text-neutral-300">
                                    <span className="text-cyan-400 font-bold w-4">d</span><span>Launch Dashboard (Go Home)</span>
                                </Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('0')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all text-neutral-500">
                                    <span className="text-red-400 font-bold w-4">0</span><span>Exit</span>
                                </Command.Item>
                            </Command.Group>
                        )}

                        {/* --- SELECT / DELETE BOARDS --- */}
                        {(view === 'select_board' || view === 'delete_board') && (
                            <Command.Group heading={view === 'select_board' ? "Select a board:" : "Select boards to delete:"}>
                                {boards.map((b, i) => (
                                    <Command.Item key={b.id} onSelect={() => executeMenuAction(getPrefix(i))} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all">
                                        <span className="text-cyan-400 font-bold w-4">{getPrefix(i)}</span>
                                        {view === 'delete_board' && (
                                            <span className="text-neutral-500">[{multiSelectIds.includes(b.id.toString()) ? 'X' : ' '}]</span>
                                        )}
                                        <span>{b.name}</span>
                                    </Command.Item>
                                ))}
                                {view === 'delete_board' && boards.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/10 px-2">
                                        <button onClick={handleDeleteBoards} disabled={multiSelectIds.length === 0} className="w-full py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50">
                                            Confirm Deletion (Enter)
                                        </button>
                                        <button onClick={() => goTo('main')} className="w-full py-2 text-neutral-500 hover:text-white mt-2">Cancel</button>
                                    </div>
                                )}
                            </Command.Group>
                        )}

                        {/* --- BOARD MENU --- */}
                        {view === 'board_menu' && selectedBoard && (
                            <Command.Group heading={`Board: ${selectedBoard.name}`}>
                                <Command.Item onSelect={() => executeMenuAction('1')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">1</span> Add new metric</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('2')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">2</span> Delete metric</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('3')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">3</span> Add value to metric</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('4')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">4</span> Show metric info</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('5')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">5</span> Show all metrics</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('6')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">6</span> Show board info</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('7')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">7</span> Delete specific value</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('h')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">h</span> Show full metric history</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('r')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">r</span> Show Progress Report</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('v')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-magenta-400 font-bold w-4">v</span> Go to Web Board Page</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('d')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">d</span> Go to Dashboard Index</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('8')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all"><span className="text-cyan-400 font-bold w-4">8</span> Back to main</Command.Item>
                                <Command.Item onSelect={() => executeMenuAction('0')} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all text-neutral-500"><span className="text-red-400 font-bold w-4">0</span> Exit</Command.Item>
                            </Command.Group>
                        )}

                        {/* --- SELECT METRIC DYNAMICALLY --- */}
                        {(view === 'add_value_select' || view === 'show_metric_info' || view === 'delete_metric' || view === 'show_metric_history_select') && (
                            <Command.Group heading="Select Metric">
                                {sortMetrics(metrics).map((m, i) => (
                                    <Command.Item key={m.id} onSelect={() => executeMenuAction(getPrefix(i))} className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-cyan-400 font-bold w-4">{getPrefix(i)}</span>
                                            <span className="font-bold">{m.name}</span>
                                            <span className="text-[10px] text-neutral-500 uppercase">({m.type})</span>
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {/* --- ADD METRIC WIZARD --- */}
                        {view === 'add_metric' && (
                            <div className="space-y-4 p-2">
                                {!metricDraft.name ? (
                                    <div className="text-center py-4">
                                        <p className="text-neutral-400 mb-4">Enter a name for your new metric in the search box above & press Enter.</p>
                                        {search.trim().length > 0 && (
                                            <Command.Item forceMount value={search} onSelect={() => setTimeout(() => { setMetricDraft({ name: search }); setSearch(""); }, 0)} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded cursor-pointer transition-all font-bold text-center w-full block">
                                                CONTINUE WITH: "{search}"
                                            </Command.Item>
                                        )}
                                    </div>
                                ) : !metricDraft.type ? (
                                    <Command.Group heading="Select Metric Type">
                                        {['SingleValue', 'CompoundValue', 'Task', 'Count', 'Goal', 'Measurement', 'SetRep', 'SetMeasurement', 'SetRepMeasurement', 'CountTime', 'MeasurementTime', 'SetRepTime', 'SetMeasurementTime'].map((t, i) => (
                                            <Command.Item key={t} onSelect={() => executeMenuAction(getPrefix(i))} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition-all">
                                                <span className="text-cyan-400 font-bold w-4">{getPrefix(i)}</span>
                                                <span>{t.replace(/([A-Z])/g, ' $1').trim()}</span>
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
                                                <p className="text-neutral-400 mb-2">Type unit in search box and click below</p>
                                                {search.trim().length > 0 && (
                                                    <Command.Item forceMount value={search} onSelect={() => setTimeout(() => { setMetricDraft({ ...metricDraft, schema: { ...metricDraft.schema, unit: search } }); setSearch(""); }, 0)} className="text-cyan-400 font-bold underline cursor-pointer block text-center p-2 hover:bg-white/5 rounded">
                                                        USE "{search}" AS UNIT
                                                    </Command.Item>
                                                )}
                                            </div>
                                        )}

                                        {((metricDraft.type === 'Goal' || metricDraft.type === 'Count') && metricDraft.schema?.target === undefined) && (
                                            <div className="text-center py-4 border border-dashed border-white/20 rounded-lg">
                                                <p className="text-neutral-400 mb-2">Type target in search box and click below</p>
                                                {search.trim().length > 0 && !isNaN(Number(search)) && (
                                                    <Command.Item forceMount value={search} onSelect={() => setTimeout(() => { setMetricDraft({ ...metricDraft, schema: { ...metricDraft.schema, target: Number(search) } }); setSearch(""); }, 0)} className="text-cyan-400 font-bold underline cursor-pointer block text-center p-2 hover:bg-white/5 rounded">
                                                        SET TARGET TO {search}
                                                    </Command.Item>
                                                )}
                                            </div>
                                        )}

                                        {/* Final confirm button */}
                                        {((!metricDraft.type.includes('Measurement') && metricDraft.type !== 'Goal' && metricDraft.type !== 'Count') ||
                                            (metricDraft.schema?.unit || (metricDraft.type === 'Count' && metricDraft.schema?.target !== undefined))) && (
                                                <div className="text-center py-4">
                                                    <p className="mb-2 text-neutral-400">All set?</p>
                                                    <Command.Item forceMount onSelect={handleAddMetric} disabled={isSubmitting} className="px-6 py-2 bg-green-500/20 text-green-400 font-bold rounded border border-green-500/30 hover:bg-green-500/30 cursor-pointer block text-center w-full data-[disabled]:opacity-50">
                                                        CREATE METRIC
                                                    </Command.Item>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- SHOW INFO / METRICS  --- */}
                        {view === 'show_metric_info' && selectedMetric && (
                            <div className="p-4 space-y-4">
                                <h3 className="text-xl font-bold text-yellow-500 border-b border-white/10 pb-2">Metric: {selectedMetric.name} [{selectedMetric.type}]</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-neutral-500">Direction:</span> {selectedMetric.progressDirection}</p>
                                    {selectedMetric.target && <p><span className="text-neutral-500">Target:</span> {selectedMetric.target}</p>}
                                    <p><span className="text-neutral-500">Progression Since Creation:</span> {selectedMetric.progSinceCreation !== null && selectedMetric.progSinceCreation !== undefined ? `${selectedMetric.progSinceCreation > 0 ? '+' : ''}${selectedMetric.progSinceCreation.toFixed(1)}%` : 'N/A'}</p>
                                </div>
                                <button onClick={() => goTo('board_menu')} className="mt-4 px-4 py-2 border border-white/10 rounded text-sm hover:bg-white/5">Back</button>
                            </div>
                        )}

                        {view === 'show_all_metrics' && (
                            <div className="p-2 space-y-2">
                                <div className="grid grid-cols-3 border-b border-white/10 pb-2 text-[10px] text-neutral-500 uppercase">
                                    <div>Name</div>
                                    <div>Type</div>
                                    <div className="text-right">Progress</div>
                                </div>
                                {sortMetrics(metrics).map(m => (
                                    <div key={m.id} className="grid grid-cols-3 items-center p-2 rounded hover:bg-white/5">
                                        <div className="font-bold">{m.name}</div>
                                        <div className="text-xs text-neutral-500">{m.type}</div>
                                        <div className={cn("text-right text-xs", (m.progSinceCreation || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                                            {m.progSinceCreation !== null && m.progSinceCreation !== undefined ? `${m.progSinceCreation > 0 ? '+' : ''}${m.progSinceCreation.toFixed(1)}%` : '--'}
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-white/10">
                                    <button onClick={() => goTo('board_menu')} className="px-4 py-2 bg-white/5 rounded hover:bg-white/10 w-full text-center">Back</button>
                                </div>
                            </div>
                        )}

                        {view === 'show_board_report' && (
                            <div className="p-2 space-y-2">
                                <h3 className="text-magenta-400 font-bold mb-4">Board Progress Report</h3>
                                <div className="grid grid-cols-3 border-b border-white/10 pb-2 text-[10px] text-neutral-500 uppercase">
                                    <div>Metric</div>
                                    <div>Progress</div>
                                    <div className="text-right">Trend</div>
                                </div>
                                {sortMetrics(metrics).map(m => {
                                    const prog = m.progSinceCreation !== null && m.progSinceCreation !== undefined ? m.progSinceCreation : 0;
                                    const bars = Math.min(10, Math.max(0, Math.floor(prog / 10)));
                                    return (
                                        <div key={m.id} className="grid grid-cols-3 items-center p-2 rounded hover:bg-white/5 group">
                                            <div className="font-bold">{m.name}</div>
                                            <div className={cn("text-xs font-mono", prog >= 0 ? "text-green-400" : "text-red-400")}>
                                                {prog > 0 ? "+" : ""}{prog.toFixed(1)}%
                                            </div>
                                            <div className="text-right text-[10px] text-neutral-600 font-mono tracking-widest group-hover:text-neutral-400">
                                                {"█".repeat(bars)}{"░".repeat(10 - bars)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-4 mt-4 border-t border-white/10">
                                    <button onClick={() => goTo('board_menu')} className="px-4 py-2 bg-white/5 rounded hover:bg-white/10 w-full text-center">Back</button>
                                </div>
                            </div>
                        )}

                        {/* --- HISTORY & DELETE SPECIFIC VALUE --- */}
                        {(view === 'show_metric_history' || view === 'delete_specific_value') && (
                            <div className="p-2 space-y-2">
                                <h3 className="text-cyan-400 font-bold mb-4">{view === 'delete_specific_value' ? 'Delete Specific Values' : 'Full Metric History'}: {selectedMetric?.name}</h3>
                                {history.length === 0 ? (
                                    <p className="text-neutral-500 text-center py-4">No data to display.</p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-4 border-b border-white/10 pb-2 text-[10px] text-neutral-500 uppercase">
                                            <div>{view === 'delete_specific_value' ? 'Key' : '#'}</div>
                                            <div className="col-span-2">Date & Time</div>
                                            <div className="text-right">Value</div>
                                        </div>
                                        {history.map((h, i) => (
                                            <Command.Item
                                                key={h.id}
                                                onSelect={() => view === 'delete_specific_value' && executeMenuAction(getPrefix(i))}
                                                className={cn("grid grid-cols-4 items-center p-2 rounded", view === 'delete_specific_value' ? "cursor-pointer hover:bg-white/5" : "")}
                                            >
                                                <div className="flex gap-2 items-center">
                                                    {view === 'delete_specific_value' && <span className="text-cyan-400 font-bold">{getPrefix(i)}</span>}
                                                    {view === 'delete_specific_value' && <span className="text-neutral-500">[{multiSelectIds.includes(h.id.toString()) ? 'X' : ' '}]</span>}
                                                    {view !== 'delete_specific_value' && <span>{history.length - i}</span>}
                                                </div>
                                                <div className="col-span-2 text-xs truncate">{new Date(h.timestamp).toLocaleString()}</div>
                                                <div className="text-right text-xs text-white">{typeof h.data === 'object' ? JSON.stringify(h.data) : String(h.data)}</div>
                                            </Command.Item>
                                        ))}

                                        {view === 'delete_specific_value' && (
                                            <div className="mt-4 pt-4 border-t border-white/10 px-2 flex gap-2">
                                                <button onClick={handleDeleteSpecificValue} disabled={multiSelectIds.length === 0} className="flex-1 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50 text-xs">
                                                    Confirm Deletion
                                                </button>
                                                <button onClick={() => goTo('board_menu')} className="flex-1 py-2 text-neutral-500 bg-white/5 rounded hover:bg-white/10 text-xs text-center">Cancel</button>
                                            </div>
                                        )}
                                    </>
                                )}
                                {view === 'show_metric_history' && (
                                    <div className="pt-4 border-t border-white/10">
                                        <button onClick={() => goTo('board_menu')} className="px-4 py-2 bg-white/5 rounded hover:bg-white/10 w-full text-center">Back</button>
                                    </div>
                                )}
                            </div>
                        )}

                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
