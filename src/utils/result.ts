import { Ok, Err, ErrorCode } from '../types.js'

export const ok = <T>(data: T, warnings?: string[]): Ok<T> => {
  const result: Ok<T> = { ok: true, data };
  if (warnings && warnings.length > 0) result.warnings = warnings;
  return result;
}
export const err = (error: string, code: ErrorCode): Err => ({ ok: false, error, code })
