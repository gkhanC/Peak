import { db, boards, metricDefinitions, entries } from "@peak/db";
import { eq, inArray, desc, and } from "drizzle-orm";
import { MetricService } from "@peak/core";
import { CLIView, COLORS } from "../views/CLIView";
import prompts from "prompts";

export class CLIController {
    private metricSvc: any;

    constructor(metricSvc: any) {
        this.metricSvc = metricSvc;
    }

    async runMainMenu() {
        let loop = true;
        while (loop) {
            CLIView.showHeader("Peak CLI - Main Menu");
            const action = await CLIView.promptAction("Please choose an option:", [
                { title: "Create Board", value: "1" },
                { title: "Delete Board", value: "2" },
                { title: "Select Board", value: "3" },
                { title: "Launch Dashboard", value: "d" },
                { title: "Exit", value: "0" }
            ]);

            if (!action || action === "0") {
                loop = false;
                break;
            }

            switch (action) {
                case "1": await this.createBoard(); break;
                case "2": await this.deleteBoard(); break;
                case "3": await this.selectBoard(); break;
                case "d": await this.openDashboard(); break;
            }
        }
        process.exit(0);
    }

    async createBoard(name?: string) {
        const boardName = name || await CLIView.promptText("Enter Board Name to create:");
        if (boardName) {
            const upperName = boardName.trim().toUpperCase();
            await db.insert(boards).values({ name: upperName });
            CLIView.showSuccess(`Board '${upperName}' created!`);
        }
    }

    async deleteBoard(name?: string) {
        if (name) {
            const upperName = name.trim().toUpperCase();
            const b = await db.select().from(boards).where(eq(boards.name, upperName)).limit(1);
            if (b.length > 0) {
                await this.performBoardDeletion([b[0].id]);
                CLIView.showSuccess(`Board '${upperName}' deleted.`);
            } else {
                CLIView.showError(`Board '${upperName}' not found.`);
            }
            return;
        }

        const allBoards = await db.select().from(boards).orderBy(boards.id);
        if (allBoards.length === 0) {
            CLIView.showInfo("No boards to delete.");
            return;
        }

        const choices = allBoards.map((b, idx) => ({ title: b.name, value: b.id.toString() }));
        const { selection } = await prompts({
            type: 'multiselect',
            name: 'selection',
            message: 'Select boards to delete:',
            choices,
            hint: '- Space to select. Return to submit'
        });

        if (selection && selection.length > 0) {
            await this.performBoardDeletion(selection.map((id: string) => parseInt(id)));
            CLIView.showSuccess("Selected boards deleted.");
        }
    }

    private async performBoardDeletion(ids: number[]) {
        const metricsToDelete = await db.select().from(metricDefinitions).where(inArray(metricDefinitions.boardId, ids));
        const mIds = metricsToDelete.map(m => m.id);
        if (mIds.length > 0) {
            await db.delete(entries).where(inArray(entries.metricId, mIds));
            await db.delete(metricDefinitions).where(inArray(metricDefinitions.boardId, ids));
        }
        await db.delete(boards).where(inArray(boards.id, ids));
    }

    async selectBoard() {
        const allBoards = await db.select().from(boards).orderBy(boards.id);
        if (allBoards.length === 0) {
            CLIView.showInfo("No boards available.");
            return;
        }

        const choices = allBoards.map(b => ({ title: b.name, value: b.id.toString() }));
        const selection = await CLIView.promptAction("Select a board:", choices);

        const board = allBoards.find(b => b.id.toString() === selection);
        if (board) {
            await this.runBoardMenu(board);
        }
    }

