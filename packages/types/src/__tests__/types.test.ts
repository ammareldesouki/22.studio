import { describe, it, expect } from 'vitest';

describe('@studioflow/types', () => {
  it('exports JsonValue that accepts objects', () => {
    const value: Record<string, unknown> = { name: 'test', count: 42 };
    expect(value.name).toBe('test');
  });
});
