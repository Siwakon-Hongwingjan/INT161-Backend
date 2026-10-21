// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

const SELECT_SQL = `SELECT c.*, b.name AS branch_name, b.city AS branch_city
    FROM cars c JOIN branches b ON b.id = c.branch_id`
const COUNT_SQL = `SELECT COUNT(*) AS total FROM cars c`
const FIND_ONE_SQL = `${SELECT_SQL} WHERE c.id = ?`
const UPDATE_SQL = `UPDATE cars SET ? WHERE id = ?`
const REMOVE_SQL = `DELETE FROM cars WHERE id = ?`
const CREATE_SQL = `INSERT INTO cars SET ?`

// สร้าง WHERE จาก filter ที่ผ่านการตรวจแล้ว ค่าทุกตัวผ่าน ? ไม่ต่อ string (กัน SQL injection)
function buildWhere(filters) {
    const conds = []
    const params = []
    if (filters.brand !== undefined) { conds.push("c.brand = ?"); params.push(filters.brand) }
    if (filters.branchId !== undefined) { conds.push("c.branch_id = ?"); params.push(filters.branchId) }
    if (filters.transmission !== undefined) { conds.push("c.transmission = ?"); params.push(filters.transmission) }
    if (filters.available !== undefined) { conds.push("c.is_available = ?"); params.push(filters.available) }
    if (filters.minSeats !== undefined) { conds.push("c.seats >= ?"); params.push(filters.minSeats) }
    return {where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params}
}

// orderBy มาจาก whitelist ใน service (เป็นชื่อคอลัมน์จริงเท่านั้น) จึงต่อ SQL ได้
export async function findAll(pagination, filters, orderBy) {
    const {where, params} = buildWhere(filters)
    const sql = `${SELECT_SQL}${where} ORDER BY ${orderBy}`
    if (!pagination) {
        const [rows] = await db.query(sql, params)
        return rows
    }
    const [rows] = await db.query(sql + " LIMIT ? OFFSET ?", [...params, pagination.limit, pagination.offset])
    // total ต้องนับด้วย WHERE เดียวกัน ไม่งั้นได้จำนวนทั้งตาราง
    const [[{total}]] = await db.query(COUNT_SQL + where, params)
    rows.totalItems = total
    return rows
}

export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    return rows.length === 0 ? null : rows[0]
}

// ทะเบียนซ้ำ / branch_id ไม่มีจริง → MySQL โยน error เอง แล้ว error handler แปลงเป็น 409 / 400
export async function create(data) {
    const [result] = await db.query(CREATE_SQL, [data])
    return findOne(result.insertId)
}

export async function update(id, data) {
    if (Object.keys(data).length > 0) await db.query(UPDATE_SQL, [data, id]) // body ว่าง → SET ? จะเป็น SQL ผิด
    return findOne(id)
}

export async function remove(id) {
    await db.query(REMOVE_SQL, [id])
}