    async runBoardMenu(board: any) {
        let loop = true;
        while (loop) {
            CLIView.showHeader(`Board: ${board.name}`, COLORS.magenta);
            const action = await CLIView.promptAction("Select action:", [
                { title: "Add new metric", value: "1" },
                { title: "Delete metric", value: "2" },
                { title: "Add value to metric", value: "3" },
                { title: "Show metric info", value: "4" },
                { title: "Show all metrics", value: "5" },
                { title: "Show board info", value: "6" },
                { title: "Delete specific value", value: "7" },
                { title: "Show full metric history", value: "h" },
                { title: "Show Progress Report", value: "r" },
                { title: "Launch Dashboard", value: "d" },
                { title: "Back to main", value: "8" },
                { title: "Exit Application", value: "0" }
            ]);

            if (!action || action === "8") {
                loop = false;
                break;
            }

            switch (action) {
                case "1": await this.addMetric(board.id); break;
                case "2": await this.deleteMetric(board.id); break;
                case "3": await this.addValue(board.id); break;
                case "4": await this.showMetricInfo(board.id); break;
                case "5": await this.showAllMetrics(board.id); break;
                case "6": await this.showBoardInfo(board); break;
                case "7": await this.deleteSpecificValue(board.id); break;
                case "h": await this.showMetricHistory(board.id); break;
                case "r": await this.showReport(board.id); break;
                case "d": await this.openDashboard(); break;
                case "8": loop = false; break; // Go back to main loop
                case "0": process.exit(0); break;
            }
        }
    }

    async showMetricHistory(boardId: number) {
        const list = await this.metricSvc.getHydratedMetrics(boardId);
        if (list.length === 0) { CLIView.showInfo("No metrics available."); return; }

        const choices = list.map((m: any) => ({ title: m.name, value: m.id.toString() }));
        const selection = await CLIView.promptAction("Select metric to view full history:", choices);
        const m = list.find((x: any) => x.id.toString() === selection);
        if (!m) return;

        const allEntries = await db.select().from(entries).where(eq(entries.metricId, m.id)).orderBy(desc(entries.timestamp));
        if (allEntries.length === 0) { CLIView.showInfo("No history found for this metric."); return; }

        CLIView.showHeader(`Full History: ${m.name}`, COLORS.cyan);
        const rows = allEntries.map((e, idx) => {
            let valStr = typeof e.data === 'object' ? JSON.stringify(e.data) : String(e.data);
            // Prettify common types if possible
            if (m.type === 'SetRep' && e.data) {
                const d = e.data as any;
                valStr = `${d.set} x ${d.rep}`;
            } else if (m.type === 'Count' || m.type === 'Goal') {
                valStr = String((e.data as any).value || 0);
            }

            return [
                String(allEntries.length - idx),
                new Date(e.timestamp).toLocaleString(),
                valStr
            ];
        });

        CLIView.formatTable(["#", "Date & Time", "Value"], rows.reverse());
        console.log("\nPress any key to return...");
        await CLIView.promptText("");
    }

    async showReport(boardId: number) {
        const list = await this.metricSvc.getHydratedMetrics(boardId);
        if (list.length === 0) { CLIView.showInfo("No metrics to report."); return; }

        CLIView.showHeader("Overall Board Progress Report", COLORS.magenta);

        const rows = list.map((m: any) => {
            const prog = m.calculateProgression('sinceCreation');
            const progStr = prog.isCalculatable ? `${prog.percentage > 0 ? '+' : ''}${prog.percentage.toFixed(1)}%` : '--';

            // Simple ASCII Bar
            const barWidth = 10;
            const filled = Math.min(barWidth, Math.max(0, Math.floor((prog.percentage || 0) / 10)));
            const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

            const valStr = this.formatLatestValues(m);

            return [m.name, CLIView.formatMetricType(m.type), progStr, valStr, bar];
        });

        CLIView.formatTable(["Metric", "Type", "Progress", "Latest Values", "Trend"], rows);

        let avg = 0; let validCnt = 0;
        list.forEach((m: any) => {
            const p = m.calculateProgression('sinceCreation');
            if (p.isCalculatable) { avg += p.percentage; validCnt++; }
        });
        const boardAvg = validCnt > 0 ? (avg / validCnt).toFixed(1) : '0.0';
        CLIView.showInfo(`Board Overall Average Progression: ${boardAvg}%`);
        console.log("\nPress any key to return...");
        await CLIView.promptText("");
    }

