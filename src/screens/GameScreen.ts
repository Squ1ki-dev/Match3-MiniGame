import { Container, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Match3, Match3OnMatchData, OnMoveData, Match3OnPopData } from '../GameLogic/Match3';
import { Shelf } from '../ui/Shelf';
import { getUrlParam, getUrlParamNumber } from '../utils/getUrlParams';
import { GameTimer } from '../ui/GameTimer';
import { navigation } from '../utils/navigation';
import { ResultScreen } from './ResultScreen';
import { GameScore } from '../ui/GameScore';
import { CloudLabel } from '../ui/CloudLabel';
import { i18n } from '../utils/i18n';
import { Cauldron } from '../ui/Cauldron';
import { RippleButton } from '../ui/RippleButton';
import { PausePopup } from '../Popups/PausePopup';
import { GameCountdown } from '../ui/GameCountdown';
import { GameEffects } from '../ui/GameEffects';
import { userSettings } from '../utils/userSettings';
import { GameTimesUp } from '../ui/GameTimesUp';
import { GameOvertime } from '../ui/GameOvertime';
import { waitFor } from '../utils/asyncUtils';
import { GetConfig, ValidModes } from '../GameLogic/Config';
import { userStats } from '../utils/userStats';

export class GameScreen extends Container {
    public static assetBundles = ['game', 'common'];

    private finished = false;

    // UI components
    private readonly match3: Match3;
    private readonly cauldron: Cauldron;
    private readonly gameContainer: Container;
    private readonly timer: GameTimer;
    private readonly score: GameScore;
    private readonly comboMessage: CloudLabel;
    private readonly comboLevel: CloudLabel;
    private readonly pauseButton: RippleButton;
    private readonly countdown: GameCountdown;
    private readonly overtime: GameOvertime;
    private readonly timesUp: GameTimesUp;
    private readonly shelf?: Shelf;
    private readonly vfx?: GameEffects;

    constructor() {
        super();
        
        // Initialize UI components
        this.pauseButton = this.createPauseButton();
        this.gameContainer = new Container();
        this.shelf = new Shelf();
        this.match3 = this.createMatch3();
        this.score = new GameScore();
        this.comboMessage = this.createCloudLabel(i18n.comboMessage, 0x2c136c, 0xffffff);
        this.comboLevel = this.createCloudLabel('x8', 0x2c136c, 0xffffff);
        this.cauldron = new Cauldron(true);
        this.timer = new GameTimer();
        this.vfx = new GameEffects(this);
        this.countdown = new GameCountdown();
        this.overtime = new GameOvertime();
        this.timesUp = new GameTimesUp();

        // Build screen hierarchy
        this.buildScreen();
    }

    private createPauseButton(): RippleButton {
        const button = new RippleButton({
            image: 'icon-pause',
            ripple: 'icon-pause-stroke',
        });
        button.onPress.connect(() => navigation.presentPopup(PausePopup));
        return button;
    }

    private createMatch3(): Match3 {
        const match3 = new Match3();
        match3.onMove = this.onMove.bind(this);
        match3.onMatch = this.onMatch.bind(this);
        match3.onPop = this.onPop.bind(this);
        match3.onProcessComplete = this.onProcessComplete.bind(this);
        match3.onTimesUp = this.onTimesUp.bind(this);
        return match3;
    }

    private createCloudLabel(text: string, color: number, labelColor: number): CloudLabel {
        const label = new CloudLabel({ color, labelColor });
        label.text = text;
        label.hide(false);
        return label;
    }

    private buildScreen(): void {
        this.addChild(this.pauseButton);
        this.addChild(this.gameContainer);
        
        this.gameContainer.addChild(this.shelf);
        this.gameContainer.addChild(this.match3);
        
        this.addChild(this.score);
        this.addChild(this.comboMessage);
        this.addChild(this.comboLevel);
        this.addChild(this.cauldron);
        
        this.cauldron.addContent(this.timer);
        this.addChild(this.vfx);
        this.addChild(this.countdown);
        this.addChild(this.overtime);
        this.addChild(this.timesUp);
    }

