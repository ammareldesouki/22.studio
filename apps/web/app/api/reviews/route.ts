import { db } from '@studioflow/db';
import { publicReviewSubmitSchema } from '@studioflow/validation/reviews';

// Public review submission for the marketing site. Persists a Review as pending + inactive
// so it does NOT appear on the site until an admin Accepts it. `email` is stored privately
// and never returned to the site.
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }
  const parsed = publicReviewSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed' }, { status: 400 });
  }
  // Honeypot tripped → looks like a bot. Pretend success, persist nothing.
  if (parsed.data.company && parsed.data.company.trim() !== '') {
    return Response.json({ ok: true }, { status: 201 });
  }
  // Append after existing reviews so, once accepted, it shows at the end of the list.
  const count = await db.review.count();
  await db.review.create({
    data: {
      quote: parsed.data.quote.trim(),
      authorName: parsed.data.authorName.trim(),
      email: parsed.data.email.trim(),
      pending: true,
      order: count,
      active: false,
    },
  });
  return Response.json({ ok: true }, { status: 201 });
}
