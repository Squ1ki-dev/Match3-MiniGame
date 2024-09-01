import { Match3 } from '../Match3';
import { Position, Type } from '../Utility';

export class SpecialColumn {
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
            if (match.length != 4) continue;
            if (match[0].row === match[1].row) {
                const middle = Math.floor(match.length / 2);
                const middlePosition = match[middle];
                await this.match3.board.popPieces(match);
                await this.match3.board.spawnPiece(middlePosition, this.pieceType);
            }
        }
    }

    public async trigger(pieceType: Type, position: Position) {
        if (pieceType !== this.pieceType) return;

        const rows = this.match3.board.rows;
        const list: Position[] = [];
        for (let i = 0; i < rows; i++) {
            list.push({ row: i, column: position.column });
        }
        await this.match3.board.popPieces(list, true);
    }
}
