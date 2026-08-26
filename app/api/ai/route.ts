export async function POST() {
  return Response.json(
    { error: 'This deployment uses local no-API mode. External AI endpoints are disabled.' },
    { status: 410 },
  )
}
