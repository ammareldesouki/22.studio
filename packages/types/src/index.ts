export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Branded<T, B> = T & { __brand: B };

export { PERMISSIONS, ALL_PERMISSIONS } from './permissions';
export type { Permission } from './permissions';

export { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from './pagination';
