import { Mode } from '../GameLogic/Config';
import { StatsData } from '../GameLogic/Stats';
import { storage } from './storage';

// Keys for saved items in storage
const KEY_PREFIX_STATS = 'stats-';
const KEY_PREFIX_BEST_SCORE = 'stats-best-score-';

export class UserStats {
    public load(mode: Mode): StatsData {
        const obj = storage.getObject(KEY_PREFIX_STATS + mode);
        if (!obj) {
            return {
                score: 0,
                matches: 0,
                pops: 0,
                specials: 0,
                grade: 0,
            };
        }
        return obj;
    }

    public save(mode: Mode, data: StatsData) {
        if (data.score > this.loadBestScore(mode)) {
            storage.setNumber(KEY_PREFIX_BEST_SCORE + mode, data.score);
        }
        storage.setObject(KEY_PREFIX_STATS + mode, data);
    }

    public loadBestScore(mode: Mode) {
        return storage.getNumber(KEY_PREFIX_BEST_SCORE + mode) ?? 0;
    }
}

export const userStats = new UserStats();
