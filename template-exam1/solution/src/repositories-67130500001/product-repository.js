// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

const TABLE_NAME = "products"

const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`
// ต้อง ORDER BY ไม่งั้น MySQL ไม่การันตีลำดับ หน้าแต่ละหน้าอาจซ้ำ/ข้าม
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY productCode`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE productCode = ?`
const FIND_BY_LINE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE productLine = ? ORDER BY productCode`
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE productCode = ?`
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE productCode = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`

export async function findAll(pagination) {
    if (!pagination) {
        const [rows] = await db.query(FIND_ALL_SQL)
        return rows
    }
    const SQL = FIND_ALL_SQL + ' LIMIT ? OFFSET ?'
    const {limit, offset} = pagination
    const [rows] = await db.query(SQL, [limit, offset])
    // โครงเดิมไม่ได้นับ total → api-response ต้องใช้ rows.totalItems ทำ pagination
    const [[{total}]] = await db.query(COUNT_ALL)
    rows.totalItems = total
    return rows
}

export async function findByLine(productLine) {
    const [rows] = await db.query(FIND_BY_LINE_SQL, [productLine])
    return rows
}

// คืน null ถ้าไม่พบ (ตามโครง) แล้วให้ service เป็นคนตัดสินใจโยน 404
export async function findOne(code) {
    const [rows] = await db.query(FIND_ONE_SQL, [code])
    return rows.length === 0 ? null : rows[0]
}

// SET ? ของ mysql2 แปลง object เป็น `col = val` เฉพาะ key ที่ส่งมา → รองรับ partial update
export async function update(code, data) {
    await db.query(UPDATE_SQL, [data, code])
    return findOne(code)
}

export async function remove(code) {
    await db.query(REMOVE_SQL, [code])
}

// โครงเดิมเช็คซ้ำด้วย data.productLine (ผิดฟิลด์) และ findOne(key) ผิดคีย์ → ต้องใช้ productCode
export async function create(data) {
    await db.query(CREATE_SQL, [data])
    return findOne(data.productCode)
}
