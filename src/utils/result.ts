import { Ok, Err, ErrorCode } from '../types.js'

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data })
export const err = (error: string, code: ErrorCode): Err => ({ ok: false, error, code })
