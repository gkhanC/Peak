import { BaseMetric, MetricType } from "./Metric";
import { CumulativeMetric } from "./CumulativeMetric";
import { ChecklistMetric } from "./ChecklistMetric";
import { MeasurementMetric } from "./MeasurementMetric";
import { CountTimeMetric } from "./CountTimeMetric";
import { MeasurementTimeMetric } from "./MeasurementTimeMetric";
import { SetRepMetric } from "./SetRepMetric";
import { SetMeasurementMetric } from "./SetMeasurementMetric";
import { SetRepTimeMetric } from "./SetRepTimeMetric";
import { SetMeasurementTimeMetric } from "./SetMeasurementTimeMetric";
import { SetRepMeasurementMetric } from "./SetRepMeasurementMetric";
export class MetricFactory {
    static create(data: any): BaseMetric {
        const { type } = data;
        let metric: BaseMetric;

        switch (type as MetricType) {
            case 'Count':
            case 'Goal':
                metric = new CumulativeMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'Checklist':
                metric = new ChecklistMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'CountTime':
                metric = new CountTimeMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'MeasurementTime':
                metric = new MeasurementTimeMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'SetRep':
                metric = new SetRepMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'SetMeasurement':
                metric = new SetMeasurementMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'SetRepTime':
                metric = new SetRepTimeMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'SetMeasurementTime':
                metric = new SetMeasurementTimeMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'SetRepMeasurement':
                metric = new SetRepMeasurementMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
            case 'Measurement':
            case 'SingleValue':
            case 'CompoundValue':
            default:
                metric = new MeasurementMetric(
                    data.id, data.boardId, data.name, data.type,
                    data.schema, data.target, data.progressDirection, data.progressionMethod
                );
                break;
        }

        if (data.dayAggregates) {
            metric.setAggregates(data.dayAggregates);
        }

        return metric;
    }
}