    /** Prepare the screen just before showing */
    public prepare() {
        const match3Config = GetConfig({
            rows: getUrlParamNumber('rows') ?? 9,
            columns: getUrlParamNumber('columns') ?? 7,
            tileSize: getUrlParamNumber('tileSize') ?? 50,
            freeMoves: getUrlParam('freeMoves') !== null,
            duration: getUrlParamNumber('duration') ?? 60,
            mode: (getUrlParam('mode') as ValidModes) ?? userSettings.getGameMode(),
        });

        this.finished = false;
        this.shelf?.setup(match3Config);
        this.match3.setup(match3Config);
        this.resetUI();
        this.resetAnimations();
    }

    private resetUI(): void {
        this.pauseButton.hide(false);
        this.cauldron.hide(false);
        this.score.hide(false);
    }

    private resetAnimations(): void {
        gsap.killTweensOf(this.gameContainer.pivot);
        this.gameContainer.pivot.y = -navigation.height * 0.7;
        gsap.killTweensOf(this.timer.scale);
    }

    /** Update the screen */
    public update(time: Ticker) {
        const remainingTime = this.match3.timer.getTimeRemaining();
        this.match3.update(time.deltaMS);
        this.timer.updateTime(remainingTime);
        this.overtime.updateTime(remainingTime);
        this.score.setScore(this.match3.stats.getScore());
    }

    /** Pause gameplay - automatically fired when a popup is presented */
    public async pause() {
        this.gameContainer.interactiveChildren = false;
        this.match3.pause();
    }

    public async resume() {
        this.gameContainer.interactiveChildren = true;
        this.match3.resume();
    }

    public reset() {
        this.shelf?.reset();
        this.match3.reset();
    }

    public resize(width: number, height: number) {
        const div = height * 0.3;
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const match3Height = this.match3.board.getHeight() * 0.5 + 20;

        this.gameContainer.position.set(centerX, div + match3Height);
        this.score.position.set(centerX, 10);
        this.comboMessage.position.set(centerX - 150, div - 50);
        this.comboLevel.position.set(centerX + 150, div - 50);
        this.cauldron.position.set(centerX, div - 60);
        this.pauseButton.position.set(30, 30);
        this.countdown.position.set(centerX, centerY);
        this.timesUp.position.set(centerX, centerY);
        this.overtime.position.set(centerX, div + match3Height);
    }

    public async show() {
        await gsap.to(this.gameContainer.pivot, { y: 0, duration: 0.5, ease: 'back.out' });
        await this.countdown.show();
        await this.cauldron.show();
        await this.countdown.hide();
        this.score.show();
        this.pauseButton.show();
        this.match3.startPlaying();
    }

    public async hide() {
        this.overtime.hide();
        this.vfx?.playGridExplosion();
        await waitFor(0.3);
        await this.timesUp.playRevealAnimation();
        await this.timesUp.playExpandAnimation();
    }

    private onMove(data: OnMoveData) {
        this.vfx?.onMove(data);
    }

    private onMatch(data: Match3OnMatchData) {
        if (data.combo > 1) {
            this.showCombo(data.combo);
        }
        this.vfx?.onMatch(data);
    }

    private showCombo(combo: number): void {
        this.comboMessage.show();
        this.comboLevel.show();
        this.comboLevel.text = 'x' + combo;
    }

    private onPop(data: Match3OnPopData) {
        this.vfx?.onPop(data);
    }

    private onProcessComplete() {
        this.comboMessage.hide();
        this.comboLevel.hide();
        if (!this.match3.timer.isRunning()) this.finish();
    }

    private onTimesUp() {
        this.pauseButton.hide();
        this.match3.stopPlaying();
        if (!this.match3.process.isProcessing()) this.finish();
    }

    private async finish() {
        if (this.finished) return;
        this.finished = true;
        this.match3.stopPlaying();
        const performance = this.match3.stats.getGameplayPerformance();
        userStats.save(this.match3.config.mode, performance);
        navigation.showScreen(ResultScreen);
    }

    public blur() {
        if (!navigation.currentPopup && this.match3.isPlaying()) {
            navigation.presentPopup
        }
    }
}