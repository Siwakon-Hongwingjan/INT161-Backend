import * as repo from "../repositories/order.repo.js";
import { toDetailDTO, toSummaryList } from "../mappers/order.mapper.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];
// state machine: สถานะปัจจุบัน → สถานะที่ไปต่อได้ (SHIPPED/CANCELLED เป็นสถานะสุดท้าย)
const TRANSITIONS = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: [],
  CANCELLED: [],
};
const SORT_COLUMNS = { totalAmount: "o.total_amount", placedAt: "o.placed_at", orderNo: "o.order_no" };

function badRequest(message) {
  return new AppError(message, httpStatus.BAD_REQUEST);
}

// ต้องเป็นรูปแบบ YYYY-MM-DD และเป็นวันที่มีจริง
// new Date("2026-02-31") ไม่ error แต่จะเลื่อนเป็น 3 มี.ค. → แปลงกลับแล้วต้องได้ string เดิม
function isValidDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

const isNumeric = (s) => s.trim() !== "" && !isNaN(s);

function parseSort(sort = "orderNo") {
  const parts = sort.split(",").map((token) => {
    const desc = token.startsWith("-");
    const column = SORT_COLUMNS[desc ? token.slice(1) : token];
    if (!column) throw badRequest(`Invalid sort field '${token}'`);
    return `${column} ${desc ? "DESC" : "ASC"}`;
  });
  return [...parts, "o.id ASC"].join(", ");
}

// query ที่ผิดทุกกรณีต้อง 400 (ไม่ใช่ปล่อยไปให้ SQL error เป็น 500 หรือได้ list ว่าง)
function parseFilters({ status, customerId, minTotal, maxTotal, from, to }) {
  const filters = {};
  if (status !== undefined) {
    const statuses = status.split(",");
    // เทียบตรงตัว ("paid" ไม่ผ่าน)
    if (!statuses.every((s) => STATUSES.includes(s))) throw badRequest(`Invalid status '${status}'`);
    filters.statuses = statuses;
  }
  if (customerId !== undefined) {
    if (!/^\d+$/.test(customerId)) throw badRequest("customerId must be an integer");
    filters.customerId = Number(customerId);
  }
  if (minTotal !== undefined) {
    if (!isNumeric(minTotal)) throw badRequest("minTotal must be a number");
    filters.minTotal = Number(minTotal);
  }
  if (maxTotal !== undefined) {
    if (!isNumeric(maxTotal)) throw badRequest("maxTotal must be a number");
    filters.maxTotal = Number(maxTotal);
  }
  if (filters.minTotal > filters.maxTotal) throw badRequest("minTotal must be <= maxTotal");
  if (from !== undefined) {
    if (!isValidDate(from)) throw badRequest("from must be a valid date YYYY-MM-DD");
    filters.from = from;
  }
  if (to !== undefined) {
    if (!isValidDate(to)) throw badRequest("to must be a valid date YYYY-MM-DD");
    filters.to = to;
  }
  // รูปแบบ YYYY-MM-DD เทียบแบบ string ได้เลย
  if (filters.from && filters.to && filters.from > filters.to) throw badRequest("from must be <= to");
  return filters;
}

const RULES = {
  orderNo: [(v) => typeof v === "string" && /^ORD-\d{4,}$/.test(v), "must match ORD- followed by at least 4 digits"],
  customerId: [Number.isInteger, "must be an integer"], // "1" (string) ไม่ผ่าน
  totalAmount: [(v) => typeof v === "number" && v > 0, "must be a number > 0"],
  placedAt: [isValidDate, "must be a valid date YYYY-MM-DD"],
};

function validate(body) {
  const details = Object.entries(RULES)
    .filter(([field, [check]]) => !check(body[field]))
    .map(([field, [, message]]) => ({ field, message }));
  if (details.length > 0) {
    throw new AppError("Validation failed", httpStatus.BAD_REQUEST, "VALIDATION_ERROR", details);
  }
}

export async function getAllObjects(pagination, query) {
  const filters = parseFilters(query);
  const orderBy = parseSort(query.sort);
  return toSummaryList(await repo.findAll(pagination, filters, orderBy));
}

export async function getObject(id) {
  return toDetailDTO(await repo.findOne(id));
}

// status ไม่ต้องส่ง → DB default เป็น PENDING
export async function createObject(body) {
  validate(body);
  const { orderNo, customerId, totalAmount, placedAt } = body;
  const order = await repo.create({
    order_no: orderNo,
    customer_id: customerId,
    total_amount: totalAmount,
    placed_at: placedAt,
  });
  return toDetailDTO(order);
}

// ลำดับ: ค่า status ผิด → 400, ไม่พบ → 404, เปลี่ยนผิดกฎ → 409 INVALID_STATUS_TRANSITION
export async function changeStatus(id, newStatus) {
  if (!STATUSES.includes(newStatus)) throw badRequest(`status must be one of ${STATUSES.join(", ")}`);
  const order = await repo.findOne(id);
  const allowed = TRANSITIONS[order.status].includes(newStatus);
  if (!allowed || !(await repo.updateStatus(id, order.status, newStatus))) {
    throw new AppError(
      `Cannot change status from ${order.status} to ${newStatus}`,
      httpStatus.CONFLICT,
      "INVALID_STATUS_TRANSITION",
    );
  }
  return toDetailDTO(await repo.findOne(id));
}

// ลบได้เฉพาะ CANCELLED
export async function removeObject(id) {
  const order = await repo.findOne(id);
  if (order.status !== "CANCELLED") {
    throw new AppError("Only CANCELLED orders can be deleted", httpStatus.CONFLICT);
  }
  await repo.remove(id);
}
