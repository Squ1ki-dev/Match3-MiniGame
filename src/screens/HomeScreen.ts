import { Container } from 'pixi.js';
import { navigation } from '../utils/navigation';
import { GameScreen } from './GameScreen';
import { i18n } from '../utils/i18n';
import { LargeButton } from '../ui/LargeButton';

export class HomeScreen extends Container {
    public static assetBundles = ['home', 'common'];
    private playButton: LargeButton;

    constructor()
    {
        super();

        this.playButton = new LargeButton({ text: i18n.playButton });
        this.playButton.onPress.connect(() => navigation.showScreen(GameScreen));
        this.addChild(this.playButton);
    }

    public resize(width: number, height: number) {
        this.playButton.x = width * 0.5;
        this.playButton.y = height * 0.5;
    }
}
