import { z, withValidation } from '@studioflow/validation';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required').max(1000),
});

// Validation (incl. malformed-JSON handling) is enforced by the wrapper — the handler only
// runs with a validated body. No persistence here (Phase 1 = zero business logic).
export const POST = withValidation(contactSchema, (data) =>
  Response.json({ success: true, data }),
);
