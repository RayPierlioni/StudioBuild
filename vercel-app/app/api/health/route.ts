export function GET() {
  return Response.json({
    ok: true,
    service: "studiobuild-app",
    checkedAt: new Date().toISOString(),
  });
}
