export type ProgressionMethod = 'sinceCreation' | 'lastTwo';

export class Board {
    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly description: string | null,
        public readonly theme: string,
        public readonly tag: string | null,
        public readonly color: string | null,
        public readonly illustration: string | null,
        public readonly progressionMethod: ProgressionMethod,
        public readonly createdAt: Date,
        private _progressionPercentage: number = 0
    ) { }

    get progressionPercentage(): number {
        return this._progressionPercentage;
    }

    setProgressionPercentage(value: number): void {
        this._progressionPercentage = Math.round(value);
    }

    static fromPlain(data: any): Board {
        return new Board(
            data.id,
            data.name,
            data.description,
            data.theme,
            data.tag,
            data.color,
            data.illustration,
            data.progressionMethod,
            new Date(data.createdAt),
            data.progressionPercentage || 0
        );
    }

    toJSON(): any {
        return {
            ...this,
            progressionPercentage: this.progressionPercentage
        };
    }
}
