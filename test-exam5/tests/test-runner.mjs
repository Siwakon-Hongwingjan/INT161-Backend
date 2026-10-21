// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, patch, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEST-EXAM 5 : Event Platform API (Hard)");
const ids = (r) => r.data.map((x) => x.id);
const P = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const code = (r, c, what = "") => { errorEnvelope(r); eq(r.json.error.code, c, `${what} error.code`.trim()); };
const SUMMARY = ["id", "title", "venueName", "city", "category", "startDate", "ticketPrice", "status", "registeredCount", "seatsLeft", "isFull"];

await test("1. Identity", "GET /student-info", 5, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "EX5-KEY" }, "data");
});

await test("2. List", "summary DTO + computed seats + soft-deleted hidden", 10, async () => {
  const r = await get("/events?page=1&limit=10");
  status(r, 200);
  eq(r.json.pagination, P(29, 1, 10), "pagination (event 29 is soft-deleted)");
  keys(r.data[0], SUMMARY, "summary DTO");
  const all = (await get("/events?page=1&limit=100")).data;
  assert(!all.some((e) => e.id === 29), "soft-deleted event 29 must not be listed");
  eq(all.find((e) => e.id === 8), { id: 8, title: "Event 08 Live", venueName: "Bangkok Hall", city: "Bangkok", category: "MUSIC", startDate: "2026-09-09", ticketPrice: 720, status: "PUBLISHED", registeredCount: 5, seatsLeft: 0, isFull: true }, "event 8 (full)");
  eq(all.find((e) => e.id === 1).seatsLeft, 8, "event 1 seatsLeft");
  eq((await get("/events")).json.pagination, P(29, 1, 20), "default page=1 limit=20");
});

await test("3. Filters", "q / city / category / status", 10, async () => {
  const a = await get("/events?q=summit&page=1&limit=50");
  eq(a.json.pagination.total, 7, "q=summit");
  assert(a.data.every((e) => /summit/i.test(e.title)), "titles must contain 'summit'");
  const b = await get("/events?q=SUMMIT&status=PUBLISHED&page=1&limit=50");
  eq(ids(b).sort((x, y) => x - y), [1, 5, 13, 21, 25], "q + status");
  eq((await get("/events?city=Bangkok&page=1&limit=50")).json.pagination.total, 7, "city=Bangkok");
  eq((await get("/events?category=MUSIC&page=1&limit=50")).json.pagination.total, 7, "category=MUSIC");
  eq((await get("/events?category=TECH&status=PUBLISHED&page=1&limit=50")).json.pagination.total, 5, "TECH + PUBLISHED");
});
await test("3. Filters", "minPrice / maxPrice / from / to + combined consistency", 8, async () => {
  eq((await get("/events?minPrice=500&maxPrice=1000&page=1&limit=50")).json.pagination.total, 11, "price range");
  eq((await get("/events?from=2026-09-01&page=1&limit=50")).json.pagination.total, 19, "from");
  const all = (await get("/events?page=1&limit=100")).data;
  const exp = all.filter((e) => e.city === "Bangkok" && e.status === "PUBLISHED" && e.ticketPrice <= 800 && e.startDate >= "2026-08-15" && e.startDate <= "2026-12-31");
  const r = await get("/events?city=Bangkok&status=PUBLISHED&maxPrice=800&from=2026-08-15&to=2026-12-31&page=1&limit=50");
  eq([r.json.pagination.total, ids(r).sort((x, y) => x - y)], [exp.length, ids({ data: exp }).sort((x, y) => x - y)], "combined filters");
  assert(exp.length > 0, "(test data sanity) combined filter should match something");
});