    // Metric Actions
    async addMetric(boardId: number, mname?: string) {
        const name = mname || await CLIView.promptText("Enter new Metric Name:");
        if (!name) return;
        const upperName = name.trim().toUpperCase();

        const types = [
            'SingleValue', 'CompoundValue', 'Task', 'Count', 'Goal',
            'Measurement', 'SetRep', 'SetMeasurement', 'CountTime',
            'MeasurementTime', 'SetRepTime', 'SetMeasurementTime'
        ];

        const typeChoices = types.map(t => ({ title: CLIView.formatMetricType(t), value: t }));
        const selectedType = await CLIView.promptAction("Select Metric Type:", typeChoices);
        if (!selectedType) return;

        const dir = await CLIView.promptAction("Select Progress Direction:", [
            { title: "Ascending (Higher is better)", value: "Ascending" },
            { title: "Descending (Lower is better)", value: "Descending" }
        ]);

        let schema: any = {};
        if (selectedType.includes('Measurement') || selectedType === 'Goal') {
            const unit = await CLIView.promptText("Enter Unit (e.g. kg, km):");
            schema.unit = unit;
        }

        if (selectedType === 'Goal' || selectedType === 'Count') {
            const target = await CLIView.promptText("Enter Target value (0 for None):");
            const start = await CLIView.promptText("Enter Starting value (usually 0):");
            if (target) schema.target = Number(target);
            schema.startingValue = Number(start) || 0;
        }

        await db.insert(metricDefinitions).values({
            boardId, name: upperName, type: selectedType as any, schema, progressDirection: dir as any
        });
        CLIView.showSuccess(`Metric '${upperName}' created!`);
    }

    async deleteMetric(boardId: number, mname?: string) {
        const mList = await db.select().from(metricDefinitions).where(eq(metricDefinitions.boardId, boardId)).orderBy(metricDefinitions.id);
        if (mList.length === 0) { CLIView.showInfo("No metrics."); return; }

        let selM;
        if (mname) {
            selM = mList.find(m => m.name === mname.toUpperCase());
        } else {
            const choices = mList.map(m => ({ title: m.name, value: m.id.toString() }));
            const selection = await CLIView.promptAction("Select metric to delete:", choices);
            selM = mList.find(m => m.id.toString() === selection);
        }

        if (selM) {
            await db.delete(entries).where(eq(entries.metricId, selM.id));
            await db.delete(metricDefinitions).where(eq(metricDefinitions.id, selM.id));
            CLIView.showSuccess(`Metric '${selM.name}' deleted completely.`);
        } else if (mname) {
            CLIView.showError(`Metric '${mname}' not found.`);
        }
    }

    async addValue(boardId: number, mname?: string) {
        const list = await this.metricSvc.getHydratedMetrics(boardId);
        if (list.length === 0) { CLIView.showInfo("No metrics found in board."); return; }

        let m;
        if (mname) {
            m = list.find((x: any) => x.name === mname.toUpperCase());
        } else {
            const rows = list.map((m: any, idx: number) => {
                const prog = m.calculateProgression('sinceCreation');
                const progStr = prog.isCalculatable ? `${prog.percentage > 0 ? '+' : ''}${prog.percentage.toFixed(1)}%` : '--';
                const valStr = this.formatLatestValues(m);
                return [String(idx + 1), m.name, CLIView.formatMetricType(m.type), progStr, valStr];
            });

            CLIView.formatTable(["#", "Name", "Type", "Progress", "Latest Values"], rows);
            const choices = list.map((m: any) => ({ title: m.name, value: m.id.toString() }));
            const selection = await CLIView.promptAction("Select metric to add value to:", choices);
            m = list.find((x: any) => x.id.toString() === selection);
        }

        if (!m) {
            if (mname) CLIView.showError(`Metric '${mname}' not found.`);
            return;
        }

        // Special handling for Checklist and Task types
        if (m.type === 'Checklist' || m.type === 'Task') {
            await this.manageChecklist(m, boardId);
            return;
        }

        const rawInput = await this.promptForValue(m.type, (m.schema as any)?.unit);
        if (rawInput === undefined) return;

        const payload = this.parseValuePayload(m.type, rawInput);
        if (payload === null) return; // Parsing error handled inside parseValuePayload

        await db.insert(entries).values({ metricId: m.id, data: payload, timestamp: new Date() });

        CLIView.showSuccess("Value added successfully!");
        await this.printFreshInfo(boardId, m.id);
    }

