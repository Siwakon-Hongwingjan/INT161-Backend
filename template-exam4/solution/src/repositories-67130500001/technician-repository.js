// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

// เงื่อนไข status ต้องอยู่ใน ON ไม่ใช่ WHERE
// ถ้าใส่ใน WHERE แถวที่ฝั่ง tickets เป็น NULL (ช่างไม่มีงาน) จะถูกกรองทิ้ง → ช่างคนนั้นหายจากผลลัพธ์
const FIND_ALL_SQL = `SELECT k.*, COUNT(t.id) AS active_tickets
    FROM technicians k
    LEFT JOIN tickets t ON t.technician_id = k.id AND t.status IN ('OPEN', 'IN_PROGRESS')
    GROUP BY k.id ORDER BY k.id`
const FIND_ONE_SQL = `SELECT * FROM technicians WHERE id = ?`

export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)
    return rows
}

export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    return rows.length === 0 ? null : rows[0]
}
