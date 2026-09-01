import { adwiceConfig } from "../config/adwice";
import { adwicePlans } from "../config/adwice-plans";
import { sendAgencyLeadEmail } from "./adwice-email";

export interface AdwiceEnv {
  ADWICE_API_BASE_URL?: string;
  ADWICE_SMTP_PASSWORD?: string;
}
type FieldErrors = Record<string, string[]>;
const json = (body: unknown, status: number) => Response.json(body, { status });

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
  for (const field of ["phone", "language", "plan", "promotion"] as const) {
    if (body[field] != null && typeof body[field] !== "string")
      errors[field] = ["This field must be text."];
  }
  if (
    typeof body.plan !== "string" ||
    !adwicePlans.some(({ id }) => id === body.plan)
  ) {
    errors.plan = ["Select a valid advertising plan."];
  }
  return errors;
}

export async function handleAdwiceRequest(
  request: Request,
  env: AdwiceEnv,
): Promise<Response> {
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
    plan: (input.plan as string).trim(),
    promotion:
      typeof input.promotion === "string" && input.promotion.trim()
        ? input.promotion.trim()
        : null,
  };
  try {
    const baseUrl = (
      env.ADWICE_API_BASE_URL || adwiceConfig.apiBaseUrl
    ).replace(/\/$/, "");
    const upstream = await fetch(
      `${baseUrl}${adwiceConfig.accountRequestPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
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
    if (
      upstream.ok &&
      (data as { status?: unknown }).status === "success" &&
      env.ADWICE_SMTP_PASSWORD
    ) {
      await sendAgencyLeadEmail(payload, env.ADWICE_SMTP_PASSWORD);
    }
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
