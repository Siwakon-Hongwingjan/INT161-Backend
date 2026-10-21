// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

// LEFT JOIN เพื่อให้สาขาที่ไม่มีรถยังอยู่ในผลลัพธ์
// ใช้ COUNT(c.id) ไม่ใช่ COUNT(*) — สาขาว่างจะมี 1 แถวที่ c.id เป็น NULL, COUNT(*) จะได้ 1 แต่ COUNT(c.id) ได้ 0
const SELECT_SQL = `SELECT b.id, b.name, b.city, COUNT(c.id) AS car_count
    FROM branches b LEFT JOIN cars c ON c.branch_id = b.id`
const FIND_ALL_SQL = `${SELECT_SQL} GROUP BY b.id ORDER BY b.id`
const FIND_ONE_SQL = `${SELECT_SQL} WHERE b.id = ? GROUP BY b.id`
const REMOVE_SQL = `DELETE FROM branches WHERE id = ?`

export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)
    return rows
}

export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    return rows.length === 0 ? null : rows[0]
}

// สาขาที่ยังมีรถ → FK (ON DELETE RESTRICT) โยน ER_ROW_IS_REFERENCED_2 → error handler ตอบ 409
export async function remove(id) {
    await db.query(REMOVE_SQL, [id])
}
