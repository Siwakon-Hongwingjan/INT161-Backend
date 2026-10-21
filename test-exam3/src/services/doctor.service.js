import * as repo from "../repositories/doctor.repo.js";
import { toDetailDTO, toSummaryList } from "../mappers/doctor.mapper.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

// sort whitelist: ชื่อใน query (camelCase) → คอลัมน์จริง
const SORT_COLUMNS = {
  consultationFee: "d.consultation_fee",
  yearsExperience: "d.years_experience",
  licenseNo: "d.license_no",
  lastName: "d.last_name",
};

// Request body เป็น camelCase → map เป็นคอลัมน์ snake_case ก่อนส่งให้ repo
const COLUMNS = {
  licenseNo: "license_no",
  firstName: "first_name",
  lastName: "last_name",
  departmentId: "department_id",
  yearsExperience: "years_experience",
  consultationFee: "consultation_fee",
  isActive: "is_active",
};

const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";
// กฎของแต่ละฟิลด์ [ตัวตรวจ, ข้อความ error]
const RULES = {
  licenseNo: [isNonEmptyString, "must be a non-empty string"],
  firstName: [isNonEmptyString, "must be a non-empty string"],
  lastName: [isNonEmptyString, "must be a non-empty string"],
  departmentId: [Number.isInteger, "must be an integer"],
  yearsExperience: [(v) => Number.isInteger(v) && v >= 0, "must be an integer >= 0"],
  consultationFee: [(v) => typeof v === "number" && v > 0, "must be a number > 0"],
  isActive: [(v) => typeof v === "boolean", "must be a boolean"],
};
const OPTIONAL = ["isActive"]; // POST ไม่บังคับ isActive (DB default TRUE)

// ตรวจ "ทุกฟิลด์" แล้วรวม error ไว้ใน details[] ทีเดียว (ไม่ throw ตั้งแต่ฟิลด์แรกที่ผิด)
// partial = true (PUT) → ตรวจเฉพาะฟิลด์ที่ส่งมา
function validate(body, partial) {
  const details = [];
  for (const [field, [check, message]] of Object.entries(RULES)) {
    const value = body[field];
    if (value === undefined && (partial || OPTIONAL.includes(field))) continue;
    if (!check(value)) details.push({ field, message });
  }
  if (details.length > 0) {
    throw new AppError("Validation failed", httpStatus.BAD_REQUEST, "VALIDATION_ERROR", details);
  }
}

function toRow(body) {
  const row = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (body[field] !== undefined) row[column] = body[field];
  }
  return row;
}

function badRequest(message) {
  return new AppError(message, httpStatus.BAD_REQUEST);
}

// แปลง "-consultationFee,licenseNo" → "d.consultation_fee DESC, d.license_no ASC, d.id ASC"
function parseSort(sort = "licenseNo") {
  const parts = sort.split(",").map((token) => {
    const desc = token.startsWith("-");
    const column = SORT_COLUMNS[desc ? token.slice(1) : token];
    if (!column) throw badRequest(`Invalid sort field '${token}'`);
    return `${column} ${desc ? "DESC" : "ASC"}`;
  });
  return [...parts, "d.id ASC"].join(", "); // id เป็นตัวตัดสินสุดท้าย ให้ลำดับคงที่
}

// ตรวจ query string (ค่ามาเป็น string ทั้งหมด) ผิด → 400
function parseFilters({ q, departmentId, isActive, minExperience }) {
  const filters = { q };
  if (departmentId !== undefined) {
    if (!/^\d+$/.test(departmentId)) throw badRequest("departmentId must be an integer");
    filters.departmentId = Number(departmentId);
  }
  if (isActive !== undefined) {
    if (isActive !== "true" && isActive !== "false") throw badRequest("isActive must be true or false");
    filters.isActive = isActive === "true";
  }
  if (minExperience !== undefined) {
    if (minExperience.trim() === "" || isNaN(minExperience)) throw badRequest("minExperience must be a number");
    filters.minExperience = Number(minExperience);
  }
  return filters;
}

export async function getAllObjects(pagination, query) {
  const filters = parseFilters(query);
  const orderBy = parseSort(query.sort);
  return toSummaryList(await repo.findAll(pagination, filters, orderBy));
}

export async function getObject(id) {
  return toDetailDTO(await repo.findOne(id));
}

export async function createObject(body) {
  validate(body, false);
  return toDetailDTO(await repo.create(toRow(body)));
}

export async function updateObject(id, body) {
  validate(body, true);
  return toDetailDTO(await repo.update(id, toRow(body)));
}

export async function removeObject(id) {
  await repo.remove(id);
}
