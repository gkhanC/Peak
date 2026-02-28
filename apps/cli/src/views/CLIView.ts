import prompts from "prompts";

export const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
};

export class CLIView {
    static formatTable(headers: string[], rows: string[][]) {
        if (rows.length === 0) {
            console.log(COLORS.yellow + "No data to display." + COLORS.reset);
            return;
        }

        const colWidths = headers.map((h, i) =>
            Math.max(h.length, ...rows.map(r => r[i] ? String(r[i]).length : 0))
        );
        const rowDivider = "".padEnd(colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * 3, "-");

        console.log();
        console.log(headers.map((h, i) => COLORS.bright + h.padEnd(colWidths[i]) + COLORS.reset).join(" | "));
        console.log(rowDivider);
        rows.forEach(r => {
            console.log(r.map((c, i) => String(c).padEnd(colWidths[i])).join(" | "));
        });
        console.log();
    }

    static formatMetricType(type: string): string {
        return type.replace(/([A-Z])/g, ' $1').trim();
    }

    static showSuccess(message: string) {
        console.log(`${COLORS.green}✓ ${message}${COLORS.reset}`);
    }

    static showError(message: string) {
        console.log(`${COLORS.red}✗ ${message}${COLORS.reset}`);
    }

    static showInfo(message: string) {
        console.log(`${COLORS.cyan}${message}${COLORS.reset}`);
    }

    static showHeader(title: string, color = COLORS.cyan) {
        console.log(`\n${color}=== ${title.toUpperCase()} ===${COLORS.reset}\n`);
    }

    static async promptAction(message: string, choices: { title: string, value: string }[]) {
        const { action } = await prompts({
            type: 'select',
            name: 'action',
            message,
            choices,
            initial: 0
        });
        return action;
    }

    static async promptText(message: string) {
        const { val } = await prompts({ type: 'text', name: 'val', message });
        return val;
    }

    static async promptConfirm(message: string) {
        const { val } = await prompts({ type: 'confirm', name: 'val', message, initial: true });
        return val;
    }
}