    async manageChecklist(metric: any, boardId: number) {
        let loop = true;
        while (loop) {
            const schema = metric.schema || {};
            const items = Array.isArray(schema.items) ? schema.items : [];
            const completedCount = items.filter((i: any) => i.completed).length;
            const progress = items.length > 0 ? (completedCount / items.length * 100).toFixed(1) : "0.0";

            CLIView.showHeader(`Manage Checklist: ${metric.name} (${progress}%)`, COLORS.cyan);

            // Format existing items as choices
            const choices = items.map((item: any) => ({
                title: `[${item.completed ? 'X' : ' '}] ${item.text}`,
                value: `toggle:${item.id}`
            }));

            const result = await CLIView.promptAction("Select item to toggle, or choose an action:", [
                ...choices,
                { title: "+ Add new task", value: "add" },
                { title: "- Remove a task", value: "remove" },
                { title: "Done", value: "done" }
            ]);

            if (!result || result === "done") {
                loop = false;
                break;
            }

            let newItems = [...items];
            if (result === "add") {
                const text = await CLIView.promptText("Enter task description:");
                if (text) {
                    newItems.push({ id: Date.now().toString(), text, completed: false });
                }
            } else if (result === "remove") {
                if (items.length === 0) { CLIView.showInfo("No tasks to remove."); continue; }
                const toRemoveIdx = await CLIView.promptAction("Select task to remove:", items.map((item: any, idx: number) => ({ title: item.text, value: idx.toString() })));
                if (toRemoveIdx !== undefined) {
                    newItems.splice(parseInt(toRemoveIdx), 1);
                }
            } else if (result.startsWith("toggle:")) {
                const id = result.replace("toggle:", "");
                newItems = newItems.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
            }

            // Update schema and log progress
            const newCompletedCount = newItems.filter((i: any) => i.completed).length;
            const newPercentage = newItems.length > 0 ? (newCompletedCount / newItems.length * 100) : 0;
            const newSchema = { ...schema, items: newItems };

            await db.update(metricDefinitions).set({ schema: newSchema }).where(eq(metricDefinitions.id, metric.id));
            await db.insert(entries).values({
                metricId: metric.id,
                data: { value: newPercentage },
                timestamp: new Date()
            });

            // Update local object for loop
            metric.schema = newSchema;
            CLIView.showSuccess("Checklist updated.");
        }
        await this.printFreshInfo(boardId, metric.id);
    }

    private async promptForValue(metricType: string, unit: string = ""): Promise<any> {
        const unitHint = unit ? ` (${unit})` : "";
        switch (metricType) {
            case 'CompoundValue':
            case 'SetRep':
                return CLIView.promptText('Enter Set x Rep (e.g., 3x12):');
            case 'SetMeasurement':
                return CLIView.promptText(`Enter Set x Measurement${unitHint} (e.g., 3x10):`);
            case 'SetRepTime':
                return CLIView.promptText('Enter Set x Rep = Time (e.g., 3x10=60):');
            case 'SetMeasurementTime':
                return CLIView.promptText(`Enter Set x Measurement${unitHint} = Time (e.g., 3x10=60):`);
            case 'CountTime':
                return CLIView.promptText('Enter Count = Time (e.g., 50=120):');
            case 'MeasurementTime':
                return CLIView.promptText(`Enter Measurement${unitHint} = Time (e.g., 50=120):`);
            case 'Checklist':
            case 'Task':
                return CLIView.promptText('Enter completion percentage (e.g., 100):');
            default:
                const { val } = await prompts({ type: 'number', name: 'val', message: `Enter value${unitHint}:` });
                return val;
        }
    }

