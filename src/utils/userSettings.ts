import { ValidModes } from '../GameLogic/Config';
import { bgm, setMasterVolume, sfx } from './audio';
import { storage } from './storage';

// Keys for saved items in storage
const KEY_VOLUME_MASTER = 'volume-master';
const KEY_VOLUME_BGM = 'volume-bgm';
const KEY_VOLUME_SFX = 'volume-sfx';
const KEY_GAME_MODE = 'game-mode';

const GameValidModes = Object.values(ValidModes);

class UserSettings {
    constructor() {
        setMasterVolume(this.getMasterVolume());
        bgm.setVolume(this.getBgmVolume());
        sfx.setVolume(this.getSfxVolume());
    }

    public getGameMode() {
        const mode = storage.getString(KEY_GAME_MODE) as ValidModes;
        return GameValidModes.includes(mode) ? mode : ValidModes.Normal;
    }

    public setGameMode(mode: ValidModes) {
        if (!GameValidModes.includes(mode)) {
            throw new Error('Invalid game mode: ' + mode);
        }
        return storage.setString(KEY_GAME_MODE, mode);
    }

    /** Get overall sound volume */
    public getMasterVolume() {
        return storage.getNumber(KEY_VOLUME_MASTER) ?? 0.5;
    }

    /** Set overall sound volume */
    public setMasterVolume(value: number) {
        setMasterVolume(value);
        storage.setNumber(KEY_VOLUME_MASTER, value);
    }

    /** Get background music volume */
    public getBgmVolume() {
        return storage.getNumber(KEY_VOLUME_BGM) ?? 1;
    }

    /** Set background music volume */
    public setBgmVolume(value: number) {
        bgm.setVolume(value);
        storage.setNumber(KEY_VOLUME_BGM, value);
    }

    /** Get sound effects volume */
    public getSfxVolume() {
        return storage.getNumber(KEY_VOLUME_SFX) ?? 1;
    }

    /** Set sound effects volume */
    public setSfxVolume(value: number) {
        sfx.setVolume(value);
        storage.setNumber(KEY_VOLUME_SFX, value);
    }
}

/** SHared user settings instance */
export const userSettings = new UserSettings();
