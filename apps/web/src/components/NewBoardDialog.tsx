"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBoards } from "@/hooks/useBoards";

interface NewBoardDialogProps {
    onCreated: (newBoard: any) => void;
}

const PREDEFINED_THEMES = ['default', 'sport', 'work', 'task', 'learning'];
const PREDEFINED_TAGS = ['Sport', 'Work', 'Learning', 'Language', 'To Do'];
const PREDEFINED_ILLUSTRATIONS = [
    { value: 'none', label: 'None' },
    { value: 'sport.png', label: 'Sport' },
    { value: 'work.png', label: 'Work' },
    { value: 'learning.png', label: 'Learning' },
    { value: 'language.png', label: 'Language' },
    { value: 'todo.png', label: 'To Do' },
];

export function NewBoardDialog({ onCreated }: NewBoardDialogProps) {
    const { createBoard } = useBoards();
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [theme, setTheme] = React.useState("default");
    const [tag, setTag] = React.useState("");
    const [illustration, setIllustration] = React.useState("none");
    const [progressionMethod, setProgressionMethod] = React.useState("sinceCreation");

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const newBoard = await createBoard({
                name: name.trim().toUpperCase(),
                description,
                theme,
                tag,
                illustration: illustration === 'none' ? null : illustration,
                progressionMethod
            });

            // Initialize default stats for a newly created board to seamlessly fit into the UI
            newBoard.completionPercentage = 0;

            onCreated(newBoard);
            setOpen(false);

            // Reset form
            setName("");
            setDescription("");
            setTheme("default");
            setTag("");
            setIllustration("none");
            setProgressionMethod("sinceCreation");
        } catch (e) {
            console.error(e);
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-neutral-200">New Board</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] border-[#333] bg-[#121212] text-white" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Board Name *</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fitness Goals" className="bg-[#1a1a1a] border-[#333]" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you tracking?" className="bg-[#1a1a1a] border-[#333]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Theme Color</Label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {PREDEFINED_THEMES.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Illustration</Label>
                            <select
                                value={illustration || 'none'}
                                onChange={(e) => setIllustration(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            onChange={(e) => setProgressionMethod(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium text-cyan-400"
                        >
                            <option value="sinceCreation">Overall (Since Creation)</option>
                            <option value="lastTwo">Recent (Last 2 Entries)</option>
                        </select>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Default calculation basis for this board</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tag">Tag (Custom or Preset)</Label>
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
                                className="bg-[#1a1a1a] border-[#333]"
                            />
                            {tag && (
                                <Button
                                    variant="outline"
                                    onClick={() => setTag("")}
                                    className="border-[#333] text-neutral-400 hover:text-white"
                                    type="button"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={handleCreate} disabled={isSaving || !name.trim()} className="bg-white text-black hover:bg-neutral-200">
                        {isSaving ? "Creating..." : "Create Board"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
