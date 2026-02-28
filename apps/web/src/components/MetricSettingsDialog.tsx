"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseMetric } from "@peak/core";

interface MetricSettingsDialogProps {
    metric: BaseMetric;
    isOpen: boolean;
    startInDeleteMode?: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function MetricSettingsDialog({ metric, isOpen, startInDeleteMode = false, onClose, onUpdate }: MetricSettingsDialogProps) {
    const [name, setName] = React.useState(metric.name);
    const [target, setTarget] = React.useState(metric.target ? String(metric.target) : "");
    const [isLoading, setIsLoading] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setName(metric.name);
            setTarget(metric.target ? String(metric.target) : "");
            setIsDeleting(startInDeleteMode);
        }
    }, [isOpen, metric, startInDeleteMode]);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/metrics/${metric.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim().toUpperCase(),
                    target: target ? parseFloat(target) : null
                })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                console.error("Failed to update metric");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/metrics/${metric.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                console.error("Failed to delete metric");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] border-slate-800 bg-[#09090b] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Metric Settings</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Update the properties of your metric or permanently delete it.
                    </DialogDescription>
                </DialogHeader>

                {isDeleting ? (
                    <div className="py-6 flex flex-col items-center justify-center text-center gap-4">
                        <div className="text-red-500 font-bold mb-2">Are you sure?</div>
                        <p className="text-sm text-neutral-400">
                            This action cannot be undone. This will permanently delete the metric and all of its associated data logs.
                        </p>
                        <div className="flex w-full justify-between mt-4">
                            <Button variant="outline" className="text-white border-neutral-700 hover:bg-neutral-800" onClick={() => setIsDeleting(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? "Deleting..." : "Yes, delete metric"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-white">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-black/50 border-neutral-800 text-white placeholder:text-neutral-500"
                                    placeholder="E.g., Morning Run"
                                />
                            </div>

                            {(metric.type === 'Goal' || metric.type === 'SingleValue') && (
                                <div className="grid gap-2">
                                    <Label htmlFor="target" className="text-white">Target (Optional)</Label>
                                    <Input
                                        id="target"
                                        type="number"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        className="bg-black/50 border-neutral-800 text-white placeholder:text-neutral-500"
                                        placeholder="Target Value"
                                    />
                                </div>
                            )}

                        </div>
                        <DialogFooter className="flex sm:justify-between items-center w-full">
                            <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setIsDeleting(true)} disabled={isLoading}>
                                Delete Metric
                            </Button>
                            <Button onClick={handleUpdate} disabled={isLoading || !name.trim()} className="bg-white text-black hover:bg-neutral-200">
                                {isLoading ? "Saving..." : "Save changes"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
