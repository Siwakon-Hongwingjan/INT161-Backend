// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, put, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEMPLATE-EXAM 1 : Classic Models Products (Beginner)");
const SUMMARY = ["id", "name", "scale", "retailPrice"];
const DETAIL = ["productCode", "productName", "productLine", "productScale", "productVendor", "productDescription", "quantityInStock", "price", "retailPrice"];
await del("/products/TP1_0001"); // เก็บกวาดถ้ารอบก่อนค้าง

await test("1. Identity", "GET /student-info", 10, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "TP1-KEY" }, "data");
});

await test("2. Product lines", "GET /product-lines", 5, async () => {
  const r = await get("/product-lines");
  status(r, 200);
  eq(r.data.map((x) => x.productLine), ["Classic Cars", "Motorcycles", "Planes", "Ships", "Trains", "Trucks and Buses", "Vintage Cars"], "lines");
  keys(r.data[0], ["productLine", "description"], "product line DTO");
  assert(r.data[0].description.startsWith("Attention car enthusiasts"), "description must come from textDescription");
});
await test("2. Product lines", "GET /product-lines/:productLine/products + 404", 5, async () => {
  const r = await get("/product-lines/Classic%20Cars/products");
  status(r, 200);
  eq(r.data.length, 38, "Classic Cars count");
  keys(r.data[0], SUMMARY, "summary DTO");
  eq((await get("/product-lines/Trains/products")).data.map((x) => x.id).length, 3, "Trains count");
  const nf = await get("/product-lines/Rockets/products");
  status(nf, 404, "unknown line:");
  errorEnvelope(nf);
});

await test("3. Products list", "pagination envelope", 15, async () => {
  const r = await get("/products?page=1&limit=10");
  status(r, 200);
  eq(r.data.length, 10, "items");
  eq(r.json.pagination, { total: 110, page: 1, limit: 10, totalPages: 11, hasNextPage: true, hasPrevPage: false }, "pagination");
  const last = await get("/products?page=11&limit=10");
  eq(last.json.pagination, { total: 110, page: 11, limit: 10, totalPages: 11, hasNextPage: false, hasPrevPage: true }, "last page");
  eq(last.data.map((x) => x.id), ["S700_2466", "S700_2610", "S700_2824", "S700_2834", "S700_3167", "S700_3505", "S700_3962", "S700_4002", "S72_1253", "S72_3212"], "last page ids (ORDER BY productCode)");
  eq((await get("/products?page=5&limit=5")).data.map((x) => x.id), ["S18_1589", "S18_1662", "S18_1749", "S18_1889", "S18_1984"], "page 5 limit 5");
});
await test("3. Products list", "summary DTO (retailPrice is number)", 10, async () => {
  const r = await get("/products?page=1&limit=3");
  keys(r.data[0], SUMMARY, "summary DTO");
  eq(r.data[0], { id: "S10_1678", name: "1969 Harley Davidson Ultimate Chopper", scale: "1:10", retailPrice: 95.7 }, "first product");
});
await test("3. Products list", "no page/limit -> all 110 without pagination", 5, async () => {
  const r = await get("/products");
  status(r, 200);
  eq(r.data.length, 110, "items");
  assert(r.json.pagination === undefined, "must not include pagination when page/limit not given");
});

await test("4. Product detail", "detail DTO + 404 envelope", 15, async () => {
  const r = await get("/products/S18_3232");
  status(r, 200);
  keys(r.data, DETAIL, "detail DTO");
  eq([r.data.productName, r.data.quantityInStock, r.data.price, r.data.retailPrice], ["1992 Ferrari 360 Spider red", 8347, 77.9, 169.34], "detail values");
  const nf = await get("/products/NOPE_999");
  status(nf, 404);
  errorEnvelope(nf);
  eq(nf.json.error.code, "NOT_FOUND", "error.code");
});

const body = { productCode: "TP1_0001", productName: "Practice Model", productLine: "Planes", productScale: "1:72", productVendor: "Exam Vendor", productDescription: "made by test-runner", quantityInStock: 50, buyPrice: 10.5, MSRP: 25 };
let created = false;
await test("5. Create", "POST 201 detail DTO", 10, async () => {
  const r = await post("/products", body);
  status(r, 201);
  keys(r.data, DETAIL, "detail DTO");
  eq([r.data.productCode, r.data.price, r.data.retailPrice, r.data.quantityInStock], ["TP1_0001", 10.5, 25, 50], "created");
  created = true;
});
await test("5. Create", "POST duplicate productCode -> 409 CONFLICT", 5, async () => {
  const r = await post("/products", { ...body, productCode: "S10_1678" });
  status(r, 409);
  errorEnvelope(r);
  eq(r.json.error.code, "CONFLICT", "error.code");
});

await test("6. Update", "PUT partial 200 + 404", 10, async () => {
  assert(created, "needs POST test to pass first");
  const r = await put("/products/TP1_0001", { MSRP: 30, quantityInStock: 7 });
  status(r, 200);
  eq([r.data.retailPrice, r.data.quantityInStock, r.data.productName], [30, 7, "Practice Model"], "updated (others untouched)");
  status(await put("/products/NOPE_999", { MSRP: 1 }), 404, "not found:");
});

await test("7. Delete", "DELETE 204 empty body, then 404", 10, async () => {
  assert(created, "needs POST test to pass first");
  const r = await del("/products/TP1_0001");
  status(r, 204);
  assert(r.json === null, "204 must have empty body");
  status(await get("/products/TP1_0001"), 404, "after delete:");
  status(await del("/products/TP1_0001"), 404, "delete again:");
});

summary();
