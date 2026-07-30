import { z } from 'zod';
import { db } from '@studioflow/db';

// Public contact endpoint for the marketing site — persists an enquiry as a Message.
const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
  budget: z.string().max(160).optional(), // selected budget option (display text), optional
  locale: z.string().max(5).optional(),
  company: z.string().optional(), // honeypot — real users leave it empty
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed' }, { status: 400 });
  }
  // Honeypot tripped → looks like a bot. Pretend success, persist nothing.
  if (parsed.data.company && parsed.data.company.trim() !== '') {
    return Response.json({ ok: true }, { status: 201 });
  }
  await db.message.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      budget: parsed.data.budget?.trim() || null,
      locale: parsed.data.locale ?? 'en',
    },
  });
  return Response.json({ ok: true }, { status: 201 });
}
