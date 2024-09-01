import { Match3 } from '../Match3';
import { ForEach, Position, Type } from '../Utility';

export class SpecialColour {
    public readonly match3: Match3;
    public readonly pieceType: Type;

    constructor(match3: Match3, pieceType: Type) {
        this.match3 = match3;
        this.pieceType = pieceType;
    }

    public async process(matches: Position[][]) {
        let i = matches.length;
        while (i--) {
            const match = matches[i];
            if (match.length < 5) continue;
            const middle = Math.floor(match.length / 2);
            const middlePosition = match[middle];
            await this.match3.board.popPieces(match);
            await this.match3.board.spawnPiece(middlePosition, this.pieceType);
        }
    }

    public async trigger(pieceType: Type) {
        if (pieceType !== this.pieceType) return;

        const numPiecesPerType: Record<number, number> = {};
        let selectedType = 0;
        let selectedTypeCount = 0;
        ForEach(this.match3.board.grid, (_, type) => {
            if (!this.match3.board.commonTypes.includes(type)) return;
            if (!numPiecesPerType[type]) numPiecesPerType[type] = 0;
            numPiecesPerType[type] += 1;
            if (numPiecesPerType[type] >= selectedTypeCount) {
                selectedTypeCount = numPiecesPerType[type];
                selectedType = type;
            }
        });

        const positions: Position[] = [];
        ForEach(this.match3.board.grid, (position, type) => {
            if (type === selectedType) {
                positions.push(position);
            }
        });

        await this.match3.board.popPieces(positions, true);
    }
}
