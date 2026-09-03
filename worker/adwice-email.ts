import nodemailer from "nodemailer";
import { adwiceConfig } from "../config/adwice";

export interface AgencyLead {
  name: string;
  email: string;
  url: string;
  phone: string | null;
  budget: number | null;
  language: string | null;
  plan: string | null;
  promotion: string | null;
}

export async function sendAgencyLeadEmail(
  lead: AgencyLead,
  password: string,
): Promise<void> {
  const smtp = adwiceConfig.email;
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: false,
    requireTLS: true,
    auth: { user: smtp.username, pass: password },
  });

  const detail = (label: string, value: string | number | null) =>
    `${label}: ${value ?? "—"}`;
  await transporter.sendMail({
    from: { name: smtp.name, address: smtp.address },
    to: smtp.recipient,
    replyTo: { name: lead.name, address: lead.email },
    envelope: { from: smtp.username, to: smtp.recipient },
    subject: `Agency contact request from ${lead.name}`,
    text: [
      "A new agency contact request was submitted.",
      "",
      detail("Name", lead.name),
      detail("Email", lead.email),
      detail("Website", lead.url),
      detail("Phone", lead.phone),
      detail("Budget", lead.budget),
      detail("Language", lead.language),
      detail("Plan", lead.plan),
      detail("Promotion", lead.promotion),
    ].join("\n"),
  });
}
