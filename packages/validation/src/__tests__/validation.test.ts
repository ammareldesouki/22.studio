import { describe, it, expect } from 'vitest';
import { z, validate } from '../index';

describe('@studioflow/validation', () => {
  it('validate returns success for valid data', () => {
    const schema = z.object({ name: z.string() });
    const result = validate(schema, { name: 'Alice' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Alice');
    }
  });

  it('validate returns error for invalid data', () => {
    const schema = z.object({ name: z.string() });
    const result = validate(schema, { name: 42 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
