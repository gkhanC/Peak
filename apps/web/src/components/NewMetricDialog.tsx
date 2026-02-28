"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface NewMetricDialogProps {
    boardId: number;
    onCreated: () => void;
}

export function NewMetricDialog({ boardId, onCreated }: NewMetricDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const [name, setName] = React.useState("");
    const [type, setType] = React.useState("Count");
    const [target, setTarget] = React.useState("");
    const [progressDirection, setProgressDirection] = React.useState("Ascending");
    const [countDirection, setCountDirection] = React.useState("Ascending");
    const [measurementDirection, setMeasurementDirection] = React.useState("Ascending");
    const [timeDirection, setTimeDirection] = React.useState("Ascending");
    const [progressionMethod, setProgressionMethod] = React.useState("sinceCreation");
    const [startingValue, setStartingValue] = React.useState("");
    const [unit, setUnit] = React.useState("");

    const handleCreate = async () => {
        if (!name.trim()) return;
        if (type === 'Goal' && (!target || isNaN(Number(target)))) {
            alert("A valid numeric target is required for Goal metrics.");
            return;
        }

        const isDescendingCounter = (type === 'Goal' || type === 'Count') && progressDirection === 'Descending';
        if (isDescendingCounter && (!startingValue || isNaN(Number(startingValue)))) {
            alert("A valid numeric starting value is required for Descending counters.");
            return;
        }

        setIsSaving(true);
        const finalProgressDirection = (type === 'SetRep' || type === 'SetMeasurement') ? 'Ascending' : progressDirection;
        let finalSchema: any = { value: "number", ...(isDescendingCounter ? { startingValue: Number(startingValue) } : {}) };

        if (type === 'Checklist') finalSchema = { items: [] };
        else if (type === 'CountTime') finalSchema = { countDirection, timeDirection };
        else if (type === 'MeasurementTime') finalSchema = { measurementDirection, timeDirection, unit };
        else if (type === 'SetRepTime') finalSchema = { timeDirection };
        else if (type === 'SetMeasurementTime') finalSchema = { timeDirection, unit };
        else if (type === 'SetMeasurement') finalSchema = { unit };
        else if (type === 'Measurement') finalSchema = { unit, value: "number", ...(isDescendingCounter ? { startingValue: Number(startingValue) } : {}) };

        try {
            const res = await fetch(`/api/metrics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    boardId,
                    name: name.trim().toUpperCase(),
                    type,
                    target: type === 'Goal' ? Number(target) : null,
                    progressDirection: finalProgressDirection,
                    progressionMethod,
                    schema: finalSchema
                }),
            });

            if (res.ok) {
                onCreated();
                setOpen(false);
                setName("");
                setType("Count");
                setTarget("");
                setStartingValue("");
                setUnit("");
                setProgressDirection("Ascending");
                setCountDirection("Ascending");
                setMeasurementDirection("Ascending");
                setTimeDirection("Ascending");
            } else if (res.status === 409) {
                alert("A metric with this name already exists in this board.");
            } else {
                console.error("Failed to create metric");
            }
        } catch (e) {
            console.error(e);
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> New Metric
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] border-slate-800 bg-[#09090b] text-white" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Create New Metric</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Metric Type</Label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="Count">Endless Counter (+1)</option>
                            <option value="Goal">Goal Target (e.g. reach 100)</option>
                            <option value="Checklist">Checklist (Habits, Todos)</option>
                            <option value="Measurement">Measurement (e.g. kg, cm, km)</option>
                            <option value="CountTime">Count + Time Split</option>
                            <option value="MeasurementTime">Measurement + Time Split</option>
                            <option value="SetRep">Set × Rep</option>
                            <option value="SetMeasurement">Set × Measurement</option>
                            <option value="SetRepTime">Set × Rep × Time</option>
                            <option value="SetMeasurementTime">Set × Measurement × Time</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Metric Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'Goal' ? "e.g. Read Pages" : "e.g. Coffees drank, Bugs fixed..."}
                            className="bg-[#050505] border-slate-800"
                        />
                    </div>

                    {type !== 'Checklist' && type === 'Goal' && (
                        <div className="grid gap-2">
                            <Label htmlFor="target">Target Value *</Label>
                            <Input
                                id="target"
                                type="number"
                                step="any"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                placeholder="e.g. 100"
                                className="bg-[#050505] border-slate-800"
                            />
                        </div>
                    )}

                    {(type === 'Measurement' || type === 'SetMeasurement' || type === 'SetMeasurementTime' || type === 'MeasurementTime') && (
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Unit (Optional)</Label>
                            <Input
                                id="unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="e.g. kg, lbs, cm, km"
                                className="bg-[#050505] border-slate-800"
                            />
                        </div>
                    )}

                    {type !== 'Checklist' && type !== 'CountTime' && type !== 'MeasurementTime' && type !== 'SetRepTime' && type !== 'SetMeasurementTime' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Method</Label>
                                <select
                                    value={progressionMethod}
                                    onChange={(e) => setProgressionMethod(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="sinceCreation">Since Creation</option>
                                    <option value="lastTwo">Last 2 Entries</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Direction</Label>
                                <select
                                    value={progressDirection}
                                    onChange={(e) => setProgressDirection(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={type === 'SetRep' || type === 'SetMeasurement'}
                                >
                                    <option value="Ascending">Ascending (+)</option>
                                    {type !== 'SetRep' && type !== 'SetMeasurement' && <option value="Descending">Descending (-)</option>}
                                </select>
                            </div>
                        </div>
                    )}

                    {(type === 'CountTime' || type === 'MeasurementTime' || type === 'SetRepTime' || type === 'SetMeasurementTime') && (
                        <div className="grid grid-cols-2 gap-4">
                            {(type === 'CountTime' || type === 'MeasurementTime') && (
                                <div className="grid gap-2">
                                    <Label>{type === 'MeasurementTime' ? "Measurement Direction" : "Count Direction"}</Label>
                                    <select
                                        value={type === 'MeasurementTime' ? measurementDirection : countDirection}
                                        onChange={(e) => type === 'MeasurementTime' ? setMeasurementDirection(e.target.value) : setCountDirection(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="Ascending">Ascending (+)</option>
                                        <option value="Descending">Descending (-)</option>
                                    </select>
                                </div>
                            )}
                            {(type === 'SetRepTime' || type === 'SetMeasurementTime') && (
                                <div className="grid gap-2">
                                    <Label>Method</Label>
                                    <select
                                        value={progressionMethod}
                                        onChange={(e) => setProgressionMethod(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="sinceCreation">Since Creation</option>
                                        <option value="lastTwo">Last 2 Entries</option>
                                    </select>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label>Time Direction</Label>
                                <select
                                    value={timeDirection}
                                    onChange={(e) => setTimeDirection(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-[#050505] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="Ascending">Ascending (+)</option>
                                    <option value="Descending">Descending (-)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {(type === 'Goal' || type === 'Count') && progressDirection === 'Descending' && (
                        <div className="grid gap-2">
                            <Label htmlFor="startingValue">Starting Value *</Label>
                            <Input
                                id="startingValue"
                                type="number"
                                step="any"
                                value={startingValue}
                                onChange={(e) => setStartingValue(e.target.value)}
                                placeholder="e.g. 500 (Initial amount to count down from)"
                                className="bg-[#050505] border-slate-800"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        onClick={handleCreate}
                        disabled={isSaving || !name.trim() || (type === 'Goal' && !target) || ((type === 'Goal' || type === 'Count') && progressDirection === 'Descending' && !startingValue)}
                        className="bg-white text-black hover:bg-neutral-200"
                    >
                        {isSaving ? "Creating..." : "Add Metric"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
