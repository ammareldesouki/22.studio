import { describe, it, expect } from 'vitest';
import { cn, SITE_NAME } from '../index';

describe('@studioflow/shared', () => {
  it('exports SITE_NAME', () => {
    expect(SITE_NAME).toBe('StudioFlow');
  });

  it('cn joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('cn filters falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});
