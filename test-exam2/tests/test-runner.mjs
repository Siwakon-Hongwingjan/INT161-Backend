// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, put, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEST-EXAM 2 : Hotel Rooms API (Easy)");
const ids = (r) => r.data.map((x) => x.roomNumber);

await test("1. Identity", "GET /student-info", 10, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "EX2-KEY" }, "data");
});

await test("2. Room types", "list + by id + 404", 10, async () => {
  const l = await get("/room-types");
  status(l, 200);
  eq(l.data.map((x) => x.name), ["Standard", "Deluxe", "Family", "Suite"], "names");
  keys(l.data[0], ["id", "name", "bedType", "maxGuests", "basePrice"], "room type DTO");
  eq(l.data[3].basePrice, 4500, "Suite basePrice must be a number");
  const o = await get("/room-types/3");
  status(o, 200);
  eq(o.data.maxGuests, 4, "maxGuests");
  status(await get("/room-types/999"), 404);
});

await test("3. Rooms list", "pagination envelope", 8, async () => {
  const r = await get("/rooms?page=2&limit=15");
  status(r, 200);
  eq(r.json.pagination, { total: 40, page: 2, limit: 15, totalPages: 3, hasNextPage: true, hasPrevPage: true }, "pagination");
  eq(r.data.length, 15, "items on page 2");
});
await test("3. Rooms list", "summary DTO", 7, async () => {
  const r = await get("/rooms?page=1&limit=5");
  keys(r.data[0], ["id", "roomNumber", "floor", "typeName", "pricePerNight", "status"], "summary DTO");
  eq([r.data[0].roomNumber, r.data[0].typeName, r.data[0].pricePerNight], ["101", "Standard", 1300], "first room");
  eq(ids(r), ["101", "102", "103", "104", "105"], "default order is roomNumber asc");
});

await test("4. Filter", "?status= keeps pagination.total in sync", 10, async () => {
  const r = await get("/rooms?status=AVAILABLE&page=1&limit=8");
  eq(r.json.pagination, { total: 20, page: 1, limit: 8, totalPages: 3, hasNextPage: true, hasPrevPage: false }, "pagination");
  assert(r.data.every((x) => x.status === "AVAILABLE"), "every item must be AVAILABLE");
  const m = await get("/rooms?status=MAINTENANCE&page=1&limit=20");
  eq(m.json.pagination.total, 8, "MAINTENANCE total");
});
await test("4. Filter", "combine floor + roomTypeId + status", 10, async () => {
  const a = await get("/rooms?floor=3&page=1&limit=20");
  eq([a.json.pagination.total, a.data.every((x) => x.floor === 3)], [8, true], "floor=3");
  const b = await get("/rooms?floor=3&status=AVAILABLE&page=1&limit=20");
  status(b, 200);
  eq([b.data.length, b.json.pagination.total, b.json.pagination.totalPages], [0, 0, 0], "floor 3 has no AVAILABLE room");
  const c = await get("/rooms?roomTypeId=4&status=AVAILABLE&page=1&limit=20");
  eq(ids(c), ["108", "408", "508"], "available suites (default sort)");
  assert(c.data.every((x) => x.typeName === "Suite"), "typeName must be Suite");
});

await test("5. Sort", "sortBy + order", 10, async () => {
  const a = await get("/rooms?sortBy=pricePerNight&order=asc&page=1&limit=3");
  eq(ids(a), ["101", "102", "103"], "cheapest 3");
  const d = await get("/rooms?sortBy=pricePerNight&order=desc&page=1&limit=3");
  eq(ids(d), ["508", "408", "308"], "priciest 3");
  const bad = await get("/rooms?sortBy=password&page=1&limit=3");
  status(bad, 400, "unknown sortBy:");
  errorEnvelope(bad);
});

await test("6. Detail", "detail DTO + priceWithVat + 404", 10, async () => {
  const r = await get("/rooms/1");
  status(r, 200);
  keys(r.data, ["id", "roomNumber", "floor", "typeName", "pricePerNight", "status", "roomType", "hasView", "priceWithVat"], "detail DTO");
  keys(r.data.roomType, ["id", "name", "bedType", "maxGuests"], "roomType");
  eq([r.data.pricePerNight, r.data.priceWithVat, r.data.hasView], [1300, 1391, false], "price/vat/hasView");
  eq((await get("/rooms/8")).data.hasView, true, "room 108 hasView");
  status(await get("/rooms/9999"), 404);
});

let newId;
const body = { room_number: "999", floor: 9, room_type_id: 2, price_per_night: 2500, status: "AVAILABLE", has_view: 1 };
await test("7. Create", "POST 201 + 409 duplicate room number", 10, async () => {
  const r = await post("/rooms", body);
  status(r, 201);
  newId = r.data?.id;
  assert(newId, "response must include data.id");
  eq([r.data.roomNumber, r.data.typeName, r.data.priceWithVat], ["999", "Deluxe", 2675], "created room");
  const dup = await post("/rooms", body);
  status(dup, 409, "duplicate:");
  errorEnvelope(dup);
});
await test("7. Create", "POST validation -> 400", 5, async () => {
  const a = await post("/rooms", { floor: 9, room_type_id: 2, price_per_night: 2500 });
  status(a, 400, "missing room_number:");
  errorEnvelope(a);
  status(await post("/rooms", { ...body, room_number: "998", price_per_night: -5 }), 400, "negative price:");
});

await test("8. Update", "PUT 200 + 404", 5, async () => {
  assert(newId, "needs POST test to pass first");
  const r = await put(`/rooms/${newId}`, { status: "MAINTENANCE", price_per_night: 3000 });
  status(r, 200);
  eq([r.data.status, r.data.pricePerNight, r.data.roomNumber], ["MAINTENANCE", 3000, "999"], "updated");
  status(await put("/rooms/9999", { status: "AVAILABLE" }), 404);
});
await test("9. Delete", "DELETE 204 then 404", 5, async () => {
  assert(newId, "needs POST test to pass first");
  status(await del(`/rooms/${newId}`), 204);
  status(await get(`/rooms/${newId}`), 404, "after delete:");
});

summary();
