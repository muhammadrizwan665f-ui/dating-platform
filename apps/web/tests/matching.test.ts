import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma singleton so this test exercises the matching route's logic
// without needing a real database — swap for an integration test against a
// throwaway Postgres instance before shipping to production.
vi.mock("@/lib/db/prisma", () => {
  const likes = new Map<string, { fromUserId: string; toUserId: string }>();
  const matches = new Map<string, { user1Id: string; user2Id: string }>();
  return {
    prisma: {
      like: {
        upsert: vi.fn(async ({ where, create }: any) => {
          const key = `${where.fromUserId_toUserId.fromUserId}:${where.fromUserId_toUserId.toUserId}`;
          if (!likes.has(key)) likes.set(key, create);
          return likes.get(key);
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          const key = `${where.fromUserId_toUserId.fromUserId}:${where.fromUserId_toUserId.toUserId}`;
          return likes.get(key) ?? null;
        }),
      },
      match: {
        upsert: vi.fn(async ({ where, create }: any) => {
          const key = `${where.user1Id_user2Id.user1Id}:${where.user1Id_user2Id.user2Id}`;
          if (!matches.has(key)) matches.set(key, { id: key, ...create });
          return matches.get(key);
        }),
      },
      block: { findFirst: vi.fn(async () => null) },
      __matches: matches,
      __likes: likes,
    },
  };
});
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/notifications/notify", () => ({ notify: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { POST as likeRoute } from "../app/api/discover/like/route";

function mockRequest(body: unknown) {
  return { json: async () => body } as any;
}

describe("discover/like — matching logic", () => {
  beforeEach(() => {
    (prisma as any).__matches.clear();
    (prisma as any).__likes.clear();
  });

  it("creates a match only once both users have liked each other", async () => {
    (getCurrentUserId as any).mockResolvedValueOnce("userA");
    const first = await likeRoute(mockRequest({ toUserId: "userB" }));
    expect((await first.json()).matched).toBe(false);

    (getCurrentUserId as any).mockResolvedValueOnce("userB");
    const second = await likeRoute(mockRequest({ toUserId: "userA" }));
    expect((await second.json()).matched).toBe(true);
  });

  it("is idempotent — liking the same profile twice does not error or duplicate", async () => {
    (getCurrentUserId as any).mockResolvedValue("userA");
    await likeRoute(mockRequest({ toUserId: "userB" }));
    const res = await likeRoute(mockRequest({ toUserId: "userB" }));
    expect(res.status).not.toBe(500);
    expect((prisma as any).__likes.size).toBe(1);
  });

  it("rejects a user liking their own profile", async () => {
    (getCurrentUserId as any).mockResolvedValueOnce("userA");
    const res = await likeRoute(mockRequest({ toUserId: "userA" }));
    expect(res.status).toBe(400);
  });
});
