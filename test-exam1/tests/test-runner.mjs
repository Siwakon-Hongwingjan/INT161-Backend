// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, put, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEST-EXAM 1 : Cafe Menu API (Beginner)");

await test("1. Identity", "GET /student-info", 10, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "EX1-KEY" }, "data");
});

await test("2. Categories", "GET /categories (list)", 5, async () => {
  const r = await get("/categories");
  status(r, 200);
  assert(Array.isArray(r.data) && r.data.length === 6, "expected array of 6 categories");
  assert(r.data[0].id === 1 && r.data[0].name === "Coffee", "first category must be Coffee (id 1)");
});
await test("2. Categories", "GET /categories/:id + 404", 5, async () => {
  const ok = await get("/categories/2");
  status(ok, 200, "found:");
  eq(ok.data.name, "Tea", "name");
  const nf = await get("/categories/9999");
  status(nf, 404, "not found:");
  errorEnvelope(nf);
});

await test("3. Menu list", "paginated envelope", 15, async () => {
  const r = await get("/menu-items?page=1&limit=10");
  status(r, 200);
  assert(r.data.length === 10, `expected 10 items, got ${r.data.length}`);
  eq(r.json.pagination, { total: 30, page: 1, limit: 10, totalPages: 3, hasNextPage: true, hasPrevPage: false }, "pagination");
  const r3 = await get("/menu-items?page=3&limit=10");
  eq(r3.json.pagination, { total: 30, page: 3, limit: 10, totalPages: 3, hasNextPage: false, hasPrevPage: true }, "page 3 pagination");
  eq(r3.data.map((x) => x.id), [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], "page 3 ids");
});
await test("3. Menu list", "summary DTO (camelCase, number, boolean)", 15, async () => {
  const r = await get("/menu-items?page=1&limit=10");
  const x = r.data[0];
  keys(x, ["id", "sku", "name", "categoryId", "price", "isAvailable"], "summary DTO");
  eq([x.sku, x.name, x.categoryId], ["CAF-001", "Espresso", 1], "first item");
  assert(typeof x.price === "number", `price must be a number, got ${typeof x.price}`);
  assert(typeof x.isAvailable === "boolean", `isAvailable must be boolean, got ${typeof x.isAvailable}`);
  eq(r.data.find((i) => i.id === 7).isAvailable, false, "item 7 isAvailable");
});
await test("3. Menu list", "page 2 limit 4 slices correctly", 5, async () => {
  const r = await get("/menu-items?page=2&limit=4");
  eq(r.data.map((x) => x.id), [5, 6, 7, 8], "ids");
});

await test("4. Menu detail", "detail DTO + 404", 10, async () => {
  const r = await get("/menu-items/3");
  status(r, 200);
  keys(r.data, ["id", "sku", "name", "categoryId", "categoryName", "price", "calories", "size", "isAvailable", "createdAt"], "detail DTO");
  eq([r.data.name, r.data.categoryName], ["Latte", "Coffee"], "name/categoryName");
  const nf = await get("/menu-items/9999");
  status(nf, 404, "not found:");
  errorEnvelope(nf);
});

let newId;
const body = { sku: "TEST-001", name: "Test Drink", category_id: 1, price: 99.5, calories: 120, size: "L", is_available: 1 };
await test("5. Create", "POST 201 returns detail DTO", 10, async () => {
  const r = await post("/menu-items", body);
  status(r, 201);
  newId = r.data?.id;
  assert(newId, "response must include data.id");
  eq([r.data.sku, r.data.price, r.data.categoryName], ["TEST-001", 99.5, "Coffee"], "created fields");
});
await test("5. Create", "POST duplicate sku -> 409", 5, async () => {
  const r = await post("/menu-items", { ...body, sku: "CAF-001" });
  status(r, 409);
  errorEnvelope(r);
});

await test("6. Update", "PUT 200 + 404", 10, async () => {
  assert(newId, "needs POST test to pass first");
  const r = await put(`/menu-items/${newId}`, { price: 120, name: "Test Drink v2" });
  status(r, 200);
  eq([r.data.price, r.data.name, r.data.sku], [120, "Test Drink v2", "TEST-001"], "updated fields (sku untouched)");
  const nf = await put("/menu-items/9999", { price: 1 });
  status(nf, 404, "not found:");
});

await test("7. Delete", "DELETE 204 then 404", 10, async () => {
  assert(newId, "needs POST test to pass first");
  const r = await del(`/menu-items/${newId}`);
  status(r, 204);
  assert(r.json === null, "204 must have empty body");
  status(await get(`/menu-items/${newId}`), 404, "after delete:");
  status(await del(`/menu-items/${newId}`), 404, "delete again:");
});

summary();
