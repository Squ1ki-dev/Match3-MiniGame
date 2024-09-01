import { AsyncQueue } from '../utils/asyncUtils';
import { Match3 } from './Match3';
import {
    GetMatches,
    GetEmptyPositions,
    ApplyGravity,
    FillUp,
    GetPieceType,
    GridToString,
} from './Utility';

export class GameProcess {
    private match3: Match3;
    private processing = false;
    private round = 0;
    private queue: AsyncQueue;

    constructor(match3: Match3) {
        this.match3 = match3;
        this.queue = new AsyncQueue();
    }

    public isProcessing() {
        return this.processing;
    }

    public getProcessRound() {
        return this.round;
    }

    public reset() {
        this.processing = false;
        this.round = 0;
        this.queue.clear();
    }

    public pause() {
        this.queue.pause();
    }

    public resume() {
        this.queue.resume();
    }

    public async start() {
        if (this.processing || !this.match3.isPlaying()) return;
        this.processing = true;
        this.round = 0;
        this.match3.onProcessStart?.();
        console.log('[Match3] ======= PROCESSING START ==========');
        this.runProcessRound();
    }

    public async stop() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();
        console.log('[Match3] Sequence rounds:', this.round);
        console.log('[Match3] Board pieces:', this.match3.board.pieces.length);
        console.log('[Match3] Grid:\n' + GridToString(this.match3.board.grid));
        console.log('[Match3] ======= PROCESSING COMPLETE =======');
        this.match3.onProcessComplete?.();
    }

    private async runProcessRound() {
        this.queue.add(async () => {
            this.round += 1;
            console.log(`[Match3] -- SEQUENCE ROUND #${this.round} START`);
            this.updateStats();
        });

        this.queue.add(async () => {
            await this.processSpecialMatches();
        });

        this.queue.add(async () => {
            await this.processRegularMatches();
        });

        this.queue.add(async () => {
            this.applyGravity();
        });

        this.queue.add(async () => {
            await this.refillGrid();
        });

        this.queue.add(async () => {
            console.log(`[Match3] -- SEQUENCE ROUND #${this.round} FINISH`);
            this.processCheckpoint();
        });
    }

    private async updateStats() {
        const matches = GetMatches(this.match3.board.grid);
        if (!matches.length) return;
        console.log('[Match3] Update stats');
        const matchData = { matches, combo: this.getProcessRound() };
        this.match3.stats.registerMatch(matchData);
        this.match3.onMatch?.(matchData);
    }

    private async processSpecialMatches() {
        console.log('[Match3] Process special matches');
        await this.match3.special.process();
    }

    private async processRegularMatches() {
        console.log('[Match3] Process regular matches');
        const matches = GetMatches(this.match3.board.grid);
        const animPromises = [];
        for (const match of matches) {
            animPromises.push(this.match3.board.popPieces(match));
        }
        await Promise.all(animPromises);
    }

    private async applyGravity() {
        const changes = ApplyGravity(this.match3.board.grid);
        console.log('[Match3] Apply gravity - moved pieces:', changes.length);
        const animPromises = [];

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.match3.board.getPieceByPosition(from);
            if (!piece) continue;
            piece.row = to.row;
            piece.column = to.column;
            const newPosition = this.match3.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPosition.x, newPosition.y));
        }

        await Promise.all(animPromises);
    }

    private async refillGrid() {
        const newPieces = FillUp(this.match3.board.grid, this.match3.board.commonTypes);
        console.log('[Match3] Refill grid - new pieces:', newPieces.length);
        const animPromises = [];
        const piecesPerColumn: Record<number, number> = {};

        for (const position of newPieces) {
            const pieceType = GetPieceType(this.match3.board.grid, position);
            const piece = this.match3.board.createPiece(position, pieceType);

            if (!piecesPerColumn[piece.column]) piecesPerColumn[piece.column] = 0;
            piecesPerColumn[piece.column] += 1;

            const x = piece.x;
            const y = piece.y;
            const columnCount = piecesPerColumn[piece.column];
            const height = this.match3.board.getHeight();
            piece.y = -height * 0.5 - columnCount * this.match3.config.tileSize;
            animPromises.push(piece.animateFall(x, y));
        }

        await Promise.all(animPromises);
    }

    private async processCheckpoint() {
        const newMatches = GetMatches(this.match3.board.grid);
        const emptySpaces = GetEmptyPositions(this.match3.board.grid);
        console.log('[Match3] Checkpoint - New matches:', newMatches.length);
        console.log('[Match3] Checkpoint - Empty spaces:', emptySpaces.length);
        if (newMatches.length || emptySpaces.length) {
            console.log('[Match3] Checkpoint - Another sequence run is needed');
            // Run it again if there are any new matches or empty spaces in the grid
            this.runProcessRound();
        } else {
            console.log('[Match3] Checkpoint - Nothing left to do, all good');
            // Otherwise, finish the grid processing
            this.stop();
        }
    }
}
