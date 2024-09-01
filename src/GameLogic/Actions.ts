import { Match3 } from './Match3';
import { GamePiece } from './GamePiece';
import {
    Position,
    GetPieceType,
    CloneGrid,
    SwapPieces,
    GetMatches,
} from './Utility';

interface ActionsConfig {
    freeMoves: boolean;
}

export class Actions {
    public match3: Match3;

    public freeMoves = false;

    constructor(match3: Match3) {
        this.match3 = match3;
    }

    public setup(config: ActionsConfig) {
        this.freeMoves = config.freeMoves;
    }

    public async actionMove(from: Position, to: Position) {
        if (!this.match3.isPlaying()) return;

        const pieceA = this.match3.board.getPieceByPosition(from);
        const pieceB = this.match3.board.getPieceByPosition(to);
        if (!pieceA || !pieceB || pieceA.isLocked() || pieceB.isLocked()) return;

        const typeA = this.match3.board.getTypeByPosition(from);
        const typeB = this.match3.board.getTypeByPosition(to);
        if (!typeA || !typeB) return;

        console.log('[Match3] ACTION! Move:', from, 'to:', to);
        await this.swapPieces(pieceA, pieceB);
        this.match3.process.start();
    }

    public async actionTap(position: Position) {
        if (!this.match3.isPlaying()) return;

        const piece = this.match3.board.getPieceByPosition(position);
        const type = this.match3.board.getTypeByPosition(position);
        if (!piece || !this.match3.special.isSpecial(type) || piece.isLocked()) return;

        console.log('[Match3] ACTION! Tap:', position);
        await this.match3.board.popPiece(piece);
        this.match3.process.start();
    }

    private validateMove(from: Position, to: Position) {
        if (this.freeMoves) return true;

        const type = GetPieceType(this.match3.board.grid, from);
        const specialFrom = this.match3.special.isSpecial(type);
        const specialTo = this.match3.special.isSpecial(GetPieceType(this.match3.board.grid, to));

        if (specialFrom || specialTo) return true;

        const tempGrid = CloneGrid(this.match3.board.grid);

        SwapPieces(tempGrid, from, to);

        const newMatches = GetMatches(tempGrid, [from, to]);

        return newMatches.length >= 1;
    }

    private async swapPieces(pieceA: GamePiece, pieceB: GamePiece) {
        const positionA = pieceA.getGridPosition();
        const positionB = pieceB.getGridPosition();
        console.log('[Match3] Swap', positionA, positionB);

        const viewPositionA = this.match3.board.getViewPositionByGridPosition(positionA);
        const viewPositionB = this.match3.board.getViewPositionByGridPosition(positionB);

        const valid = this.validateMove(positionA, positionB);

        this.match3.onMove?.({
            from: positionA,
            to: positionB,
            valid,
        });

        if (valid) {
            SwapPieces(this.match3.board.grid, positionA, positionB);
            pieceA.row = positionB.row;
            pieceA.column = positionB.column;
            pieceB.row = positionA.row;
            pieceB.column = positionA.column;
        }

        this.match3.board.bringToFront(pieceA);
        await Promise.all([
            pieceA.animateSwap(viewPositionB.x, viewPositionB.y),
            pieceB.animateSwap(viewPositionA.x, viewPositionA.y),
        ]);

        if (!valid) {
            const viewPositionA = this.match3.board.getViewPositionByGridPosition(positionA);
            const viewPositionB = this.match3.board.getViewPositionByGridPosition(positionB);
            this.match3.board.bringToFront(pieceB);
            await Promise.all([
                pieceA.animateSwap(viewPositionA.x, viewPositionA.y),
                pieceB.animateSwap(viewPositionB.x, viewPositionB.y),
            ]);
        } else if (this.match3.special.isSpecial(GetPieceType(this.match3.board.grid, positionA))) {
            await this.match3.board.popPiece(positionA);
        } else if (this.match3.special.isSpecial(GetPieceType(this.match3.board.grid, positionB))) {
            await this.match3.board.popPiece(positionB);
        }
    }
}
