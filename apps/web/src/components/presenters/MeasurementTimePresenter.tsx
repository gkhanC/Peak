import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface MeasurementTimePresenterProps {
    metric: any;
    onLog: (measurement: number, time: number) => Promise<void>;
    isLoading: boolean;
}

export function MeasurementTimePresenter({ metric, onLog, isLoading }: MeasurementTimePresenterProps) {
    const [measurement, setMeasurement] = React.useState("");
    const [time, setTime] = React.useState("");

    const handleLog = async () => {
        if (measurement === "" || time === "") return;
        await onLog(Number(measurement), Number(time));
        setMeasurement("");
        setTime("");
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full p-6 bg-black/20 rounded-2xl border border-white/5 relative shadow-inner">
            <h3 className="text-xl font-black text-white/50 uppercase tracking-widest text-center">New Entry</h3>
            <div className="flex flex-col gap-4 mt-auto">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Measurement / Unit</label>
                    <Input
                        type="number"
                        step="any"
                        value={measurement}
                        onChange={(e) => setMeasurement(e.target.value)}
                        placeholder="0"
                        className="bg-black/50 border-slate-700/50 text-white text-lg h-12 font-bold focus-visible:ring-1 focus-visible:ring-cyan-500"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Time Value (e.g. seconds or minutes)</label>
                    <Input
                        type="number"
                        step="any"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="0"
                        className="bg-black/50 border-slate-700/50 text-white text-lg h-12 font-bold focus-visible:ring-1 focus-visible:ring-cyan-500"
                    />
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase tracking-widest h-12 mt-2 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    onClick={handleLog}
                    disabled={isLoading || measurement === "" || time === ""}
                >
                    {isLoading ? "Saving..." : <><Plus className="w-5 h-5 mr-2 stroke-[3]" /> Save</>}
                </Button>
            </div>
        </div>
    );
}
