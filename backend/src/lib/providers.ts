// Messaging provider stubs. Swap for real Meta Cloud API / SES / Firebase.
import { db } from "../db.js";

export async function sendWhatsApp(o: { to: string; templateName: string; vars?: Record<string, string>; customerId: string; brandId: string }) {
  const tpl = await db.whatsAppTemplate.findFirst({ where: { brandId: o.brandId, name: o.templateName } });
  if (!tpl) throw new Error(`Template ${o.templateName} not found`);
  let body = tpl.body;
  for (const [k, v] of Object.entries(o.vars ?? {})) body = body.replaceAll(`{{${k}}}`, v);
  await new Promise((r) => setTimeout(r, 50));
  return db.message.create({
    data: { customerId: o.customerId, channel: "WHATSAPP", direction: "OUT", body, templateId: tpl.id, status: "SENT" },
  });
}

export async function sendEmail(o: { to: string; subject: string; body: string; customerId: string; campaignId?: string }) {
  await new Promise((r) => setTimeout(r, 30));
  return db.message.create({
    data: { customerId: o.customerId, channel: "EMAIL", direction: "OUT", body: `${o.subject}\n\n${o.body}`, campaignId: o.campaignId, status: "SENT" },
  });
}

export async function sendSMS(o: { to: string; body: string; customerId: string; campaignId?: string }) {
  await new Promise((r) => setTimeout(r, 20));
  return db.message.create({
    data: { customerId: o.customerId, channel: "SMS", direction: "OUT", body: o.body, campaignId: o.campaignId, status: "SENT" },
  });
}

export async function sendPush(o: { title: string; body: string; customerId: string; campaignId?: string }) {
  await new Promise((r) => setTimeout(r, 15));
  return db.message.create({
    data: { customerId: o.customerId, channel: "PUSH", direction: "OUT", body: `${o.title}\n${o.body}`, campaignId: o.campaignId, status: "SENT" },
  });
}
