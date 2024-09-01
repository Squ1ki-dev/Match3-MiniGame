import { Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Position } from './Utility';
import { resolveAndKillTweens, pauseTweens, resumeTweens } from '../utils/animation';
import { app } from '../main';

interface PieceOption {
    name: string;
    type: number;
    size: number;
    highlight: boolean;
    interactive: boolean;
}

const defaultPieceOptions: PieceOption = {
    name: '',
    type: 0,
    size: 50,
    highlight: false,
    interactive: false,
};

export type PieceOptions = Partial<PieceOption>;

const easeSingleBounce = gsap.parseEase('bounce.out');

export class GamePiece extends Container {
    private readonly area: Sprite;
    private readonly image: Sprite;
    private readonly highlight: Sprite;

    private pressing = false;
    private dragging = false;
    private paused = false;

    private pressPosition = { x: 0, y: 0 };

    public row = 0;
    public column = 0;
    public type = 0;
    public name = '';

    public onMove?: (from: Position, to: Position) => void;
    public onTap?: (position: Position) => void;

    constructor() {
        super();

        this.highlight = this.createSprite('highlight', 0.5);
        this.image = this.createSprite(undefined, 0.5);
        this.area = this.createArea();

        this.addEventListeners();
        this.onRender = this.renderUpdate;
    }

    public setup(options: PieceOptions = {}) {
        const opts = { ...defaultPieceOptions, ...options };

        this.resetState();
        this.applyOptions(opts);
    }

    private createSprite(texture?: string, anchor: number = 0): Sprite {
        const sprite = Sprite.from(texture || Texture.EMPTY);
        sprite.anchor.set(anchor);
        this.addChild(sprite);
        return sprite;
    }

    private createArea(): Sprite {
        const area = new Sprite(Texture.WHITE);
        area.anchor.set(0.5);
        area.alpha = 0;
        area.interactive = true;
        area.cursor = 'pointer';
        this.addChild(area);
        return area;
    }

    private addEventListeners() {
        this.area.on('pointerdown', this.onPointerDown);
        this.area.on('pointermove', this.onPointerMove);
        this.area.on('pointerup', this.onPointerUp);
        this.area.on('pointerupoutside', this.onPointerUp);
        this.area.on('pointercancel', this.onPointerUp);
    }

    private resetState() {
        this.killTweens();
        this.paused = false;
        this.pressing = false;
        this.dragging = false;
        this.visible = true;
        this.alpha = 1;
        this.scale.set(1);
    }

    private applyOptions(opts: PieceOption) {
        this.type = opts.type;
        this.name = opts.name;

        this.image.texture = Texture.from(opts.name);
        this.image.alpha = 1;
        this.image.width = opts.size - (opts.highlight ? 2 : 8);
        this.image.height = this.image.width;

        this.highlight.visible = opts.highlight;
        this.highlight.width = opts.size;
        this.highlight.height = opts.size;
        this.highlight.alpha = 0.3;

        this.area.width = opts.size;
        this.area.height = opts.size;
        this.area.interactive = opts.interactive;

        this.unlock();
    }

    private onPointerDown = (e: FederatedPointerEvent) => {
        if (this.isLocked()) return;
        this.pressing = true;
        this.dragging = false;
        this.pressPosition = { x: e.globalX, y: e.globalY };
    };

    private onPointerMove = (e: FederatedPointerEvent) => {
        if (!this.pressing || this.isLocked()) return;

        const { x: pressX, y: pressY } = this.pressPosition;
        const moveX = e.globalX - pressX;
        const moveY = e.globalY - pressY;
        const distance = Math.hypot(moveX, moveY);

        if (distance > 10) {
            this.dragging = true;
            const direction = this.getMovementDirection(moveX, moveY);
            this.onMove?.({ row: this.row, column: this.column }, direction);
            this.onPointerUp();
        }
    };

    private onPointerUp = () => {
        if (this.pressing && !this.dragging && !this.isLocked()) {
            this.onTap?.({ row: this.row, column: this.column });
        }
        this.pressing = false;
        this.dragging = false;
    };

    private getMovementDirection(moveX: number, moveY: number): Position {
        const direction = { row: this.row, column: this.column };

        if (Math.abs(moveX) > Math.abs(moveY)) {
            direction.column += moveX < 0 ? -1 : 1;
        } else {
            direction.row += moveY < 0 ? -1 : 1;
        }

        return direction;
    }

    public async animateSwap(x: number, y: number) {
        await this.animateMovement({ x, y, duration: 0.2, ease: 'quad.out' });
    }

    public async animateFall(x: number, y: number) {
        await this.animateMovement({ x, y, duration: 0.5, ease: easeSingleBounce });
    }

    public async animatePop() {
        this.lock();
        await this.animateAlpha(0, 0.1, 'sine.out');
        this.visible = false;
    }

    public async animateSpawn() {
        this.lock();
        this.scale.set(2);
        this.visible = true;
        await gsap.to(this.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out' });
        this.unlock();
    }

    private async animateMovement({ x, y, duration, ease }: { x: number, y: number, duration: number, ease: string | Function }) {
        this.lock();
        resolveAndKillTweens(this);
        await gsap.to(this, { x, y, duration, ease });
        this.unlock();
    }

    private async animateAlpha(alpha: number, duration: number, ease: string | Function) {
        resolveAndKillTweens(this.image);
        await gsap.to(this.image, { alpha, duration, ease });
    }

    public renderUpdate() {
        if (this.paused) return;

        if (this.highlight.visible) {
            this.highlight.rotation += app.ticker.deltaTime * 0.03;
            this.image.rotation = Math.sin(app.ticker.lastTime * 0.01) * 0.1;
        } else {
            this.image.rotation = 0;
        }
    }

    private killTweens() {
        resolveAndKillTweens(this, this.position, this.scale, this.image);
    }

    public pause() {
        this.paused = true;
        pauseTweens(this, this.position, this.scale, this.image);
    }

    public resume() {
        this.paused = false;
        resumeTweens(this, this.position, this.scale, this.image);
    }

    public lock() {
        this.interactiveChildren = false;
        this.pressing = false;
        this.dragging = false;
    }

    public unlock() {
        this.interactiveChildren = true;
    }

    public isLocked() {
        return !this.interactiveChildren;
    }

    public getGridPosition(): Position {
        return { row: this.row, column: this.column };
    }
}
