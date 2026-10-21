import * as repo from "../repositories/event.repo.js";
import * as registrationRepo from "../repositories/registration.repo.js";
import {
  toDetailDTO,
  toSummaryList,
  toRegistrationList,
  toCityStatDTO,
} from "../mappers/event.mapper.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const CATEGORIES = ["MUSIC", "TECH", "SPORT", "FOOD"];
const STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED"];
const SORT_COLUMNS = { startDate: "e.start_date", ticketPrice: "e.ticket_price", title: "e.title" };
// camelCase body → คอลัมน์ (ไม่มี venueId เพราะ PATCH ห้ามเปลี่ยน venue ส่วน POST ใส่เองแยก)
const COLUMNS = {
  title: "title",
  category: "category",
  startDate: "start_date",
  ticketPrice: "ticket_price",
  maxAttendees: "max_attendees",
  status: "status",
};

function badRequest(message) {
  return new AppError(message, httpStatus.BAD_REQUEST);
}

function validationError(details) {
  return new AppError("Validation failed", httpStatus.BAD_REQUEST, "VALIDATION_ERROR", details);
}

// YYYY-MM-DD ที่มีจริง (2026-02-31 แปลงเป็น Date แล้วจะเลื่อนเป็นมี.ค. → ไม่ตรงกับ string เดิม)
function isValidDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

const isNumeric = (s) => s.trim() !== "" && !isNaN(s);

// ---------- query ของ GET /events ----------

function parseSort(sort = "startDate") {
  const parts = sort.split(",").map((token) => {
    const desc = token.startsWith("-");
    const column = SORT_COLUMNS[desc ? token.slice(1) : token];
    if (!column) throw badRequest(`Invalid sort field '${token}'`);
    return `${column} ${desc ? "DESC" : "ASC"}`;
  });
  return [...parts, "e.id ASC"].join(", "); // โจทย์กำหนด: ค่าเท่ากันให้ตัดสินด้วย id น้อยไปมาก
}

function parseFilters({ q, city, category, status, minPrice, maxPrice, from, to }) {
  const filters = { q, city };
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) throw badRequest(`Invalid category '${category}'`);
    filters.category = category;
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw badRequest(`Invalid status '${status}'`);
    filters.status = status;
  }
  if (minPrice !== undefined) {
    if (!isNumeric(minPrice)) throw badRequest("minPrice must be a number");
    filters.minPrice = Number(minPrice);
  }
  if (maxPrice !== undefined) {
    if (!isNumeric(maxPrice)) throw badRequest("maxPrice must be a number");
    filters.maxPrice = Number(maxPrice);
  }
  if (filters.minPrice > filters.maxPrice) throw badRequest("minPrice must be <= maxPrice");
  if (from !== undefined) {
    if (!isValidDate(from)) throw badRequest("from must be a valid date YYYY-MM-DD");
    filters.from = from;
  }
  if (to !== undefined) {
    if (!isValidDate(to)) throw badRequest("to must be a valid date YYYY-MM-DD");
    filters.to = to;
  }
  if (filters.from && filters.to && filters.from > filters.to) throw badRequest("from must be <= to");
  return filters;
}

// ---------- body ของ POST/PATCH /events ----------

const RULES = {
  title: [(v) => typeof v === "string" && v.length >= 1 && v.length <= 150, "must be a string of 1-150 characters"],
  venueId: [Number.isInteger, "must be an integer"],
  category: [(v) => CATEGORIES.includes(v), `must be one of ${CATEGORIES.join(", ")}`],
  startDate: [isValidDate, "must be a valid date YYYY-MM-DD"],
  ticketPrice: [(v) => typeof v === "number" && v >= 0, "must be a number >= 0"],
  maxAttendees: [(v) => Number.isInteger(v) && v >= 1, "must be an integer >= 1"],
  status: [(v) => STATUSES.includes(v), `must be one of ${STATUSES.join(", ")}`],
};

