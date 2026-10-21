// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

// LEFT JOIN + COUNT(e.employeeNumber) เผื่อ office ที่ไม่มีพนักงานจะได้ 0 ไม่ใช่หายไป
const FIND_ALL_SQL = `SELECT o.officeCode, o.city, o.country, COUNT(e.employeeNumber) AS employeeCount
    FROM offices o LEFT JOIN employees e ON e.officeCode = o.officeCode
    GROUP BY o.officeCode ORDER BY o.officeCode`

export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)
    return rows
}
