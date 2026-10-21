// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, patch, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEST-EXAM 4 : Shop Orders API (Medium-Hard)");
const nos = (r) => r.data.map((x) => x.orderNo);
const P = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });

await test("1. Identity", "GET /student-info", 10, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "EX4-KEY" }, "data");
});

await test("2. List", "summary DTO (vat, grandTotal, placedAt string)", 10, async () => {
  const r = await get("/orders?page=1&limit=5");
  status(r, 200);
  keys(r.data[0], ["id", "orderNo", "customerName", "status", "totalAmount", "vat", "grandTotal", "placedAt"], "summary DTO");
  eq(r.data[0], { id: 1, orderNo: "ORD-0001", customerName: "Boon Customer", status: "CANCELLED", totalAmount: 237, vat: 16.59, grandTotal: 253.59, placedAt: "2026-02-06" }, "ORD-0001");
});
await test("2. List", "default pagination when no params (page 1, limit 20)", 5, async () => {
  const r = await get("/orders");
  status(r, 200);
  eq(r.data.length, 20, "items");
  eq(r.json.pagination, P(60, 1, 20), "pagination");
});

await test("3. Status filter", "?status=PAID,SHIPPED (comma list)", 5, async () => {
  const r = await get("/orders?status=PAID,SHIPPED&page=1&limit=10");
  status(r, 200);
  eq(r.json.pagination, P(30, 1, 10), "pagination");
  assert(r.data.every((o) => o.status === "PAID" || o.status === "SHIPPED"), "only PAID/SHIPPED allowed");
  eq((await get("/orders?status=CANCELLED&page=1&limit=50")).json.pagination.total, 15, "single status");
});

await test("4. Range filters", "minTotal / maxTotal (inclusive) + customerId", 8, async () => {
  eq((await get("/orders?minTotal=1000&maxTotal=2000&page=1&limit=50")).json.pagination.total, 14, "1000..2000");
  eq((await get("/orders?customerId=1&page=1&limit=50")).json.pagination.total, 7, "customerId=1");
  const c = await get("/orders?status=PAID&minTotal=2500&page=1&limit=50");
  eq(c.json.pagination.total, 7, "PAID & >=2500");
  assert(c.data.every((o) => o.status === "PAID" && o.totalAmount >= 2500), "all filters must apply together");
});
await test("4. Range filters", "from / to date range (inclusive)", 7, async () => {
  eq((await get("/orders?from=2026-01-01&to=2026-01-31&page=1&limit=50")).json.pagination.total, 20, "January");
  const f = await get("/orders?from=2026-02-10&to=2026-02-20&page=1&limit=50");
  eq(f.json.pagination.total, 7, "10..20 Feb");
  assert(f.data.every((o) => o.placedAt >= "2026-02-10" && o.placedAt <= "2026-02-20"), "placedAt inside range");
  eq((await get("/orders?to=2026-01-05&page=1&limit=50")).data.every((o) => o.placedAt <= "2026-01-05"), true, "only 'to'");
});

await test("5. Sort", "?sort= multi-field, '-' = desc", 10, async () => {
  const a = await get("/orders?sort=-totalAmount&page=1&limit=3");
  eq(nos(a), ["ORD-0035", "ORD-0034", "ORD-0033"], "highest totals");
  const l = (await get("/orders?sort=-placedAt,orderNo&page=1&limit=60")).data;
  for (let i = 1; i < l.length; i++) {
    const [p, c] = [l[i - 1], l[i]];
    assert(p.placedAt > c.placedAt || (p.placedAt === c.placedAt && p.orderNo < c.orderNo), `bad order at ${i}: ${p.placedAt}/${p.orderNo} then ${c.placedAt}/${c.orderNo}`);
  }
  const t = (await get("/orders?sort=totalAmount&page=1&limit=60")).data.map((o) => o.totalAmount);
  assert(t.every((v, i) => i === 0 || t[i - 1] <= v), "totalAmount must be ascending");
});

