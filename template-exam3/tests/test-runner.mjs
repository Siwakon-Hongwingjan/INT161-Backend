// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, put, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEMPLATE-EXAM 3 : Classic Models Customers (Medium)");
const nums = (r) => r.data.map((x) => x.customerNumber);
const code = (r, c, what = "") => { errorEnvelope(r); eq(r.json.error.code, c, `${what} error.code`.trim()); };
const SUMMARY = ["customerNumber", "customerName", "contactName", "country", "creditLimit", "creditTier"];
const DETAIL = [...SUMMARY, "phone", "city", "salesRep", "orderCount", "totalPayments"];

// เก็บกวาดถ้ารอบก่อนค้าง
for (const c of (await get("/customers?q=Practice%20Test%20Shop")).data || []) await del(`/customers/${c.customerNumber}`);

await test("1. Identity", "GET /student-info", 5, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "TP3-KEY" }, "data");
});

await test("2. Offices", "GET /offices with employeeCount", 5, async () => {
  const r = await get("/offices");
  status(r, 200);
  keys(r.data[0], ["officeCode", "city", "country", "employeeCount"], "office DTO");
  eq(r.data.map((o) => [o.city, o.employeeCount]), [["San Francisco", 6], ["Boston", 2], ["NYC", 2], ["Paris", 5], ["Tokyo", 2], ["Sydney", 4], ["London", 2]], "city/employeeCount");
});

await test("3. Customers list", "pagination + summary DTO (trimmed contactName)", 10, async () => {
  const r = await get("/customers?page=1&limit=10");
  status(r, 200);
  eq(r.json.pagination, { total: 122, page: 1, limit: 10, totalPages: 13, hasNextPage: true, hasPrevPage: false }, "pagination");
  keys(r.data[0], SUMMARY, "summary DTO");
  eq(r.data[0], { customerNumber: 103, customerName: "Atelier graphique", contactName: "Carine Schmitt", country: "France", creditLimit: 21000, creditTier: "LOW" }, "customer 103");
  eq((await get("/customers")).data.length, 122, "no page/limit -> all");
});
await test("3. Customers list", "creditTier boundaries", 5, async () => {
  const all = (await get("/customers")).data;
  const n = (t) => all.filter((c) => c.creditTier === t).length;
  eq([n("NONE"), n("LOW"), n("MEDIUM"), n("HIGH")], [24, 13, 60, 25], "NONE/LOW/MEDIUM/HIGH");
});

await test("4. Search", "q (case-insensitive) / country / total in sync", 7, async () => {
  const r = await get("/customers?q=GIFT&page=1&limit=5");
  eq(r.json.pagination, { total: 23, page: 1, limit: 5, totalPages: 5, hasNextPage: true, hasPrevPage: false }, "q=GIFT pagination");
  assert(r.data.every((c) => /gift/i.test(c.customerName)), "every name must contain 'gift'");
  eq((await get("/customers?country=USA&page=1&limit=50")).json.pagination.total, 36, "country=USA");
});
await test("4. Search", "salesRepId (number / none) + credit range combined", 8, async () => {
  eq((await get("/customers?salesRepId=1370&page=1&limit=50")).json.pagination.total, 7, "salesRepId=1370");
  const none = await get("/customers?salesRepId=none&page=1&limit=50");
  eq(none.json.pagination.total, 22, "salesRepId=none");
  assert(none.data.every((c) => c.creditTier === "NONE"), "(data) customers without a sales rep have 0 credit");
  eq((await get("/customers?country=USA&minCredit=100000&page=1&limit=50")).json.pagination.total, 9, "USA & >= 100000");
  eq(nums(await get("/customers?q=mini&minCredit=50000&maxCredit=100000")), [121, 129, 204, 209, 320, 350], "q + inclusive range");
});
await test("4. Search", "invalid query -> 400 BAD_REQUEST", 5, async () => {
  for (const q of ["salesRepId=abc", "minCredit=abc", "minCredit=9000&maxCredit=10", "sort=password", "sort=customerName,-phone"]) {
    const r = await get(`/customers?${q}`);
    status(r, 400, `?${q}:`);
    code(r, "BAD_REQUEST", `?${q}`);
  }
});

await test("5. Sort", "multi-field sort with '-' = desc", 10, async () => {
  eq(nums(await get("/customers?sort=-creditLimit,customerName&page=1&limit=3")), [141, 124, 298], "highest credit");
  eq(nums(await get("/customers?sort=country,-customerName&page=1&limit=3")), [282, 333, 114], "country asc, name desc");
  const t = (await get("/customers?sort=creditLimit")).data;
  assert(t.every((c, i) => i === 0 || t[i - 1].creditLimit < c.creditLimit || (t[i - 1].creditLimit === c.creditLimit && t[i - 1].customerNumber < c.customerNumber)), "creditLimit asc, ties by customerNumber");
});

