/**
 * The Next.js app is stateless/serverless and cannot hold WebSocket
 * connections itself, so realtime delivery is delegated to the sidecar
 * Socket.IO server (apps/realtime) over an internal HTTP call. The DB
 * write always happens first (source of truth); this is best-effort
 * push on top of it, so a failure here must never fail the request.
 */
export async function emitToUser(userId: string, event: string, payload: unknown) {
  try {
    await fetch(`${process.env.REALTIME_INTERNAL_URL}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.REALTIME_INTERNAL_SECRET ?? "",
      },
      body: JSON.stringify({ userId, event, payload }),
    });
  } catch (err) {
    console.error("realtime emit failed", err);
  }
}
