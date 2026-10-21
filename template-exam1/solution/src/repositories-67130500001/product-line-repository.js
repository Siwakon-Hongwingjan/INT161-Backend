// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

// เลือกเฉพาะคอลัมน์ที่ใช้ (htmlDescription, image เป็นข้อมูลใหญ่ไม่ต้องส่ง)
const FIND_ALL_SQL = `SELECT productLine, textDescription FROM productlines ORDER BY productLine`
const FIND_ONE_SQL = `SELECT productLine FROM productlines WHERE productLine = ?`

export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)
    return rows
}

export async function findOne(productLine) {
    const [rows] = await db.query(FIND_ONE_SQL, [productLine])
    return rows.length === 0 ? null : rows[0]
}
