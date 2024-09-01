import { Container, NineSliceSprite, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Label } from '../ui/Label';
import { i18n } from '../utils/i18n';
import { ResultStars } from '../ui/ResultStars';
import { LargeButton } from '../ui/LargeButton';
import { GameScreen } from './GameScreen';
import { navigation } from '../utils/navigation';
import { CloudLabel } from '../ui/CloudLabel';
import { ResultScore } from '../ui/ResultScore';
import { sfx } from '../utils/audio';
import { userSettings } from '../utils/userSettings';
import { waitFor } from '../utils/asyncUtils';
import { MaskTransition } from '../ui/MaskTransition';
import { userStats } from '../utils/userStats';

export class ResultScreen extends Container {
    public static assetBundles = ['result', 'common'];

    private panel: Container;
    private panelBase: Sprite;
    private title: Label;
    private mode: Label;
    private cauldron: Sprite;
    private message: CloudLabel;
    private score: ResultScore;
    private bestScore: ResultScore;
    private stars: ResultStars;
    private bottomBase: NineSliceSprite;
    private continueButton: LargeButton;
    private maskTransition?: MaskTransition;

    constructor() {
        super();

        this.createPanel();
        this.createBottomBase();
        this.createContinueButton();
        this.maskTransition = new MaskTransition();
    }

    private createPanel() {
        this.panel = new Container();
        this.addChild(this.panel);

        this.panelBase = Sprite.from('result-base');
        this.panelBase.anchor.set(0.5);
        this.panel.addChild(this.panelBase);

        this.title = new Label('', { fill: 0xffffff });
        this.title.y = -160;
        this.panel.addChild(this.title);

        this.mode = new Label('', { fill: 0xffffff, fontSize: 12 });
        this.mode.y = -140;
        this.mode.alpha = 0.5;
        this.panel.addChild(this.mode);

        this.cauldron = Sprite.from('white-cauldron');
        this.cauldron.anchor.set(0.5);
        this.cauldron.y = 145;
        this.panel.addChild(this.cauldron);

        this.message = new CloudLabel({ color: 0xffffff, labelColor: 0x2c136c });
        this.message.y = -95;
        this.panel.addChild(this.message);

        this.score = new ResultScore();
        this.score.y = 60;
        this.panel.addChild(this.score);

        this.bestScore = new ResultScore(0xffd579);
        this.bestScore.y = 90;
        this.bestScore.scale.set(0.7);
        this.panel.addChild(this.bestScore);

        this.stars = new ResultStars();
        this.stars.y = -10;
        this.panel.addChild(this.stars);
    }

    private createBottomBase() {
        this.bottomBase = new NineSliceSprite({
            texture: Texture.from('rounded-rectangle'),
            leftWidth: 32,
            topHeight: 32,
            rightWidth: 32,
            bottomHeight: 32,
        });
        this.bottomBase.tint = 0x2c136c;
        this.bottomBase.height = 200;
        this.addChild(this.bottomBase);
    }

    private createContinueButton() {
        this.continueButton = new LargeButton({ text: i18n.resultPlay });
        this.addChild(this.continueButton);
        this.continueButton.onPress.connect(() => navigation.showScreen(GameScreen));
    }

    public prepare() {
        this.setVisible(false);

        this.title.text = `${i18n.resultTitle}`;
        const mode = userSettings.getGameMode();
        const readableMode = (i18n as any)[`${mode}Mode`];
        this.mode.text = `${readableMode}`;
    }

    private setVisible(visible: boolean) {
        this.panel.visible = visible;
        this.score.visible = visible;
        this.bestScore.visible = visible;
        this.message.hide(!visible);
        this.stars.hide(!visible);
        this.bottomBase.visible = visible;
        this.continueButton.visible = visible;
    }

    public resize(width: number, height: number) {
        this.panel.position.set(width * 0.5, height * 0.5);
        this.continueButton.position.set(width * 0.5, height - 90);
        this.bottomBase.width = width;
        this.bottomBase.y = height - 100;
    }

    public async show() {
        this.maskTransition?.playTransitionIn();
        await waitFor(0.5);

        const mode = userSettings.getGameMode();
        const performance = userStats.load(mode);

        await this.showPanel();
        this.animateGradeStars(performance.grade);
        await this.animatePoints(performance.score);
        await this.animateGradeMessage(performance.grade);
        this.showBottom();
    }

    public async hide() {
        await this.hideBottom();
        await this.hidePanel();
    }

    private async showPanel() {
        this.animatePanel(true);
    }

    private async hidePanel() {
        this.animatePanel(false);
    }

    private async animatePanel(show: boolean) {
        const targetScale = show ? 1 : 0;
        const duration = show ? 0.4 : 0.3;
        const easeType = show ? 'back.out' : 'back.in';

        gsap.killTweensOf(this.panel.scale);
        this.panel.visible = true;
        this.panel.scale.set(show ? 0 : 1);

        await gsap.to(this.panel.scale, {
            x: targetScale,
            y: targetScale,
            duration,
            ease: easeType,
        });

        if (!show) this.panel.visible = false;
    }

    private async showBottom() {
        await this.animateBottom(true);
    }

    private async hideBottom() {
        await this.animateBottom(false);
    }

    private async animateBottom(show: boolean) {
        const targetY = show ? 0 : -200;
        const delay = show ? 0.3 : 0;
        const easeType = show ? 'back.out' : 'back.in';

        gsap.killTweensOf(this.bottomBase.pivot);
        gsap.killTweensOf(this.continueButton.pivot);

        this.bottomBase.visible = true;
        this.continueButton.visible = true;

        await gsap.to(this.bottomBase.pivot, {
            y: targetY,
            duration: 0.3,
            ease: easeType,
            delay,
        });

        await gsap.to(this.continueButton.pivot, {
            y: targetY,
            duration: 0.4,
            ease: easeType,
            delay: delay + 0.1,
        });

        if (!show) {
            this.bottomBase.visible = false;
            this.continueButton.visible = false;
        }
    }

    private async animatePoints(points: number) {
        await this.score.show();
        await this.score.playScore(points);

        if (points) {
            const mode = userSettings.getGameMode();
            const bestScore = userStats.loadBestScore(mode);

            this.bestScore.show();
            this.bestScore.setText(
                points >= bestScore ? i18n.newBestScore : `${i18n.bestScorePrefix}${bestScore}`
            );
        }
    }

    private async animateGradeStars(grade: number) {
        await this.stars.show();
        await this.stars.playGrade(grade);
    }

    private async animateGradeMessage(grade: number) {
        await waitFor(0.1);

        const messageKey = `grade${grade}`;
        this.message.text = i18n[messageKey];

        sfx.play(grade < 1 ? 'common/sfx-incorrect.wav' : 'common/sfx-special.wav');
        await this.message.show();
    }
}
