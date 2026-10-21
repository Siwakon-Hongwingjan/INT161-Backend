// Usage: node tests/test-runner.mjs [studentId] [port]
import { base, get, post, patch, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEMPLATE-EXAM 4 : Helpdesk Tickets (Medium-Hard)");
const nos = (r) => r.data.map((x) => x.ticketNo);
const code = (r, c, what = "") => { errorEnvelope(r); eq(r.json.error.code, c, `${what} error.code`.trim()); };
const P = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const SUMMARY = ["id", "ticketNo", "title", "priority", "status", "technicianName", "openedOn", "dueOn"];

// เก็บกวาดถ้ารอบก่อนค้าง: ทำให้เป็นสถานะสุดท้ายแล้วลบ
for (const t of (await get("/tickets?q=Exam%20runner&limit=50")).data || []) {
  for (const s of ["CANCELLED", "CLOSED"]) await patch(`/tickets/${t.id}/status`, { status: s });
  await del(`/tickets/${t.id}`);
}

await test("1. Identity", "GET /student-info", 5, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "TP4-KEY" }, "data");
});

await test("2. Technicians", "GET /technicians with activeTickets", 5, async () => {
  const r = await get("/technicians");
  status(r, 200);
  keys(r.data[0], ["id", "name", "level", "isActive", "activeTickets"], "technician DTO");
  eq(r.data.map((t) => [t.name, t.isActive, t.activeTickets]), [["Anan Support", true, 3], ["Benja Fixit", true, 3], ["Chai Network", true, 3], ["Dara Desk", true, 5], ["Ekk Hardware", true, 4], ["Fon Retired", false, 0]], "name/isActive/activeTickets");
});

await test("3. List", "summary DTO with dueOn", 5, async () => {
  const r = await get("/tickets?page=1&limit=4");
  status(r, 200);
  keys(r.data[0], SUMMARY, "summary DTO");
  eq(r.data[0], { id: 1, ticketNo: "TCK-0001", title: "VPN cannot connect on floor 2", priority: "URGENT", status: "IN_PROGRESS", technicianName: "Dara Desk", openedOn: "2026-01-12", dueOn: "2026-01-13" }, "TCK-0001");
  eq([r.data[3].technicianName, r.data[3].dueOn], [null, "2026-02-28"], "TCK-0004 (no technician, LOW +14d)");
  const p2 = await get("/tickets?page=2&limit=10");
  eq([p2.data[1].ticketNo, p2.data[1].dueOn], ["TCK-0012", "2026-03-08"], "TCK-0012 (LOW, 2026-02-22 + 14d crosses month)");
});
await test("3. List", "default pagination page=1 limit=10", 5, async () => {
  const r = await get("/tickets");
  status(r, 200);
  eq([r.data.length, r.json.pagination], [10, P(48, 1, 10)], "items/pagination");
});

await test("4. Filters", "status / priority comma lists", 5, async () => {
  eq((await get("/tickets?status=OPEN,IN_PROGRESS")).json.pagination.total, 30, "OPEN,IN_PROGRESS");
  const r = await get("/tickets?priority=URGENT,HIGH&status=IN_PROGRESS&limit=50");
  eq(r.json.pagination.total, 12, "URGENT/HIGH in progress");
  assert(r.data.every((t) => ["URGENT", "HIGH"].includes(t.priority) && t.status === "IN_PROGRESS"), "filters must all apply");
});
await test("4. Filters", "technicianId (number / none) + q", 5, async () => {
  eq((await get("/tickets?technicianId=none")).json.pagination.total, 18, "unassigned");
  eq((await get("/tickets?technicianId=none&status=OPEN")).json.pagination.total, 12, "unassigned OPEN");
  eq(nos(await get("/tickets?technicianId=4&status=OPEN,IN_PROGRESS")), ["TCK-0001", "TCK-0006", "TCK-0041", "TCK-0046", "TCK-0048"], "Dara's active tickets");
  eq(nos(await get("/tickets?q=VPN")), ["TCK-0001", "TCK-0009", "TCK-0017", "TCK-0025", "TCK-0033", "TCK-0041"], "q=VPN");
});
await test("4. Filters", "from / to (inclusive)", 5, async () => {
  eq((await get("/tickets?from=2026-01-01&to=2026-01-31")).json.pagination.total, 19, "January");
  eq((await get("/tickets?from=2026-03-01")).json.pagination.total, 12, "from March");
  const f = await get("/tickets?from=2026-02-10&to=2026-02-20&priority=LOW");
  eq(f.json.pagination.total, 3, "10..20 Feb LOW");
  assert(f.data.every((t) => t.openedOn >= "2026-02-10" && t.openedOn <= "2026-02-20"), "openedOn inside range");
});

