import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface SetMeasurementPresenterProps {
    metric: any;
    onLog: (set: number, measurement: number) => Promise<void>;
    isLoading: boolean;
}

export function SetMeasurementPresenter({ metric, onLog, isLoading }: SetMeasurementPresenterProps) {
    const [set, setSet] = React.useState("");
    const [measurement, setMeasurement] = React.useState("");

    const handleLog = async () => {
        if (set === "" || measurement === "") return;
        await onLog(Number(set), Number(measurement));
        setSet("");
        setMeasurement("");
    };

    const unit = metric.schema?.unit || "Unit";

    return (
        <div className="flex flex-col gap-4 w-full h-full p-6 bg-black/20 rounded-2xl border border-white/5 relative shadow-inner">
            <h3 className="text-xl font-black text-white/50 uppercase tracking-widest text-center">New Entry</h3>
            <div className="flex flex-col gap-4 mt-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Sets</label>
                        <Input
                            type="number"
                            step="any"
                            value={set}
                            onChange={(e) => setSet(e.target.value)}
                            placeholder="0"
                            className="bg-black/50 border-slate-700/50 text-white text-lg h-12 font-bold focus-visible:ring-1 focus-visible:ring-cyan-500 text-center"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">{unit}</label>
                        <Input
                            type="number"
                            step="any"
                            value={measurement}
                            onChange={(e) => setMeasurement(e.target.value)}
                            placeholder="0"
                            className="bg-black/50 border-slate-700/50 text-white text-lg h-12 font-bold focus-visible:ring-1 focus-visible:ring-cyan-500 text-center"
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black uppercase tracking-widest h-12 mt-2 shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                    onClick={handleLog}
                    disabled={isLoading || set === "" || measurement === ""}
                >
                    {isLoading ? "Saving..." : <><Plus className="w-5 h-5 mr-2 stroke-[3]" /> Save</>}
                </Button>
            </div>
        </div>
    );
}
