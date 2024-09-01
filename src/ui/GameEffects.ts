import { Container } from 'pixi.js';
import { OnMatchData, OnMoveData, OnPopData } from '../GameLogic/Match3';
import { GamePiece } from '../GameLogic/GamePiece';
import { randomRange } from '../utils/random';
import gsap from 'gsap';
import { GameScreen } from '../screens/GameScreen';
import { earthquake } from '../utils/animation';
import { getDistance } from '../utils/maths';
import { pool } from '../utils/pool';
import { sfx } from '../utils/audio';
import { PopExplosion } from './PopExplosion';
import { waitFor } from '../utils/asyncUtils';
import { throttle } from '../utils/throttle';

export class GameEffects extends Container {
    private game: GameScreen;

    constructor(game: GameScreen) {
        super();
        this.game = game;
        this.sortableChildren = true;
        this.onRender = () => this.renderUpdate();
    }

    private renderUpdate() {
        for (const child of this.children) {
            child.zIndex = child.scale.x;
        }
    }

    public async onMove(data: OnMoveData) {
        const sound = data.valid ? 'common/sfx-correct.wav' : 'common/sfx-incorrect.wav';
        sfx.play(sound, { volume: 0.5 });
    }

    /** Fired when a piece is popped out from the grid */
    public async onPop(data: OnPopData) {
        const position = this.toLocal(data.piece.getGlobalPosition());
        this.playPopExplosion(position);

        if (!data.isSpecial) {
            const piece = pool.get(GamePiece);
            piece.setup({
                name: data.piece.name,
                type: data.piece.type,
                size: this.game.match3.board.tileSize,
                interactive: false,
            });
            piece.position.copyFrom(position);
            this.addChild(piece);

            await this.playFlyToCauldron(piece);

            this.removeChild(piece);
            pool.giveBack(piece);
        } else {
            sfx.play('common/sfx-special.wav', { volume: 0.5 });
            earthquake(this.game.pivot, 15);
        }
    }

    public async onMatch(data: OnMatchData) {
        const progress = 0.04;
        sfx.play('common/sfx-match.wav', { speed: 1 - progress + data.combo * progress });

        if (data.combo > 1) {
            earthquake(this.game.pivot, Math.min(1 + data.combo * 0.5, 20));
        }
    }

    private async playFlyToCauldron(piece: GamePiece) {
        const x = this.game.cauldron.x + randomRange(-20, 20);
        const y = this.game.cauldron.y - 55;
        const duration = getDistance(piece.x, piece.y, x, y) * 0.001 + randomRange(0.2, 0.8);

        gsap.killTweensOf(piece);
        gsap.killTweensOf(piece.scale);

        gsap.to(piece, {
            x,
            y,
            duration,
            ease: 'power1.inOut',
        });

        await gsap.to(piece.scale, {
            x: 0.5,
            y: 0.5,
            duration,
            ease: 'power1.inOut',
        });

        // Play cauldron splash
        sfx.play('common/sfx-bubble.wav');
        this.game.cauldron.playSplash(x - this.game.cauldron.x);
    }

    private async playPopExplosion(position: { x: number; y: number }) {
        const explosion = pool.get(PopExplosion);
        explosion.position.set(position.x, position.y);
        this.addChild(explosion);

        await explosion.play();

        this.removeChild(explosion);
        pool.giveBack(explosion);
    }

    /** Explode a piece out of the board, part of the grid explosion animation */
    private async playPieceExplosion(piece: GamePiece) {
        const position = this.toLocal(piece.getGlobalPosition());
        const x = position.x + randomRange(-100, 100);
        const yUp = position.y + randomRange(-100, -200);
        const yDown = yUp + 600;
        const duration = randomRange(0.5, 0.8);

        const animatedPiece = pool.get(GamePiece);
        animatedPiece.setup({
            name: piece.name,
            type: piece.type,
            size: this.game.match3.board.tileSize,
            interactive: false,
        });
        animatedPiece.position.copyFrom(position);
        animatedPiece.alpha = 1;
        this.addChild(animatedPiece);

        await waitFor(randomRange(0, 0.3));
        throttle('pieceExplosion', 100, () => sfx.play('common/sfx-incorrect.wav', { volume: 0.5 }));

        this.playPopExplosion(position);

        gsap.to(animatedPiece, { y: yUp, duration: duration * 0.4, ease: 'circ.out' });
        gsap.to(animatedPiece, { y: yDown, duration: duration * 0.6, ease: 'circ.in', delay: duration * 0.4 });
        gsap.to(animatedPiece, { alpha: 0, duration: 0.2, ease: 'linear', delay: duration - 0.2 });
        gsap.to(animatedPiece.scale, { x: 2, y: 2, duration, ease: 'linear' });
        await gsap.to(animatedPiece, { x, duration, ease: 'linear' });

        this.removeChild(animatedPiece);
        pool.giveBack(piece);
    }

    /** Explode all pieces out of the board when gameplay finishes */
    public async playGridExplosion() {
        earthquake(this.game.pivot, 10);

        const animPromises = this.game.match3.board.pieces.map(piece => this.playPieceExplosion(piece));

        this.game.match3.board.piecesContainer.visible = false;
        await Promise.all(animPromises);
    }
}