    private parseValuePayload(metricType: string, rawVal: any): any {
        if (typeof rawVal === 'number') return { value: rawVal };
        const s = String(rawVal).toLowerCase().replace(/\s+/g, '');

        try {
            if (metricType === 'SetRep' || metricType === 'CompoundValue') {
                const parts = s.split('x');
                if (parts.length < 2) throw new Error("Format: Set x Rep");
                return { set: Number(parts[0]), rep: Number(parts[1]) };
            }
            if (metricType === 'SetMeasurement') {
                const parts = s.split('x');
                if (parts.length < 2) throw new Error("Format: Set x Measurement");
                return { set: Number(parts[0]), measurement: Number(parts[1].replace(/[^0-9.]/g, '')) };
            }
            if (metricType === 'SetRepTime') {
                const [main, time] = s.split('=');
                if (!time) throw new Error("Format: Set x Rep = Time");
                const [set, rep] = main.split('x');
                if (!rep) throw new Error("Format: Set x Rep = Time");
                return { set: Number(set), rep: Number(rep), time: Number(time) };
            }
            if (metricType === 'SetMeasurementTime') {
                const [main, time] = s.split('=');
                if (!time) throw new Error("Format: Set x Measurement = Time");
                const [set, measurement] = main.split('x');
                if (!measurement) throw new Error("Format: Set x Measurement = Time");
                return { set: Number(set), measurement: Number(measurement.replace(/[^0-9.]/g, '')), time: Number(time) };
            }
            if (metricType === 'CountTime') {
                const [count, time] = s.split('=');
                if (!time) throw new Error("Format: Count = Time");
                return { count: Number(count), time: Number(time) };
            }
            if (metricType === 'MeasurementTime') {
                const [measurement, time] = s.split('=');
                if (!time) throw new Error("Format: Measurement = Time");
                return { measurement: Number(measurement.replace(/[^0-9.]/g, '')), time: Number(time) };
            }
        } catch (e: any) {
            CLIView.showError(`Invalid format: ${e.message}`);
            return null;
        }

        return { value: Number(s.replace(/[^0-9.-]/g, '')) };
    }

    private async printFreshInfo(boardId: number, metricId: number) {
        const freshMetrics = await this.metricSvc.getHydratedMetrics(boardId);
        const freshM = freshMetrics.find((x: any) => x.id === metricId);
        if (freshM) {
            const lastRec = freshM.dayAggregates[freshM.dayAggregates.length - 1];
            CLIView.showHeader("Metric Details", COLORS.cyan);
            console.log(`Name: ${freshM.name}`);
            console.log(`Type: ${CLIView.formatMetricType(freshM.type)}`);
            console.log(`Latest Values: ${this.formatLatestValues(freshM)}`);

            const progSinceCreation = freshM.calculateProgression('sinceCreation');
            const progLastTwo = freshM.calculateProgression('lastTwo');
            console.log(`Progression (Since Creation): ${progSinceCreation.isCalculatable ? (progSinceCreation.percentage > 0 ? '+' : '') + progSinceCreation.percentage.toFixed(1) + '%' : 'N/A'}`);
            console.log(`Progression (Last 2 updates): ${progLastTwo.isCalculatable ? (progLastTwo.percentage > 0 ? '+' : '') + progLastTwo.percentage.toFixed(1) + '%' : 'N/A'}`);

            let avg = 0;
            let validCnt = 0;
            freshMetrics.forEach((m: any) => {
                const p = m.calculateProgression('sinceCreation');
                if (p.isCalculatable) { avg += p.percentage; validCnt++; }
            });
            const boardAvg = validCnt > 0 ? (avg / validCnt).toFixed(1) : '0.0';
            CLIView.showHeader("Board Progress", COLORS.magenta);
            console.log(`Current Overall Board Progress: ${boardAvg}%`);
        }
    }

