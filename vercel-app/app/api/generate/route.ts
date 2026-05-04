import { envStatus } from "../../../lib/env";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return Response.json(
    {
      ok: false,
      status: "not_configured",
      message:
        "StudioBuild generation will run here after auth, usage limits, and OPENAI_API_KEY are configured on Vercel.",
      received: {
        mode: body?.mode || null,
        projectId: body?.projectId || null,
      },
      env: envStatus(),
    },
    { status: 501 },
  );
}
