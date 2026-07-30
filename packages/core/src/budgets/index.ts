import { db } from '@studioflow/db';

// CRUD for the contact-form budget/plan options. Unlike Clients/Services this is a light
// lookup list — no publish workflow, SEO, or versioning — just an ordered, toggleable set.

export interface BudgetRecord {
  id: string;
  labelEn: string;
  labelAr: string | null;
  amount: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const SELECT = {
  id: true,
  labelEn: true,
  labelAr: true,
  amount: true,
  order: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function map(row: Record<string, unknown>): BudgetRecord {
  return {
    id: row.id as string,
    labelEn: row.labelEn as string,
    labelAr: (row.labelAr as string) ?? null,
    amount: (row.amount as string) ?? null,
    order: row.order as number,
    active: row.active as boolean,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

export class BudgetsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'BudgetsError';
  }
}

export class BudgetsService {
  // Admin view — every budget, ordered.
  async list(): Promise<BudgetRecord[]> {
    const rows = await db.budget.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], select: SELECT });
    return rows.map((r) => map(r as unknown as Record<string, unknown>));
  }

  // Public view — only active budgets, ordered.
  async listActive(): Promise<BudgetRecord[]> {
    const rows = await db.budget.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: SELECT,
    });
    return rows.map((r) => map(r as unknown as Record<string, unknown>));
  }

  async getById(id: string): Promise<BudgetRecord | null> {
    const row = await db.budget.findUnique({ where: { id }, select: SELECT });
    return row ? map(row as unknown as Record<string, unknown>) : null;
  }

  async create(input: {
    labelEn: string;
    labelAr?: string | null;
    amount?: string | null;
    order?: number;
    active?: boolean;
  }): Promise<BudgetRecord> {
    const row = await db.budget.create({
      data: {
        labelEn: input.labelEn,
        labelAr: input.labelAr ?? null,
        amount: input.amount ?? null,
        order: input.order ?? 0,
        active: input.active ?? true,
      },
      select: SELECT,
    });
    return map(row as unknown as Record<string, unknown>);
  }

  async update(
    id: string,
    input: { labelEn?: string; labelAr?: string | null; amount?: string | null; order?: number; active?: boolean },
  ): Promise<BudgetRecord> {
    const existing = await db.budget.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new BudgetsError('Budget not found', 'NOT_FOUND', 404);

    const data: Record<string, unknown> = {};
    if (input.labelEn !== undefined) data.labelEn = input.labelEn;
    if ('labelAr' in input) data.labelAr = input.labelAr ?? null;
    if ('amount' in input) data.amount = input.amount ?? null;
    if (input.order !== undefined) data.order = input.order;
    if (input.active !== undefined) data.active = input.active;

    const row = await db.budget.update({ where: { id }, data: data as never, select: SELECT });
    return map(row as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const existing = await db.budget.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new BudgetsError('Budget not found', 'NOT_FOUND', 404);
    await db.budget.delete({ where: { id } });
  }
}

export const budgetsService = new BudgetsService();
