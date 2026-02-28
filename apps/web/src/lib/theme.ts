export const THEME_COLORS: Record<string, string> = {
    sport: "border-fuchsia-500/50 bg-fuchsia-500/5 text-fuchsia-400",
    work: "border-cyan-500/50 bg-cyan-500/5 text-cyan-400",
    task: "border-emerald-500/50 bg-emerald-500/5 text-emerald-400",
    learning: "border-yellow-400/50 bg-yellow-400/5 text-yellow-400", // Gold
    default: "border-slate-800 bg-[#09090b] text-white", // Dark Black & Silver
};

export const THEME_BG_VARIANTS: Record<string, string> = {
    sport: "bg-fuchsia-500/10",
    work: "bg-cyan-500/10",
    task: "bg-emerald-500/10",
    learning: "bg-yellow-400/10", // Gold
    default: "bg-[#09090b]", // Dark Black
};

export const THEME_CHART_COLORS: Record<string, string> = {
    sport: "#d946ef",
    work: "#06b6d4",
    task: "#10b981",
    learning: "#eab308", // yellow-500 Gold
    default: "#94a3b8", // slate-400 Silver
};

export function getThemeClasses(theme: string | null | undefined) {
    const t = theme || "default";
    return THEME_COLORS[t] || THEME_COLORS.default;
}

export function getThemeBgClass(theme: string | null | undefined) {
    const t = theme || "default";
    return THEME_BG_VARIANTS[t] || THEME_BG_VARIANTS.default;
}

export function getThemeChartColor(theme: string | null | undefined) {
    const t = theme || "default";
    return THEME_CHART_COLORS[t] || THEME_CHART_COLORS.default;
}
