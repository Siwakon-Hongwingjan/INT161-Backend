// Usage: node tests/test-runner.mjs [studentId] [port]
import { base, get, post, patch, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEMPLATE-EXAM 5 : Classic Models Orders (Hard)");
const nums = (r) => r.data.map((x) => x.orderNumber);
const code = (r, c, what = "") => { errorEnvelope(r); eq(r.json.error.code, c, `${what} error.code`.trim()); };
const P = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const SUMMARY = ["orderNumber", "orderDate", "status", "customerName", "itemCount", "total"];
const stock = async (codeNo) => (await get(`/products/${codeNo}`)).data?.quantityInStock;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// เก็บกวาดถ้ารอบก่อนค้าง: order ที่เทสต์สร้างมี comments = "exam-runner"
for (const o of (await get("/orders?from=2026-01-01&limit=100")).data || []) {
  const d = (await get(`/orders/${o.orderNumber}`)).data;
  if (d?.comments !== "exam-runner") continue;
  for (const s of ["Disputed", "Cancelled"]) await patch(`/orders/${o.orderNumber}/status`, { status: s });
  await del(`/orders/${o.orderNumber}`);
}

await test("1. Identity", "GET /student-info", 5, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "TP5-KEY" }, "data");
});

await test("2. List", "summary DTO (computed itemCount / total)", 5, async () => {
  const r = await get("/orders?page=1&limit=2");
  status(r, 200);
  keys(r.data[0], SUMMARY, "summary DTO");
  eq(r.data, [
    { orderNumber: 10100, orderDate: "2003-01-06", status: "Shipped", customerName: "Online Diecast Creations Co.", itemCount: 4, total: 10223.83 },
    { orderNumber: 10101, orderDate: "2003-01-09", status: "Shipped", customerName: "Blauer See Auto, Co.", itemCount: 4, total: 10549.01 },
  ], "first two orders");
});
await test("2. List", "default pagination page=1 limit=20", 5, async () => {
  const r = await get("/orders");
  eq([r.data.length, r.json.pagination], [20, P(326, 1, 20)], "items/pagination");
});

await test("3. Filters", "status (with spaces, comma list) / customerNumber / dates", 8, async () => {
  const s = await get("/orders?status=On%20Hold,Disputed&limit=50");
  eq(s.json.pagination.total, 7, "On Hold + Disputed");
  assert(s.data.every((o) => ["On Hold", "Disputed"].includes(o.status)), "only On Hold / Disputed");
  eq((await get("/orders?customerNumber=141&limit=50")).json.pagination.total, 26, "customer 141");
  eq((await get("/orders?from=2004-01-01&to=2004-03-31&limit=50")).json.pagination.total, 27, "Q1 2004");
});
await test("3. Filters", "minTotal / maxTotal on computed total + combined", 7, async () => {
  const m = await get("/orders?minTotal=50000&limit=50");
  eq(m.json.pagination.total, 36, "total >= 50000");
  assert(m.data.every((o) => o.total >= 50000), "every total >= 50000");
  eq((await get("/orders?status=Shipped&from=2005-01-01&minTotal=10000&maxTotal=20000&limit=50")).json.pagination.total, 9, "combined");
});

await test("4. Sort", "sort by computed total / orderDate (tie -> orderNumber)", 5, async () => {
  eq(nums(await get("/orders?sort=-total&limit=3")), [10165, 10287, 10310], "biggest orders");
  eq(nums(await get("/orders?sort=-orderDate&limit=3")), [10424, 10425, 10422], "newest (same day -> orderNumber asc)");
});

await test("5. Query validation", "bad query -> 400 BAD_REQUEST", 5, async () => {
  for (const q of ["page=0", "limit=101", "status=shipped", "status=Shipped,Lost", "customerNumber=x", "from=2004-02-30", "from=2005-01-01&to=2004-01-01", "minTotal=abc", "minTotal=900&maxTotal=10", "sort=comments"]) {
    const r = await get(`/orders?${q}`);
    status(r, 400, `?${q}:`);
    code(r, "BAD_REQUEST", `?${q}`);
  }
});