await test("5. Sort", "priority by severity (not alphabetical) + multi-field", 10, async () => {
  eq(nos(await get("/tickets?sort=-priority,openedOn&limit=4")), ["TCK-0037", "TCK-0001", "TCK-0045", "TCK-0009"], "URGENT first, oldest first");
  eq(nos(await get("/tickets?sort=priority&limit=3")), ["TCK-0004", "TCK-0008", "TCK-0012"], "LOW first (ties by id)");
  eq(nos(await get("/tickets?sort=-openedOn&limit=3")), ["TCK-0029", "TCK-0007", "TCK-0036"], "newest first");
});

await test("6. Query validation", "bad query -> 400 BAD_REQUEST", 10, async () => {
  for (const q of ["page=0", "page=x", "limit=0", "limit=51", "status=open", "status=OPEN,FOO", "priority=CRITICAL", "technicianId=abc", "from=2026-02-30", "from=2026-03-01&to=2026-01-01", "sort=title"]) {
    const r = await get(`/tickets?${q}`);
    status(r, 400, `?${q}:`);
    code(r, "BAD_REQUEST", `?${q}`);
  }
});

await test("7. Detail", "detail DTO + technician null + 404", 5, async () => {
  const r = await get("/tickets/2");
  status(r, 200);
  keys(r.data, [...SUMMARY, "slaDays", "resolvedOn", "technician"], "detail DTO");
  eq([r.data.slaDays, r.data.resolvedOn, r.data.technician], [3, "2026-01-26", { id: 2, name: "Benja Fixit", level: "L2" }], "TCK-0002");
  eq([(await get("/tickets/4")).data.technician, (await get("/tickets/4")).data.resolvedOn], [null, null], "TCK-0004 nulls");
  const nf = await get("/tickets/9999");
  status(nf, 404);
  code(nf, "NOT_FOUND");
});

let id;
const body = { ticketNo: "TCK-9001", title: "Exam runner ticket", priority: "HIGH", openedOn: "2026-03-30" };
await test("8. Create", "POST 201 + validation details + 409", 10, async () => {
  const r = await post("/tickets", body);
  status(r, 201);
  id = r.data?.id;
  assert(id, "response must include data.id");
  eq([r.data.status, r.data.technician, r.data.dueOn, r.data.resolvedOn], ["OPEN", null, "2026-04-02", null], "created");
  const v = await post("/tickets", { ticketNo: "T-1", title: "ab", priority: "high", openedOn: "2026-02-30" });
  status(v, 400, "invalid body:");
  code(v, "VALIDATION_ERROR");
  eq((v.json.error.details || []).map((d) => d.field).sort(), ["openedOn", "priority", "ticketNo", "title"], "error.details[].field");
  const d = await post("/tickets", { ...body, ticketNo: "TCK-0001" });
  status(d, 409, "duplicate:");
  code(d, "DUPLICATE_KEY");
});