    async showMetricInfo(boardId: number) {
        const list = await this.metricSvc.getHydratedMetrics(boardId);
        if (list.length === 0) { CLIView.showInfo("No metrics."); return; }

        const choices = list.map((m: any) => ({ title: m.name, value: m.id.toString() }));
        const selection = await CLIView.promptAction("Select metric to view info:", choices);
        const m = list.find((x: any) => x.id.toString() === selection);
        if (!m) return;

        CLIView.showHeader(`Metric: ${m.name} [${CLIView.formatMetricType(m.type)}]`, COLORS.yellow);
        console.log(`Direction: ${m.progressDirection}`);
        if (m.target) console.log(`Target: ${m.target}`);

        console.log(`Latest Values: ${this.formatLatestValues(m)}`);

        const progAll = m.calculateProgression('sinceCreation');
        const progRec = m.calculateProgression('lastTwo');
        console.log(`Progress (Since Creation): ${progAll.isCalculatable ? (progAll.percentage > 0 ? '+' : '') + progAll.percentage.toFixed(1) + '%' : 'N/A'}`);
        console.log(`Progress (Last 2 Updates): ${progRec.isCalculatable ? (progRec.percentage > 0 ? '+' : '') + progRec.percentage.toFixed(1) + '%' : 'N/A'}`);

        const hist = await db.select().from(entries).where(eq(entries.metricId, m.id)).orderBy(desc(entries.timestamp)).limit(5);
        console.log(`\nRecent History:`);
        hist.forEach(h => {
            console.log(` - ${new Date(h.timestamp).toLocaleString()} : Payload -> ${JSON.stringify(h.data)}`);
        });
        console.log();
    }

    async showAllMetrics(boardId: number) {
        const list = await this.metricSvc.getHydratedMetrics(boardId);
        if (list.length === 0) { CLIView.showInfo("No metrics in this board."); return; }

        const rows = list.map((m: any) => {
            const prog = m.calculateProgression('sinceCreation');
            const progStr = prog.isCalculatable ? `${prog.percentage > 0 ? '+' : ''}${prog.percentage.toFixed(1)}%` : '--';

            // Get last 2 aggregated values
            const aggs = m.dayAggregates || [];
            const lastOnes = aggs.slice(-2).reverse();
            const valStr = lastOnes.length > 0
                ? lastOnes.map((a: any) => {
                    let v = a.val;
                    if (m.type === 'Count' || m.type === 'Goal') v = a.cumulative;
                    return typeof v === 'object' ? JSON.stringify(v) : String(v);
                }).join(" ← ")
                : "No data";

            return [m.name, CLIView.formatMetricType(m.type), progStr, valStr];
        });

        CLIView.formatTable(["Metric Name", "Type", "Progress", "Latest Values"], rows);

        let avg = 0; let validCnt = 0;
        list.forEach((m: any) => {
            const p = m.calculateProgression('sinceCreation');
            if (p.isCalculatable) { avg += p.percentage; validCnt++; }
        });
        const boardAvg = validCnt > 0 ? (avg / validCnt).toFixed(1) : '0.0';
        CLIView.showInfo(`Board Overall Average Progression: ${boardAvg}%`);
    }

    async showBoardInfo(board: any) {
        CLIView.showInfo(`Board Name: ${board.name}`);
        CLIView.showInfo(`Theme: ${board.theme || 'default'}`);
        CLIView.showInfo(`Description: ${board.description || 'N/A'}`);
        CLIView.showInfo(`Created At: ${new Date(board.createdAt).toLocaleString()}`);
        await this.showAllMetrics(board.id);
    }