await test("4. Sort", "?sort= multi-field", 7, async () => {
  eq(ids(await get("/events?sort=startDate,-ticketPrice&page=1&limit=5")), [30, 6, 12, 18, 24], "startDate asc");
  const l = (await get("/events?sort=-ticketPrice,title&page=1&limit=100")).data;
  for (let i = 1; i < l.length; i++) {
    const [p, c] = [l[i - 1], l[i]];
    assert(p.ticketPrice > c.ticketPrice || (p.ticketPrice === c.ticketPrice && p.title <= c.title), `bad order at ${i}: ${p.ticketPrice}/${p.title} then ${c.ticketPrice}/${c.title}`);
  }
});
await test("5. List validation", "bad query params -> 400", 5, async () => {
  for (const q of ["page=0", "page=x", "limit=0", "limit=101", "category=FOO", "status=foo", "minPrice=abc", "minPrice=500&maxPrice=100", "from=2026-02-31", "from=2026-12-01&to=2026-01-01", "sort=deletedAt"]) {
    const r = await get(`/events?${q}`);
    status(r, 400, `?${q}:`);
    errorEnvelope(r);
  }
});

await test("6. Detail", "nested venue + seats + 404 (also for soft-deleted)", 5, async () => {
  const r = await get("/events/3");
  status(r, 200);
  keys(r.data, ["id", "title", "venue", "category", "startDate", "ticketPrice", "maxAttendees", "status", "registeredCount", "seatsLeft", "isFull"], "detail DTO");
  eq(r.data.venue, { id: 4, name: "Khon Kaen Center", city: "Khon Kaen", capacity: 100 }, "venue");
  eq([r.data.maxAttendees, r.data.seatsLeft, r.data.isFull], [50, 50, false], "seat numbers");
  status(await get("/events/9999"), 404, "unknown:");
  status(await get("/events/29"), 404, "soft-deleted:");
});

let eid;
const body = { title: "Exam Night", venueId: 4, category: "TECH", startDate: "2026-12-24", ticketPrice: 150, maxAttendees: 2, status: "PUBLISHED" };
await test("7. Create event", "POST 201 detail DTO (status defaults to DRAFT)", 5, async () => {
  const r = await post("/events", body);
  status(r, 201);
  eid = r.data?.id;
  assert(eid, "response must include data.id");
  eq([r.data.venue.city, r.data.seatsLeft, r.data.status, r.data.startDate], ["Khon Kaen", 2, "PUBLISHED", "2026-12-24"], "created");
  const d = await post("/events", { ...body, title: "Draft Night", status: undefined });
  status(d, 201, "without status:");
  eq(d.data.status, "DRAFT", "default status");
  status(await del(`/events/${d.data.id}`), 204, "cleanup:");
});
await test("7. Create event", "validation 400 details[], unknown venue 400, over capacity 422", 7, async () => {
  const v = await post("/events", { title: "", venueId: "4", category: "ART", startDate: "24-12-2026", ticketPrice: -1, maxAttendees: 0 });
  status(v, 400, "invalid body:");
  errorEnvelope(v);
  eq((v.json.error.details || []).map((d) => d.field).sort(), ["category", "maxAttendees", "startDate", "ticketPrice", "title", "venueId"], "error.details[].field");
  status(await post("/events", { ...body, venueId: 999 }), 400, "unknown venue:");
  const c = await post("/events", { ...body, maxAttendees: 101 });
  status(c, 422, "venue 4 capacity is 100:");
  code(c, "EXCEEDS_VENUE_CAPACITY");
});

await test("8. Edit event", "PATCH partial / rules (409, 422) / 404", 5, async () => {
  assert(eid, "needs POST test to pass first");
  const r = await patch(`/events/${eid}`, { ticketPrice: 200, title: "Exam Night II" });
  status(r, 200);
  eq([r.data.ticketPrice, r.data.title, r.data.maxAttendees], [200, "Exam Night II", 2], "patched");
  const c = await patch("/events/4", { ticketPrice: 1 });
  status(c, 409, "cancelled event:");
  code(c, "EVENT_CANCELLED");
  const b = await patch("/events/8", { maxAttendees: 4 });
  status(b, 409, "below registeredCount (5):");
  code(b, "BELOW_REGISTERED_COUNT");
  status(await patch("/events/3", { maxAttendees: 101 }), 422, "over capacity:");
  status(await patch("/events/9999", { ticketPrice: 1 }), 404, "unknown:");
});

