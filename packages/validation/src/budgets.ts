import { z } from 'zod';

// Budget/plan options offered in the public contact form. `amount` is free text so the
// admin can type any currency/format (e.g. "$1k–$5k", "20,000 EGP").
export const createBudgetSchema = z.object({
  labelEn: z.string().min(1).max(120),
  labelAr: z.string().max(120).optional().nullable(),
  amount: z.string().max(120).optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const updateBudgetSchema = z.object({
  labelEn: z.string().min(1).max(120).optional(),
  labelAr: z.string().max(120).nullable().optional(),
  amount: z.string().max(120).nullable().optional(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});
