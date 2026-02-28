import { z } from "zod";

/**
 * Metrik tiplerini belirleyen Enum değerleri.
 */
export enum MetricType {
    SingleValue = "SingleValue",
    CompoundValue = "CompoundValue",
    Task = "Task",
    Count = "Count",
    Goal = "Goal"
}

/**
 * İlerleme yönünü belirleyen Enum değerleri.
 */
export enum ProgressDirection {
    Ascending = "Ascending",   // Artan yönde gelişim (örn: Koşu mesafesi)
    Descending = "Descending"  // Azalan yönde gelişim (örn: Vücut ağırlığı)
}

export interface MetricDefinition {
    id: number;
    boardId: number;
    name: string;
    type: string;
    schema: any;
    progressDirection: string;
}

export interface Entry {
    id: number;
    metricId: number;
    timestamp: Date;
    data: any;
}

/**
 * JSON şemasından dinamik Zod doğrulayıcı oluşturur.
 */
export function createValidatorFromSchema(schema: Record<string, string>) {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, type] of Object.entries(schema)) {
        if (type === "number" || type === "int" || type === "float") {
            shape[key] = z.number();
        } else if (type === "boolean") {
            shape[key] = z.boolean();
        } else if (type === "string") {
            shape[key] = z.string();
        }
    }
    return z.object(shape);
}

/**
 * İki değer arasındaki yüzde değişimini hesaplar.
 * @param direction Gelişim yönü (Artan/Azalan)
 */
export function calculatePercentageChange(
    oldValue: number,
    newValue: number,
    direction: ProgressDirection
): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;

    const rawChange = ((newValue - oldValue) / Math.abs(oldValue)) * 100;

    // Eğer hedef azalmaksa (örn: ağırlık), düşüş pozitif gelişimdir.
    if (direction === ProgressDirection.Descending) {
        return -rawChange;
    }

    return rawChange;
}

/**
 * Metrik verisinden karşılaştırılabilir bir sayısal değer çıkarır.
 */
export function getScalarValueFromData(data: Record<string, any>, type: MetricType): number {
    if (type === MetricType.SingleValue) {
        const values = Object.values(data);
        return values.length > 0 ? Number(values[0]) : 0;
    }

    if (type === MetricType.CompoundValue) {
        let product = 1;
        let hasValues = false;
        for (const val of Object.values(data)) {
            if (typeof val === "number") {
                product *= val;
                hasValues = true;
            }
        }
        return hasValues ? product : 0;
    }

    return 0;
}

/**
 * Görev (Task) metriği için ilerleme yüzdesini hesaplar.
 */
export function calculateTaskProgress(data: Record<string, any>): number {
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;

    let completedCount = 0;
    for (const val of Object.values(data)) {
        if (val === true) completedCount++;
    }

    return (completedCount / keys.length) * 100;
}

/**
 * İki kayıt arasındaki metrik gelişimini değerlendirir.
 */
export function evaluateMetricProgress(
    metricDef: MetricDefinition,
    oldEntry: Entry | null,
    newEntry: Entry
): { percentage: number; isPositive: boolean } {
    const type = metricDef.type as MetricType;

    if (type === MetricType.Task) {
        const progress = calculateTaskProgress(newEntry.data);
        return { percentage: progress, isPositive: progress === 100 };
    }

    if (!oldEntry) {
        return { percentage: 0, isPositive: true };
    }

    const oldScalar = getScalarValueFromData(oldEntry.data, type);
    const newScalar = getScalarValueFromData(newEntry.data, type);

    const rawPercentage = calculatePercentageChange(
        oldScalar,
        newScalar,
        metricDef.progressDirection as ProgressDirection
    );

    return {
        percentage: rawPercentage,
        isPositive: rawPercentage >= 0,
    };
}

/**
 * Bir panonun genel ilerlemesini, alt metriklerin ortalamasını alarak hesaplar.
 */
export function calculateBoardOverallProgress(metricProgresses: number[]): number {
    if (metricProgresses.length === 0) return 0;
    const sum = metricProgresses.reduce((acc, curr) => acc + curr, 0);
    return sum / metricProgresses.length;
}
