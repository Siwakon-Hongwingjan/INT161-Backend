import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

// ทุก query ต้องมี e.deleted_at IS NULL เพื่อซ่อน event ที่ถูก soft delete
const SELECT_SQL = `SELECT e.*, v.name AS venue_name, v.city, v.capacity,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
  FROM events e JOIN venues v ON v.id = e.venue_id`;
const COUNT_SQL = `SELECT COUNT(*) AS total FROM events e JOIN venues v ON v.id = e.venue_id`;
const FIND_ONE_SQL = `${SELECT_SQL} WHERE e.id = ? AND e.deleted_at IS NULL`;
const FIND_VENUE_SQL = `SELECT * FROM venues WHERE id = ?`;
const CREATE_SQL = `INSERT INTO events SET ?`;
const UPDATE_SQL = `UPDATE events SET ? WHERE id = ?`;
// soft delete = ตั้ง deleted_at ไม่ลบแถวจริง
const SOFT_DELETE_SQL = `UPDATE events SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
// นับ registrations ใน subquery แยกก่อน แล้วค่อย LEFT JOIN
// ถ้า JOIN registrations ตรงๆ แถว event จะถูกคูณตามจำนวนคนลงทะเบียน ทำให้ COUNT/AVG เพี้ยน
// LEFT JOIN + COALESCE ทำให้เมืองที่ไม่มีคนลงทะเบียนยังอยู่ (totalRegistrations = 0)
const CITY_STATS_SQL = `SELECT v.city,
    COUNT(*) AS event_count,
    COALESCE(SUM(rc.cnt), 0) AS total_registrations,
    ROUND(AVG(e.ticket_price), 2) AS avg_ticket_price
  FROM events e
  JOIN venues v ON v.id = e.venue_id
  LEFT JOIN (SELECT event_id, COUNT(*) AS cnt FROM registrations GROUP BY event_id) rc ON rc.event_id = e.id
  WHERE e.deleted_at IS NULL
  GROUP BY v.city
  ORDER BY event_count DESC, v.city ASC`;

function buildWhere(filters) {
  const conds = ["e.deleted_at IS NULL"];
  const params = [];
  if (filters.q !== undefined) { conds.push("e.title LIKE ?"); params.push(`%${filters.q}%`); }
  if (filters.city !== undefined) { conds.push("v.city = ?"); params.push(filters.city); }
  if (filters.category !== undefined) { conds.push("e.category = ?"); params.push(filters.category); }
  if (filters.status !== undefined) { conds.push("e.status = ?"); params.push(filters.status); }
  if (filters.minPrice !== undefined) { conds.push("e.ticket_price >= ?"); params.push(filters.minPrice); }
  if (filters.maxPrice !== undefined) { conds.push("e.ticket_price <= ?"); params.push(filters.maxPrice); }
  if (filters.from !== undefined) { conds.push("e.start_date >= ?"); params.push(filters.from); }
  if (filters.to !== undefined) { conds.push("e.start_date <= ?"); params.push(filters.to); }
  return { where: ` WHERE ${conds.join(" AND ")}`, params };
}

export async function findAll(pagination, filters, orderBy) {
  const { where, params } = buildWhere(filters);
  const sql = `${SELECT_SQL}${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const [datas] = await db.query(sql, [...params, pagination.limit, pagination.offset]);
  const [[{ total }]] = await db.query(COUNT_SQL + where, params);
  datas.totalItems = total;
  return datas;
}

// ถูก soft delete แล้วก็ถือว่าไม่พบ → 404
export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(`Event with id '${id}' was not found`, httpStatus.NOT_FOUND);
  }
  return data[0];
}

export async function findVenue(id) {
  const [data] = await db.query(FIND_VENUE_SQL, [id]);
  return data[0];
}

export async function create(data) {
  const [result] = await db.query(CREATE_SQL, [data]);
  return findOne(result.insertId);
}

export async function update(id, data) {
  if (Object.keys(data).length > 0) await db.query(UPDATE_SQL, [data, id]);
  return findOne(id);
}

export async function softDelete(id) {
  const [result] = await db.query(SOFT_DELETE_SQL, [id]);
  if (result.affectedRows === 0) {
    throw new AppError(`Event with id '${id}' was not found`, httpStatus.NOT_FOUND);
  }
}

export async function cityStats() {
  const [datas] = await db.query(CITY_STATS_SQL);
  return datas;
}
