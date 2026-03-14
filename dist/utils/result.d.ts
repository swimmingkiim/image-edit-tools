import { Ok, Err, ErrorCode } from '../types.js';
export declare const ok: <T>(data: T) => Ok<T>;
export declare const err: (error: string, code: ErrorCode) => Err;
//# sourceMappingURL=result.d.ts.map