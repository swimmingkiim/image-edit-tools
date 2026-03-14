declare module 'color-thief-node' {
    export function getPaletteFromURL(url: string, count?: number, quality?: number): Promise<number[][]>;
    export function getColorFromURL(url: string, quality?: number): Promise<number[]>;
}
