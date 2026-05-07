export function GET() {
  return Response.json({
    ok: true,
    service: "miseforge-app",
    checkedAt: new Date().toISOString(),
  });
}
