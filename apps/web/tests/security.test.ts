import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    conversation: { findUnique: vi.fn() },
    block: { findFirst: vi.fn(async () => null) },
    message: { create: vi.fn(), findMany: vi.fn(async () => []) },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: vi.fn(),
  requireRole: vi.fn(),
}));
vi.mock("@/lib/notifications/notify", () => ({ notify: vi.fn() }));
vi.mock("@/lib/realtime/emit", () => ({ emitToUser: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId, requireRole } from "@/lib/auth/session";
import { GET as getMessages, POST as postMessage } from "../app/api/chat/messages/route";
import { PATCH as adminApprovePayment } from "../app/api/admin/payments/[id]/route";

function req(body?: unknown, url = "http://localhost/api") {
  return { json: async () => body, url } as any;
}

describe("chat authorization", () => {
  it("rejects unauthenticated requests", async () => {
    (getCurrentUserId as any).mockResolvedValueOnce(null);
    const res = await postMessage(req({ conversationId: "c1", body: "hi" }));
    expect(res.status).toBe(401);
  });

  it("rejects access to a conversation the user is not a participant of", async () => {
    (getCurrentUserId as any).mockResolvedValueOnce("userC");
    (prisma.conversation.findUnique as any).mockResolvedValueOnce({
      id: "c1",
      user1Id: "userA",
      user2Id: "userB",
    });
    const res = await postMessage(req({ conversationId: "c1", body: "hi" }));
    expect(res.status).toBe(404);
  });

  it("allows a genuine participant to send a message", async () => {
    (getCurrentUserId as any).mockResolvedValueOnce("userA");
    (prisma.conversation.findUnique as any).mockResolvedValueOnce({
      id: "c1",
      user1Id: "userA",
      user2Id: "userB",
    });
    (prisma.message.create as any).mockResolvedValueOnce({ id: "m1", body: "hi" });
    const res = await postMessage(req({ conversationId: "c1", body: "hi" }));
    expect(res.status).toBe(201);
  });

  it("rejects reading a conversation's history without authorization", async () => {
    (getCurrentUserId as any).mockResolvedValueOnce("userC");
    (prisma.conversation.findUnique as any).mockResolvedValueOnce({
      id: "c1",
      user1Id: "userA",
      user2Id: "userB",
    });
    const res = await getMessages(req(undefined, "http://localhost/api?conversationId=c1"));
    expect(res.status).toBe(404);
  });
});

describe("admin endpoint protection", () => {
  it("rejects a non-admin attempting to approve a payment", async () => {
    (requireRole as any).mockResolvedValueOnce(null); // requireRole returns null when role check fails
    const res = await adminApprovePayment(req({ action: "APPROVE" }), { params: { id: "p1" } });
    expect(res.status).toBe(403);
  });
});
