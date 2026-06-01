// Cross-brand identity stitching.
import { db } from "../db.js";

const normalizeEmail = (e?: string | null) => e?.trim().toLowerCase() || null;
const normalizePhone = (p?: string | null) => p?.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "") || null;

export async function stitchCustomer(customerId: string) {
  const c = await db.customer.findUnique({ where: { id: customerId } });
  if (!c) return null;
  const email = normalizeEmail(c.email);
  const phone = normalizePhone(c.phone);

  let person = await db.person.findFirst({
    where: {
      OR: [
        email ? { primaryEmail: email } : undefined,
        phone ? { primaryPhone: phone } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!person) {
    person = await db.person.create({
      data: { primaryEmail: email, primaryPhone: phone, displayName: c.name },
    });
  }

  await db.customer.update({ where: { id: customerId }, data: { personId: person.id } });
  await refreshPersonAggregates(person.id);
  return person;
}

export async function refreshPersonAggregates(personId: string) {
  const customers = await db.customer.findMany({ where: { personId }, select: { brandId: true, cltv: true } });
  const brands = new Set(customers.map((c) => c.brandId));
  const totalCLTV = customers.reduce((a, c) => a + c.cltv, 0);
  await db.person.update({ where: { id: personId }, data: { brandCount: brands.size, totalCLTV } });
}

const CROSS_SELL: Record<string, { from: string; reason: string }[]> = {
  sofy: [
    { from: "mamypoko", reason: "Mom of toddler → likely menstrual hygiene buyer" },
    { from: "lifree", reason: "Caregiver in household → adult also a hygiene customer" },
  ],
  mamypoko: [
    { from: "sofy", reason: "Female menstrual hygiene buyer → likely planning/has young children" },
    { from: "petcare", reason: "Pet-owning household → often young family" },
  ],
  lifree: [
    { from: "sofy", reason: "Adult hygiene buyer → likely in caregiving household" },
    { from: "petcare", reason: "Companion pet often present in elderly households" },
  ],
  petcare: [
    { from: "mamypoko", reason: "Young family demographic overlap" },
    { from: "sofy", reason: "Adult female buyer overlap" },
  ],
};

export type CrossSellOpportunity = {
  personId: string;
  displayName: string;
  ownedBrandSlugs: string[];
  ownedBrandNames: string[];
  missingBrandSlug: string;
  missingBrandName: string;
  reason: string;
  totalCLTV: number;
};

export async function findCrossSellOpportunities(scopedBrandIds: string[], limit = 50): Promise<CrossSellOpportunity[]> {
  const allBrands = await db.brand.findMany();
  const brandBySlug = Object.fromEntries(allBrands.map((b) => [b.slug, b]));

  const persons = await db.person.findMany({
    where: { customers: { some: { brandId: { in: scopedBrandIds } } } },
    include: { customers: { include: { brand: true } } },
    orderBy: { totalCLTV: "desc" },
    take: 500,
  });

  const opps: CrossSellOpportunity[] = [];
  for (const p of persons) {
    const ownedSlugs = new Set(p.customers.map((c) => c.brand.slug));
    for (const slug of ownedSlugs) {
      const candidates = CROSS_SELL[slug] ?? [];
      for (const cand of candidates) {
        if (!ownedSlugs.has(cand.from) && brandBySlug[cand.from]) {
          opps.push({
            personId: p.id,
            displayName: p.displayName,
            ownedBrandSlugs: [...ownedSlugs],
            ownedBrandNames: p.customers.map((c) => c.brand.name),
            missingBrandSlug: cand.from,
            missingBrandName: brandBySlug[cand.from].name,
            reason: cand.reason,
            totalCLTV: p.totalCLTV,
          });
          break;
        }
      }
      if (opps.length >= limit) break;
    }
    if (opps.length >= limit) break;
  }
  return opps;
}

export async function brandOverlapMatrix(brandIds: string[]) {
  const allBrands = await db.brand.findMany();
  const scoped = allBrands.filter((b) => brandIds.includes(b.id));
  const matrix = await Promise.all(
    scoped.map(async (a) => {
      const row = await Promise.all(
        scoped.map(async (b) => {
          if (a.id === b.id) return db.person.count({ where: { customers: { some: { brandId: a.id } } } });
          return db.person.count({
            where: { AND: [{ customers: { some: { brandId: a.id } } }, { customers: { some: { brandId: b.id } } }] },
          });
        }),
      );
      return { brand: { id: a.id, slug: a.slug, name: a.name, color: a.color }, row };
    }),
  );
  return matrix;
}