// partial (PATCH) → ตรวจเฉพาะฟิลด์ที่ส่งมา, status ไม่บังคับทั้ง POST/PATCH
function validateEvent(body, partial) {
  const details = [];
  for (const [field, [check, message]] of Object.entries(RULES)) {
    if (body[field] === undefined && (partial || field === "status")) continue;
    if (!check(body[field])) details.push({ field, message });
  }
  if (details.length > 0) throw validationError(details);
}

function toRow(body) {
  const row = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (body[field] !== undefined) row[column] = body[field];
  }
  return row;
}

function exceedsCapacity(capacity) {
  return new AppError(
    `maxAttendees exceeds venue capacity (${capacity})`,
    httpStatus.UNPROCESSABLE_ENTITY, // 422: ข้อมูลรูปแบบถูก แต่ผิดกฎธุรกิจ
    "EXCEEDS_VENUE_CAPACITY",
  );
}

// ---------- events ----------

export async function getAllObjects(pagination, query) {
  const filters = parseFilters(query);
  const orderBy = parseSort(query.sort);
  return toSummaryList(await repo.findAll(pagination, filters, orderBy));
}

export async function getObject(id) {
  return toDetailDTO(await repo.findOne(id));
}

// ลำดับ: body ผิด (400) → venue ไม่มีจริง (400) → เกิน capacity (422)
export async function createObject(body) {
  validateEvent(body, false);
  const venue = await repo.findVenue(body.venueId);
  if (!venue) throw badRequest(`Venue with id '${body.venueId}' does not exist`);
  if (body.maxAttendees > venue.capacity) throw exceedsCapacity(venue.capacity);
  // ไม่ส่ง status → ไม่ใส่ใน row → DB default 'DRAFT'
  return toDetailDTO(await repo.create({ ...toRow(body), venue_id: body.venueId }));
}

// ลำดับ: ไม่พบ (404) → body ผิด (400) → CANCELLED (409) → เกิน capacity (422) → น้อยกว่าคนที่ลงแล้ว (409)
export async function updateObject(id, body) {
  const event = await repo.findOne(id);
  const { venueId, ...changes } = body; // venueId ห้ามเปลี่ยน → ตัดทิ้งเงียบๆ
  validateEvent(changes, true);
  if (event.status === "CANCELLED") {
    throw new AppError("Cancelled event cannot be edited", httpStatus.CONFLICT, "EVENT_CANCELLED");
  }
  if (changes.maxAttendees !== undefined) {
    if (changes.maxAttendees > event.capacity) throw exceedsCapacity(event.capacity);
    if (changes.maxAttendees < event.registered_count) {
      throw new AppError(
        `maxAttendees cannot be below registered count (${event.registered_count})`,
        httpStatus.CONFLICT,
        "BELOW_REGISTERED_COUNT",
      );
    }
  }
  return toDetailDTO(await repo.update(id, toRow(changes)));
}

export async function removeObject(id) {
  await repo.softDelete(id);
}

// ---------- registrations ----------

const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ลำดับตามโจทย์: event ไม่พบ (404) → body ผิด (400) → แล้วค่อยเช็คกฎธุรกิจใน transaction (409)
export async function register(eventId, body) {
  const event = await repo.findOne(eventId);
  const { attendeeName, attendeeEmail } = body;
  const details = [];
  if (typeof attendeeName !== "string" || attendeeName.trim() === "") {
    details.push({ field: "attendeeName", message: "must be a non-empty string" });
  }
  if (!isEmail(attendeeEmail)) details.push({ field: "attendeeEmail", message: "must be a valid email" });
  if (details.length > 0) throw validationError(details);

  const { id, seatsLeft } = await registrationRepo.register(event.id, attendeeName, attendeeEmail);
  return { id, eventId: event.id, attendeeName, attendeeEmail, seatsLeft };
}

export async function getRegistrations(eventId, pagination) {
  const event = await repo.findOne(eventId); // 404 ถ้าไม่พบ/ถูกลบ
  return toRegistrationList(await registrationRepo.findByEvent(event.id, pagination));
}

// ---------- stats ----------

export async function getCityStats() {
  return (await repo.cityStats()).map(toCityStatDTO);
}