await test("6. Detail", "detail DTO with customer + lines + 404", 10, async () => {
  const r = await get("/orders/10100");
  status(r, 200);
  keys(r.data, [...SUMMARY, "requiredDate", "shippedDate", "comments", "customer", "lines"], "detail DTO");
  eq([r.data.requiredDate, r.data.shippedDate, r.data.comments], ["2003-01-13", "2003-01-10", null], "dates/comments");
  eq(r.data.customer, { customerNumber: 363, customerName: "Online Diecast Creations Co.", country: "USA" }, "customer");
  eq(r.data.lines.map((l) => l.productCode), ["S24_3969", "S18_2248", "S18_1749", "S18_4409"], "lines ordered by orderLineNumber");
  eq(r.data.lines[0], { lineNumber: 1, productCode: "S24_3969", productName: "1936 Mercedes Benz 500k Roadster", quantity: 49, priceEach: 35.29, lineTotal: 1729.21 }, "line 1");
  eq((await get("/orders/10425")).data.shippedDate, null, "unshipped order");
  const nf = await get("/orders/1");
  status(nf, 404);
  code(nf, "NOT_FOUND");
});

await test("7. Stats", "GET /stats/product-lines (GROUP BY, Cancelled excluded)", 10, async () => {
  const r = await get("/stats/product-lines?year=2004");
  status(r, 200);
  eq(r.data.map((x) => x.productLine), ["Classic Cars", "Vintage Cars", "Motorcycles", "Trucks and Buses", "Planes", "Ships", "Trains"], "sorted by revenue desc");
  eq(r.data[0], { productLine: "Classic Cars", orderCount: 94, unitsSold: 15470, revenue: 1689307.07 }, "Classic Cars 2004");
  eq(r.data[6], { productLine: "Trains", orderCount: 20, unitsSold: 1290, revenue: 86897.46 }, "Trains 2004");
  const all = await get("/stats/product-lines");
  eq(all.data.slice(0, 2), [{ productLine: "Classic Cars", orderCount: 205, unitsSold: 34923, revenue: 3774647.39 }, { productLine: "Vintage Cars", orderCount: 182, unitsSold: 22383, revenue: 1755309.57 }], "all years");
  status(await get("/stats/product-lines?year=04"), 400, "bad year:");
});

let a, b;
const items = [{ productCode: "S18_3232", quantity: 3 }, { productCode: "S10_1678", quantity: 2 }];
const body = { customerNumber: 141, requiredDate: "2026-12-01", comments: "exam-runner", items };
await test("8. Create", "POST 201 + stock decreased + product endpoint", 8, async () => {
  const p = await get("/products/S18_3232");
  status(p, 200, "product:");
  eq(p.data, { productCode: "S18_3232", productName: "1992 Ferrari 360 Spider red", quantityInStock: 8347, retailPrice: 169.34 }, "product DTO");
  status(await get("/products/NOPE"), 404, "unknown product:");
  const r = await post("/orders", body);
  status(r, 201);
  a = r.data?.orderNumber;
  assert(a > 10425, `orderNumber must be MAX+1 (> 10425), got ${a}`);
  assert(DATE.test(r.data.orderDate), `orderDate must be today's YYYY-MM-DD, got ${r.data.orderDate}`);
  eq([r.data.status, r.data.itemCount, r.data.total, r.data.shippedDate, r.data.customer.customerNumber], ["In Process", 2, 699.42, null, 141], "created order");
  eq(r.data.lines.map((l) => [l.lineNumber, l.productCode, l.quantity, l.priceEach]), [[1, "S18_3232", 3, 169.34], [2, "S10_1678", 2, 95.7]], "lines (priceEach = MSRP)");
  eq([await stock("S18_3232"), await stock("S10_1678")], [8344, 7931], "stock decreased");
});
await test("8. Create", "validation 400 VALIDATION_ERROR with item paths", 4, async () => {
  const v = await post("/orders", { customerNumber: "141", requiredDate: "2026-13-01", comments: 5, items: [{ productCode: "S18_3232", quantity: 0 }, { productCode: 5, quantity: 1 }] });
  status(v, 400, "invalid body:");
  code(v, "VALIDATION_ERROR");
  eq((v.json.error.details || []).map((d) => d.field).sort(), ["comments", "customerNumber", "items[0].quantity", "items[1].productCode", "requiredDate"], "error.details[].field");
  const e = await post("/orders", { ...body, items: [] });
  eq((e.json?.error?.details || []).map((d) => d.field), ["items"], "empty items");
  const d = await post("/orders", { ...body, items: [items[0], { productCode: "S18_3232", quantity: 1 }] });
  eq((d.json?.error?.details || []).map((x) => x.field), ["items[1].productCode"], "duplicate productCode");
});
await test("8. Create", "CUSTOMER/PRODUCT_NOT_FOUND, INSUFFICIENT_STOCK rolls back everything", 8, async () => {
  const c = await post("/orders", { ...body, customerNumber: 1 });
  status(c, 400, "unknown customer:");
  code(c, "CUSTOMER_NOT_FOUND");
  const p = await post("/orders", { ...body, items: [{ productCode: "NOPE_1", quantity: 1 }] });
  status(p, 400, "unknown product:");
  code(p, "PRODUCT_NOT_FOUND");
  const before = await stock("S18_3232");
  const s = await post("/orders", { ...body, items: [{ productCode: "S18_3232", quantity: 1 }, { productCode: "S24_2000", quantity: 16 }] });
  status(s, 409, "16 x S24_2000 (stock 15):");
  code(s, "INSUFFICIENT_STOCK");
  eq((s.json.error.details || []).map((d) => d.field), ["items[1].quantity"], "error.details[].field");
  eq([await stock("S18_3232"), await stock("S24_2000")], [before, 15], "nothing saved (stock unchanged)");
});

