import { envStatus } from "../../../lib/env";

export function GET() {
  return Response.json({
    ok: true,
    service: "studiobuild-vercel",
    checkedAt: new Date().toISOString(),
    env: envStatus(),
  });
}
