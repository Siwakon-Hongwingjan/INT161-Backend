import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const TABLE_NAME = "menu_items";
const ENTITY_NAME = "menuItem";

const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`;
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME}`;
// Detail ต้องมี categoryName จึงต้อง JOIN categories
const FIND_ONE_SQL = `SELECT m.*, c.name AS category_name
  FROM ${TABLE_NAME} m
  JOIN categories c ON c.id = m.category_id
  WHERE m.id = ?`;
const FIND_BY_SKU_SQL = `SELECT id FROM ${TABLE_NAME} WHERE sku = ?`;
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE id = ?`;
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`;

async function count() {
  const [[{ total }]] = await db.query(COUNT_ALL);
  return total;
}

export async function findAll(pagination) {
  if (!pagination) {
    const [datas] = await db.query(FIND_ALL_SQL);
    return datas;
  }
  // ต้อง ORDER BY id ไม่งั้น MySQL ไม่การันตีลำดับ หน้า 2/3 อาจได้ id ไม่ต่อเนื่อง
  const SQL = FIND_ALL_SQL + " ORDER BY id LIMIT ? OFFSET ?";
  const { limit, offset } = pagination;
  const [datas] = await db.query(SQL, [limit, offset]);
  datas.totalItems = await count();
  return datas;
}

export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(
      `${ENTITY_NAME} with code '${id}' was not found`,
      httpStatus.NOT_FOUND,
    );
  }
  return data[0];
}

// UPDATE ... SET ? ของ mysql2 จะแปลง object เป็น `col = val` เฉพาะ key ที่ส่งมา จึงรองรับ partial update ได้เลย
export async function update(id, data) {
  await findOne(id);
  await db.query(UPDATE_SQL, [data, id]);
  return findOne(id);
}

export async function remove(id) {
  await findOne(id);
  const [data] = await db.query(REMOVE_SQL, [id]);
  return data;
}

export async function create(data) {
  const key = data.sku;
  // เช็ค sku ซ้ำก่อน insert → 409 (ถึงไม่เช็ค UNIQUE ใน DB ก็จะโยน ER_DUP_ENTRY ซึ่ง error-handler แปลงเป็น 409 ให้อยู่แล้ว)
  const [existingItem] = await db.query(FIND_BY_SKU_SQL, [key]);
  if (existingItem.length != 0) {
    throw new AppError(
      `Menu Items'${key}' already exists`,
      httpStatus.CONFLICT,
    );
  }
  const [result] = await db.query(CREATE_SQL, [data]);
  return findOne(result.insertId);
}
