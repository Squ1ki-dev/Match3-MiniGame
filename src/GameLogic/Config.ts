export enum ValidModes {
    Easy = 'easy',
    Normal = 'normal'
}

export type Mode = keyof typeof ValidModes;

const blocks: Record<ValidModes, string[]> = {
    [ValidModes.Easy]: ['piece-dragon', 'piece-frog', 'piece-newt', 'piece-snake'],
    [ValidModes.Normal]: ['piece-dragon', 'piece-frog', 'piece-newt', 'piece-snake', 'piece-spider']
};

const defaultConfig = {
    rows: 7,
    columns: 7,
    tileSize: 50,
    freeMoves: false,
    duration: 60,
    mode: ValidModes.Normal, // Change this to Match3ValidModes.Hard or Match3ValidModes.Expert if needed
};

export type Config = typeof defaultConfig;

export function GetConfig(customConfig: Partial<Config> = {}): Config {
    return { ...defaultConfig, ...customConfig };
}

export function GetBlocks(mode: ValidModes): string[] {
    return [...blocks[mode]];
}