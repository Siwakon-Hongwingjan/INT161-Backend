import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const SELECT_SQL = `SELECT o.*, c.full_name AS customer_name, c.email AS customer_email, c.tier AS customer_tier
  FROM orders o JOIN customers c ON c.id = o.customer_id`;
const COUNT_SQL = `SELECT COUNT(*) AS total FROM orders o`;
const FIND_ONE_SQL = `${SELECT_SQL} WHERE o.id = ?`;
const CREATE_SQL = `INSERT INTO orders SET ?`;
// ใส่ AND status = <สถานะเดิม> กันกรณี 2 request เปลี่ยนสถานะพร้อมกัน (อันหลังจะ update ไม่โดนแถว)
const UPDATE_STATUS_SQL = `UPDATE orders SET status = ? WHERE id = ? AND status = ?`;
const REMOVE_SQL = `DELETE FROM orders WHERE id = ?`;

// filters ผ่านการตรวจใน service แล้ว
function buildWhere(filters) {
  const conds = [];
  const params = [];
  // IN (?) + array → mysql2 แตกเป็น IN ('PAID', 'SHIPPED') ให้เอง
  if (filters.statuses) { conds.push("o.status IN (?)"); params.push(filters.statuses); }
  if (filters.customerId !== undefined) { conds.push("o.customer_id = ?"); params.push(filters.customerId); }
  // ช่วงราคา/วันที่ "รวมขอบ" จึงใช้ >= และ <=
  if (filters.minTotal !== undefined) { conds.push("o.total_amount >= ?"); params.push(filters.minTotal); }
  if (filters.maxTotal !== undefined) { conds.push("o.total_amount <= ?"); params.push(filters.maxTotal); }
  if (filters.from !== undefined) { conds.push("o.placed_at >= ?"); params.push(filters.from); }
  if (filters.to !== undefined) { conds.push("o.placed_at <= ?"); params.push(filters.to); }
  return { where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params };
}

// ข้อนี้ pagination มีค่าเสมอ (middleware ใส่ default ให้)
export async function findAll(pagination, filters, orderBy) {
  const { where, params } = buildWhere(filters);
  const sql = `${SELECT_SQL}${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const [datas] = await db.query(sql, [...params, pagination.limit, pagination.offset]);
  const [[{ total }]] = await db.query(COUNT_SQL + where, params);
  datas.totalItems = total;
  return datas;
}

export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(`Order with id '${id}' was not found`, httpStatus.NOT_FOUND);
  }
  return data[0];
}

// order_no ซ้ำ → 409, customer_id ไม่มีจริง → 400 (error-handler แปลง MySQL error ให้)
export async function create(data) {
  const [result] = await db.query(CREATE_SQL, [data]);
  return findOne(result.insertId);
}

// คืน true ถ้าเปลี่ยนได้จริง (affectedRows = 0 แปลว่าสถานะถูกเปลี่ยนไปก่อนแล้ว)
export async function updateStatus(id, fromStatus, toStatus) {
  const [result] = await db.query(UPDATE_STATUS_SQL, [toStatus, id, fromStatus]);
  return result.affectedRows === 1;
}

export async function remove(id) {
  await db.query(REMOVE_SQL, [id]);
}
