/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/**
 * Helper to ensure a value is a positive integer.
 */
export declare function isPositiveInt(val: any): boolean;
/**
 * Helper to get basic dimensions securely via sharp metadata
 */
export declare function getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    hasAlpha: boolean;
    format: string;
}>;
//# sourceMappingURL=validate.d.ts.map