await test("9. Assign", "assign rules (422 / 400 / 409) then success", 10, async () => {
  assert(id, "needs POST test to pass first");
  const n = await patch(`/tickets/${id}/status`, { status: "IN_PROGRESS" });
  status(n, 422, "start without technician:");
  code(n, "TECHNICIAN_REQUIRED");
  const inactive = await patch(`/tickets/${id}/assign`, { technicianId: 6 });
  status(inactive, 422, "inactive technician:");
  code(inactive, "TECHNICIAN_INACTIVE");
  const unknown = await patch(`/tickets/${id}/assign`, { technicianId: 999 });
  status(unknown, 400, "unknown technician:");
  code(unknown, "TECHNICIAN_NOT_FOUND");
  const bad = await patch(`/tickets/${id}/assign`, { technicianId: "2" });
  status(bad, 400, "string technicianId:");
  code(bad, "VALIDATION_ERROR");
  const closed = await patch("/tickets/3/assign", { technicianId: 1 });
  status(closed, 409, "CLOSED ticket:");
  code(closed, "TICKET_CLOSED");
  status(await patch("/tickets/9999/assign", { technicianId: 1 }), 404, "unknown ticket:");
  const ok = await patch(`/tickets/${id}/assign`, { technicianId: 2 });
  status(ok, 200, "assign:");
  eq([ok.data.technicianName, ok.data.technician], ["Benja Fixit", { id: 2, name: "Benja Fixit", level: "L2" }], "assigned");
});

await test("10. Status flow", "OPEN->IN_PROGRESS->RESOLVED->IN_PROGRESS->RESOLVED->CLOSED + illegal moves", 10, async () => {
  assert(id, "needs POST test to pass first");
  status(await patch(`/tickets/${id}/status`, { status: "IN_PROGRESS" }), 200, "start:");
  const res = await patch(`/tickets/${id}/status`, { status: "RESOLVED" });
  status(res, 200, "resolve:");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(res.data.resolvedOn), `resolvedOn must be YYYY-MM-DD, got ${res.data.resolvedOn}`);
  const re = await patch(`/tickets/${id}/status`, { status: "IN_PROGRESS" });
  status(re, 200, "reopen:");
  eq([re.data.status, re.data.resolvedOn], ["IN_PROGRESS", null], "reopen clears resolvedOn");
  status(await patch(`/tickets/${id}/status`, { status: "RESOLVED" }), 200, "resolve again:");
  status(await patch(`/tickets/${id}/status`, { status: "CLOSED" }), 200, "close:");
  const x = await patch(`/tickets/${id}/status`, { status: "OPEN" });
  status(x, 409, "CLOSED->OPEN:");
  code(x, "INVALID_STATUS_TRANSITION");
  status(await patch("/tickets/5/status", { status: "IN_PROGRESS" }), 409, "seed CANCELLED->IN_PROGRESS:");
  status(await patch("/tickets/4/status", { status: "RESOLVED" }), 409, "seed OPEN->RESOLVED:");
  status(await patch("/tickets/4/status", { status: "DONE" }), 400, "unknown status:");
  status(await patch("/tickets/9999/status", { status: "OPEN" }), 404, "unknown ticket:");
});

await test("11. Delete", "only CANCELLED/CLOSED (204) else 409, then 404", 5, async () => {
  assert(id, "needs POST test to pass first");
  const x = await del("/tickets/1");
  status(x, 409, "IN_PROGRESS ticket:");
  code(x, "TICKET_NOT_DELETABLE");
  status(await del(`/tickets/${id}`), 204, "CLOSED ticket:");
  status(await del(`/tickets/${id}`), 404, "again:");
});

await test("12. Unknown route", "404 NOT_FOUND as JSON for any unknown path", 5, async () => {
  for (const [method, path] of [["GET", "/api/67130500001/no-such-thing"], ["POST", "/api/67130500001/tickets/1/close"], ["GET", "/hello"]]) {
    const res = await fetch(base + path, { method });
    let json = null;
    try { json = JSON.parse(await res.text()); } catch {}
    assert(res.status === 404, `${method} ${path}: expected 404, got ${res.status}`);
    assert(json?.success === false && json?.error?.code === "NOT_FOUND", `${method} ${path}: expected JSON error NOT_FOUND, got ${JSON.stringify(json)}`);
  }
});

summary();
