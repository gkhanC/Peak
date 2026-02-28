import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check } from "lucide-react";

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

interface ChecklistPresenterProps {
    metric: any;
    onUpdateSchema: (newSchema: any) => Promise<void>;
    onLog: (percentage: number) => Promise<void>;
    isLoading?: boolean;
}

export function ChecklistPresenter({ metric, onUpdateSchema, onLog, isLoading }: ChecklistPresenterProps) {
    const [items, setItems] = React.useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = React.useState("");

    React.useEffect(() => {
        if (metric.schema && Array.isArray(metric.schema.items)) {
            setItems(metric.schema.items);
        }
    }, [metric.schema]);

    const calculatePercentage = (currentItems: ChecklistItem[]) => {
        if (currentItems.length === 0) return 0;
        const completed = currentItems.filter(i => i.completed).length;
        return (completed / currentItems.length) * 100;
    };

    const updateAndLog = async (newItems: ChecklistItem[]) => {
        setItems(newItems);
        // Optimize: Do both operations concurrently
        await Promise.all([
            onUpdateSchema({ ...metric.schema, items: newItems }),
            onLog(calculatePercentage(newItems))
        ]);
    };

    const handleAddItem = async () => {
        if (!newItemText.trim()) return;

        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: newItemText.trim(),
            completed: false
        };

        const newItems = [...items, newItem];
        setNewItemText("");
        await updateAndLog(newItems);
    };

    const handleToggleItem = async (id: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        await updateAndLog(newItems);
    };

    const handleDeleteItem = async (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        await updateAndLog(newItems);
    };

    return (
        <div className="flex flex-col gap-3 w-full h-full max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-2 sticky top-0 bg-[#09090b] pt-1 pb-2 z-10 border-b border-white/5">
                <Input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder="Add new task..."
                    className="h-8 bg-[#050505] border-slate-800 text-xs focus:ring-cyan-500/50"
                    disabled={isLoading}
                />
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/40 hover:text-white border border-cyan-500/30"
                    disabled={isLoading || !newItemText.trim()}
                    onClick={handleAddItem}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-col gap-2 pb-2">
                {items.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 italic py-4">No tasks added yet.</div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className={`flex items-center justify-between gap-3 group p-2 rounded-lg border transition-all ${item.completed ? 'bg-white/5 border-emerald-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>

                            <div className="flex items-center gap-3 flex-grow overflow-hidden cursor-pointer" onClick={() => !isLoading && handleToggleItem(item.id)}>
                                <div className={`flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'border-slate-600 bg-black/50'} `}>
                                    {item.completed && <Check className="h-3 w-3" strokeWidth={4} />}
                                </div>
                                <span className={`text-sm tracking-wide truncate transition-all ${item.completed ? 'text-slate-500 line-through decoration-emerald-500/50' : 'text-slate-200'}`}>
                                    {item.text}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isLoading}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
