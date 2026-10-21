// Usage: node tests/test-runner.mjs [studentId] [port]
import { get, post, put, del, test, start, summary, status, eq, keys, assert, errorEnvelope } from "./harness.mjs";

await start("TEST-EXAM 3 : Clinic Doctors API (Medium)");
const lic = (r) => r.data.map((x) => x.licenseNo);

await test("1. Identity", "GET /student-info", 10, async () => {
  const r = await get("/student-info");
  status(r, 200);
  eq(r.data, { studentId: "67130500001", name: "Practice Student", secretKey: "EX3-KEY" }, "data");
});
await test("2. Departments", "GET /departments", 5, async () => {
  const r = await get("/departments");
  status(r, 200);
  eq(r.data.map((x) => x.name), ["Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Neurology"], "names");
});

await test("3. Doctors list", "pagination + summary DTO", 10, async () => {
  const r = await get("/doctors?page=1&limit=10");
  status(r, 200);
  eq(r.json.pagination, { total: 45, page: 1, limit: 10, totalPages: 5, hasNextPage: true, hasPrevPage: false }, "pagination");
  keys(r.data[0], ["id", "licenseNo", "fullName", "departmentName", "yearsExperience", "experienceLevel", "consultationFee", "isActive"], "summary DTO");
  eq(r.data[0], { id: 1, licenseNo: "LIC-0001", fullName: "Dr. Somsri Rakthai", departmentName: "Dermatology", yearsExperience: 3, experienceLevel: "JUNIOR", consultationFee: 350, isActive: true }, "doctor 1");
  assert(r.data.find((d) => d.id === 8)?.isActive === false, "doctor 8 must be isActive=false (boolean)");
});
await test("3. Doctors list", "experienceLevel boundaries (<5 / 5-14 / >=15)", 5, async () => {
  const r = await get("/doctors?page=1&limit=100");
  const n = (l) => r.data.filter((d) => d.experienceLevel === l).length;
  eq([n("JUNIOR"), n("SENIOR"), n("EXPERT")], [9, 19, 17], "JUNIOR/SENIOR/EXPERT counts");
});

await test("4. Search", "?q= matches first OR last name, case-insensitive, total in sync", 10, async () => {
  const r = await get("/doctors?q=SOM&page=1&limit=4");
  status(r, 200);
  eq(r.json.pagination, { total: 10, page: 1, limit: 4, totalPages: 3, hasNextPage: true, hasPrevPage: false }, "pagination");
  assert(r.data.every((d) => /som/i.test(d.fullName)), "every result must contain 'som'");
  const l = await get("/doctors?q=wongsa&page=1&limit=50");
  assert(l.json.pagination.total === 9 && l.data.every((d) => /wongsa/i.test(d.fullName)), `q=wongsa expected 9 by last name, got ${l.json.pagination?.total}`);
  eq((await get("/doctors?q=zzzz&page=1&limit=5")).json.pagination.total, 0, "no match total");
});
await test("4. Search", "combine q + departmentId + isActive + minExperience", 10, async () => {
  const a = await get("/doctors?departmentId=1&isActive=true&page=1&limit=50");
  eq(a.json.pagination.total, 8, "dept 1 active");
  const b = await get("/doctors?minExperience=10&departmentId=2&page=1&limit=50");
  eq(b.json.pagination.total, 5, "dept 2 exp>=10");
  assert(b.data.every((d) => d.yearsExperience >= 10 && d.departmentName === "Dermatology"), "filters must all apply");
  const c = await get("/doctors?q=malee&minExperience=5&isActive=true&page=1&limit=50");
  eq(c.json.pagination.total, 5, "q+exp+active");
  const f = await get("/doctors?isActive=false&page=1&limit=50");
  eq(f.json.pagination.total, 5, "inactive");
});

await test("5. Sort", "?sort=-consultationFee,licenseNo (multi-field, '-' = desc)", 10, async () => {
  const r = await get("/doctors?sort=-consultationFee,licenseNo&page=1&limit=3");
  eq(lic(r), ["LIC-0023", "LIC-0022", "LIC-0021"], "top fees");
  const a = await get("/doctors?sort=yearsExperience,-licenseNo&page=1&limit=3");
  eq(a.data.map((d) => d.yearsExperience), [0, 1, 1], "lowest experience first");
  const bad = await get("/doctors?sort=password&page=1&limit=3");
  status(bad, 400, "unknown sort field:");
  errorEnvelope(bad);
});

await test("6. Detail", "detail DTO + bookedAppointments + 404", 10, async () => {
  const r = await get("/doctors/1");
  status(r, 200);
  keys(r.data, ["id", "licenseNo", "fullName", "departmentName", "yearsExperience", "experienceLevel", "consultationFee", "isActive", "department", "bookedAppointments", "createdAt"], "detail DTO");
  eq(r.data.department, { id: 2, name: "Dermatology" }, "department");
  eq(r.data.bookedAppointments, 2, "doctor 1 has 3 appointments, 1 CANCELLED");
  eq((await get("/doctors/4")).data.bookedAppointments, 0, "doctor 4 has none");
  status(await get("/doctors/9999"), 404);
});

let newId;
const body = { licenseNo: "LIC-TEST", firstName: "Test", lastName: "Doctor", departmentId: 3, yearsExperience: 15, consultationFee: 999.5 };
await test("7. Create", "POST camelCase body -> 201 detail DTO", 5, async () => {
  const r = await post("/doctors", body);
  status(r, 201);
  newId = r.data?.id;
  assert(newId, "response must include data.id");
  eq([r.data.fullName, r.data.experienceLevel, r.data.consultationFee, r.data.department.name], ["Dr. Test Doctor", "EXPERT", 999.5, "Pediatrics"], "created");
});
await test("7. Create", "POST validation -> 400 with error.details[]", 10, async () => {
  const r = await post("/doctors", { licenseNo: "", firstName: "X", yearsExperience: -1, consultationFee: 0 });
  status(r, 400);
  errorEnvelope(r);
  const f = (r.json.error.details || []).map((d) => d.field).sort();
  eq(f, ["consultationFee", "departmentId", "lastName", "licenseNo", "yearsExperience"], "invalid fields listed in error.details[].field");
  assert((r.json.error.details || []).every((d) => d.message), "each detail needs a message");
});
await test("7. Create", "POST duplicate licenseNo -> 409, unknown department -> 400", 5, async () => {
  status(await post("/doctors", body), 409, "duplicate:");
  status(await post("/doctors", { ...body, licenseNo: "LIC-T2", departmentId: 999 }), 400, "unknown department:");
});

await test("8. Update", "PUT partial camelCase + validation + 404", 5, async () => {
  assert(newId, "needs POST test to pass first");
  const r = await put(`/doctors/${newId}`, { consultationFee: 1200, isActive: false });
  status(r, 200);
  eq([r.data.consultationFee, r.data.isActive, r.data.licenseNo], [1200, false, "LIC-TEST"], "updated");
  status(await put(`/doctors/${newId}`, { consultationFee: -1 }), 400, "invalid fee:");
  status(await put("/doctors/9999", { consultationFee: 10 }), 404, "not found:");
});

await test("9. Delete", "204 / 409 when doctor has appointments / 404", 5, async () => {
  assert(newId, "needs POST test to pass first");
  const c = await del("/doctors/1");
  status(c, 409, "doctor with appointments:");
  errorEnvelope(c);
  status(await del(`/doctors/${newId}`), 204, "free doctor:");
  status(await del(`/doctors/${newId}`), 404, "again:");
});

summary();