await test("6. Detail", "detail DTO with salesRep / orderCount / totalPayments + 404", 15, async () => {
  const r = await get("/customers/141");
  status(r, 200);
  keys(r.data, DETAIL, "detail DTO");
  eq([r.data.phone, r.data.city, r.data.orderCount, r.data.totalPayments], ["(91) 555 94 44", "Madrid", 26, 715738.98], "customer 141");
  eq(r.data.salesRep, { employeeNumber: 1370, fullName: "Gerard Hernandez", email: "ghernande@classicmodelcars.com" }, "salesRep");
  const n = await get("/customers/125");
  eq([n.data.salesRep, n.data.orderCount, n.data.totalPayments], [null, 0, 0], "customer 125 (no rep / orders / payments)");
  const nf = await get("/customers/9999");
  status(nf, 404);
  code(nf, "NOT_FOUND");
});

let newNo;
const body = { customerName: "Practice Test Shop", contactFirstName: "Test", contactLastName: "Runner", phone: "02-000-0000", addressLine1: "1 Exam Road", city: "Bangkok", country: "Thailand", creditLimit: 45000, salesRepEmployeeNumber: 1370 };
await test("7. Create", "POST 201 detail DTO with generated customerNumber", 5, async () => {
  const r = await post("/customers", body);
  status(r, 201);
  newNo = r.data?.customerNumber;
  assert(Number.isInteger(newNo) && newNo > 496, `customerNumber must be MAX+1 (> 496), got ${newNo}`);
  eq([r.data.contactName, r.data.creditTier, r.data.salesRep?.fullName, r.data.orderCount, r.data.totalPayments], ["Test Runner", "LOW", "Gerard Hernandez", 0, 0], "created");
});
await test("7. Create", "POST validation -> 400 VALIDATION_ERROR with every invalid field", 10, async () => {
  const r = await post("/customers", { customerName: "", contactFirstName: "A", phone: 123, creditLimit: -5, salesRepEmployeeNumber: "1370" });
  status(r, 400);
  code(r, "VALIDATION_ERROR");
  eq((r.json.error.details || []).map((d) => d.field).sort(), ["addressLine1", "city", "contactLastName", "country", "creditLimit", "customerName", "phone", "salesRepEmployeeNumber"], "error.details[].field");
  assert(r.json.error.details.every((d) => d.message), "each detail needs a message");
});
await test("7. Create", "unknown salesRep -> 400 FOREIGN_KEY_NOT_FOUND, creditLimit defaults to 0", 5, async () => {
  const f = await post("/customers", { ...body, salesRepEmployeeNumber: 1 });
  status(f, 400, "unknown sales rep:");
  code(f, "FOREIGN_KEY_NOT_FOUND");
  const { creditLimit, salesRepEmployeeNumber, ...minimal } = body;
  const d = await post("/customers", minimal);
  status(d, 201, "minimal body:");
  eq([d.data.creditLimit, d.data.creditTier, d.data.salesRep], [0, "NONE", null], "defaults");
  status(await del(`/customers/${d.data.customerNumber}`), 204, "cleanup:");
});

await test("8. Update", "PUT partial + validation + 404", 5, async () => {
  assert(newNo, "needs POST test to pass first");
  const r = await put(`/customers/${newNo}`, { creditLimit: 150000, city: "Chiang Mai", customerNumber: 1 });
  status(r, 200);
  eq([r.data.customerNumber, r.data.city, r.data.creditTier, r.data.customerName], [newNo, "Chiang Mai", "HIGH", "Practice Test Shop"], "updated (customerNumber in body ignored)");
  const v = await put(`/customers/${newNo}`, { country: "" });
  status(v, 400, "invalid:");
  code(v, "VALIDATION_ERROR");
  status(await put("/customers/9999", { city: "X" }), 404, "unknown:");
});

await test("9. Delete", "409 RESOURCE_IN_USE / 204 / 404", 5, async () => {
  assert(newNo, "needs POST test to pass first");
  const c = await del("/customers/103");
  status(c, 409, "customer with orders:");
  code(c, "RESOURCE_IN_USE");
  status(await del(`/customers/${newNo}`), 204, "new customer:");
  status(await del(`/customers/${newNo}`), 404, "again:");
});

summary();
