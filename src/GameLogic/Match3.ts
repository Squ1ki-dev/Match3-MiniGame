import { Container } from 'pixi.js';
import { Actions } from './Actions';
import { Board } from './Board';
import { Config, GetConfig } from './Config';
import { GamePiece } from './GamePiece';
import { GameProcess } from './GameProcess';
import { Special } from './Special';
import { Stats } from './Stats';
import { Timer } from './Timer';
import { Position, Type } from './Utility';

export interface OnMatchData {
    matches: Position[][];
    combo: number;
}

export interface OnPopData {
    type: Type;
    piece: GamePiece;
    combo: number;
    isSpecial: boolean;
    causedBySpecial: boolean;
}

export interface OnMoveData {
    from: Position;
    to: Position;
    valid: boolean;
}

export class Match3 extends Container {
    public config: Config;
    public timer: Timer;
    public stats: Stats;
    public board: Board;
    public actions: Actions;
    public process: GameProcess;
    public special: Special;

    public onMove?: (data: OnMoveData) => void;
    public onMatch?: (data: OnMatchData) => void;
    public onPop?: (data: OnPopData) => void;
    public onProcessStart?: () => void;
    public onProcessComplete?: () => void;
    public onTimesUp?: () => void;

    constructor() {
        super();

        this.config = GetConfig();
        this.timer = new Timer(this);
        this.stats = new Stats(this);
        this.board = new Board(this);
        this.actions = new Actions(this);
        this.process = new GameProcess(this);
        this.special = new Special(this);
    }

    public setup(config: Config) {
        this.config = config;
        this.reset();
        this.actions.setup(config);
        this.board.setup(config);
        this.timer.setup(config.duration * 1000);
    }

    /** Fully reset the game */
    public reset() {
        this.interactiveChildren = false;
        this.timer.reset();
        this.stats.reset();
        this.board.reset();
        this.special.reset();
        this.process.reset();
    }

    public startPlaying() {
        this.interactiveChildren = true;
        this.timer.start();
    }

    public stopPlaying() {
        this.interactiveChildren = false;
        this.timer.stop();
    }

    public isPlaying() {
        return this.interactiveChildren;
    }

    public pause() {
        this.timer.pause();
        this.board.pause();
        this.process.pause();
    }

    public resume() {
        this.timer.resume();
        this.board.resume();
        this.process.resume();
    }

    public update(delta: number) {
        this.timer.update(delta);
    }
}
