import { Match3 } from './Match3';
import { SpecialBlast } from './specials/SpecialBlast';
import { SpecialColour } from './specials/SpecialColour';
import { SpecialColumn } from './specials/SpecialColumn';
import { SpecialRow } from './specials/SpecialRow';
import { GetMatches, Position, Type } from './Utility';

export interface SpecialHandler {
    match3: Match3;
    pieceType: Type;
    process(matches: Position[][]): Promise<void>;
    trigger(pieceType: Type, position: Position): Promise<void>;
}

export interface SpecialHandlerConstructor {
    new (match3: Match3, pieceType: Type): SpecialHandler;
}

const availableSpecials: Record<string, SpecialHandlerConstructor> = {
    'special-row': SpecialRow,
    'special-column': SpecialColumn,
    'special-colour': SpecialColour,
    'special-blast': SpecialBlast,
};

export class Special {
    public match3: Match3;
    public specialTypes: Type[] = [];
    public specialHandlers: SpecialHandler[] = [];

    constructor(match3: Match3) {
        this.match3 = match3;
    }

    public reset() {
        this.specialTypes.length = 0;
        this.specialHandlers.length = 0;
    }

    public isSpecialAvailable(name: string) {
        return !!availableSpecials[name];
    }

    public addSpecialHandler(name: string, pieceType: Type) {
        if (!availableSpecials[name]) return;
        this.specialTypes.push(pieceType);
        this.specialHandlers.push(new availableSpecials[name](this.match3, pieceType));
    }

    public async process() {
        for (const special of this.specialHandlers) {
            const matches = GetMatches(this.match3.board.grid);
            await special.process(matches);
        }
    }

    public async trigger(pieceType: Type, position: Position) {
        if (!this.isSpecial(pieceType)) return;
        for (const special of this.specialHandlers) {
            await special.trigger(pieceType, position);
        }
    }

    public isSpecial(pieceType: Type) {
        return this.specialTypes.includes(pieceType);
    }
}
