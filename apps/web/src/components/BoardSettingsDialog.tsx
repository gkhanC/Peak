"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { Board, ProgressionMethod } from "@/types";

interface BoardSettingsDialogProps {
    board: Board;
    onUpdate: (updatedBoard?: Board | null) => void;
    isHeader?: boolean;
}

const PREDEFINED_THEMES = ['default', 'sport', 'work', 'task', 'learning'] as const;
const PREDEFINED_TAGS = ['Sport', 'Work', 'Learning', 'Language', 'To Do'] as const;
const PREDEFINED_ILLUSTRATIONS = [
    { value: 'none', label: 'None' },
    { value: 'sport.png', label: 'Sport' },
    { value: 'work.png', label: 'Work' },
    { value: 'learning.png', label: 'Learning' },
    { value: 'language.png', label: 'Language' },
    { value: 'todo.png', label: 'To Do' },
] as const;

/**
 * Pano ayarları iletişim kutusu bileşeni.
 * Ad, açıklama, tema, etiket ve ilerleme yöntemini değiştirmeyi sağlar.
 * Ayrıca panoyu silme özelliğine sahiptir.
 */
export function BoardSettingsDialog({ board, onUpdate, isHeader }: BoardSettingsDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const [name, setName] = React.useState(board.name || "");
    const [description, setDescription] = React.useState(board.description || "");
    const [theme, setTheme] = React.useState(board.theme || "default");
    const [tag, setTag] = React.useState(board.tag || "");
    const [illustration, setIllustration] = React.useState(board.illustration || "none");
    const [progressionMethod, setProgressionMethod] = React.useState<ProgressionMethod>(board.progressionMethod || "sinceCreation");

    // Senkronizasyon (Eğer dışarıdan board değişirse veya modal açılırsa mevcut veriyi sıfırla)
    React.useEffect(() => {
        if (open) {
            setName(board.name || "");
            setDescription(board.description || "");
            setTheme(board.theme || "default");
            setTag(board.tag || "");
            setIllustration(board.illustration || "none");
            setProgressionMethod(board.progressionMethod || "sinceCreation");
        }
    }, [open, board]);

    const isInitialMount = React.useRef(true);

    // Otomatik kaydetme efekti (Debounce ile)
    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Sadece bir değişiklik varsa kaydet
        if (
            name === (board.name || "") &&
            description === (board.description || "") &&
            theme === (board.theme || "default") &&
            tag === (board.tag || "") &&
            (illustration === 'none' ? null : illustration) === (board.illustration || null) &&
            progressionMethod === (board.progressionMethod || "sinceCreation")
        ) {
            return;
        }

        const handler = setTimeout(async () => {
            setIsSaving(true);
            try {
                const res = await fetch(`/api/boards/${board.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name.trim().toUpperCase(),
                        description,
                        theme,
                        tag,
                        illustration: illustration === 'none' ? null : illustration,
                        progressionMethod
                    }),
                });

                if (res.ok) {
                    const updatedBoard: Board = await res.json();
                    onUpdate(updatedBoard);
                }
            } catch (e) {
                console.error("Güncelleme hatası:", e);
            }
            setIsSaving(false);
        }, 500);

        return () => clearTimeout(handler);
    }, [name, description, theme, tag, illustration, progressionMethod, board.id, onUpdate]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this board and all its data? This cannot be undone.")) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/boards/${board.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setOpen(false);
                onUpdate(null); // Parent bileşene silindiğini bildir
            }
        } catch (e) {
            console.error("Silme hatası:", e);
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={isHeader ? "outline" : "ghost"}
                    size={isHeader ? "sm" : "icon"}
                    className={isHeader
                        ? "bg-black/50 border-slate-800 hover:bg-[#222] text-neutral-400 hover:text-white h-9"
                        : "h-8 w-8 text-neutral-500 hover:text-white absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    }
                    onClick={(e) => e.stopPropagation()}
                >
                    {isHeader ? <><Settings className="h-4 w-4 mr-2" /> Board Settings</> : <Settings className="h-4 w-4" />}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-slate-800 bg-[#09090b] text-white" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Edit Board Settings</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Board Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#050505] border-slate-800" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#050505] border-slate-800" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Theme Color</Label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {PREDEFINED_THEMES.map(t => (
                                    <option key={t} value={t}>{t.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Illustration</Label>
                            <select
                                value={illustration || 'none'}
                                onChange={(e) => setIllustration(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {PREDEFINED_ILLUSTRATIONS.map(i => (
                                    <option key={i.value} value={i.value}>{i.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Progression Method</Label>
                        <select
                            value={progressionMethod}
                            onChange={(e) => setProgressionMethod(e.target.value as ProgressionMethod)}
                            className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm font-medium text-cyan-400"
                        >
                            <option value="sinceCreation">Overall (Since Creation)</option>
                            <option value="lastTwo">Recent (Last 2 entries)</option>
                        </select>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Calculation basis for board percentages</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tag">Tag</Label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {PREDEFINED_TAGS.map(preset => (
                                <Badge
                                    key={preset}
                                    variant="outline"
                                    className={`cursor-pointer ${tag === preset ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                                    onClick={() => setTag(preset)}
                                >
                                    {preset}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="tag"
                                placeholder="Or type custom tag..."
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                className="bg-[#050505] border-slate-800"
                            />
                            {tag && (
                                <Button variant="outline" onClick={() => setTag("")} className="border-slate-800 text-neutral-400 hover:text-white" type="button">Clear</Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/50">
                    <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={handleDelete} disabled={isSaving}>
                        {isSaving ? "Processing..." : "Delete Board"}
                    </Button>
                    <span className={`text-sm text-neutral-500 flex items-center gap-2 ${isSaving ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        Saving...
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
