import nodemailer from "nodemailer";
import { adwiceConfig } from "../config/adwice";
import type { AdwiceEnv } from "../config/adwice-env";

export interface AgencyLead {
  name: string;
  email: string;
  url: string;
  phone: string | null;
  message: string | null;
}

export async function sendAgencyLeadEmail(
  lead: AgencyLead,
  env: AdwiceEnv,
): Promise<void> {
  const smtp = {
    host: env.ADWICE_SMTP_HOST || adwiceConfig.email.host,
    port: Number(env.ADWICE_SMTP_PORT) || adwiceConfig.email.port,
    secure: env.ADWICE_SMTP_SECURE === "true",
    requireTls:
      env.ADWICE_SMTP_REQUIRE_TLS == null
        ? adwiceConfig.email.requireTls
        : env.ADWICE_SMTP_REQUIRE_TLS === "true",
    username: env.ADWICE_SMTP_USERNAME || adwiceConfig.email.username,
    password: env.ADWICE_SMTP_PASSWORD!,
    address: env.ADWICE_SMTP_FROM_ADDRESS || adwiceConfig.email.address,
    name: env.ADWICE_SMTP_FROM_NAME || adwiceConfig.email.name,
    recipient: env.ADWICE_SMTP_RECIPIENT || adwiceConfig.email.recipient,
  };
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    requireTLS: smtp.requireTls,
    auth: { user: smtp.username, pass: smtp.password },
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
      detail("Message", lead.message),
    ].join("\n"),
  });
}
