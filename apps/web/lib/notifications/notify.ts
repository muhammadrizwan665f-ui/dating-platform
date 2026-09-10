import { prisma } from "@/lib/db/prisma";
import { emitToUser } from "@/lib/realtime/emit";

/**
 * Central notification entry point. Always writes the in-app notification
 * (durable, drives the notification center + badge), then pushes a realtime
 * event if the user is connected. Email/SMS fan-out plugs in here later
 * (phase 46) behind the same function signature — callers never change.
 */
export async function notify(userId: string, type: string, payload: Record<string, unknown>) {
  const notification = await prisma.notification.create({
    data: { userId, type, payload },
  });
  emitToUser(userId, "notification:new", notification);
  // TODO(phase 8+): dispatch to email/SMS provider based on user + admin settings
  return notification;
}
