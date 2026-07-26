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
 * Wraps a route handler so every request body is JSON-parsed and schema-validated before the
 * handler runs (FR-018: the backend never trusts unvalidated input). Framework-agnostic — uses
 * the web-standard Request/Response, so it works in any Next.js route handler without coupling
 * this package to Next.
 *
 * - Malformed JSON  → 400 `{ error: 'Invalid JSON', issues: [...] }`
 * - Schema failure  → 400 `{ error: 'Validation failed', issues: [...] }`
 * - Valid           → calls `handler(data, request)`
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request) => Response | Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON', issues: [{ path: '', message: 'Request body is not valid JSON' }] },
        { status: 400 },
      );
    }

    const result = validate(schema, body);
    if (!result.success) {
      return Response.json({ error: 'Validation failed', issues: result.error.issues }, { status: 400 });
    }

    return handler(result.data, request);
  };
}

export { z };