await test("9. Registrations", "POST 201 + seatsLeft, validation 400, 404", 6, async () => {
  assert(eid, "needs POST test to pass first");
  const r = await post(`/events/${eid}/registrations`, { attendeeName: "Alice", attendeeEmail: "alice@example.com" });
  status(r, 201);
  keys(r.data, ["id", "eventId", "attendeeName", "attendeeEmail", "seatsLeft"], "registration DTO");
  eq([r.data.eventId, r.data.seatsLeft], [eid, 1], "eventId/seatsLeft");
  const v = await post(`/events/${eid}/registrations`, { attendeeName: "", attendeeEmail: "not-an-email" });
  status(v, 400, "invalid body:");
  eq((v.json?.error?.details || []).map((d) => d.field).sort(), ["attendeeEmail", "attendeeName"], "error.details[].field");
  status(await post("/events/9999/registrations", { attendeeName: "A", attendeeEmail: "a@example.com" }), 404, "unknown event:");
});
await test("9. Registrations", "409 DUPLICATE_REGISTRATION / EVENT_FULL / EVENT_NOT_OPEN", 9, async () => {
  assert(eid, "needs POST test to pass first");
  const d = await post(`/events/${eid}/registrations`, { attendeeName: "Alice again", attendeeEmail: "alice@example.com" });
  status(d, 409, "duplicate email:");
  code(d, "DUPLICATE_REGISTRATION");
  status(await post(`/events/${eid}/registrations`, { attendeeName: "Bob", attendeeEmail: "bob@example.com" }), 201, "2nd seat:");
  const f = await post(`/events/${eid}/registrations`, { attendeeName: "Carol", attendeeEmail: "carol@example.com" });
  status(f, 409, "3rd attendee on a 2-seat event:");
  code(f, "EVENT_FULL");
  const seed = await post("/events/8/registrations", { attendeeName: "Late", attendeeEmail: "late@example.com" });
  status(seed, 409, "seed event 8 is full:");
  code(seed, "EVENT_FULL", "seed event 8");
  const dr = await post("/events/2/registrations", { attendeeName: "X", attendeeEmail: "x@example.com" });
  status(dr, 409, "DRAFT event:");
  code(dr, "EVENT_NOT_OPEN");
  status(await post("/events/4/registrations", { attendeeName: "X", attendeeEmail: "x@example.com" }), 409, "CANCELLED event:");
  const g = await get(`/events/${eid}`);
  eq([g.data.registeredCount, g.data.seatsLeft, g.data.isFull], [2, 0, true], "event is now full");
});
await test("9. Registrations", "GET /events/:id/registrations paginated + 404", 5, async () => {
  assert(eid, "needs POST test to pass first");
  const r = await get(`/events/${eid}/registrations?page=1&limit=1`);
  status(r, 200);
  eq(r.json.pagination, P(2, 1, 1), "pagination");
  eq(r.data.map((x) => x.attendeeEmail), ["alice@example.com"], "first registration");
  const s = await get("/events/2/registrations?page=1&limit=20");
  eq([s.json.pagination.total, s.data.length], [10, 10], "seed event 2 has 10 registrations");
  status(await get("/events/9999/registrations?page=1&limit=5"), 404, "unknown:");
});

await test("10. Soft delete", "DELETE 204 -> hidden everywhere -> 404", 5, async () => {
  assert(eid, "needs POST test to pass first");
  status(await del(`/events/${eid}`), 204);
  status(await get(`/events/${eid}`), 404, "detail after delete:");
  status(await del(`/events/${eid}`), 404, "delete again:");
  assert(!ids(await get("/events?page=1&limit=100")).includes(eid), "deleted event must not be listed");
});

await test("11. Stats", "GET /stats/cities (GROUP BY, sorted)", 8, async () => {
  const r = await get("/stats/cities");
  status(r, 200);
  eq(r.data, [
    { city: "Phuket", eventCount: 8, totalRegistrations: 10, avgTicketPrice: 690 },
    { city: "Bangkok", eventCount: 7, totalRegistrations: 11, avgTicketPrice: 797.14 },
    { city: "Chiang Mai", eventCount: 7, totalRegistrations: 3, avgTicketPrice: 527.14 },
    { city: "Khon Kaen", eventCount: 7, totalRegistrations: 0, avgTicketPrice: 707.14 },
  ], "stats (soft-deleted events excluded, cities without registrations kept)");
});

summary();
