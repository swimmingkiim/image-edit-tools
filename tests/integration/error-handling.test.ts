import { describe, it, expect } from 'vitest';
import { ok, err } from '../../src/utils/result.js';
import { ErrorCode } from '../../src/types.js';

describe('error handling utilities', () => {
  it('constructs an Ok result', () => {
    const val = { testing: 123 };
    const result = ok(val);
    expect(result).toEqual({ ok: true, data: val });
  });

  it('constructs an Err result with code', () => {
    const message = "Invalid dimensions provided";
    const result = err(message, ErrorCode.INVALID_INPUT);
    
    expect(result.ok).toBe(false);
    if (!result.ok) { // TypeScript narrowing
      expect(result.error).toBe(message);
      expect(result.code).toBe(ErrorCode.INVALID_INPUT);
    }
  });
});