    async deleteSpecificValue(boardId: number) {
        const mList = await db.select().from(metricDefinitions).where(eq(metricDefinitions.boardId, boardId)).orderBy(metricDefinitions.id);
        if (mList.length === 0) { CLIView.showInfo("No metrics."); return; }

        const choices = mList.map(m => ({ title: m.name, value: m.id.toString() }));
        const selection = await CLIView.promptAction("Select metric to manage values for:", choices);
        const m = mList.find(x => x.id.toString() === selection);
        if (!m) return;

        const hist = await db.select().from(entries).where(eq(entries.metricId, m.id)).orderBy(desc(entries.timestamp)).limit(20);
        if (hist.length === 0) { CLIView.showInfo("No data stored for this metric."); return; }

        const rows = hist.map((h, i) => [String(i + 1), new Date(h.timestamp).toLocaleString(), JSON.stringify(h.data)]);
        CLIView.formatTable(["#", "Timestamp", "Data Payload"], rows);

        const targetIdx = await CLIView.promptText("Enter row number(s) to delete (space-separated, or empty to cancel):");
        if (!targetIdx) return;

        const indices = targetIdx.split(' ').map((s: string) => parseInt(s.trim()) - 1);
        const idsToDelete = indices.map((i: number) => hist[i]?.id).filter((id: number | undefined) => id);

        if (idsToDelete.length > 0) {
            await db.delete(entries).where(inArray(entries.id, idsToDelete));
            CLIView.showSuccess("Record(s) deleted.");
            await this.printFreshInfo(boardId, m.id);
        }
    }

    async openDashboard() {
        const url = "http://localhost:3000";
        CLIView.showInfo(`Checking dashboard at ${url}...`);

        try {
            const { execSync, spawn } = await import("child_process");
            const { existsSync } = await import("fs");
            const { join } = await import("path");

            // Check if port 3000 is listening
            let isRunning = false;
            try {
                if (process.platform === 'win32') {
                    execSync('netstat -an | findstr :3000', { stdio: 'ignore' });
                } else {
                    execSync('lsof -i :3000', { stdio: 'ignore' });
                }
                isRunning = true;
            } catch (e) {
                // Port not listening
            }

            if (!isRunning) {
                CLIView.showError("Dashboard server is not running!");
                const startNow = await CLIView.promptConfirm("Would you like to start the server now in the background?");

                if (startNow) {
                    // Check if we are in the project root
                    if (!existsSync(join(process.cwd(), "package.json"))) {
                        CLIView.showError("Could not find package.json in current directory.");
                        CLIView.showInfo("Please run 'peak' from the root of the Peak project.");
                        return;
                    }

                    CLIView.showInfo("🚀 Starting server (npm run dev)...");

                    // Detach the process so it keeps running
                    const child = spawn("npm", ["run", "dev"], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    child.unref();

                    CLIView.showInfo("Server starting. Waiting a few seconds...");
                    await new Promise(r => setTimeout(r, 4000));
                } else {
                    CLIView.showInfo("Please run 'npm run dev' manually to use the dashboard.");
                    return;
                }
            }

            const { exec } = await import("child_process");
            const startCmd = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
            exec(`${startCmd} ${url}`);
            CLIView.showSuccess("Opening dashboard browser...");
        } catch (error) {
            CLIView.showError("An unexpected error occurred while launching dashboard.");
            CLIView.showInfo(`Manual URL: ${url}`);
        }
    }

    private formatLatestValues(m: any): string {
        const aggs = m.dayAggregates || [];
        const lastOnes = aggs.slice(-2).reverse();
        if (lastOnes.length === 0) return "No data";

        return lastOnes.map((a: any) => {
            let v = a.val;
            if (m.type === 'Count' || m.type === 'Goal') v = a.cumulative;
            return typeof v === 'object' ? JSON.stringify(v) : String(v);
        }).join(" ← ");
    }
}
