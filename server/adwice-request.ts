import { adwiceConfig } from "../config/adwice";
import { resolveAdwiceEnv, type AdwiceEnv } from "../config/adwice-env";
import { adwicePlans } from "../config/adwice-plans";
import { sendAgencyLeadEmail } from "./adwice-email";

export type { AdwiceEnv } from "../config/adwice-env";
type FieldErrors = Record<string, string[]>;
type Currency = "INR" | "USD" | "EUR";
const currencies: readonly Currency[] = ["INR", "USD", "EUR"];
const json = (body: unknown, status: number) => Response.json(body, { status });

function currencyFrom(input: Record<string, unknown>): Currency {
  return typeof input.currency === "string" &&
    currencies.includes(input.currency as Currency)
    ? (input.currency as Currency)
    : "USD";
}

function apiConfigFor(currency: Currency, env: AdwiceEnv) {
  const marketConfig = {
    INR: {
      url: env.ADWICE_INR_API_URL,
      token: env.ADWICE_INR_API_TOKEN,
    },
    USD: {
      url: env.ADWICE_USD_API_URL,
      token: env.ADWICE_USD_API_TOKEN,
    },
    EUR: {
      url: env.ADWICE_EUR_API_URL,
      token: env.ADWICE_EUR_API_TOKEN,
    },
  }[currency];
  return {
    url:
      marketConfig.url ||
      `${(env.ADWICE_API_BASE_URL || adwiceConfig.apiBaseUrl).replace(/\/$/, "")}${env.ADWICE_ACCOUNT_REQUEST_PATH || adwiceConfig.accountRequestPath}`,
    token: marketConfig.token || env.ADWICE_API_TOKEN,
  };
}

function validateAgencyDemo(body: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ["name", "email", "url"] as const) {
    if (typeof body[field] !== "string" || !body[field].trim())
      errors[field] = ["This field is required."];
  }
  if (
    typeof body.email === "string" &&
    body.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  )
    errors.email = ["Enter a valid email address."];
  if (typeof body.url === "string" && body.url.trim()) {
    try {
      const url = new URL(body.url.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      errors.url = ["Enter a valid website URL, including https://."];
    }
  }
  for (const field of ["phone", "message"] as const) {
    if (body[field] != null && typeof body[field] !== "string")
      errors[field] = ["This field must be text."];
  }
  return errors;
}

function validate(body: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ["name", "email", "url"] as const) {
    if (typeof body[field] !== "string" || !body[field].trim())
      errors[field] = ["This field is required."];
  }
  if (
    typeof body.email === "string" &&
    body.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  )
    errors.email = ["Enter a valid email address."];
  if (typeof body.url === "string" && body.url.trim()) {
    try {
      const url = new URL(body.url.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      errors.url = ["Enter a valid website URL, including https://."];
    }
  }
  if (
    body.budget != null &&
    (typeof body.budget !== "number" ||
      !Number.isFinite(body.budget) ||
      body.budget < 0)
  )
    errors.budget = ["Budget must be a positive number."];
  for (const field of [
    "phone",
    "language",
    "country",
    "plan",
    "promotion",
    "requestType",
    "currency",
  ] as const) {
    if (body[field] != null && typeof body[field] !== "string")
      errors[field] = ["This field must be text."];
  }
  if (
    typeof body.plan !== "string" ||
    !adwicePlans.some(({ id }) => id === body.plan)
  ) {
    errors.plan = ["Select a valid advertising plan."];
  }
  if (
    body.requestType != null &&
    body.requestType !== "agency" &&
    body.requestType !== "business"
  )
    errors.requestType = ["Invalid request type."];
  if (
    body.currency != null &&
    (typeof body.currency !== "string" ||
      !currencies.includes(body.currency as Currency))
  )
    errors.currency = ["Select a valid currency."];
  return errors;
}

export async function handleAgencyDemoRequest(
  request: Request,
  bindings: AdwiceEnv,
): Promise<Response> {
  const env = resolveAdwiceEnv(bindings);
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(
      { status: "fail", message: "Invalid JSON request.", code: 400, data: {} },
      400,
    );
  }
  const errors = validateAgencyDemo(input);
  if (Object.keys(errors).length)
    return json(
      {
        status: "fail",
        message: "Please check the highlighted fields.",
        code: 422,
        data: errors,
      },
      422,
    );
  if (
    !env.ADWICE_SMTP_PASSWORD ||
    !env.ADWICE_SMTP_USERNAME ||
    !env.ADWICE_SMTP_FROM_ADDRESS ||
    !env.ADWICE_SMTP_RECIPIENT
  )
    return json(
      { status: "error", message: "Email service is not configured right now." },
      503,
    );
  const lead = {
    name: (input.name as string).trim(),
    email: (input.email as string).trim(),
    url: (input.url as string).trim(),
    phone:
      typeof input.phone === "string" && input.phone.trim()
        ? input.phone.trim()
        : null,
    message:
      typeof input.message === "string" && input.message.trim()
        ? input.message.trim()
        : null,
  };
  try {
    await sendAgencyLeadEmail(lead, env);
    return json(
      { status: "success", message: "Your agency request was received." },
      200,
    );
  } catch (error) {
    console.error("Agency lead email could not be sent.", error);
    return json(
      { status: "error", message: "We couldn't send your request right now." },
      502,
    );
  }
}

export async function handleAdwiceRequest(
  request: Request,
  bindings: AdwiceEnv,
): Promise<Response> {
  const env = resolveAdwiceEnv(bindings);
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(
      { status: "fail", message: "Invalid JSON request.", code: 400, data: {} },
      400,
    );
  }
  const errors = validate(input);
  if (Object.keys(errors).length)
    return json(
      {
        status: "fail",
        message: "Please check the highlighted fields.",
        code: 422,
        data: errors,
      },
      422,
    );
  const payload = {
    name: (input.name as string).trim(),
    email: (input.email as string).trim(),
    url: (input.url as string).trim(),
    phone:
      typeof input.phone === "string" && input.phone.trim()
        ? input.phone.trim()
        : null,
    budget: typeof input.budget === "number" ? input.budget : null,
    language:
      typeof input.language === "string" && input.language.trim()
        ? input.language.trim()
        : null,
    plan:
      typeof input.plan === "string" && input.plan.trim()
        ? input.plan.trim()
        : null,
    promotion:
      typeof input.promotion === "string" && input.promotion.trim()
        ? input.promotion.trim()
        : null,
    ...(typeof input.country === "string" && input.country.trim()
      ? { country: input.country.trim().toLowerCase() }
      : {}),
    ...(input.requestType === "agency" || input.requestType === "business"
      ? { requestType: input.requestType }
      : {}),
  };

  try {
    const apiConfig = apiConfigFor(currencyFrom(input), env);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (apiConfig.token) headers.Authorization = `Bearer ${apiConfig.token}`;
    const upstream = await fetch(apiConfig.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => null);
    if (upstream.status === 422 && data && typeof data === "object")
      return json(data, 422);
    if (!upstream.ok || !data || typeof data !== "object")
      return json(
        {
          status: "error",
          message: "We couldn't submit your request right now.",
        },
        502,
      );
    return json(data, upstream.status);
  } catch {
    return json(
      {
        status: "error",
        message:
          "We couldn't reach Adwice right now. Please try again shortly.",
      },
      502,
    );
  }
}
