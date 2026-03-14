import { ImageInput, ImageResult, PipelineOperation } from '../types.js';
export declare function pipeline(input: ImageInput, operations: PipelineOperation[]): Promise<ImageResult & {
    step?: number;
}>;
//# sourceMappingURL=pipeline.d.ts.map