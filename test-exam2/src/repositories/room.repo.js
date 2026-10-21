import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

// JOIN room_types ทุกครั้ง เพราะทั้ง Summary (typeName) และ Detail (roomType) ต้องใช้
const SELECT_SQL = `SELECT r.*, t.name AS type_name, t.bed_type, t.max_guests
  FROM rooms r JOIN room_types t ON t.id = r.room_type_id`;
const COUNT_SQL = `SELECT COUNT(*) AS total FROM rooms r`;
const FIND_ONE_SQL = `${SELECT_SQL} WHERE r.id = ?`;
const UPDATE_SQL = `UPDATE rooms SET ? WHERE id = ?`;
const REMOVE_SQL = `DELETE FROM rooms WHERE id = ?`;
const CREATE_SQL = `INSERT INTO rooms SET ?`;

// filters = { status, floor, roomTypeId } ค่าไหนไม่ส่งมาก็ไม่ใส่เงื่อนไข
// ค่าทุกตัวส่งผ่าน ? (placeholder) ไม่ต่อ string ตรงๆ กัน SQL injection
function buildWhere(filters) {
  const conds = [];
  const params = [];
  if (filters.status !== undefined) { conds.push("r.status = ?"); params.push(filters.status); }
  if (filters.floor !== undefined) { conds.push("r.floor = ?"); params.push(filters.floor); }
  if (filters.roomTypeId !== undefined) { conds.push("r.room_type_id = ?"); params.push(filters.roomTypeId); }
  return { where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params };
}

// orderBy มาจาก whitelist ใน service แล้ว (เป็นชื่อคอลัมน์จริง) จึงต่อเข้า SQL ได้อย่างปลอดภัย
export async function findAll(pagination, filters, orderBy) {
  const { where, params } = buildWhere(filters);
  let sql = `${SELECT_SQL}${where} ORDER BY ${orderBy}`;
  if (!pagination) {
    const [datas] = await db.query(sql, params);
    return datas;
  }
  sql += " LIMIT ? OFFSET ?";
  const [datas] = await db.query(sql, [...params, pagination.limit, pagination.offset]);
  // total ต้องนับด้วย WHERE เดียวกัน ไม่งั้น pagination.total จะเป็นจำนวนทั้งตาราง
  const [[{ total }]] = await db.query(COUNT_SQL + where, params);
  datas.totalItems = total;
  return datas;
}

export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(`Room with id '${id}' was not found`, httpStatus.NOT_FOUND);
  }
  return data[0];
}

export async function update(id, data) {
  await findOne(id);
  await db.query(UPDATE_SQL, [data, id]);
  return findOne(id);
}

export async function remove(id) {
  await findOne(id);
  await db.query(REMOVE_SQL, [id]);
}

// room_number เป็น UNIQUE ใน DB → ถ้าซ้ำ MySQL โยน ER_DUP_ENTRY แล้ว error-handler แปลงเป็น 409 ให้เอง
export async function create(data) {
  const [result] = await db.query(CREATE_SQL, [data]);
  return findOne(result.insertId);
}
