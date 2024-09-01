import { Match3 } from '../Match3';
import {
    Position,
    PositionToString,
    StringToPosition,
    Type,
} from '../Utility';

export class SpecialBlast {
    public readonly match3: Match3;
    public readonly pieceType: Type;

    constructor(match3: Match3, pieceType: Type) {
        this.match3 = match3;
        this.pieceType = pieceType;
    }

    public async process(matches: Position[][]) {
        const allPositions = new Set<string>();
        const repeatedPositions = new Set<string>();
        const matchesPerPosition = new Map<string, Position[][]>();
        const animPromises = [];

        // Collect all positions
        for (const match of matches) {
            for (const position of match) {
                const posStr = PositionToString(position);
                allPositions.add(posStr);
            }
        }

        // Map matches per position
        for (const posStr of allPositions) {
            matchesPerPosition.set(posStr, matches.filter(match => 
                match.some(position => PositionToString(position) === posStr)
            ));
        }

        // Find matches with repeated positions
        for (const [posStr, posMatches] of matchesPerPosition) {
            if (posMatches.length < 2) continue;

            repeatedPositions.add(posStr);

            for (const match of posMatches) {
                animPromises.push(this.match3.board.popPieces(match));
            }
        }

        await Promise.all(animPromises);

        // Spawn specials on repeated positions
        for (const posStr of repeatedPositions) {
            const position = StringToPosition(posStr);
            await this.match3.board.spawnPiece(position, this.pieceType);
        }
    }

    public async trigger(pieceType: Type, position: Position) {
        if (pieceType !== this.pieceType) return;

        const list = [
            { row: position.row - 2, column: position.column },
            { row: position.row - 1, column: position.column - 1 },
            { row: position.row - 1, column: position.column },
            { row: position.row - 1, column: position.column + 1 },
            { row: position.row, column: position.column - 2 },
            { row: position.row, column: position.column - 1 },
            { row: position.row, column: position.column + 1 },
            { row: position.row, column: position.column + 2 },
            { row: position.row + 1, column: position.column - 1 },
            { row: position.row + 1, column: position.column },
            { row: position.row + 1, column: position.column + 1 },
            { row: position.row + 2, column: position.column },
        ];

        await this.match3.board.popPieces(list, true);
    }
}