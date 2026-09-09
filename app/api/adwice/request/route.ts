import { handleAdwiceRequest } from "../../../../worker/adwice-request";
import { getNodeAdwiceEnv } from "../../adwice-env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleAdwiceRequest(request, getNodeAdwiceEnv());
}
