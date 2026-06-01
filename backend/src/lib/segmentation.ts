import type { Prisma } from "../db.js";

export type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "starts_with";
export type Field = "lifecycle" | "cltv" | "totalOrders" | "city" | "state" | "gender" | "ageBand" | "source" | "churnScore" | "name" | "email";
export type Cond = { field: Field; op: Op; value: string | number | (string | number)[] };
export type RuleGroup = { all?: Cond[]; any?: Cond[] };

const PRISMA_OP: Record<Op, string> = {
  eq: "equals", neq: "not", gt: "gt", gte: "gte", lt: "lt", lte: "lte", in: "in", contains: "contains", starts_with: "startsWith",
};

function condToWhere(c: Cond): Record<string, unknown> {
  const op = PRISMA_OP[c.op];
  return { [c.field]: { [op]: c.value } };
}

export function rulesToWhere(rules: RuleGroup): Prisma.CustomerWhereInput {
  const w: Prisma.CustomerWhereInput = {};
  if (rules.all?.length) (w as any).AND = rules.all.map(condToWhere);
  if (rules.any?.length) (w as any).OR = rules.any.map(condToWhere);
  return w;
}

export function validateRules(rules: unknown): rules is RuleGroup {
  if (!rules || typeof rules !== "object") return false;
  const r = rules as RuleGroup;
  const check = (c: unknown): c is Cond => {
    if (!c || typeof c !== "object") return false;
    const cc = c as any;
    return typeof cc.field === "string" && typeof cc.op === "string" && cc.value !== undefined;
  };
  if (r.all && !r.all.every(check)) return false;
  if (r.any && !r.any.every(check)) return false;
  return true;
}
