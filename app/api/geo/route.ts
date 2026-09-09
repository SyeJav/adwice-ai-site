export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country =
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country") ||
    "";
  return Response.json(
    { country },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
