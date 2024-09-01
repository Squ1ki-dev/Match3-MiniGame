import { Match3, OnMatchData, OnPopData } from './Match3';

const defaultStatsData = {
    score: 0,
    matches: 0,
    pops: 0,
    specials: 0,
    grade: 0,
};

export type StatsData = typeof defaultStatsData;

export class Stats {
    private match3: Match3;
    private data: StatsData;

    constructor(match3: Match3) {
        this.match3 = match3;
        this.data = { ...defaultStatsData };
    }

    public reset() {
        this.data = { ...defaultStatsData };
    }

    public registerPop(data: OnPopData) {
        const points = data.causedBySpecial ? 3 : 1;
        this.data.score += points;
        this.data.pops += 1;
        if (data.isSpecial) {
            this.data.specials += 1;
        }
    }

    public registerMatch(data: OnMatchData) {
        for (const match of data.matches) {
            const points = match.length + data.matches.length * data.combo;
            this.data.score += points;
            this.data.matches += 1;
        }
    }

    public caulculateGrade(score: number, playTime: number) {
        const avgPointsPerSecond = 8;
        const gameplayTimeInSecs = playTime / 1000;
        const pointsPerSecond = score / gameplayTimeInSecs;

        let grade = 0;
        if (pointsPerSecond > avgPointsPerSecond * 2) {
            grade = 3;
        } else if (pointsPerSecond > avgPointsPerSecond) {
            grade = 2;
        } else if (pointsPerSecond > avgPointsPerSecond * 0.1) {
            grade = 1;
        }

        return grade;
    }

    public getScore() {
        return this.data.score;
    }

    public getGameplayPerformance() {
        const grade = this.caulculateGrade(this.data.score, this.match3.timer.getTime());
        return { ...this.data, grade };
    }
}
