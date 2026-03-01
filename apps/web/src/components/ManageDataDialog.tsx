"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseMetric } from "@peak/core";
import { Trash2, Plus } from "lucide-react";

interface ManageDataDialogProps {
    metric: BaseMetric;
    history: any[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function ManageDataDialog({ metric, history, isOpen, onClose, onUpdate }: ManageDataDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [newDate, setNewDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [newValue, setNewValue] = React.useState("");
    const [newCount, setNewCount] = React.useState("");
    const [newMeasurement, setNewMeasurement] = React.useState("");
    const [newTime, setNewTime] = React.useState("");
    const [newSet, setNewSet] = React.useState("");
    const [newRep, setNewRep] = React.useState("");

    const handleDeleteEntry = async (entryId: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/entries/${entryId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                onUpdate();
            } else {
                console.error("Failed to delete entry");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEntry = async () => {
        if ((metric.type as any) === 'CountTime') {
            if (!newCount || !newTime) return;
        } else if ((metric.type as any) === 'MeasurementTime') {
            if (!newMeasurement || !newTime) return;
        } else if (metric.type === 'SetRep') {
            if (!newSet || !newRep) return;
        } else if (metric.type === 'SetMeasurement') {
            if (!newSet || !newMeasurement) return;
        } else if (metric.type === 'SetRepTime') {
            if (!newSet || !newRep || !newTime) return;
        } else if (metric.type === 'SetRepMeasurement') {
            if (!newSet || !newRep || !newMeasurement) return;
        } else {
            if (!newValue) return;
        }

        setIsLoading(true);
        try {
            let dataPayload: any = {};
            if (metric.type === 'CompoundValue') {
                dataPayload = { set: parseInt(newValue.split(',')[0] || "0"), rep: parseInt(newValue.split(',')[1] || "0") };
            } else if ((metric.type as any) === 'CountTime') {
                dataPayload = { count: Number(newCount), time: Number(newTime) };
            } else if ((metric.type as any) === 'MeasurementTime') {
                dataPayload = { measurement: Number(newMeasurement), time: Number(newTime) };
            } else if (metric.type === 'SetRep') {
                dataPayload = { set: Number(newSet), rep: Number(newRep) };
            } else if (metric.type === 'SetMeasurement') {
                dataPayload = { set: Number(newSet), measurement: Number(newMeasurement) };
            } else if (metric.type === 'SetRepTime') {
                dataPayload = { set: Number(newSet), rep: Number(newRep), time: Number(newTime) };
            } else if (metric.type === 'SetRepMeasurement') {
                dataPayload = { set: Number(newSet), rep: Number(newRep), measurement: Number(newMeasurement) };
            } else {
                dataPayload = { value: parseFloat(newValue) };
            }

            const res = await fetch("/api/entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    metricId: metric.id,
                    data: dataPayload,
                    timestamp: new Date(newDate).toISOString()
                })
            });

            if (res.ok) {
                setNewValue("");
                setNewCount("");
                setNewMeasurement("");
                setNewTime("");
                setNewSet("");
                setNewRep("");
                onUpdate();
            } else {
                console.error("Failed to add past entry");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-[#09090b] text-white overflow-hidden flex flex-col max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Manage Historical Data</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Add past entries or remove incorrect logs for {metric.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
                    {/* Add New Entry Form */}
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
                        <div className="font-semibold text-sm">Add Past Entry</div>
                        <div className={`grid ${(metric.type === 'SetRepTime' || metric.type === 'SetMeasurementTime' || metric.type === 'SetRepMeasurement') ? 'grid-cols-4' : (metric.type === 'CountTime' || metric.type === 'MeasurementTime' || metric.type === 'SetRep' || metric.type === 'SetMeasurement') ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-400">Date</Label>
                                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8 text-sm bg-black/50 border-neutral-800" />
                            </div>

                            {(metric.type as any) === 'CountTime' || (metric.type as any) === 'MeasurementTime' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-neutral-400">{(metric.type as any) === 'MeasurementTime' ? 'Measurement' : 'Count'}</Label>
                                        <Input type="number" step="any" value={(metric.type as any) === 'MeasurementTime' ? newMeasurement : newCount} onChange={(e) => (metric.type as any) === 'MeasurementTime' ? setNewMeasurement(e.target.value) : setNewCount(e.target.value)} placeholder="0" className="h-8 text-sm bg-black/50 border-neutral-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-neutral-400">Time</Label>
                                        <Input type="number" step="any" value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="0" className="h-8 text-sm bg-black/50 border-neutral-800" />
                                    </div>
                                </>
                            ) : metric.type === 'SetRep' || metric.type === 'SetRepTime' || metric.type === 'SetRepMeasurement' ? (
                                <>
                                    <div className="space-y-2"><Label className="text-xs text-neutral-400">Sets</Label><Input value={newSet} onChange={e => setNewSet(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>
                                    <div className="space-y-2"><Label className="text-xs text-neutral-400">Reps</Label><Input value={newRep} onChange={e => setNewRep(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>
                                    {metric.type === 'SetRepTime' && <div className="space-y-2"><Label className="text-xs text-neutral-400">Time</Label><Input value={newTime} onChange={e => setNewTime(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>}
                                    {metric.type === 'SetRepMeasurement' && <div className="space-y-2"><Label className="text-xs text-neutral-400 uppercase">{metric.schema?.unit || 'Unit'}</Label><Input value={newMeasurement} onChange={e => setNewMeasurement(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>}
                                </>
                            ) : metric.type === 'SetMeasurement' || metric.type === 'SetMeasurementTime' ? (
                                <>
                                    <div className="space-y-2"><Label className="text-xs text-neutral-400">Sets</Label><Input value={newSet} onChange={e => setNewSet(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>
                                    <div className="space-y-2"><Label className="text-xs text-neutral-400 uppercase">{metric.schema?.unit || 'Unit'}</Label><Input value={newMeasurement} onChange={e => setNewMeasurement(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>
                                    {metric.type === 'SetMeasurementTime' && <div className="space-y-2"><Label className="text-xs text-neutral-400">Time</Label><Input value={newTime} onChange={e => setNewTime(e.target.value)} type="number" step="any" className="h-8 text-sm bg-black/50 border-neutral-800" /></div>}
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-xs text-neutral-400 uppercase">
                                        {metric.type === 'CompoundValue' ? 'Value (Set,Rep)' : metric.schema?.unit ? `Value (${metric.schema.unit})` : 'Value'}
                                    </Label>
                                    <Input
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        placeholder={metric.type === 'CompoundValue' ? "e.g. 3,10" : "Value"}
                                        type={metric.type === 'CompoundValue' ? "text" : "number"}
                                        step={metric.type === 'CompoundValue' ? undefined : "any"}
                                        className="h-8 text-sm bg-black/50 border-neutral-800"
                                    />
                                </div>
                            )}
                        </div>
                        <Button
                            className="w-full h-8 text-xs bg-white text-black hover:bg-neutral-200"
                            onClick={handleAddEntry}
                            disabled={isLoading}
                        >
                            <Plus className="w-3 h-3 mr-2" /> Add Entry
                        </Button>
                    </div>

                    {/* History List */}
                    <div className="space-y-2 pb-4">
                        <div className="font-semibold text-sm mb-3">Recorded Entries</div>
                        {history.length === 0 ? (
                            <div className="text-center text-neutral-500 text-sm py-4">No entries recorded yet.</div>
                        ) : (
                            history.map((entry, idx) => (
                                <div key={entry.id || idx} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                            {(metric.type as any) === 'CountTime'
                                                ? `C: ${entry.data.count || 0}   T: ${entry.data.time || 0}`
                                                : (metric.type as any) === 'MeasurementTime'
                                                    ? `U: ${entry.data.measurement || 0}   T: ${entry.data.time || 0}`
                                                    : metric.type === 'SetRep'
                                                        ? `${entry.data.set || 0} Sets × ${entry.data.rep || 0} Reps`
                                                        : metric.type === 'SetMeasurement'
                                                            ? `${entry.data.set || 0} Sets × ${entry.data.measurement || 0} ${metric.schema?.unit || 'Unit'}`
                                                            : metric.type === 'SetRepMeasurement'
                                                                ? `${entry.data.set || 0}S × ${entry.data.rep || 0}R × ${entry.data.measurement || 0} ${metric.schema?.unit || 'Unit'}`
                                                                : metric.type === 'SetRepTime'
                                                                    ? `${entry.data.set || 0}S × ${entry.data.rep || 0}R in ${entry.data.time || 0}T`
                                                                    : metric.type === 'SetMeasurementTime'
                                                                        ? `${entry.data.set || 0}S × ${entry.data.measurement || 0}${metric.schema?.unit || 'U'} in ${entry.data.time || 0}T`
                                                                        : metric.type === 'CompoundValue'
                                                                            ? `${entry.data.set} sets, ${entry.data.rep} reps`
                                                                            : `${entry.data.value} ${metric.schema?.unit || ''}`}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {new Date(entry.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={() => entry.id && handleDeleteEntry(entry.id)}
                                        disabled={isLoading || !entry.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
