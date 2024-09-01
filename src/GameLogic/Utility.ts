export type Type = number;
export type Grid = Type[][];
export type Position = { row: number; column: number };
export type Orientation = 'horizontal' | 'vertical';

// Helper function to create a new grid of a specified size with randomized pieces
export function CreateGrid(rows = 6, columns = 6, types: Type[]): Grid {
    const grid: Grid = Array.from({ length: rows }, () => Array(columns).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let type = GetRandomType(types);

            while (PreviousTypes(grid, { row: r, column: c }, type)) {
                type = GetRandomType(types, [type]);
            }

            grid[r][c] = type;
        }
    }

    return grid;
}

export function CloneGrid(grid: Grid): Grid {
    return grid.map(row => [...row]);
}

function PreviousTypes(grid: Grid, { row, column }: Position, type: Type): boolean {
    const horizontalMatch = type === grid?.[row]?.[column - 1] && type === grid?.[row]?.[column - 2];
    const verticalMatch = type === grid?.[row - 1]?.[column] && type === grid?.[row - 2]?.[column];
    return horizontalMatch || verticalMatch;
}

export function GetRandomType(types: Type[], exclude: Type[] = []): Type {
    const availableTypes = types.filter(type => !exclude.includes(type));
    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    return availableTypes[randomIndex];
}

export function SwapPieces(grid: Grid, positionA: Position, positionB: Position): void {
    const typeA = GetPieceType(grid, positionA);
    const typeB = GetPieceType(grid, positionB);

    if (typeA !== undefined && typeB !== undefined) {
        SetPieceType(grid, positionA, typeB);
        SetPieceType(grid, positionB, typeA);
    }
}

export function SetPieceType(grid: Grid, { row, column }: Position, type: Type): void {
    grid[row][column] = type;
}

export function GetPieceType(grid: Grid, { row, column }: Position): Type | undefined {
    return grid?.[row]?.[column];
}

export function IsValidPosition(grid: Grid, { row, column }: Position): boolean {
    return row >= 0 && row < grid.length && column >= 0 && column < grid[0].length;
}

// Iterate over all pieces in the grid and apply a function to each
export function ForEach(grid: Grid, fn: (position: Position, type: Type) => void): void {
    grid.forEach((row, r) => {
        row.forEach((type, c) => {
            fn({ row: r, column: c }, type);
        });
    });
}

function GetMatchesByOrientation(grid: Grid, matchSize: number, orientation: Orientation): Position[][] {
    const matches: Position[][] = [];
    const [primaryLimit, secondaryLimit] = orientation === 'horizontal' ? [grid.length, grid[0].length] : [grid[0].length, grid.length];

    for (let p = 0; p < primaryLimit; p++) {
        let currentMatch: Position[] = [];
        let lastType: Type | undefined;

        for (let s = 0; s < secondaryLimit; s++) {
            const row = orientation === 'horizontal' ? p : s;
            const column = orientation === 'horizontal' ? s : p;
            const type = grid[row][column];

            if (type === lastType) {
                currentMatch.push({ row, column });
            } else {
                if (currentMatch.length >= matchSize) matches.push([...currentMatch]);
                currentMatch = [{ row, column }];
                lastType = type;
            }
        }

        if (currentMatch.length >= matchSize) matches.push([...currentMatch]);
    }

    return matches;
}

export function ComparePositions(a: Position, b: Position): boolean {
    return a.row === b.row && a.column === b.column;
}

export function IncludesPosition(positions: Position[], position: Position): boolean {
    return positions.some(p => ComparePositions(p, position));
}

export function GetMatches(grid: Grid, filter: Position[] = [], matchSize = 3): Position[][] {
    const allMatches = [
        ...GetMatchesByOrientation(grid, matchSize, 'horizontal'),
        ...GetMatchesByOrientation(grid, matchSize, 'vertical'),
    ];

    if (!filter.length) return allMatches;

    return allMatches.filter(match => match.some(position => IncludesPosition(filter, position)));
}

export function ApplyGravity(grid: Grid): Position[][] {
    const changes: Position[][] = [];

    for (let r = grid.length - 1; r >= 0; r--) {
        for (let c = 0; c < grid[0].length; c++) {
            let position = { row: r, column: c };
            let belowPosition = { row: r + 1, column: c };

            while (IsValidPosition(grid, belowPosition) && grid[belowPosition.row][belowPosition.column] === 0) {
                SwapPieces(grid, position, belowPosition);
                position = belowPosition;
                belowPosition = { row: belowPosition.row + 1, column: c };
            }

            if (position.row !== r) changes.push([{ row: r, column: c }, position]);
        }
    }

    return changes;
}

export function GetEmptyPositions(grid: Grid): Position[] {
    const positions: Position[] = [];

    ForEach(grid, (position, type) => {
        if (type === 0) positions.push(position);
    });

    return positions;
}

export function GridToString(grid: Grid): string {
    return grid.map(row => row.map(type => String(type).padStart(2, '0')).join('|')).join('\n');
}

// Fill up empty positions in the grid with random types, returning the new positions
export function FillUp(grid: Grid, types: Type[]): Position[] {
    const newPositions: Position[] = [];

    ForEach(grid, (position, type) => {
        if (type === 0) {
            const newType = GetRandomType(types);
            SetPieceType(grid, position, newType);
            newPositions.push(position);
        }
    });

    return newPositions.reverse();
}

// Filter out duplicate positions from a list
export function FilterUniquePositions(positions: Position[]): Position[] {
    const uniquePositions = new Map<string, Position>();

    positions.forEach(position => {
        const key = PositionToString(position);
        if (!uniquePositions.has(key)) {
            uniquePositions.set(key, position);
        }
    });

    return Array.from(uniquePositions.values());
}

export function PositionToString({ row, column }: Position): string {
    return `${row}:${column}`;
}

// Convert a string identifier back to a position
export function StringToPosition(str: string): Position {
    const [row, column] = str.split(':').map(Number);
    return { row, column };
}