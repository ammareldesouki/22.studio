import { z } from 'zod';
import { db } from '@studioflow/db';

// Public contact endpoint for the marketing site — persists an enquiry as a Message.
const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
  locale: z.string().max(5).optional(),
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
  await db.message.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      locale: parsed.data.locale ?? 'en',
    },
  });
  return Response.json({ ok: true }, { status: 201 });
}
