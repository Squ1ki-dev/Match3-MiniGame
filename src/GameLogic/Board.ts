import { Container, Graphics } from 'pixi.js';
import { pool } from '../utils/pool';
import { Match3 } from './Match3';
import { Config, GetBlocks } from './Config';
import { GamePiece } from './GamePiece';
import {
    Position,
    SetPieceType,
    GetPieceType,
    CreateGrid,
    ForEach,
    Grid,
    Type,
} from './Utility';

export class Board {
    public match3: Match3;
    public grid: Grid = [];
    public pieces: GamePiece[] = [];
    public piecesMask: Graphics;
    public piecesContainer: Container;
    public rows = 0;
    public columns = 0;
    public tileSize = 0;
    public commonTypes: Type[] = [];
    public typesMap: Record<number, string> = {};

    constructor(match3: Match3) {
        this.match3 = match3;
        this.piecesContainer = new Container();
        this.piecesMask = new Graphics().beginFill(0xff0000, 0.5).drawRect(-2, -2, 4, 4).endFill();

        this.match3.addChild(this.piecesContainer);
        this.match3.addChild(this.piecesMask);
        this.piecesContainer.mask = this.piecesMask;
    }

    public setup(config: Config) {
        this.rows = config.rows;
        this.columns = config.columns;
        this.tileSize = config.tileSize;

        this.piecesMask.width = this.getWidth();
        this.piecesMask.height = this.getHeight();
        this.piecesContainer.visible = true;

        this.commonTypes = [];
        const blocks = GetBlocks(config.mode);

        blocks.forEach((name, index) => {
            const type = index + 1;
            if (this.match3.special.isSpecialAvailable(name)) {
                this.match3.special.addSpecialHandler(name, type);
            } else {
                this.commonTypes.push(type);
            }
            this.typesMap[type] = name;
        });

        this.grid = CreateGrid(this.rows, this.columns, this.commonTypes);
        ForEach(this.grid, (gridPosition: Position, type: Type) => {
            this.createPiece(gridPosition, type);
        });
    }

    public reset() {
        this.pieces.forEach(piece => this.disposePiece(piece));
        this.pieces.length = 0;
    }

    public createPiece(position: Position, pieceType: Type): GamePiece {
        const name = this.typesMap[pieceType];
        const piece = pool.get(GamePiece);
        const viewPosition = this.getViewPositionByGridPosition(position);

        piece.setup({
            name,
            type: pieceType,
            size: this.tileSize,
            interactive: true,
            highlight: this.match3.special.isSpecial(pieceType),
        });

        piece.row = position.row;
        piece.column = position.column;
        piece.position.set(viewPosition.x, viewPosition.y);

        piece.onMove = (from, to) => this.match3.actions.actionMove(from, to);
        piece.onTap = pos => this.match3.actions.actionTap(pos);

        this.pieces.push(piece);
        this.piecesContainer.addChild(piece);
        return piece;
    }

    public disposePiece(piece: GamePiece) {
        const index = this.pieces.indexOf(piece);
        if (index !== -1) {
            this.pieces.splice(index, 1);
        }

        piece.parent?.removeChild(piece);
        pool.giveBack(piece);
    }

    public async spawnPiece(position: Position, pieceType: Type) {
        const oldPiece = this.getPieceByPosition(position);
        if (oldPiece) this.disposePiece(oldPiece);

        SetPieceType(this.grid, position, pieceType);
        if (!pieceType) return;

        const piece = this.createPiece(position, pieceType);
        await piece.animateSpawn();
    }

    public async popPiece(position: Position, causedBySpecial = false) {
        const piece = this.getPieceByPosition(position);
        const type = GetPieceType(this.grid, position);
        if (!type || !piece) return;

        const isSpecial = this.match3.special.isSpecial(type);
        const combo = this.match3.process.getProcessRound();

        SetPieceType(this.grid, position, 0);

        const popData = { piece, type, combo, isSpecial, causedBySpecial };
        this.match3.stats.registerPop(popData);
        this.match3.onPop?.(popData);

        await piece.animatePop();
        this.disposePiece(piece);

        await this.match3.special.trigger(type, position);
    }

    public async popPieces(positions: Position[], causedBySpecial = false) {
        await Promise.all(positions.map(position => this.popPiece(position, causedBySpecial)));
    }

    public getPieceByPosition(position: Position): GamePiece | null {
        return this.pieces.find(piece => piece.row === position.row && piece.column === position.column) || null;
    }

    public getViewPositionByGridPosition(position: Position) {
        const offsetX = (this.columns - 1) * this.tileSize / 2;
        const offsetY = (this.rows - 1) * this.tileSize / 2;
        return {
            x: position.column * this.tileSize - offsetX,
            y: position.row * this.tileSize - offsetY,
        };
    }

    public getTypeByPosition(position: Position): Type | null {
        return GetPieceType(this.grid, position);
    }

    public getWidth(): number {
        return this.columns * this.tileSize;
    }

    public getHeight(): number {
        return this.rows * this.tileSize;
    }

    public pause() {
        this.pieces.forEach(piece => piece.pause());
    }

    public resume() {
        this.pieces.forEach(piece => piece.resume());
    }

    public bringToFront(piece: GamePiece) {
        this.piecesContainer.addChild(piece);
    }
}
