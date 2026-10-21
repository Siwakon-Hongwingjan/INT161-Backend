// Usage: node tests/test-runner.mjs [studentId] [port]
import { api, get, post, put, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEMPLATE-EXAM 2 : Car Rental (Easy)");
const plates = (r) => r.data.map((x) => x.plateNo);
const code = (r, c, what = "") => { errorEnvelope(r); eq(r.json.error.code, c, `${what} error.code`.trim()); };
const SUMMARY = ["id", "plateNo", "name", "branchName", "dailyRate", "isAvailable"];

// เก็บกวาดถ้ารอบก่อนค้าง
for (const c of (await get("/cars?brand=Tesla")).data || []) await del(`/cars/${c.id}`);

await test("1. Identity", "GET /student-info", 5, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "TP2-KEY" }, "data");
});

await test("2. Branches", "GET /branches with carCount (LEFT JOIN keeps empty branch)", 5, async () => {
  const r = await get("/branches");
  status(r, 200);
  keys(r.data[0], ["id", "name", "city", "carCount"], "branch DTO");
  eq(r.data.map((b) => [b.name, b.carCount]), [["Bangkok Central", 9], ["Chiang Mai Airport", 9], ["Phuket Town", 9], ["Pattaya Beach", 9], ["Hua Hin Station", 0]], "name/carCount");
});
await test("2. Branches", "GET /branches/:id + 404", 5, async () => {
  const r = await get("/branches/5");
  status(r, 200);
  eq(r.data, { id: 5, name: "Hua Hin Station", city: "Prachuap Khiri Khan", carCount: 0 }, "branch 5");
  const nf = await get("/branches/999");
  status(nf, 404);
  code(nf, "NOT_FOUND");
});
await test("2. Branches", "DELETE branch with cars -> 409 RESOURCE_IN_USE, unknown -> 404", 5, async () => {
  const r = await del("/branches/1");
  status(r, 409);
  code(r, "RESOURCE_IN_USE");
  status(await del("/branches/999"), 404, "unknown:");
});

await test("3. Cars list", "pagination envelope", 8, async () => {
  const r = await get("/cars?page=3&limit=10");
  status(r, 200);
  eq(r.json.pagination, { total: 36, page: 3, limit: 10, totalPages: 4, hasNextPage: true, hasPrevPage: true }, "pagination");
  eq(r.data.length, 10, "items");
  eq((await get("/cars")).data.length, 36, "no page/limit -> all");
});
await test("3. Cars list", "summary DTO + default sort plateNo", 7, async () => {
  const r = await get("/cars?page=1&limit=3");
  keys(r.data[0], SUMMARY, "summary DTO");
  eq(r.data[0], { id: 1, plateNo: "BKK-1000", name: "Toyota Yaris", branchName: "Bangkok Central", dailyRate: 900, isAvailable: true }, "first car");
  eq(plates(r), ["BKK-1000", "BKK-1007", "BKK-1014"], "default order");
  eq((await get("/cars?page=1&limit=4")).data[3], { id: 4, plateNo: "BKK-1021", name: "Honda Civic", branchName: "Bangkok Central", dailyRate: 1400, isAvailable: false }, "BKK-1021 (isAvailable must be boolean false)");
});

await test("4. Filter", "brand / available / total in sync", 8, async () => {
  const r = await get("/cars?brand=Toyota&available=true&page=1&limit=3");
  eq(r.json.pagination, { total: 5, page: 1, limit: 3, totalPages: 2, hasNextPage: true, hasPrevPage: false }, "pagination");
  eq(plates(await get("/cars?brand=Toyota&available=true")), ["BKK-1000", "BKK-1007", "CNX-1003", "CNX-1010", "PTY-1016"], "available Toyotas");
  eq((await get("/cars?available=false&page=1&limit=50")).json.pagination.total, 10, "unavailable");
});
await test("4. Filter", "branchId + transmission + minSeats combined", 7, async () => {
  eq((await get("/cars?branchId=2&transmission=MANUAL&page=1&limit=50")).json.pagination.total, 3, "branch 2 manual");
  const s = await get("/cars?minSeats=7&page=1&limit=50");
  eq(s.json.pagination.total, 4, "minSeats=7");
  const z = await get("/cars?minSeats=7&transmission=MANUAL&page=1&limit=10");
  status(z, 200);
  eq([z.data.length, z.json.pagination.total, z.json.pagination.totalPages], [0, 0, 0], "no match");
});
await test("4. Filter", "invalid filter values -> 400 BAD_REQUEST", 5, async () => {
  for (const q of ["transmission=auto", "available=yes", "minSeats=abc", "minSeats=2.5"]) {
    const r = await get(`/cars?${q}`);
    status(r, 400, `?${q}:`);
    code(r, "BAD_REQUEST", `?${q}`);
  }
});