await test("9. Status flow", "transitions, shippedDate, cancel restores stock", 10, async () => {
  assert(a, "needs POST test to pass first");
  status(await patch(`/orders/${a}/status`, { status: "On Hold" }), 200, "In Process -> On Hold:");
  status(await patch(`/orders/${a}/status`, { status: "In Process" }), 200, "On Hold -> In Process:");
  const c = await patch(`/orders/${a}/status`, { status: "Cancelled" });
  status(c, 200, "-> Cancelled:");
  eq([await stock("S18_3232"), await stock("S10_1678")], [8347, 7933], "stock restored after cancel");
  const x = await patch(`/orders/${a}/status`, { status: "In Process" });
  status(x, 409, "Cancelled -> In Process:");
  code(x, "INVALID_STATUS_TRANSITION");

  const r = await post("/orders", { ...body, items: [{ productCode: "S24_2000", quantity: 15 }] });
  status(r, 201, "second order (all 15 in stock):");
  b = r.data.orderNumber;
  eq(await stock("S24_2000"), 0, "stock 0");
  const sh = await patch(`/orders/${b}/status`, { status: "Shipped" });
  status(sh, 200, "-> Shipped:");
  assert(DATE.test(sh.data.shippedDate), `shippedDate must be set, got ${sh.data.shippedDate}`);
  status(await patch(`/orders/${b}/status`, { status: "Cancelled" }), 409, "Shipped -> Cancelled:");
  status(await patch(`/orders/${b}/status`, { status: "Disputed" }), 200, "-> Disputed:");
  status(await patch(`/orders/${b}/status`, { status: "Cancelled" }), 200, "Disputed -> Cancelled:");
  eq(await stock("S24_2000"), 15, "stock restored");
  status(await patch("/orders/10164/status", { status: "Disputed" }), 409, "seed Resolved -> Disputed:");
  status(await patch("/orders/10425/status", { status: "Lost" }), 400, "unknown status:");
  status(await patch("/orders/1/status", { status: "Shipped" }), 404, "unknown order:");
});

await test("10. Delete", "only Cancelled (204, lines removed) else 409, then 404", 5, async () => {
  assert(a && b, "needs previous tests to pass first");
  const x = await del("/orders/10100");
  status(x, 409, "Shipped order:");
  code(x, "ORDER_NOT_CANCELLED");
  status(await del(`/orders/${a}`), 204, "cancelled order a:");
  status(await del(`/orders/${b}`), 204, "cancelled order b:");
  status(await get(`/orders/${a}`), 404, "after delete:");
  status(await del(`/orders/${a}`), 404, "again:");
  eq((await get("/orders")).json.pagination.total, 326, "back to 326 orders");
});

await test("11. Errors", "unknown route 404 JSON + malformed JSON 400", 5, async () => {
  for (const path of ["/api/67130500001/orders/10100/invoice", "/nope"]) {
    const res = await fetch(base + path);
    let json = null;
    try { json = JSON.parse(await res.text()); } catch {}
    assert(res.status === 404 && json?.error?.code === "NOT_FOUND", `${path}: expected 404 NOT_FOUND JSON, got ${res.status} ${JSON.stringify(json)}`);
  }
  const res = await fetch(`${base}/api/67130500001/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
  let json = null;
  try { json = JSON.parse(await res.text()); } catch {}
  assert(res.status === 400 && json?.error?.code === "INVALID_JSON", `malformed JSON: expected 400 INVALID_JSON, got ${res.status} ${JSON.stringify(json)}`);
});

summary();
