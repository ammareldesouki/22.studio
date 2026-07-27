import { z } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: { path: string; message: string }[] } };

export function validate<T>(schema: z.ZodSchema<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
  };
}

/**
 * Parse + schema-validate a request body, returning either the typed data or a ready 400 Response.
 * Centralizes the malformed-JSON / validation-failure envelope so both `withValidation` (body-only
 * routes) and native dynamic-segment handlers (which need Next's `params`) reuse one implementation.
 *
 * - Malformed JSON  → `{ ok: false, response: 400 'Invalid JSON' }`
 * - Schema failure  → `{ ok: false, response: 400 'Validation failed' }`
 * - Valid           → `{ ok: true, data }`
 */
export async function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  request: Request,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: Response.json(
        { error: 'Invalid JSON', issues: [{ path: '', message: 'Request body is not valid JSON' }] },
        { status: 400 },
      ),
    };
  }
  const result = validate(schema, body);
  if (!result.success) {
    return {
      ok: false,
      response: Response.json({ error: 'Validation failed', issues: result.error.issues }, { status: 400 }),
    };
  }
  return { ok: true, data: result.data };
}

/**
 * Wraps a body-only route handler so the request body is JSON-parsed and schema-validated before
 * the handler runs (FR-018). Framework-agnostic (web-standard Request/Response). For dynamic
 * routes that also need the id, use a native handler with `params` + `parseAndValidate`.
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request) => Response | Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const parsed = await parseAndValidate(schema, request);
    if (!parsed.ok) return parsed.response;
    return handler(parsed.data, request);
  };
}

export { z };

export { paginationCursorSchema, idSchema, seoSchema, versionSchema } from './shared';