await test("6. Query validation", "page / limit -> 400", 5, async () => {
  for (const q of ["page=0&limit=10", "page=abc&limit=10", "page=1&limit=0", "page=1&limit=101", "page=-2&limit=10"]) {
    const r = await get(`/orders?${q}`);
    status(r, 400, `?${q}:`);
    errorEnvelope(r);
  }
});
await test("6. Query validation", "status / dates / totals / sort -> 400", 10, async () => {
  for (const q of ["status=FOO", "status=PAID,FOO", "status=paid", "from=2026-13-45", "from=hello", "from=2026-03-01&to=2026-01-01", "minTotal=abc", "minTotal=500&maxTotal=100", "sort=password", "customerId=x"]) {
    const r = await get(`/orders?page=1&limit=10&${q}`);
    status(r, 400, `?${q}:`);
    errorEnvelope(r);
  }
});

await test("7. Detail", "detail DTO with nested customer + 404", 5, async () => {
  const r = await get("/orders/1");
  status(r, 200);
  keys(r.data, ["id", "orderNo", "customerName", "status", "totalAmount", "vat", "grandTotal", "placedAt", "customer"], "detail DTO");
  eq(r.data.customer, { id: 2, email: "boon@example.com", fullName: "Boon Customer", tier: "SILVER" }, "customer");
  status(await get("/orders/9999"), 404);
});

let a, b;
const body = (no) => ({ orderNo: no, customerId: 1, totalAmount: 1000, placedAt: "2026-03-15" });
await test("8. Create", "POST 201 -> PENDING, vat computed", 5, async () => {
  const r = await post("/orders", body("ORD-9001"));
  status(r, 201);
  a = r.data?.id;
  assert(a, "response must include data.id");
  eq([r.data.status, r.data.vat, r.data.grandTotal, r.data.placedAt, r.data.customerName], ["PENDING", 70, 1070, "2026-03-15", "Arisa Customer"], "created order");
});
await test("8. Create", "POST validation 400 (details[]), duplicate 409, unknown customer 400", 5, async () => {
  const v = await post("/orders", { orderNo: "bad", customerId: "1", totalAmount: -1, placedAt: "15/03/2026" });
  status(v, 400, "invalid body:");
  errorEnvelope(v);
  eq((v.json.error.details || []).map((d) => d.field).sort(), ["customerId", "orderNo", "placedAt", "totalAmount"], "error.details[].field");
  status(await post("/orders", body("ORD-9001")), 409, "duplicate:");
  status(await post("/orders", { ...body("ORD-9002"), customerId: 999 }), 400, "unknown customer:");
});

await test("9. Status flow", "valid transitions PENDING -> PAID -> CANCELLED", 5, async () => {
  assert(a, "needs POST test to pass first");
  const p = await patch(`/orders/${a}/status`, { status: "PAID" });
  status(p, 200, "PENDING->PAID:");
  eq(p.data.status, "PAID", "status");
  const c = await patch(`/orders/${a}/status`, { status: "CANCELLED" });
  status(c, 200, "PAID->CANCELLED:");
  eq(c.data.status, "CANCELLED", "status");
});
await test("9. Status flow", "illegal transitions -> 409 INVALID_STATUS_TRANSITION, bad value -> 400, 404", 5, async () => {
  assert(a, "needs POST test to pass first");
  const x = await patch(`/orders/${a}/status`, { status: "PAID" });
  status(x, 409, "CANCELLED->PAID:");
  errorEnvelope(x);
  eq(x.json.error.code, "INVALID_STATUS_TRANSITION", "error.code");
  status(await patch("/orders/2/status", { status: "CANCELLED" }), 409, "seed SHIPPED->CANCELLED:");
  status(await patch("/orders/3/status", { status: "PENDING" }), 409, "seed PAID->PENDING:");
  status(await patch("/orders/4/status", { status: "FOO" }), 400, "unknown value:");
  status(await patch("/orders/9999/status", { status: "PAID" }), 404, "not found:");
});

await test("10. Delete", "only CANCELLED can be deleted (204) else 409, then 404", 5, async () => {
  assert(a, "needs POST test to pass first");
  const x = await del("/orders/4");
  status(x, 409, "PENDING order:");
  errorEnvelope(x);
  status(await del("/orders/2"), 409, "SHIPPED order:");
  status(await del(`/orders/${a}`), 204, "CANCELLED order:");
  status(await del(`/orders/${a}`), 404, "again:");
});

summary();
