import { describe, expect, it } from "vitest";
import {
  createReviewFeedHandler,
  createReviewReplyHandler,
  createReviewStore,
  parseReviewCursor,
  REVIEW_BODY_LIMIT,
  type QmapsReview,
} from "../../supabase/functions/_shared/takatak-reviews";

const client = "11111111-1111-4111-8111-111111111111";
const otherClient = "22222222-2222-4222-8222-222222222222";
const business = "33333333-3333-4333-8333-333333333333";
const otherBusiness = "44444444-4444-4444-8444-444444444444";
const reviewId = (number: number) =>
  `55555555-5555-4555-8555-${String(number).padStart(12, "0")}`;
const time = "2026-10-01T12:00:00.123456+00:00";
type Row = Record<string, unknown>;
const review = (number: number, overrides: Row = {}) => ({
  id: reviewId(number),
  business_id: business,
  rating: 4,
  body: `Synthetic review ${number}`,
  created_at: time,
  updated_at: time,
  owner_reply: null,
  owner_replied_at: null,
  moderation_status: "visible",
  hidden_at: null,
  user_id: "private-member",
  hidden_reason: "private-reason",
  ...overrides,
});
function fixture() {
  const tables: Record<string, Row[]> = {
    businesses: [
      { id: business, takatak_client_id: client, is_active: true },
      { id: otherBusiness, takatak_client_id: otherClient, is_active: true },
    ],
    reviews: [
      review(1),
      review(2, { moderation_status: "trusted" }),
      review(3, { moderation_status: "hidden" }),
      review(4, { moderation_status: "needs_review" }),
      review(5, { hidden_at: time }),
      review(6, { business_id: otherBusiness }),
    ],
  };
  const calls: Array<{ table: string; operation: string; args: unknown[] }> =
    [];
  let fail = false;
  class Query {
    predicates: Array<(row: Row) => boolean> = [];
    orders: Array<{ column: string; ascending: boolean }> = [];
    columns = "";
    take: number | null = null;
    single = false;
    updateData: Row | null = null;
    constructor(readonly table: string) {
      calls.push({ table, operation: "from", args: [] });
    }
    call(operation: string, args: unknown[]) {
      calls.push({ table: this.table, operation, args });
      return this;
    }
    select(columns: string) {
      this.columns = columns;
      return this.call("select", [columns]);
    }
    eq(column: string, value: unknown) {
      this.predicates.push((row) => row[column] === value);
      return this.call("eq", [column, value]);
    }
    in(column: string, values: unknown[]) {
      this.predicates.push((row) => values.includes(row[column]));
      return this.call("in", [column, values]);
    }
    is(column: string, value: unknown) {
      this.predicates.push((row) => row[column] === value);
      return this.call("is", [column, value]);
    }
    order(column: string, options: { ascending: boolean }) {
      this.orders.push({ column, ...options });
      return this.call("order", [column, options]);
    }
    limit(take: number) {
      this.take = take;
      return this.call("limit", [take]);
    }
    update(data: Row) {
      this.updateData = data;
      return this.call("update", [data]);
    }
    maybeSingle() {
      this.single = true;
      return this.call("maybeSingle", []);
    }
    or(filter: string) {
      const match =
        /^created_at\.lt\.(.+),and\(created_at\.eq\.(.+),id\.lt\.([a-f0-9-]+)\)$/.exec(
          filter,
        );
      if (!match || match[1] !== match[2]) throw new Error("unsafe filter");
      this.predicates.push(
        (row) =>
          String(row.created_at) < match[1] ||
          (row.created_at === match[1] && String(row.id) < match[3]),
      );
      return this.call("or", [filter]);
    }
    execute() {
      if (fail)
        return { data: null, error: { message: "private-database-error" } };
      let rows = tables[this.table].filter((row) =>
        this.predicates.every((predicate) => predicate(row)),
      );
      rows = rows.sort((a, b) => {
        for (const order of this.orders) {
          const compared = String(a[order.column]).localeCompare(
            String(b[order.column]),
          );
          if (compared) return order.ascending ? compared : -compared;
        }
        return 0;
      });
      if (this.take !== null) rows = rows.slice(0, this.take);
      if (this.updateData)
        for (const row of rows) Object.assign(row, this.updateData);
      const selected = rows.map((row) =>
        Object.fromEntries(
          this.columns.split(",").map((column) => [column, row[column]]),
        ),
      );
      return {
        data: this.single ? (selected[0] ?? null) : selected,
        error: null,
      };
    }
    then(
      onfulfilled: (value: { data: unknown; error: unknown }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
    }
  }
  const store = createReviewStore({ from: (table) => new Query(table) });
  return {
    store,
    tables,
    calls,
    fail: () => {
      fail = true;
    },
  };
}
const input = (overrides: Row = {}) => ({
  version: 1,
  clientId: client,
  businessId: business,
  limit: 1,
  ...overrides,
});
const request = (
  body: unknown,
  headers: Record<string, string> = { "content-type": "application/json" },
) =>
  new Request("https://qmaps.example/functions/v1/reviews", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
const runFeed = (db: ReturnType<typeof fixture>, body: unknown) =>
  createReviewFeedHandler({
    authorize: async () => true,
    store: () => db.store,
  })(request(body));
const runReply = (db: ReturnType<typeof fixture>, body: unknown) =>
  createReviewReplyHandler({
    authorize: async () => true,
    store: () => db.store,
    now: () => new Date("2026-11-01T12:00:00.000Z"),
  })(request(body));

describe("QMAPS scoped review API", () => {
  it("rejects methods and auth before touching the store", async () => {
    const db = fixture();
    const handler = createReviewFeedHandler({
      authorize: async () => false,
      store: () => db.store,
    });
    expect((await handler(new Request("https://qmaps.example"))).status).toBe(
      405,
    );
    expect((await handler(request(input()))).status).toBe(401);
    expect(db.calls).toEqual([]);
  });
  it("rejects invalid version, identifiers, limits, hidden scopes and unsafe cursors", async () => {
    for (const overrides of [
      { version: 2 },
      { clientId: "x" },
      { businessId: "x" },
      { limit: 0 },
      { limit: 101 },
      { limit: "10" },
      { includeHidden: true },
      { cursor: { id: reviewId(1), createdAt: `${time},business_id.neq.any` } },
      { cursor: { id: reviewId(1), createdAt: "2026-02-30T12:00:00Z" } },
    ]) {
      const db = fixture();
      expect((await runFeed(db, input(overrides))).status).toBe(400);
      expect(db.calls).toEqual([]);
    }
  });
  it("bounds streamed bodies and refuses non-JSON payloads", async () => {
    const db = fixture();
    const handler = createReviewFeedHandler({
      authorize: async () => true,
      store: () => db.store,
    });
    expect(
      (await handler(request(input(), { "content-type": "text/plain" })))
        .status,
    ).toBe(415);
    expect(
      (
        await handler(
          request(input({ padding: "x".repeat(REVIEW_BODY_LIMIT) })),
        )
      ).status,
    ).toBe(413);
    expect(db.calls).toEqual([]);
  });
  it("requires the exact active business/workspace mapping before reading reviews", async () => {
    for (const overrides of [
      { clientId: otherClient },
      { businessId: otherBusiness },
    ]) {
      const db = fixture();
      expect((await runFeed(db, input(overrides))).status).toBe(404);
      expect(db.calls.some((call) => call.table === "reviews")).toBe(false);
    }
    const db = fixture();
    db.tables.businesses[0].is_active = false;
    expect((await runFeed(db, input())).status).toBe(404);
  });
  it("paginates equal timestamps by UUID without exposing hidden or cross-business reviews", async () => {
    const db = fixture();
    const first = await runFeed(db, input());
    const page = await first.json();
    expect(first.status).toBe(200);
    expect(page.clientId).toBe(client);
    expect(page.businessId).toBe(business);
    expect(page.reviews.map((row: QmapsReview) => row.id)).toEqual([
      reviewId(2),
    ]);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toEqual({ id: reviewId(2), createdAt: time });
    const next = await (
      await runFeed(db, input({ cursor: page.nextCursor }))
    ).json();
    expect(next.reviews.map((row: QmapsReview) => row.id)).toEqual([
      reviewId(1),
    ]);
    expect(next.nextCursor).toBeNull();
    expect(next.hasMore).toBe(false);
    expect(
      db.calls.some((call) => call.operation === "limit" && call.args[0] === 2),
    ).toBe(true);
    expect(first.headers.get("cache-control")).toBe("private, no-store");
  });
  it("returns only the explicit public review projection", async () => {
    const db = fixture();
    const body = await (await runFeed(db, input({ limit: 100 }))).json();
    expect(body.reviews).toHaveLength(2);
    expect(Object.keys(body.reviews[0]).sort()).toEqual(
      [
        "author",
        "body",
        "businessId",
        "createdAt",
        "id",
        "ownerRepliedAt",
        "ownerReply",
        "rating",
        "updatedAt",
      ].sort(),
    );
    expect(body.reviews[0].author).toBe("QMAPS customer");
    expect(JSON.stringify(body)).not.toMatch(
      /private-member|private-reason|user_id|hidden_by/,
    );
  });
  it("uses an explicit empty page rather than a fabricated review", async () => {
    const db = fixture();
    db.tables.reviews = [];
    const data = await (await runFeed(db, input())).json();
    expect(data.reviews).toEqual([]);
    expect(data.hasMore).toBe(false);
    expect(data.nextCursor).toBeNull();
  });
  it("requires all scoped reply identifiers and version before a write", async () => {
    for (const body of [
      { reviewId: reviewId(1), body: "Hello" },
      {
        version: 1,
        clientId: client,
        businessId: business,
        reviewId: reviewId(1),
        body: "",
      },
      {
        version: 1,
        clientId: client,
        businessId: business,
        reviewId: reviewId(1),
        body: "x".repeat(2001),
      },
      {
        version: 1,
        clientId: "wrong",
        businessId: business,
        reviewId: reviewId(1),
        body: "Hello",
      },
    ]) {
      const db = fixture();
      expect((await runReply(db, body)).status).toBe(400);
      expect(db.calls).toEqual([]);
    }
  });
  it("refuses cross-workspace, foreign-business, hidden and privately moderated reply targets", async () => {
    for (const overrides of [
      { clientId: otherClient, reviewId: reviewId(1) },
      { reviewId: reviewId(6) },
      { reviewId: reviewId(3) },
      { reviewId: reviewId(4) },
      { reviewId: reviewId(5) },
    ]) {
      const db = fixture();
      const reply = {
        version: 1,
        clientId: client,
        businessId: business,
        reviewId: reviewId(1),
        body: "A real owner reply",
        ...overrides,
      };
      expect((await runReply(db, reply)).status).toBe(404);
      expect(db.tables.reviews.every((row) => row.owner_reply === null)).toBe(
        true,
      );
    }
  });
  it("writes only the selected linked source review and acknowledges all persisted identifiers", async () => {
    const db = fixture();
    const response = await runReply(db, {
      version: 1,
      clientId: client,
      businessId: business,
      reviewId: reviewId(1),
      body: " Thank you\nfor visiting ",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      version: 1,
      clientId: client,
      businessId: business,
      reviewId: reviewId(1),
      ownerReply: "Thank you for visiting",
      ownerRepliedAt: "2026-11-01T12:00:00.000Z",
    });
    expect(db.tables.reviews.filter((row) => row.owner_reply)).toHaveLength(1);
    expect(db.calls).toContainEqual({
      table: "reviews",
      operation: "eq",
      args: ["business_id", business],
    });
  });
  it("fails closed on database errors without leaking source errors or claiming publication", async () => {
    const db = fixture();
    db.fail();
    const response = await runFeed(db, input());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/private-database-error/);
  });
  it("preserves timestamp microseconds and rejects cursor key/identifier injection", () => {
    expect(parseReviewCursor({ createdAt: time, id: reviewId(1) })).toEqual({
      createdAt: time,
      id: reviewId(1),
    });
    expect(
      parseReviewCursor({
        createdAt: time,
        id: reviewId(1),
        clientId: otherClient,
      }),
    ).toBe(false);
    expect(
      parseReviewCursor({ createdAt: time, id: "id),business_id.neq.all" }),
    ).toBe(false);
  });
});
