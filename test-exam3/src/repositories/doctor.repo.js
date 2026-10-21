import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const SELECT_SQL = `SELECT d.*, dep.name AS department_name
  FROM doctors d JOIN departments dep ON dep.id = d.department_id`;
const COUNT_SQL = `SELECT COUNT(*) AS total FROM doctors d`;
// bookedAppointments ใช้ subquery นับเฉพาะ status = 'BOOKED' (นัดที่ CANCELLED ไม่นับ)
const FIND_ONE_SQL = `SELECT d.*, dep.name AS department_name,
    (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.status = 'BOOKED') AS booked_appointments
  FROM doctors d JOIN departments dep ON dep.id = d.department_id
  WHERE d.id = ?`;
const UPDATE_SQL = `UPDATE doctors SET ? WHERE id = ?`;
const REMOVE_SQL = `DELETE FROM doctors WHERE id = ?`;
const CREATE_SQL = `INSERT INTO doctors SET ?`;

// filters ผ่านการตรวจใน service แล้ว ค่าทุกตัวใช้ ? placeholder
function buildWhere(filters) {
  const conds = [];
  const params = [];
  if (filters.q !== undefined) {
    // q ต้องหาได้ทั้ง first_name หรือ last_name → ต้องครอบวงเล็บ ไม่งั้น OR จะไปกิน AND ตัวอื่น
    // collation utf8mb4_unicode_ci ไม่สนตัวพิมพ์อยู่แล้ว LIKE จึง case-insensitive
    conds.push("(d.first_name LIKE ? OR d.last_name LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.departmentId !== undefined) { conds.push("d.department_id = ?"); params.push(filters.departmentId); }
  if (filters.isActive !== undefined) { conds.push("d.is_active = ?"); params.push(filters.isActive); }
  if (filters.minExperience !== undefined) { conds.push("d.years_experience >= ?"); params.push(filters.minExperience); }
  return { where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params };
}

// orderBy สร้างจาก whitelist ใน service แล้ว
export async function findAll(pagination, filters, orderBy) {
  const { where, params } = buildWhere(filters);
  let sql = `${SELECT_SQL}${where} ORDER BY ${orderBy}`;
  if (!pagination) {
    const [datas] = await db.query(sql, params);
    return datas;
  }
  sql += " LIMIT ? OFFSET ?";
  const [datas] = await db.query(sql, [...params, pagination.limit, pagination.offset]);
  const [[{ total }]] = await db.query(COUNT_SQL + where, params); // นับหลัง filter
  datas.totalItems = total;
  return datas;
}

export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(`Doctor with id '${id}' was not found`, httpStatus.NOT_FOUND);
  }
  return data[0];
}

// license_no ซ้ำ → ER_DUP_ENTRY (409), department_id ไม่มีจริง → ER_NO_REFERENCED_ROW_2 (400)
// ทั้งสองกรณี error-handler แปลงให้แล้ว ไม่ต้องเช็คเอง
export async function create(data) {
  const [result] = await db.query(CREATE_SQL, [data]);
  return findOne(result.insertId);
}

export async function update(id, data) {
  await findOne(id);
  // ถ้า body ว่าง SET ? จะได้ SQL ผิด จึงข้ามการ UPDATE
  if (Object.keys(data).length > 0) await db.query(UPDATE_SQL, [data, id]);
  return findOne(id);
}

// หมอที่มี appointments ลบไม่ได้เพราะ FK (ON DELETE RESTRICT) → ER_ROW_IS_REFERENCED_2 → 409 จาก error-handler
export async function remove(id) {
  await findOne(id);
  await db.query(REMOVE_SQL, [id]);
}
