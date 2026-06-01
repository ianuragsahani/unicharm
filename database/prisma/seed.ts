import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const BRANDS = [
  { slug: "sofy", name: "Sofy", color: "#E91E63" },
  { slug: "mamypoko", name: "Mamy Poko Pants", color: "#03A9F4" },
  { slug: "lifree", name: "Lifree", color: "#9C27B0" },
  { slug: "petcare", name: "Pet Care", color: "#FF9800" },
];

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];
const FIRST = ["Priya", "Ananya", "Rohit", "Aarav", "Neha", "Vikram", "Sneha", "Arjun", "Pooja", "Kavya", "Rahul", "Divya", "Karan", "Riya", "Sanjay"];
const LAST = ["Sharma", "Verma", "Patel", "Kumar", "Singh", "Iyer", "Reddy", "Joshi", "Mehta", "Nair"];

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

async function main() {
  console.log("🌱 Seeding...");

  await db.$transaction([
    db.redemption.deleteMany(),
    db.loyaltyAccount.deleteMany(),
    db.loyaltyTier.deleteMany(),
    db.message.deleteMany(),
    db.whatsAppTemplate.deleteMany(),
    db.segmentMember.deleteMany(),
    db.segment.deleteMany(),
    db.campaign.deleteMany(),
    db.journey.deleteMany(),
    db.order.deleteMany(),
    db.event.deleteMany(),
    db.consent.deleteMany(),
    db.customer.deleteMany(),
    db.person.deleteMany(),
    db.auditLog.deleteMany(),
    db.brandAccess.deleteMany(),
    db.brand.deleteMany(),
    db.user.deleteMany(),
  ]);

  const brands = await Promise.all(BRANDS.map((b) => db.brand.create({ data: b })));
  const bySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));

  const admin = await db.user.create({
    data: {
      email: "admin@unicharm.in",
      name: "Joy Admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "SUPER_ADMIN",
      brandAccess: { create: brands.map((b) => ({ brandId: b.id })) },
    },
  });

  const sofyMgr = await db.user.create({
    data: {
      email: "sofy.manager@unicharm.in",
      name: "Sofy Manager",
      passwordHash: await bcrypt.hash("sofy123", 10),
      role: "BRAND_ADMIN",
      brandAccess: { create: [{ brandId: bySlug.sofy.id }] },
    },
  });

  const analyst = await db.user.create({
    data: {
      email: "analyst@unicharm.in",
      name: "Analyst Anika",
      passwordHash: await bcrypt.hash("analyst123", 10),
      role: "ANALYST",
      brandAccess: { create: brands.map((b) => ({ brandId: b.id })) },
    },
  });

  // Loyalty tiers per brand
  for (const b of brands) {
    await db.loyaltyTier.createMany({
      data: [
        { brandId: b.id, name: "Bronze", minPoints: 0, perks: JSON.stringify(["Welcome offer"]), order: 1 },
        { brandId: b.id, name: "Silver", minPoints: 500, perks: JSON.stringify(["5% off", "Birthday gift"]), order: 2 },
        { brandId: b.id, name: "Gold", minPoints: 2000, perks: JSON.stringify(["10% off", "Free shipping", "Early access"]), order: 3 },
        { brandId: b.id, name: "Platinum", minPoints: 5000, perks: JSON.stringify(["15% off", "Free shipping", "Priority support", "Exclusive drops"]), order: 4 },
      ],
    });
  }

  // WhatsApp templates
  for (const b of brands) {
    await db.whatsAppTemplate.createMany({
      data: [
        { brandId: b.id, name: "welcome_v1", category: "MARKETING", body: `Hi {{name}}! Welcome to ${b.name}. Use code WELCOME10 for 10% off.` },
        { brandId: b.id, name: "winback_v1", category: "MARKETING", body: `We miss you {{name}}! Come back to ${b.name} — 20% off awaits.` },
        { brandId: b.id, name: "order_confirm", category: "UTILITY", body: `Order {{order_id}} confirmed. Tracking: {{tracking_url}}` },
        { brandId: b.id, name: "otp_login", category: "AUTHENTICATION", body: `Your ${b.name} OTP is {{otp}}. Valid 5 min.` },
      ],
    });
  }

  // Plan persons first. ~30% of persons span 2-3 brands (cross-sell pool).
  const PERSONS_TOTAL = 140;
  const personPlan: { name: string; email: string; phone: string; city: string; gender: string; ageBand: string; brandSlugs: string[] }[] = [];
  for (let i = 0; i < PERSONS_TOTAL; i++) {
    const name = `${rand(FIRST)} ${rand(LAST)}`;
    const email = `${name.toLowerCase().replace(/ /g, ".")}${i}@example.com`;
    const phone = `+9198${String(10000000 + i).padStart(8, "0")}`;
    let brandCount = 1;
    const r = Math.random();
    if (r > 0.85) brandCount = 3;
    else if (r > 0.6) brandCount = 2;
    const shuffled = [...brands].sort(() => Math.random() - 0.5).slice(0, brandCount);
    personPlan.push({
      name, email, phone,
      city: rand(CITIES),
      gender: rand(["F", "M", "F", "F"]),
      ageBand: rand(["18-24", "25-34", "25-34", "35-44", "45-54"]),
      brandSlugs: shuffled.map((b) => b.slug),
    });
  }

  // Customers (linked to Person, one per brand-membership)
  const customers: { id: string; brandId: string }[] = [];
  let custIdx = 0;
  for (const p of personPlan) {
    const person = await db.person.create({
      data: {
        primaryEmail: p.email.toLowerCase(),
        primaryPhone: p.phone.replace(/\D/g, "").replace(/^91/, ""),
        displayName: p.name,
      },
    });

    for (const slug of p.brandSlugs) {
      const brand = bySlug[slug];
      const orders = Math.floor(between(0, 20));
      const cltv = orders * between(300, 1500);
      const churn = Math.random();
      const lifecycle = orders === 0 ? "NEW" : churn > 0.85 ? "CHURNED" : churn > 0.7 ? "AT_RISK" : cltv > 8000 ? "VIP" : "ACTIVE";

      const c = await db.customer.create({
        data: {
          brandId: brand.id,
          personId: person.id,
          externalId: `EXT-${1000 + custIdx}`,
          name: p.name,
          email: p.email,
          phone: p.phone,
          city: p.city,
          state: "MH",
          gender: p.gender,
          ageBand: p.ageBand,
          source: rand(["website", "app", "whatsapp", "offline"]),
          lifecycle,
          cltv,
          totalOrders: orders,
          lastOrderAt: orders ? daysAgo(Math.floor(between(0, 180))) : null,
          churnScore: parseFloat(churn.toFixed(3)),
          consent: {
            create: {
              email: Math.random() > 0.2,
              sms: Math.random() > 0.3,
              whatsapp: Math.random() > 0.15,
              push: Math.random() > 0.4,
            },
          },
        },
      });
      customers.push({ id: c.id, brandId: c.brandId });
      custIdx++;
      await seedCustomerActivity(c.id, orders, cltv);
    }

    // Refresh Person aggregates
    const linked = await db.customer.findMany({ where: { personId: person.id }, select: { brandId: true, cltv: true } });
    const totalCLTV = linked.reduce((a, x) => a + x.cltv, 0);
    const brandCount = new Set(linked.map((x) => x.brandId)).size;
    await db.person.update({ where: { id: person.id }, data: { totalCLTV, brandCount } });
  }

  // Segments — one per brand
  for (const b of brands) {
    const vipRule = JSON.stringify({ all: [{ field: "lifecycle", op: "eq", value: "VIP" }] });
    const atRiskRule = JSON.stringify({ all: [{ field: "lifecycle", op: "eq", value: "AT_RISK" }] });
    const newRule = JSON.stringify({ all: [{ field: "lifecycle", op: "eq", value: "NEW" }] });

    const vipCount = await db.customer.count({ where: { brandId: b.id, lifecycle: "VIP" } });
    const atRiskCount = await db.customer.count({ where: { brandId: b.id, lifecycle: "AT_RISK" } });
    const newCount = await db.customer.count({ where: { brandId: b.id, lifecycle: "NEW" } });

    await db.segment.createMany({
      data: [
        { brandId: b.id, name: `${b.name} VIPs`, description: "Top spenders, high CLTV", rules: vipRule, size: vipCount },
        { brandId: b.id, name: `${b.name} At-Risk`, description: "Lapsing in 30d", rules: atRiskRule, size: atRiskCount },
        { brandId: b.id, name: `${b.name} New (0 orders)`, description: "Onboarding cohort", rules: newRule, size: newCount },
      ],
    });
  }

  // Campaigns
  for (const b of brands) {
    const segs = await db.segment.findMany({ where: { brandId: b.id } });
    await db.campaign.createMany({
      data: [
        {
          brandId: b.id, name: `${b.name} – Welcome flow`, channel: "WHATSAPP", status: "RUNNING",
          segmentId: segs[2]?.id, subject: "Welcome!", body: "Use WELCOME10 for 10% off",
          sent: 423, opened: 312, clicked: 145, converted: 38, revenue: 28400,
          startedAt: daysAgo(20),
        },
        {
          brandId: b.id, name: `${b.name} – Winback`, channel: "EMAIL", status: "COMPLETED",
          segmentId: segs[1]?.id, subject: "We miss you", body: "20% off — come back",
          sent: 1240, opened: 612, clicked: 198, converted: 72, revenue: 84600,
          startedAt: daysAgo(45), completedAt: daysAgo(40),
        },
        {
          brandId: b.id, name: `${b.name} – VIP Drop`, channel: "PUSH", status: "SCHEDULED",
          segmentId: segs[0]?.id, subject: "Exclusive drop", body: "First-access launch",
          scheduledAt: daysAgo(-3),
        },
      ],
    });
  }

  // Journeys — full lifecycle set per brand. Node configs are populated so the
  // journey engine (backend/src/services/journey-engine.ts) can execute them.
  for (const b of brands) {
    const segs = await db.segment.findMany({ where: { brandId: b.id } });
    const vipSeg = segs.find((s) => s.name.includes("VIP"));
    const atRiskSeg = segs.find((s) => s.name.includes("At-Risk"));

    const journeys = [
      {
        name: `${b.name} – Onboarding`,
        trigger: "EVENT",
        triggerConfig: { event: "signup" },
        status: "ACTIVE", runs: 1240, conversions: 312,
        graph: {
          nodes: [
            { id: "n1", type: "trigger", label: "Signup", x: 60, y: 80, config: { event: "signup" } },
            { id: "n2", type: "wait", label: "Wait 1h", x: 260, y: 80, config: { amount: 1, unit: "hours" } },
            { id: "n3", type: "message", label: "WhatsApp: welcome_v1", x: 460, y: 80, config: { channel: "WHATSAPP", templateName: "welcome_v1" } },
            { id: "n4", type: "branch", label: "Opened?", x: 660, y: 80, config: { field: "lastMessageOpened", op: "eq", value: "true" } },
            { id: "n5", type: "message", label: "Email: welcome offer", x: 860, y: 20, config: { channel: "EMAIL", subject: "A welcome gift", body: "Use WELCOME10 for 10% off your first order." } },
            { id: "n6", type: "wait", label: "Wait 2d", x: 860, y: 140, config: { amount: 2, unit: "days" } },
          ],
          edges: [
            { id: "e1", from: "n1", to: "n2" },
            { id: "e2", from: "n2", to: "n3" },
            { id: "e3", from: "n3", to: "n4" },
            { id: "e4", from: "n4", to: "n5", label: "yes" },
            { id: "e5", from: "n4", to: "n6", label: "no" },
          ],
        },
      },
      {
        name: `${b.name} – Abandoned Cart Recovery`,
        trigger: "EVENT",
        triggerConfig: { event: "abandon_cart" },
        status: "ACTIVE", runs: 860, conversions: 173,
        graph: {
          nodes: [
            { id: "n1", type: "trigger", label: "Cart abandoned", x: 60, y: 80, config: { event: "abandon_cart" } },
            { id: "n2", type: "wait", label: "Wait 1h", x: 260, y: 80, config: { amount: 1, unit: "hours" } },
            { id: "n3", type: "message", label: "WhatsApp: reminder", x: 460, y: 80, config: { channel: "WHATSAPP", templateName: "welcome_v1" } },
            { id: "n4", type: "branch", label: "Purchased?", x: 660, y: 80, config: { field: "totalOrders", op: "gt", value: "0" } },
            { id: "n5", type: "message", label: "SMS: last-chance offer", x: 860, y: 140, config: { channel: "SMS", body: "Still thinking it over? Your cart is waiting — 10% off if you check out today." } },
          ],
          edges: [
            { id: "e1", from: "n1", to: "n2" },
            { id: "e2", from: "n2", to: "n3" },
            { id: "e3", from: "n3", to: "n4" },
            { id: "e4", from: "n4", to: "n5", label: "no" },
          ],
        },
      },
      {
        name: `${b.name} – Win-Back (At-Risk)`,
        trigger: "SEGMENT_ENTRY",
        triggerConfig: { segmentId: atRiskSeg?.id ?? "" },
        status: "ACTIVE", runs: 540, conversions: 96,
        graph: {
          nodes: [
            { id: "n1", type: "trigger", label: "Enters At-Risk", x: 60, y: 80, config: { segmentId: atRiskSeg?.id ?? "" } },
            { id: "n2", type: "message", label: "WhatsApp: winback_v1", x: 260, y: 80, config: { channel: "WHATSAPP", templateName: "winback_v1" } },
            { id: "n3", type: "wait", label: "Wait 3d", x: 460, y: 80, config: { amount: 3, unit: "days" } },
            { id: "n4", type: "branch", label: "Recovered?", x: 660, y: 80, config: { field: "churnScore", op: "lt", value: "0.7" } },
            { id: "n5", type: "message", label: "Email: deeper offer", x: 860, y: 140, config: { channel: "EMAIL", subject: "We really miss you", body: "Here's 20% off to come back to " + b.name + "." } },
          ],
          edges: [
            { id: "e1", from: "n1", to: "n2" },
            { id: "e2", from: "n2", to: "n3" },
            { id: "e3", from: "n3", to: "n4" },
            { id: "e4", from: "n4", to: "n5", label: "no" },
          ],
        },
      },
      {
        name: `${b.name} – Post-Purchase Nurture`,
        trigger: "EVENT",
        triggerConfig: { event: "purchase" },
        status: "ACTIVE", runs: 2110, conversions: 388,
        graph: {
          nodes: [
            { id: "n1", type: "trigger", label: "Purchase", x: 60, y: 80, config: { event: "purchase" } },
            { id: "n2", type: "message", label: "WhatsApp: order_confirm", x: 260, y: 80, config: { channel: "WHATSAPP", templateName: "order_confirm" } },
            { id: "n3", type: "wait", label: "Wait 7d", x: 460, y: 80, config: { amount: 7, unit: "days" } },
            { id: "n4", type: "message", label: "Push: cross-sell", x: 660, y: 80, config: { channel: "PUSH", subject: "Picked for you", body: "Items that pair well with your last order." } },
          ],
          edges: [
            { id: "e1", from: "n1", to: "n2" },
            { id: "e2", from: "n2", to: "n3" },
            { id: "e3", from: "n3", to: "n4" },
          ],
        },
      },
      {
        name: `${b.name} – Reactivation (Dormant)`,
        trigger: "SCHEDULE",
        triggerConfig: { schedule: "0 9 * * *" },
        status: "PAUSED", runs: 0, conversions: 0,
        graph: {
          nodes: [
            { id: "n1", type: "trigger", label: "Daily 9 AM", x: 60, y: 80, config: { schedule: "0 9 * * *" } },
            { id: "n2", type: "branch", label: "Churned?", x: 260, y: 80, config: { field: "lifecycle", op: "eq", value: "CHURNED" } },
            { id: "n3", type: "message", label: "Email: come back", x: 460, y: 20, config: { channel: "EMAIL", subject: "It's been a while", body: "A lot has changed at " + b.name + ". Here's 25% off to take a look." } },
          ],
          edges: [
            { id: "e1", from: "n1", to: "n2" },
            { id: "e2", from: "n2", to: "n3", label: "yes" },
          ],
        },
      },
      {
        name: `${b.name} – VIP Nurture`,
        trigger: "SEGMENT_ENTRY",
        triggerConfig: { segmentId: vipSeg?.id ?? "" },
        status: "ACTIVE", runs: 312, conversions: 141,
        graph: {
          nodes: [
            { id: "n1", type: "trigger", label: "Enters VIP", x: 60, y: 80, config: { segmentId: vipSeg?.id ?? "" } },
            { id: "n2", type: "message", label: "WhatsApp: thank you", x: 260, y: 80, config: { channel: "WHATSAPP", templateName: "welcome_v1" } },
            { id: "n3", type: "wait", label: "Wait 30d", x: 460, y: 80, config: { amount: 30, unit: "days" } },
            { id: "n4", type: "message", label: "Push: early access", x: 660, y: 80, config: { channel: "PUSH", subject: "VIP early access", body: "Shop the new drop 24h before everyone else." } },
          ],
          edges: [
            { id: "e1", from: "n1", to: "n2" },
            { id: "e2", from: "n2", to: "n3" },
            { id: "e3", from: "n3", to: "n4" },
          ],
        },
      },
    ];

    for (const j of journeys) {
      await db.journey.create({
        data: {
          brandId: b.id,
          name: j.name,
          trigger: j.trigger,
          triggerConfig: JSON.stringify(j.triggerConfig),
          graph: JSON.stringify(j.graph),
          status: j.status,
          runs: j.runs,
          conversions: j.conversions,
        },
      });
    }
  }

  // Audit
  await db.auditLog.create({ data: { userId: admin.id, action: "system.seed", metadata: JSON.stringify({ note: "Initial seed" }) } });

  const personCount = await db.person.count();
  const multiBrand = await db.person.count({ where: { brandCount: { gt: 1 } } });
  console.log(`✅ Seeded ${brands.length} brands, ${personCount} persons (${multiBrand} multi-brand), ${customers.length} customer-profiles. Users: ${[admin.email, sofyMgr.email, analyst.email].join(", ")}`);
}

async function seedCustomerActivity(customerId: string, orders: number, cltv: number) {
  // Orders
  for (let o = 0; o < orders; o++) {
    await db.order.create({
      data: {
        customerId,
        amount: between(200, 2500),
        items: Math.floor(between(1, 5)),
        channel: rand(["web", "app", "offline"]),
        createdAt: daysAgo(Math.floor(between(0, 180))),
      },
    });
  }
  // Events
  const evCount = Math.floor(between(5, 40));
  for (let e = 0; e < evCount; e++) {
    await db.event.create({
      data: {
        customerId,
        type: rand(["page_view", "add_to_cart", "purchase", "app_open", "email_open", "whatsapp_click", "search"]),
        occurredAt: daysAgo(Math.floor(between(0, 90))),
      },
    });
  }
  // Loyalty
  const points = Math.floor(cltv / 10);
  const tier = points >= 5000 ? "Platinum" : points >= 2000 ? "Gold" : points >= 500 ? "Silver" : "Bronze";
  await db.loyaltyAccount.create({
    data: {
      customerId,
      points,
      tier,
      totalEarned: points + Math.floor(between(0, 500)),
      totalRedeemed: Math.floor(between(0, 300)),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