await test("5. Sort", "sortBy + order + tie-break by plateNo", 10, async () => {
  eq(plates(await get("/cars?sortBy=dailyRate&order=desc&page=1&limit=4")), ["HKT-1062", "PTY-1065", "CNX-1059", "BKK-1056"], "priciest");
  eq(plates(await get("/cars?sortBy=dailyRate&page=1&limit=4")), ["BKK-1042", "BKK-1028", "BKK-1000", "CNX-1045"], "cheapest (900 tie -> plateNo)");
  eq(plates(await get("/cars?sortBy=seats&order=desc&page=1&limit=3")), ["BKK-1007", "CNX-1010", "HKT-1013"], "most seats");
  for (const q of ["sortBy=password", "sortBy=dailyRate&order=up"]) status(await get(`/cars?${q}`), 400, `?${q}:`);
});

await test("6. Detail", "detail DTO + weeklyRate + 404", 10, async () => {
  const r = await get("/cars/2");
  status(r, 200);
  keys(r.data, [...SUMMARY, "brand", "model", "seats", "transmission", "branch", "weeklyRate"], "detail DTO");
  eq([r.data.name, r.data.seats, r.data.transmission, r.data.weeklyRate], ["Toyota Fortuner", 7, "AUTO", 13860], "values");
  eq(r.data.branch, { id: 1, name: "Bangkok Central", city: "Bangkok" }, "branch");
  status(await get("/cars/9999"), 404);
});

let newId;
const body = { plate_no: "TST-9001", brand: "Tesla", model: "Model 3", branch_id: 5, daily_rate: 2999.99, seats: 5, transmission: "AUTO" };
await test("7. Create", "POST 201 detail DTO", 5, async () => {
  const r = await post("/cars", body);
  status(r, 201);
  newId = r.data?.id;
  assert(newId, "response must include data.id");
  eq([r.data.plateNo, r.data.name, r.data.branch.name, r.data.isAvailable, r.data.weeklyRate], ["TST-9001", "Tesla Model 3", "Hua Hin Station", true, 18899.94], "created");
});
await test("7. Create", "POST validation -> 400 BAD_REQUEST", 5, async () => {
  const ok = { ...body, plate_no: "TST-9002" };
  const bad = [{ ...ok, plate_no: "" }, { ...ok, daily_rate: 0 }, { ...ok, seats: 12 }, { ...ok, transmission: "CVT" }, { plate_no: "TST-9002", brand: "Tesla" }];
  for (const b of bad) {
    const r = await post("/cars", b);
    status(r, 400, `body ${JSON.stringify(b).slice(0, 60)}:`);
    code(r, "BAD_REQUEST");
  }
});
await test("7. Create", "duplicate plate -> 409 DUPLICATE_KEY, unknown branch -> 400 FOREIGN_KEY_NOT_FOUND", 5, async () => {
  const d = await post("/cars", { ...body, plate_no: "BKK-1000" });
  status(d, 409, "duplicate:");
  code(d, "DUPLICATE_KEY");
  const f = await post("/cars", { ...body, plate_no: "TST-9003", branch_id: 999 });
  status(f, 400, "unknown branch:");
  code(f, "FOREIGN_KEY_NOT_FOUND");
});

await test("8. Invalid JSON", "malformed JSON body -> 400 INVALID_JSON", 5, async () => {
  const res = await fetch(`${api}/cars`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"plate_no": "X",' });
  let json = null;
  try { json = JSON.parse(await res.text()); } catch {}
  assert(res.status === 400, `expected HTTP 400, got ${res.status}`);
  assert(json?.success === false && json?.error?.code === "INVALID_JSON", `expected error.code INVALID_JSON, got ${JSON.stringify(json)}`);
});

await test("9. Update/Delete", "PUT partial + 409 + 404, DELETE 204 + 404", 5, async () => {
  assert(newId, "needs POST test to pass first");
  const r = await put(`/cars/${newId}`, { daily_rate: 3200, is_available: 0 });
  status(r, 200);
  eq([r.data.dailyRate, r.data.isAvailable, r.data.plateNo], [3200, false, "TST-9001"], "updated");
  status(await put(`/cars/${newId}`, { seats: 1 }), 400, "invalid seats:");
  status(await put(`/cars/${newId}`, { plate_no: "BKK-1000" }), 409, "plate taken:");
  status(await put("/cars/9999", { daily_rate: 1 }), 404, "unknown:");
  status(await del(`/cars/${newId}`), 204, "delete:");
  status(await del(`/cars/${newId}`), 404, "delete again:");
});

summary();
