import { Match3 } from './Match3';

export class Timer {
    private match3: Match3;
    private time = 0;
    private duration = 0;
    private paused = false;
    private running = false;

    constructor(match3: Match3) {
        this.match3 = match3;
    }

    public reset() {
        this.time = 0;
        this.duration = 0;
        this.running = false;
        this.paused = false;
    }

    public setup(duration: number) {
        this.reset();
        this.duration = Math.floor(duration);
    }

    public start() {
        this.running = true;
        this.paused = false;
        this.time = 0;
    }

    public stop() {
        this.running = false;
        this.paused = false;
        this.time = this.duration;
    }

    public pause() {
        this.paused = true;
    }

    public resume() {
        this.paused = false;
    }

    public update(delta: number) {
        if (!this.running || this.paused) return;
        this.time += delta;
        if (this.time >= this.duration) {
            this.stop();
            this.match3.onTimesUp?.();
        }
    }

    public isPaused(){
        return this.paused;
    }

    public isRunning(){
        return this.running;
    }

    public getTime(){
        return this.time;
    }

    public getTimeRemaining(){
        return this.duration - this.time;
    }
}
